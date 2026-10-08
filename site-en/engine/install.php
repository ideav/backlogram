<?php
# Idempotent installer: creates the `my` (personal cabinet) and `en` (workspace template) tables
# from db/*.sql and prepares the writable folders. Re-running never overwrites existing rows.
#
#   CLI:  php install.php
#   Web:  https://<host>/install.php?token=<INTEGRAM_INSTALL_TOKEN>   (only when that env var is set)

$cli = (PHP_SAPI === 'cli');
if(!$cli){
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    $expected = getenv('INTEGRAM_INSTALL_TOKEN');
    if($expected === false || $expected === '' || !isset($_GET['token']) || !hash_equals($expected, (string)$_GET['token'])){
        http_response_code(403);
        die("Forbidden. Run `php install.php` on the server, or set INTEGRAM_INSTALL_TOKEN and pass ?token=.\n");
    }
}

function out($s){ echo $s, "\n"; }
function env($k, $d = ''){ $v = getenv($k); return ($v === false || $v === '') ? $d : $v; }

# Same optional .env file the engine reads (real environment variables win).
$dotenv = env('INTEGRAM_ENV_FILE', __DIR__.'/.env');
if(is_file($dotenv)){
    foreach(file($dotenv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line){
        $line = trim($line);
        if($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        list($k, $v) = array_map('trim', explode('=', $line, 2));
        if(strlen($v) > 1 && ($v[0] === '"' || $v[0] === "'") && substr($v, -1) === $v[0]) $v = substr($v, 1, -1);
        if(getenv($k) === false) putenv("$k=$v");
    }
}

mysqli_report(MYSQLI_REPORT_OFF);
$db = env('INTEGRAM_DB_NAME', 'integram');
$tries = (int)env('INTEGRAM_INSTALL_WAIT', $cli ? '30' : '1');
for($i = 0; $i < max(1, $tries); $i++){
    $c = @mysqli_connect(env('INTEGRAM_DB_HOST', 'localhost'), env('INTEGRAM_DB_USER', 'integram'),
                         env('INTEGRAM_DB_PASSWORD', ''), '', (int)env('INTEGRAM_DB_PORT', '3306'));
    if($c) break;
    if($i + 1 < $tries) sleep(2);
}
if(!$c){
    out("ERROR: cannot connect to MySQL: ".mysqli_connect_error());
    exit(1);
}
$c->set_charset('utf8mb4');
if(!$c->query("CREATE DATABASE IF NOT EXISTS `".$c->real_escape_string($db)."` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci"))
    out("note: CREATE DATABASE skipped (".$c->error."), using the existing one");
if(!$c->select_db($db)){
    out("ERROR: cannot use database $db: ".$c->error);
    exit(1);
}

function run_sql_file($c, $file){
    $sql = file_get_contents($file);
    if($sql === false){ out("ERROR: cannot read $file"); exit(1); }
    if(!$c->multi_query($sql)){ out("ERROR in $file: ".$c->error); exit(1); }
    do{
        if($r = $c->store_result()) $r->free();
        if($c->errno){ out("ERROR in $file: ".$c->error); exit(1); }
    } while($c->more_results() && $c->next_result());
    if($c->errno){ out("ERROR in $file: ".$c->error); exit(1); }
}

foreach(array('schema.sql', 'seed-my.sql', 'seed-en.sql') as $f){
    run_sql_file($c, __DIR__."/db/$f");
    out("applied db/$f");
}
foreach(array('my', 'en') as $t){
    $n = $c->query("SELECT COUNT(*) FROM `$t`")->fetch_row()[0];
    out("table $t: $n rows");
}

# Writable folders: logs (request log), download/<workspace> (uploads), templates/custom/<workspace>.
foreach(array('logs', 'download', 'download/my', 'download/en', 'templates/custom', 'templates/custom/my', 'templates/custom/en') as $d){
    $p = __DIR__."/$d";
    if(!is_dir($p) && !@mkdir($p, 0775, true))
        out("WARNING: cannot create $d");
    elseif(!is_writable($p))
        out("WARNING: $d is not writable by ".(function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'this user'));
}
out("done");
