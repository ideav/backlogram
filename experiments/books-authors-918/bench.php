<?php
// Замер #918: обычная схема vs ядро. Запуск в контейнере app: php bench.php <метка> [раундов]
$label = $argv[1] ?? 'run'; $N = (int)($argv[2] ?? 7);
$st = json_decode(file_get_contents(__DIR__ . '/state.json'), true);
$R = $st['reports'];
$db = new mysqli('db', 'root', 'root918', 'classic'); $db->set_charset('utf8mb4');
$prefix = ['Le%', 'Wij%', 'Тяме%', 'Мун %', 'Co %', 'Te %'];
$eq = ['Иванов', 'Brait'];
$sel = "SELECT author.author, books.name, books.pages, books.year FROM books, author WHERE ";
$cases = [];
$cases[] = ['q1 автор %aro%', "{$sel}author.author LIKE '%aro%' AND books.author=author.id LIMIT 1000", $R['q1_author_like'], 'FR_author=' . rawurlencode('%aro%')];
foreach ($prefix as $p) $cases[] = ["q2 автор $p", "{$sel}author.author LIKE '$p' AND books.author=author.id LIMIT 1000", $R['q1_author_like'], 'FR_author=' . rawurlencode($p)];
foreach ($eq as $p) $cases[] = ["q2 автор = $p", "{$sel}author.author = '$p' AND books.author=author.id LIMIT 1000", $R['q1_author_like'], 'FR_author=' . rawurlencode($p)];
$cases[] = ['q3 книга %лые пар% (автор первым)', "{$sel}books.name LIKE '%лые пар%' AND books.author=author.id LIMIT 50", $R['q3_book_like_af'], 'FR_book=' . rawurlencode('%лые пар%')];
$cases[] = ['q3 книга %лые пар% (книга первой)', "SELECT author.author, books.name, books.pages, books.year FROM books INNER JOIN author ON books.author=author.id WHERE books.name LIKE '%лые пар%' LIMIT 50", $R['q3_book_like_bf'], 'FR_book=' . rawurlencode('%лые пар%')];
$cases[] = ['q4 страниц=150 и год=1972', "{$sel}books.pages=150 AND books.year=1972 AND books.author=author.id LIMIT 50", $R['q4_pages_year'], 'FR_pages=150&FR_year=1972'];
$cases[] = ['q5 книг по годам', "SELECT year, COUNT(*) FROM books GROUP BY year ORDER BY year", $R['q5_by_year'], ''];
$cases[] = ['q6 сумма страниц по автору', "SELECT author.id, author.author, SUM(books.pages) FROM author LEFT JOIN books ON books.author=author.id GROUP BY author.id, author.author", $R['q6_pages_by_author'], ''];
$cases[] = ['q7 топ-10 авторов по числу книг', "SELECT author.id, author.author, COUNT(*) c FROM author JOIN books ON books.author=author.id GROUP BY author.id, author.author ORDER BY c DESC LIMIT 10", $R['q7_top10_authors'], ''];

function t_sql($db, $sql) { $t = microtime(true); $r = $db->query($sql) or die($db->error . "\n$sql\n"); $n = 0; while ($r->fetch_row()) $n++; return [microtime(true) - $t, $n]; }
function t_http($rep, $qs, $trace = false) {
  $url = "http://localhost/bk/report/$rep?JSON_KV&TIME=600&LIMIT=0,200000" . ($qs ? "&$qs" : '') . ($trace ? '&TRACE_IT=1' : '');
  $c = curl_init($url); curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => 1, CURLOPT_HTTPHEADER => ['X-Authorization: bk918tok'], CURLOPT_TIMEOUT => 300]);
  $t = microtime(true); $b = curl_exec($c); $dt = microtime(true) - $t; $code = curl_getinfo($c, CURLINFO_HTTP_CODE);
  $j = json_decode($b, true); if ($code != 200 || !is_array($j)) die("HTTP $code $url\n" . substr($b, 0, 500) . "\n");
  return [$dt, count($j)];
}
// SQL отчёта, который построило ядро: берём из трассировки (TRACE_IT) самый долгий запрос к bk
function core_sql($rep, $qs) {
  foreach (glob('/var/www/html/templates/custom/bk/logs/trace*.log') as $f) unlink($f);
  t_http($rep, $qs, true);
  $best = null; $bt = -1;
  for ($w = 0; $w < 50; $w++) { $all = implode('', array_map('file_get_contents', glob('/var/www/html/templates/custom/bk/logs/trace2*.log'))); if (strpos($all, '; [Request report data]') !== false) break; usleep(100000); }
  foreach (glob('/var/www/html/templates/custom/bk/logs/trace*.log') as $f)
    if (preg_match_all('/\[([\d.]+)\] (SELECT .*?); \[/s', file_get_contents($f), $m, PREG_SET_ORDER))
      foreach ($m as $x) if (preg_match('/a(' . $GLOBALS['st']['A'] . '|' . $GLOBALS['st']['B'] . ')/', $x[2]) && (float)$x[1] > $bt) { $bt = (float)$x[1]; $best = $x[2]; }
  if ($best === null) fprintf(STDERR, "core_sql miss: w=%d m=%d A=%s len=%d\n", $w, count($m ?? []), var_export($GLOBALS['st']['A'] ?? null, true), strlen($all));
  return [$best, $bt];
}
$core = new mysqli('db', 'root', 'root918', 'ideav'); $core->set_charset('utf8mb4');
$med = function ($a) { sort($a); return $a[intdiv(count($a), 2)]; };
$out = [];
foreach ($cases as [$name, $sql, $rep, $qs]) {
  [$csql, $ctrace] = core_sql($rep, $qs);
  $a = $b = $c = []; $na = $nb = $nc = 0;
  for ($i = 0; $i < $N; $i++) {
    [$x, $na] = t_sql($db, $sql); $a[] = $x;
    [$x, $nb] = t_http($rep, $qs); $b[] = $x;
    [$x, $nc] = t_sql($core, $csql); $c[] = $x;
  }
  $row = ['case' => $name, 'rows_classic' => $na, 'rows_core' => $nb, 'rows_core_sql' => $nc,
    'classic_ms' => round($med($a) * 1000, 1), 'core_http_ms' => round($med($b) * 1000, 1), 'core_sql_ms' => round($med($c) * 1000, 1),
    'classic_all' => array_map(fn($v) => round($v * 1000, 1), $a), 'core_http_all' => array_map(fn($v) => round($v * 1000, 1), $b),
    'core_sql_all' => array_map(fn($v) => round($v * 1000, 1), $c), 'classic_sql' => $sql, 'core_sql' => $csql];
  $out[] = $row;
  fprintf(STDERR, "%-40s rows %d/%d/%d  classic %.1f  core-http %.1f  core-sql %.1f ms\n", $name, $na, $nb, $nc, $row['classic_ms'], $row['core_http_ms'], $row['core_sql_ms']);
}
file_put_contents(__DIR__ . "/results-$label.json", json_encode(['label' => $label, 'rounds' => $N, 'at' => date('c'), 'cases' => $out], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
