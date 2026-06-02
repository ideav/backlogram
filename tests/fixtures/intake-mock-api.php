<?php
/**
 * Mock GitHub + Telegram API for the excel-to-app backend e2e test.
 *
 * Run with:  php -S 127.0.0.1:PORT tests/fixtures/intake-mock-api.php
 * Every request is appended (as JSON) to the file named in the MOCK_LOG env var
 * so the test can assert which API calls happened.
 */

$logFile = getenv('MOCK_LOG');
$method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri     = $_SERVER['REQUEST_URI'] ?? '/';
$path    = parse_url($uri, PHP_URL_PATH) ?? $uri;
$raw     = file_get_contents('php://input');

if ($logFile) {
    file_put_contents(
        $logFile,
        json_encode(['method' => $method, 'path' => $path, 'body' => $raw]) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

header('Content-Type: application/json');

// Telegram sendMessage
if (strpos($path, '/sendMessage') !== false) {
    echo json_encode(['ok' => true, 'result' => ['message_id' => 1]]);
    exit;
}

// GitHub Contents API (file upload)
if ($method === 'PUT' && strpos($path, '/contents/') !== false) {
    http_response_code(201);
    echo json_encode([
        'content' => [
            'html_url'     => 'https://github.com/mock' . $path,
            'download_url' => 'https://raw.example/mock' . $path,
        ],
    ]);
    exit;
}

// GitHub create issue
if ($method === 'POST' && preg_match('#/issues$#', $path)) {
    http_response_code(201);
    echo json_encode([
        'number'   => 4242,
        'html_url' => 'https://github.com/mock/issues/4242',
    ]);
    exit;
}

http_response_code(404);
echo json_encode(['message' => "not mocked: $method $path"]);
