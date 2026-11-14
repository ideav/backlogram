import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// PHP берём из docker-образа (на хосте PHP нет); без docker тесты пропускаются.
const IMAGE = process.env.PHP_IMAGE || 'php:8.2-cli'
function hasDocker() { try { execFileSync('docker', ['image', 'inspect', IMAGE], { stdio: 'ignore' }); return true } catch { return false } }
const docker = hasDocker()
function php(code) {
  return execFileSync('docker', ['run', '--rm', '-v', `${process.cwd()}/public:/app:ro`, IMAGE, 'php', '-r',
    `require "/app/partner-link-lib.php"; ${code}`], { encoding: 'utf8' }).trim()
}

test('htaccess routes /m/<token> above the front controller', () => {
  const h = readFileSync('public/.htaccess', 'utf8')
  assert.ok(h.indexOf('partner-link.php') > 0 && h.indexOf('partner-link.php') < h.lastIndexOf('RewriteRule ^ index.php'))
})

test('partner PHP files have no syntax errors', { skip: !docker }, () => {
  for (const f of ['partner-link-lib.php', 'partner-link.php', 'partner-links-admin.php', 'partner-config.example.php'])
    execFileSync('docker', ['run', '--rm', '-v', `${process.cwd()}/public:/app:ro`, IMAGE, 'php', '-l', `/app/${f}`], { stdio: 'pipe' })
})

test('token validation accepts only 16–64 url-safe chars', { skip: !docker }, () => {
  assert.equal(php('echo json_encode([pl_valid_token("abcdEFGH_-123456"), pl_valid_token("short"), pl_valid_token("../etc/passwd/aaaaaa"), pl_valid_token(null)]);'), '[true,false,false,false]')
})

test('bots and link previews are flagged, browsers are not', { skip: !docker }, () => {
  assert.equal(php('echo json_encode([pl_is_bot("TelegramBot (like TwitterBot)"), pl_is_bot(""), pl_is_bot("Mozilla/5.0 (iPhone) Safari"), pl_is_bot("Mozilla/5.0 YaBrowser/23"), pl_is_bot("WhatsApp/2.23")]);'), '[true,true,false,false,true]')
})

const DOWN = '$cfg=["url"=>"http://127.0.0.1:1/my","token"=>"t"];'
const TMP = '$d=sys_get_temp_dir()."/pl".getmypid(); @mkdir($d);'

test('link row from the table: partner id before the colon, token rechecked case-sensitively', { skip: !docker }, () => {
  assert.equal(php('echo json_encode(pl_link_from_row(["i"=>1,"r"=>["Tok1234567890abcd","12:Иван","video_excel","Видео","material"]]), JSON_UNESCAPED_UNICODE);'),
    '{"partner":"12","material":"video_excel","title":"Видео","kind":"material"}')
})

test('target comes only from materials.json; aff is appended for ideav.ru pages; cache serves links when API is down', { skip: !docker }, () => {
  const out = php(DOWN + TMP + '$m=["v"=>["url"=>"https://ideav.ru/excel-to-app.html","aff"=>true]];'
    + 'file_put_contents("$d/links-cache.json", json_encode(["tok1234567890abcd"=>["partner"=>"12","material"=>"v","title"=>"","kind"=>"material"]]));'
    + '$h=pl_resolve($d,$cfg,$m,"tok1234567890abcd"); echo pl_target_url($h["info"],$h["partner"]), "|", var_export(pl_resolve($d,$cfg,$m,"nope0000000000000"), true), "|", var_export(pl_resolve($d,$cfg,$m,"../etc/passwd"), true);')
  assert.equal(out, 'https://ideav.ru/excel-to-app.html?aff=12|NULL|NULL')
})

test('event goes to the table fields; time is unix seconds; previews are not recorded', { skip: !docker }, () => {
  const out = php('$e=pl_build_event("7","kp","КП","Mozilla/5.0","v1","t.me",1794645959); $f=pl_event_fields($e);'
    + 'echo json_encode([$f["t238518"], $f["t238519"], $f["t238523"], $f["t238525"], $f["t238527"], $f["t238529"], $e["preview"], pl_build_event("7","kp","","TelegramBot","v","")["preview"]], JSON_UNESCAPED_UNICODE);')
  assert.equal(out, '["material_open","7",1794645959,"v1",0,"Открыл: КП (переход с t.me)",false,true]')
})

test('API down: event is queued, flush keeps it until the table accepts it', { skip: !docker }, () => {
  const out = php(DOWN + TMP + '$e=pl_build_event("7","kp","","Mozilla/5.0","v1","");'
    + '$a=pl_record_event($d,$cfg,$e); $b=pl_record_event($d,$cfg,pl_build_event("7","kp","","curl/8","v2",""));'
    + '$f=pl_flush($d,$cfg); $q=json_decode(file($d."/events.jsonl")[0],true);'
    + 'echo json_encode([$a, $b, $f, count(file($d."/events.jsonl")), isset($q["preview"]), $q["time"]===$e["time"]]);')
  assert.equal(out, '["queued","skipped",[0,1],1,false,true]')
})
