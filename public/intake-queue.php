<?php
/**
 * Файловая очередь заявок с подтверждением адреса (issue #624).
 *
 * Хранилище выбрано файловым по решению владельца: каталог рядом с интейком,
 * без базы. Заявка — это каталог `<queue>/<id>/` с `request.json` и `files/`;
 * статус живёт в самом файле, а не в имени каталога, чтобы переход состояния
 * был одной атомарной записью под flock.
 *
 * Жизненный цикл:
 *   pending_confirmation --(переход по ссылке из письма)--> confirmed
 *   confirmed            --(сборщик забрал работу)-------> building
 *   building             --(сборщик отчитался)-----------> delivered
 *   pending_confirmation --(истёк TTL, cron)-------------> удалена
 *   building             --(сборщик сообщил об ошибке)---> failed
 *
 * Токен подтверждения: `<id>.<secret>`. В `request.json` лежит только
 * sha256-хеш секрета — чтения каталога очереди недостаточно, чтобы подтвердить
 * чужую заявку. По id находим каталог без перебора, сравниваем hash_equals.
 *
 * Каталог очереди по умолчанию — ВНЕ вебрута (рядом с ним): в нём лежат файлы
 * клиентов, раздавать их наружу нельзя.
 */

if (!defined('INTAKE_QUEUE_LOADED')) {
    define('INTAKE_QUEUE_LOADED', true);

    // Как и в intake-mail.php: нужен только intake_config(). Лендинг на другом
    // хосте объявляет его сам поверх order_config() — intake-shared.php там нет.
    if (!function_exists('intake_config')) {
        require_once __DIR__ . '/intake-shared.php';
    }

    // Статусы заявки (define, а не const: файл целиком обёрнут в if).
    define('INTAKE_STATUS_PENDING',   'pending_confirmation');
    define('INTAKE_STATUS_CONFIRMED', 'confirmed');
    define('INTAKE_STATUS_BUILDING',  'building');
    define('INTAKE_STATUS_DELIVERED', 'delivered');
    define('INTAKE_STATUS_FAILED',    'failed');

    /** Каталог очереди: INTAKE_QUEUE_DIR или `<родитель вебрута>/excel-to-app-queue`. */
    function intake_queue_dir(): string {
        $configured = (string) intake_config('INTAKE_QUEUE_DIR', '');
        if ($configured !== '') {
            return rtrim(str_replace('\\', '/', $configured), '/');
        }
        $root = (string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
        $root = rtrim(str_replace('\\', '/', $root), '/');
        return dirname($root) . '/excel-to-app-queue';
    }

    /** Срок жизни ссылки подтверждения в секундах (по умолчанию 24 ч). */
    function intake_confirm_ttl(): int {
        $ttl = (int) intake_config('INTAKE_CONFIRM_TTL', '86400');
        return $ttl > 0 ? $ttl : 86400;
    }

    /** Новый идентификатор заявки (он же каталог вложений в репозитории). */
    function intake_queue_new_id(): string {
        return date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 8);
    }

    /**
     * Путь к каталогу заявки. null — идентификатор не того вида.
     * Форма id проверяется строго: это единственное, что приходит из URL, и
     * через него нельзя выйти из каталога очереди.
     */
    function intake_queue_path(string $dir, string $id): ?string {
        if (preg_match('/^\d{8}-\d{6}-[0-9a-f]{8}$/', $id) !== 1) {
            return null;
        }
        return rtrim($dir, '/') . '/' . $id;
    }

    /**
     * Разобрать токен подтверждения на id и секрет.
     *
     * @return array{id:string, secret:string}|null
     */
    function intake_queue_parse_token(string $token): ?array {
        $token = trim($token);
        if (substr_count($token, '.') !== 1) {
            return null;
        }
        [$id, $secret] = explode('.', $token, 2);
        if (preg_match('/^[0-9a-f]{32,128}$/', $secret) !== 1) {
            return null;
        }
        if (preg_match('/^\d{8}-\d{6}-[0-9a-f]{8}$/', $id) !== 1) {
            return null;
        }
        return ['id' => $id, 'secret' => $secret];
    }

    /** Прочитать request.json заявки. null — нет заявки или файл битый. */
    function intake_queue_load(string $dir, string $id): ?array {
        $path = intake_queue_path($dir, $id);
        if ($path === null || !is_file($path . '/request.json')) {
            return null;
        }
        $data = json_decode((string) @file_get_contents($path . '/request.json'), true);
        return is_array($data) ? $data : null;
    }

    /** Записать request.json атомарно (tmp + rename). */
    function intake_queue_write(string $dir, array $record): bool {
        $path = intake_queue_path($dir, (string) ($record['id'] ?? ''));
        if ($path === null || !is_dir($path)) {
            return false;
        }
        $json = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $tmp  = $path . '/request.json.tmp';
        if (@file_put_contents($tmp, $json, LOCK_EX) === false) {
            return false;
        }
        return @rename($tmp, $path . '/request.json');
    }

    /**
     * Имя файла, безопасное для файловой системы, из произвольного имени загрузки.
     *
     * Живёт здесь, а не в intake-shared.php: именем распоряжается тот, кто
     * файл хранит, а хранит его очередь — и она нужна лендингу
     * excel-to-app.ru, где intake-shared.php нет (issue #624).
     */
    function intake_sanitize_filename(string $name): string {
        $name = basename($name);
        // Collapse anything that is not alphanumeric / dot / dash / underscore.
        $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name);
        $name = trim($name, '._');
        return $name !== '' ? $name : 'file';
    }

    /**
     * Создать заявку в статусе pending_confirmation и сохранить её вложения.
     *
     * Вложения переносятся из временного каталога PHP в очередь: иначе к
     * моменту подтверждения (часы спустя) файлов уже не будет.
     *
     * @param array<string, mixed>                                        $request
     * @param array<int, array{name:string, tmp_name:string, size:int}>   $uploads
     * @return array{id:string, token:string, record:array}|null
     */
    function intake_queue_create(string $dir, array $request, array $uploads, ?int $ttl = null, ?int $now = null): ?array {
        $now = $now ?? time();
        $ttl = $ttl ?? intake_confirm_ttl();
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return null;
        }
        $id   = intake_queue_new_id();
        $path = intake_queue_path($dir, $id);
        if ($path === null || !@mkdir($path, 0700)) {
            return null;
        }
        if (!@mkdir($path . '/files', 0700) && !is_dir($path . '/files')) {
            return null;
        }

        $files = [];
        foreach ($uploads as $index => $upload) {
            $safeName = intake_sanitize_filename((string) $upload['name']);
            $stored   = sprintf('%02d-%s', $index + 1, $safeName);
            $tmpName  = (string) $upload['tmp_name'];
            // move_uploaded_file — для настоящей загрузки, copy — для тестов и
            // повторного использования функции не из HTTP-контекста.
            $moved = is_uploaded_file($tmpName)
                ? @move_uploaded_file($tmpName, $path . '/files/' . $stored)
                : @copy($tmpName, $path . '/files/' . $stored);
            if (!$moved) {
                intake_queue_remove($dir, $id);
                return null;
            }
            $files[] = ['name' => $safeName, 'stored' => $stored, 'size' => (int) $upload['size']];
        }

        $secret = bin2hex(random_bytes(32));
        $record = array_merge($request, [
            'id'              => $id,
            'status'          => INTAKE_STATUS_PENDING,
            'created'         => $now,
            'confirm_expires' => $now + $ttl,
            'token_hash'      => hash('sha256', $secret),
            'files'           => $files,
            'history'         => [['at' => $now, 'status' => INTAKE_STATUS_PENDING]],
        ]);

        if (!intake_queue_write($dir, $record)) {
            intake_queue_remove($dir, $id);
            return null;
        }
        return ['id' => $id, 'token' => $id . '.' . $secret, 'record' => $record];
    }

    /**
     * Подтвердить заявку по токену.
     *
     * Переход pending_confirmation → confirmed делается под эксклюзивным
     * flock: по ссылке из письма запросто прилетает два обращения подряд
     * (двойной клик, префетч почтового клиента), а стартовать сборку дважды
     * нельзя. Второе обращение получает 'already' и видит человеческую
     * страницу «уже подтверждено», а не вторую сборку.
     *
     * @return array{status:'ok'|'already'|'expired'|'not_found', record?:array}
     */
    function intake_queue_confirm(string $dir, string $token, ?int $now = null): array {
        $now    = $now ?? time();
        $parsed = intake_queue_parse_token($token);
        if ($parsed === null) {
            return ['status' => 'not_found'];
        }
        $path = intake_queue_path($dir, $parsed['id']);
        if ($path === null || !is_file($path . '/request.json')) {
            return ['status' => 'not_found'];
        }

        $handle = @fopen($path . '/request.json', 'r+');
        if ($handle === false) {
            return ['status' => 'not_found'];
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                return ['status' => 'not_found'];
            }
            $raw    = (string) stream_get_contents($handle);
            $record = json_decode($raw, true);
            if (!is_array($record) || !isset($record['token_hash'])) {
                return ['status' => 'not_found'];
            }
            if (!hash_equals((string) $record['token_hash'], hash('sha256', $parsed['secret']))) {
                return ['status' => 'not_found'];
            }
            if (($record['status'] ?? '') !== INTAKE_STATUS_PENDING) {
                // Уже подтверждена (или уже собирается/доставлена) — это не ошибка.
                return ['status' => 'already', 'record' => $record];
            }
            if ($now > (int) ($record['confirm_expires'] ?? 0)) {
                return ['status' => 'expired', 'record' => $record];
            }

            $record['status']       = INTAKE_STATUS_CONFIRMED;
            $record['confirmed_at'] = $now;
            $record['history'][]    = ['at' => $now, 'status' => INTAKE_STATUS_CONFIRMED];
            // Хеш токена остаётся в заявке намеренно: одноразовость обеспечивает
            // статус (второй раз pending уже не встретится), а сохранённый хеш
            // позволяет отличить повторный клик по своей ссылке от чужого
            // мусорного токена и показать человеку «уже подтверждено» вместо
            // «ссылка не найдена».

            $json = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            ftruncate($handle, 0);
            rewind($handle);
            fwrite($handle, (string) $json);
            fflush($handle);
            return ['status' => 'ok', 'record' => $record];
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    /**
     * Обновить статус и поля заявки.
     *
     * @param array<string, mixed> $patch
     */
    function intake_queue_mark(string $dir, string $id, ?string $status, array $patch = [], ?int $now = null): ?array {
        $now    = $now ?? time();
        $record = intake_queue_load($dir, $id);
        if ($record === null) {
            return null;
        }
        $record = array_merge($record, $patch);
        if ($status !== null) {
            $record['status']    = $status;
            $record['history'][] = ['at' => $now, 'status' => $status];
        }
        return intake_queue_write($dir, $record) ? $record : null;
    }

    /**
     * Идентификаторы заявок в заданном статусе, от старых к новым.
     *
     * @return array<int, string>
     */
    function intake_queue_list(string $dir, ?string $status = null): array {
        if (!is_dir($dir)) {
            return [];
        }
        $ids = [];
        foreach (glob(rtrim($dir, '/') . '/*', GLOB_ONLYDIR) ?: [] as $path) {
            $id     = basename($path);
            $record = intake_queue_load($dir, $id);
            if ($record === null) {
                continue;
            }
            if ($status === null || ($record['status'] ?? '') === $status) {
                $ids[] = $id;
            }
        }
        sort($ids); // id начинается с метки времени — сортировка даёт порядок FIFO
        return $ids;
    }

    /**
     * Забрать подтверждённые заявки в работу: confirmed → building.
     * Возвращает записи заявок (уже со статусом building).
     *
     * @return array<int, array>
     */
    function intake_queue_claim(string $dir, int $limit = 5, ?int $now = null): array {
        $now   = $now ?? time();
        $taken = [];
        foreach (intake_queue_list($dir, INTAKE_STATUS_CONFIRMED) as $id) {
            if (count($taken) >= $limit) {
                break;
            }
            $record = intake_queue_mark($dir, $id, INTAKE_STATUS_BUILDING, ['claimed_at' => $now], $now);
            if ($record !== null) {
                $taken[] = $record;
            }
        }
        return $taken;
    }

    /** Абсолютные пути вложений заявки: [['name' => …, 'path' => …], …]. */
    function intake_queue_files(string $dir, string $id): array {
        $record = intake_queue_load($dir, $id);
        $path   = intake_queue_path($dir, $id);
        if ($record === null || $path === null) {
            return [];
        }
        $out = [];
        foreach ((array) ($record['files'] ?? []) as $file) {
            $full = $path . '/files/' . (string) ($file['stored'] ?? '');
            if (is_file($full)) {
                $out[] = ['name' => (string) ($file['name'] ?? basename($full)), 'path' => $full];
            }
        }
        return $out;
    }

    /** Удалить заявку вместе с вложениями. */
    function intake_queue_remove(string $dir, string $id): bool {
        $path = intake_queue_path($dir, $id);
        if ($path === null || !is_dir($path)) {
            return false;
        }
        foreach (glob($path . '/files/*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($path . '/files');
        foreach (glob($path . '/*') ?: [] as $file) {
            @unlink($file);
        }
        return @rmdir($path);
    }

    /**
     * Убрать неподтверждённые заявки, у которых вышел TTL, и давно доставленные.
     *
     * Неподтверждённая заявка — это чужие файлы, которые мы не имеем повода
     * хранить: как обещано в письме, через TTL они удаляются.
     *
     * @return array{expired:int, purged:int}
     */
    function intake_queue_purge(string $dir, ?int $keepDelivered = null, ?int $now = null): array {
        $now           = $now ?? time();
        $keepDelivered = $keepDelivered ?? (int) intake_config('INTAKE_QUEUE_KEEP_DELIVERED', (string) (30 * 86400));
        $expired       = 0;
        $purged        = 0;
        foreach (intake_queue_list($dir) as $id) {
            $record = intake_queue_load($dir, $id);
            if ($record === null) {
                continue;
            }
            $status = (string) ($record['status'] ?? '');
            if ($status === INTAKE_STATUS_PENDING && $now > (int) ($record['confirm_expires'] ?? 0)) {
                if (intake_queue_remove($dir, $id)) {
                    $expired++;
                }
                continue;
            }
            $done = in_array($status, [INTAKE_STATUS_DELIVERED, INTAKE_STATUS_FAILED], true);
            if ($done && $keepDelivered > 0) {
                $at = (int) ($record['delivered_at'] ?? $record['created'] ?? 0);
                if ($at > 0 && $now - $at > $keepDelivered && intake_queue_remove($dir, $id)) {
                    $purged++;
                }
            }
        }
        return ['expired' => $expired, 'purged' => $purged];
    }

    /**
     * Ссылка подтверждения для письма.
     * База берётся из INTAKE_CONFIRM_URL, иначе собирается по текущему хосту —
     * так эндпоинт работает и на превью-домене без отдельной настройки.
     */
    function intake_confirm_url(string $token, ?string $host = null, bool $https = true): string {
        $base = (string) intake_config('INTAKE_CONFIRM_URL', '');
        if ($base === '') {
            $host   = $host !== null && $host !== '' ? $host : 'ideav.ru';
            $scheme = $https ? 'https' : 'http';
            $base   = $scheme . '://' . $host . '/excel-to-app-confirm.php';
        }
        return $base . (strpos($base, '?') === false ? '?' : '&') . 'token=' . rawurlencode($token);
    }
}
