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

test('target comes only from config; aff is appended for ideav.ru pages', { skip: !docker }, () => {
  const out = php('$m=["v"=>["url"=>"https://ideav.ru/excel-to-app.html","aff"=>true]]; $l=["tok1234567890abcd"=>["partner"=>"12","material"=>"v"]];'
    + '$h=pl_resolve($l,$m,"tok1234567890abcd"); echo pl_target_url($h["info"],$h["partner"]), "|", var_export(pl_resolve($l,$m,"nope0000000000000"), true);')
  assert.equal(out, 'https://ideav.ru/excel-to-app.html?aff=12|NULL')
})

test('issue is idempotent; report counts humans, uniques and bots separately', { skip: !docker }, () => {
  const out = php('$d=sys_get_temp_dir()."/pl".getmypid(); mkdir($d); file_put_contents("$d/materials.json", json_encode(["a"=>["url"=>"https://x.y/a"],"b"=>["url"=>"https://x.y/b"]]));'
    + '$t1=pl_issue($d,"7"); $t2=pl_issue($d,"7"); $t3=pl_issue($d,"8");'
    + '$ev=function($m,$ua,$v) use ($d){ pl_append_event($d, pl_build_event("7",$m,$ua,"1.2.3.4",$v,false,"","s")); };'
    + '$ev("a","Mozilla/5.0","v1"); $ev("a","Mozilla/5.0","v1"); $ev("a","Mozilla/5.0","v2"); $ev("a","TelegramBot","v3");'
    + '$r=pl_report($d)["7"]["a"]; echo json_encode([$t1===$t2, $t1["a"]!==$t3["a"], count($t1), $r["open"], $r["unique"], $r["bot"], strlen(json_decode(file($d."/events.jsonl")[0],true)["ip"])]);')
  assert.equal(out, '[true,true,2,3,2,1,12]')
})
