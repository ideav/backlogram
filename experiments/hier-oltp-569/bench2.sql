\set ON_ERROR_STOP on
\timing on
-- Q1b: СЧЁТ транзакций по филиалам за 7 дней (без суммы) — flat vs hier2/hier4
\echo === Q1b flat
SELECT g.val, count(*)
FROM flat d JOIN flat g ON g.up=d.up AND g.t=1051
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;
\echo === Q1b hier2
SELECT g.val, count(*)
FROM hier2 d
JOIN hier2 g  ON g.up=d.up AND g.t=1051
JOIN hier2 tx ON tx.up=d.up AND tx.t=100
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;
\echo === Q1b hier4
SELECT g.val, count(*)
FROM hier4 d
JOIN hier4 g  ON g.up=d.up AND g.t=1051
JOIN hier4 tx ON tx.up=d.up AND tx.t=100
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;

-- Накопитель: сумма amount детей как реквизит разреза (t=2001), один раз
\echo === build accumulator (t=2001 на hier4)
INSERT INTO hier4
SELECT (SELECT max(id) FROM hier4) + row_number() OVER (), s.cut, 2001, s.total::text
FROM (
  SELECT tx.up AS cut, sum(a.val::numeric) AS total
  FROM hier4 tx JOIN hier4 a ON a.up=tx.id AND a.t=1003
  WHERE tx.t=100 GROUP BY tx.up
) s;
ANALYZE hier4;

-- Q1c: сумма по филиалам за 7 дней ТОЛЬКО по уровню разреза (накопители)
\echo === Q1c hier4+акк
SELECT g.val, sum(acc.val::numeric)
FROM hier4 d
JOIN hier4 g   ON g.up=d.up AND g.t=1051
JOIN hier4 acc ON acc.up=d.up AND acc.t=2001
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;

-- Q3c: сумма по валютам за 90 дней только по разрезам
\echo === Q3c hier4+акк
SELECT c.val, sum(acc.val::numeric)
FROM hier4 c JOIN hier4 acc ON acc.up=c.up AND acc.t=2001
WHERE c.t=1045
GROUP BY c.val ORDER BY 1;
