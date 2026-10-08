<?php
# Site-level helpers of the English build: public base URL and bot protection
# (honeypot, per-IP rate limit, optional Cloudflare Turnstile).

# Public base URL without a trailing slash: INTEGRAM_BASE_URL, or derived from the request.
function enBaseUrl(){
    $base = rtrim(integram_env('INTEGRAM_BASE_URL', ''), '/');
    if($base !== '')
        return $base;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost');
    $host = preg_replace('/[^A-Za-z0-9.:\-\[\]]/', '', $host);
    return ($https ? 'https' : 'http').'://'.$host;
}

function enHost(){
    return parse_url(enBaseUrl(), PHP_URL_HOST);
}

function enIsHttps(){
    return strpos(enBaseUrl(), 'https://') === 0;
}

function enClientIp(){
    # Behind Cloudflare / a reverse proxy, trust the forwarded address only when told to.
    if(integram_env('INTEGRAM_TRUST_PROXY', '') !== ''){
        if(!empty($_SERVER['HTTP_CF_CONNECTING_IP']))
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        if(!empty($_SERVER['HTTP_X_FORWARDED_FOR']))
            return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
}

# Sliding-window counter in the temp dir: TRUE while $ip made fewer than $max hits of $bucket
# within $window seconds. Every call counts as a hit.
function enRateLimit($bucket, $max, $window){
    if(integram_env('INTEGRAM_RATE_LIMIT', '1') === '0')
        return TRUE;
    $dir = rtrim(integram_env('INTEGRAM_RATE_DIR', sys_get_temp_dir()), '/').'/integram-rate';
    if(!is_dir($dir))
        @mkdir($dir, 0700, TRUE);
    $file = $dir.'/'.preg_replace('/[^a-z_]/', '', $bucket).'-'.sha1(enClientIp().SALT).'.json';
    $fp = @fopen($file, 'c+');
    if(!$fp)
        return TRUE;  # Fail open: a broken temp dir must not lock everybody out
    flock($fp, LOCK_EX);
    $now = time();
    $hits = json_decode(stream_get_contents($fp), TRUE);
    $hits = is_array($hits) ? array_values(array_filter($hits, function($t) use ($now, $window){ return $t > $now - $window; })) : array();
    $allowed = count($hits) < $max;
    $hits[] = $now;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($hits));
    flock($fp, LOCK_UN);
    fclose($fp);
    return $allowed;
}

# Cloudflare Turnstile check. Disabled (always TRUE) unless INTEGRAM_TURNSTILE_SECRET is set.
function enTurnstileVerify($token){
    $secret = integram_env('INTEGRAM_TURNSTILE_SECRET', '');
    if($secret === '')
        return TRUE;
    if(!is_string($token) || $token === '')
        return FALSE;
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(array('secret' => $secret, 'response' => $token, 'remoteip' => enClientIp())));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $raw = curl_exec($ch);
    curl_close($ch);
    $data = json_decode((string)$raw, TRUE);
    return !empty($data['success']);
}

# Limits per action: array(max hits, window in seconds). Override with INTEGRAM_RATE_<ACTION>=max/window.
function enRateRule($action){
    $defaults = array(
        'register' => array(5, 3600),
        'reset'    => array(5, 3600),
        'login'    => array(30, 600),
        'oauth'    => array(30, 600),
    );
    $rule = isset($defaults[$action]) ? $defaults[$action] : array(30, 600);
    $env = integram_env('INTEGRAM_RATE_'.strtoupper($action), '');
    if(preg_match('/^(\d+)\/(\d+)$/', $env, $m))
        $rule = array((int)$m[1], (int)$m[2]);
    return $rule;
}

function enBotDie($msg, $code){
    if(function_exists('isApi') && isApi()){
        header("HTTP/1.0 $code");
        header("Content-Type: application/json; charset=UTF-8");
        die(json_encode(array(array("error" => $msg)), JSON_UNESCAPED_SLASHES));
    }
    header("HTTP/1.0 $code");
    die(htmlspecialchars($msg));
}

# Workspace names share the URL space with the marketing pages and the engine folders
# (ideav.pro/<workspace>), so these names are never given to a workspace.
function enReservedName($db){
    $db = strtolower((string)$db);
    $reserved = array('my', 'en', 'start', 'auth', 'pricing', 'ai', 'compare', 'use', 'usecases', 'knowledge',
        'contact', 'terms', 'privacy', 'cookies', 'excel', 'api', 'admin', 'root', 'www', 'mail', 'img', 'js', 'css',
        'i', 'ace', 'assets', 'download', 'templates', 'include', 'db', 'logs', 'install', 'order', 'images', 'blog',
        'help', 'docs', 'static', 'support', 'status', 'app', 'dashboard', 'login', 'signup', 'register', 'demo');
    if(in_array($db, $reserved, TRUE))
        return TRUE;
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : dirname(__DIR__);
    return file_exists("$root/$db") || file_exists("$root/$db.html") || file_exists("$root/$db.php");
}

# Guard for the public forms: register, login, reset (and the OAuth start).
function enBotGuard($action){
    # Honeypot: the auth page carries a visually hidden "website" field humans never fill in.
    if(!empty($_REQUEST['website'])){
        if(function_exists('wlog'))
            wlog("[bot] honeypot hit on $action from ".enClientIp(), "log");
        enBotDie("Request rejected.", "400 Bad Request");
    }
    list($max, $window) = enRateRule($action);
    if(!enRateLimit($action, $max, $window))
        enBotDie("Too many attempts. Please wait a few minutes and try again.", "429 Too Many Requests");
    if(in_array($action, array('register', 'reset'), TRUE)
        && !enTurnstileVerify(isset($_REQUEST['cf-turnstile-response']) ? $_REQUEST['cf-turnstile-response'] : ''))
        enBotDie("Please complete the human verification and try again.", "403 Forbidden");
}
