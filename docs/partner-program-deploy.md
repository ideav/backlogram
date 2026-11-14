# Партнёрская программа: внедрение на боевой сайт ideav.ru

Ветка: `partner-program` (собрана из `partner-price-18500`, `partner-links`, `partner-offer-14` поверх `origin/main` a3cb687). Откат и список изменений: `ЗАМЕНА.md` (в папке ideav-работа/партнёрка у автора).

## 0. До выкладки (блокеры)
1. ~~Платёжная ссылка Точки на 18 500 ₽~~ — сделано и проверено собственником: `PAYMENT_CHECKOUT_URL` (`src/pages/ExcelToApp.tsx`) указывает на `https://tochkaplace.com/ia/723252cf-4583-4967-83fe-e9630b207f9f` (каталог Точки с позицией 18 500 ₽). Перед выкладкой пройти оплату тестовым платежом и убедиться, что сумма 18 500 ₽.
2. ~~Утвердить раздел 14 оферты~~ — раздел 14 (`src/data/partner-docs.mjs`) утверждён владельцем 10.11.2026; платёжная ссылка проверена собственником.
3. ~~Дата вступления~~ — дата редакции в коде: 11 ноября 2026 (`PARTNER_OFFER_UPDATED`) = дата публикации. По разделу 11 оферты новая редакция вступает не раньше чем через 30 дней после публикации. Если выкладка сдвинется — поправить дату.

## 1. Код
1. Открыть пулреквест `partner-program` → `main`, дождаться тестов (`node --test tests/*.test.mjs`; известные падения main не связаны с веткой).
2. После слияния выложить сайт обычным способом (`vite build`, содержимое `dist/` в вебрут). `public/.htaccess` копируется сборкой и уже содержит правило `^m/<токен>` над front controller — проверить, что в вебруте оно есть.

## 2. Сервер (однократно)
PHP 7.2 или новее.
1. Каталог данных вне вебруты: `mkdir -p /var/www/partner-data && chmod 700 /var/www/partner-data`, владелец — пользователь веб-сервера.
2. В вебруте создать `partner-config.php` (образец `public/partner-config.example.php`, в git не попадает):
   `define('PARTNER_DATA_DIR','/var/www/partner-data'); define('PARTNER_API_URL','https://ideav.ru/my'); define('PARTNER_API_TOKEN','<токен>');`
   Токен — пользователя базы my с правом записи в таблицы «Ссылка партнёра» (238510) и «Событие партнёра» (238518): ссылки и события живут там, их читает кабинет партнёра (ideav/crm, `docs/partner-cabinet.md`).
3. Файлы материалов (в git не входят) положить в вебрут, например `/partner-files/`:
   `video-excel.mp4`, `video-bot.mp4`, `prezentaciya.pdf`, `kommercheskoe-predlozhenie.docx`.
4. Создать `/var/www/partner-data/materials.json` (адрес назначения берётся только отсюда):
   ```json
   {
     "video_excel": {"title": "Видео: из Excel в приложение", "url": "https://ideav.ru/partner-files/video-excel.mp4"},
     "video_bot":   {"title": "Видео: бот и дашборды",        "url": "https://ideav.ru/partner-files/video-bot.mp4"},
     "presentation":{"title": "Презентация",                  "url": "https://ideav.ru/partner-files/prezentaciya.pdf"},
     "kp":          {"title": "Коммерческое предложение",     "url": "https://ideav.ru/partner-files/kommercheskoe-predlozhenie.docx"},
     "service":     {"title": "Страница услуги",              "url": "https://ideav.ru/excel-to-app.html", "aff": true}
   }
   ```
   `"aff": true` добавляет к адресу `?aff=<номер партнёра>`, чтобы регистрация засчиталась партнёру.

## 3. Выдача ссылок партнёру и проверка
Команды запускать от пользователя веб-сервера (`sudo -u <пользователь веб-сервера> php …`): каталог данных закрыт `chmod 700`.
1. `php partner-links-admin.php issue <номер партнёра>` — записывает в «Ссылку партнёра» по ссылке на каждый материал и одну на бота и печатает их: `https://ideav.ru/m/<токен>` и `https://t.me/Integrammbot?start=<токен>` (повторный вызов даёт те же). Номер партнёра — id пользователя в базе my. Те же ссылки партнёр видит во вкладке «Материалы и ссылки».
2. Проверка: `curl -sI https://ideav.ru/m/<токен>` → `302` и `Location` на материал, `Cache-Control: no-store`; неизвестный токен → `404`; `curl -sI -A "TelegramBot" …` тоже `302`.
3. Запись событий: запрос `HEAD` (`curl -sI`) событие не пишет, превью мессенджеров и ботов (`-A "TelegramBot"`, `curl` без `-A`) тоже. Открыть ссылку в браузере и убедиться, что в «Событии партнёра» появилась запись `material_open`, а в кабинете партнёра выросло «Открытия».
4. Если API базы my было недоступно, событие ложится в очередь `/var/www/partner-data/events.jsonl`, а ссылки открываются по кэшу `links-cache.json`. Дослать очередь: `php partner-links-admin.php flush` (код выхода 2 — что-то осталось). Повесить в cron раз в 10 минут.

## 4. Что не входит в эту ветку
- Личный кабинет партнёра и сводный кабинет — в `ideav/crm`, PR #5474 и #5476 (выкладываются после сайта).
- Вкладка «Правила» в кабинете (`templates/my/main.html`): порог вывода 500 ₽ против 1 000 ₽ в оферте. Расхождение уже есть на проде, эта ветка его не меняет.
- События бота `@Integrammbot` (`bot_start`, `flow_done`) пишет сам бот (ideav/python2node, `services/excel2app/bot`, ideav/crm#5495).
- Слайды презентации 4, 6, 9 (ошибки) и заглушки бота и QR на слайдах 8 и 10.
- Рекламный текст «Демонстрация бесплатно» в `scripts/direct-create-cpa-campaign.mjs` (Яндекс Директ) не менялся.

## 5. Откат
`git revert` слияния (или откатить файлы) и выложить заново. Дополнительно удалить на сервере `partner-config.php`, каталог `partner-data` и файлы `/partner-files/`. Уже розданные ссылки `ideav.ru/m/…` после отката перестанут работать.
