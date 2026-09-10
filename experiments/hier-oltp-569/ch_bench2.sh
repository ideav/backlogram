#!/bin/bash
# Чистое время запроса (--time печатает только его, без старта процесса).
CH=~/ch/clickhouse
CHD=~/chdata

run() {
  local name="$1"; local sql="$2"
  "$CH" local --path "$CHD" --query "$sql" >/dev/null 2>&1              # прогрев
  local a=$("$CH" local --path "$CHD" --time --query "$sql" 2>&1 >/dev/null | tail -1)
  local b=$("$CH" local --path "$CHD" --time --query "$sql" 2>&1 >/dev/null | tail -1)
  echo "$name | $a | $b"
}

echo "=== WIDE (типизированная колоночная таблица) ==="
run "Q1  сумма по филиалам, 7 дней" \
  "SELECT Gosb, sum(amount) FROM wide_ch WHERE DT BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY Gosb FORMAT Null"
run "Q1b счёт по филиалам, 7 дней" \
  "SELECT Gosb, count() FROM wide_ch WHERE DT BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY Gosb FORMAT Null"
run "Q2  счёт по типам, 30 дней" \
  "SELECT Merchant_Type, count() FROM wide_ch WHERE DT BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY Merchant_Type FORMAT Null"
run "Q3  сумма по валютам, 90 дней" \
  "SELECT CCY, sum(amount) FROM wide_ch GROUP BY CCY FORMAT Null"
run "Q4  точечно: карточка по PAN" \
  "SELECT * FROM wide_ch WHERE pan='4625092648361236' LIMIT 1 FORMAT Null"

echo
echo "=== EAV-квартет в том же ClickHouse ==="
run "Q1  сумма по филиалам, 7 дней" \
  "SELECT g.val, sum(toDecimal64(a.val, 2)) FROM flat_ch d
   INNER JOIN flat_ch g ON g.up = d.up INNER JOIN flat_ch a ON a.up = d.up
   WHERE d.t = 1006 AND d.val BETWEEN '2026-06-10' AND '2026-06-16' AND g.t = 1051 AND a.t = 1003
   GROUP BY g.val FORMAT Null"
run "Q1b счёт по филиалам, 7 дней" \
  "SELECT g.val, count() FROM flat_ch d INNER JOIN flat_ch g ON g.up = d.up
   WHERE d.t = 1006 AND d.val BETWEEN '2026-06-10' AND '2026-06-16' AND g.t = 1051
   GROUP BY g.val FORMAT Null"
run "Q3  сумма по валютам, 90 дней" \
  "SELECT c.val, sum(toDecimal64(a.val, 2)) FROM flat_ch c INNER JOIN flat_ch a ON a.up = c.up
   WHERE c.t = 1045 AND a.t = 1003 GROUP BY c.val FORMAT Null"
run "Q4  точечно: карточка по PAN" \
  "SELECT r.t, r.val FROM flat_ch r
   WHERE r.up = (SELECT up FROM flat_ch WHERE t = 1001 AND val = '4625092648361236' LIMIT 1) FORMAT Null"
