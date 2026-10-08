<?php
# Configuration comes from environment variables only (see .env.example and README.md).
# Apache: SetEnv / PassEnv in the vhost, or a .env file next to index.php (loaded below).
if(!function_exists('integram_env')){
    function integram_env($name, $default = ''){
        $value = getenv($name);
        return ($value === false || $value === '') ? $default : $value;
    }
}
# Optional .env file (KEY=VALUE per line) for hosts where setting env vars is awkward.
# Real environment variables always win over the file.
if(!defined('INTEGRAM_DOTENV_LOADED')){
    define('INTEGRAM_DOTENV_LOADED', true);
    $dotenv = integram_env('INTEGRAM_ENV_FILE', dirname(__DIR__).'/.env');
    if(is_file($dotenv) && is_readable($dotenv)){
        foreach(file($dotenv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line){
            $line = trim($line);
            if($line === '' || $line[0] === '#' || strpos($line, '=') === false)
                continue;
            list($k, $v) = array_map('trim', explode('=', $line, 2));
            if(strlen($v) > 1 && ($v[0] === '"' || $v[0] === "'") && substr($v, -1) === $v[0])
                $v = substr($v, 1, -1);
            if(getenv($k) === false)
                putenv("$k=$v");
        }
    }
}

$dbHost = integram_env('INTEGRAM_DB_HOST', 'localhost');
$dbPort = (int)integram_env('INTEGRAM_DB_PORT', '3306');
$dbName = integram_env('INTEGRAM_DB_NAME', 'integram');
$dbUser = integram_env('INTEGRAM_DB_USER', 'integram');
$dbPassword = integram_env('INTEGRAM_DB_PASSWORD', '');

# Timeouts must be set before connecting; the read timeout backs up TIME_LIMIT_MAX.
$connection = mysqli_init() or die("Couldn't connect.");
@mysqli_options($connection, MYSQLI_OPT_CONNECT_TIMEOUT, 10);
if(defined("MYSQLI_OPT_READ_TIMEOUT"))
    @mysqli_options($connection, MYSQLI_OPT_READ_TIMEOUT, TIME_LIMIT_MAX + TIME_LIMIT_SQL_SLACK);
@mysqli_real_connect($connection, $dbHost, $dbUser, $dbPassword, $dbName, $dbPort) or die("Couldn't connect to the database.");
$connection->set_charset("utf8mb4");
$GLOBALS["DB_CONN"] = array("host" => $dbHost, "user" => $dbUser, "password" => $dbPassword,
                            "name" => $dbName, "port" => $dbPort);
$GLOBALS["SQL_THREAD_ID"] = mysqli_thread_id($connection);
Limit_sql_time(isset($GLOBALS["TIME_LIMIT"]) ? $GLOBALS["TIME_LIMIT"] : TIME_LIMIT_DEFAULT, $connection);

global $mail_config;
# Outgoing mail (confirmation links, password resets, admin notices).
# smtp_host may carry a transport prefix: "ssl://smtp.example.com" for port 465 (implicit TLS);
# INTEGRAM_SMTP_SECURE=tls switches on STARTTLS (port 587). Empty password = no SMTP AUTH.
$mail_config['smtp_username'] = integram_env('INTEGRAM_SMTP_USERNAME', '');
$mail_config['smtp_password'] = integram_env('INTEGRAM_SMTP_PASSWORD', '');
$mail_config['smtp_host'] = integram_env('INTEGRAM_SMTP_HOST', 'localhost');
$mail_config['smtp_port'] = integram_env('INTEGRAM_SMTP_PORT', '25');
$mail_config['smtp_secure'] = strtolower(integram_env('INTEGRAM_SMTP_SECURE', ''));
$mail_config['smtp_from_email'] = integram_env('INTEGRAM_SMTP_FROM_EMAIL', $mail_config['smtp_username'] !== '' ? $mail_config['smtp_username'] : 'hello@ideav.pro');
$mail_config['smtp_debug'] = filter_var(integram_env('INTEGRAM_SMTP_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN);
$mail_config['smtp_charset'] = integram_env('INTEGRAM_SMTP_CHARSET', 'utf-8');
$mail_config['smtp_from'] = integram_env('INTEGRAM_SMTP_FROM', 'Integram');
define("ADMINEMAIL", integram_env('INTEGRAM_ADMIN_EMAIL', 'hello@ideav.pro'));
# Workspace templates: a MySQL table with this name is cloned into each new workspace (newDb()).
define("TEMPLATES", integram_env('INTEGRAM_TEMPLATES', ':en:'));
$masterPassword = integram_env('INTEGRAM_MASTER_PASSWORD', '');
# Without a master password the "admin" master login is disabled (a random hash nobody knows).
define("ADMINHASH", integram_env('INTEGRAM_ADMINHASH', $masterPassword !== '' ? sha1($_SERVER["SERVER_NAME"].$z.$masterPassword) : bin2hex(random_bytes(20))));
define("SALT", integram_env('INTEGRAM_SALT', 'change-me'));
define("SMS_SADR", "");
define("SMS_OP", "");
define("G_CLIENT_ID", integram_env('INTEGRAM_GOOGLE_CLIENT_ID', ''));
define("G_CLIENT_PK", integram_env('INTEGRAM_GOOGLE_CLIENT_SECRET', ''));
define("GH_CLIENT_ID", integram_env('INTEGRAM_GITHUB_CLIENT_ID', ''));
define("GH_CLIENT_PK", integram_env('INTEGRAM_GITHUB_CLIENT_SECRET', ''));

Exec_sql("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'", "Set sql_mode");
