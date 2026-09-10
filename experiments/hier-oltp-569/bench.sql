-- Замер #569: агрегаты и точечные выборки. t-коды: TX=100, CUT=200,
-- pan=1001, amount=1003, DT=1006, Merchant_Type=1017, CCY=1045, Gosb=1051.
\set ON_ERROR_STOP on
\timing on

-- ============ Q1: сумма amount по филиалам за 7 дней ============
\echo === Q1 wide
SELECT "Gosb", sum(amount::numeric) FROM wide
WHERE "DT" BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1 ORDER BY 1 LIMIT 3;

\echo === Q1 flat (разрезы храним у каждой транзакции)
SELECT g.val, sum(a.val::numeric)
FROM flat d
JOIN flat g ON g.up=d.up AND g.t=1051
JOIN flat a ON a.up=d.up AND a.t=1003
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;

\echo === Q1 hier2 (разрез = дата+филиал)
SELECT g.val, sum(a.val::numeric)
FROM hier2 d
JOIN hier2 g  ON g.up=d.up AND g.t=1051
JOIN hier2 tx ON tx.up=d.up AND tx.t=100
JOIN hier2 a  ON a.up=tx.id AND a.t=1003
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;

\echo === Q1 hier4
SELECT g.val, sum(a.val::numeric)
FROM hier4 d
JOIN hier4 g  ON g.up=d.up AND g.t=1051
JOIN hier4 tx ON tx.up=d.up AND tx.t=100
JOIN hier4 a  ON a.up=tx.id AND a.t=1003
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val ORDER BY 1 LIMIT 3;

-- ============ Q2: число транзакций по типу мерчанта за 30 дней ============
\echo === Q2 wide
SELECT "Merchant_Type", count(*) FROM wide
WHERE "DT" BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY 1 ORDER BY 1 LIMIT 3;

\echo === Q2 flat
SELECT m.val, count(*)
FROM flat d
JOIN flat m ON m.up=d.up AND m.t=1017
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-01' AND '2026-06-30'
GROUP BY m.val ORDER BY 1 LIMIT 3;

\echo === Q2 hier4 (тип — на уровне разреза, считаем детей)
SELECT m.val, count(*)
FROM hier4 d
JOIN hier4 m  ON m.up=d.up AND m.t=1017
JOIN hier4 tx ON tx.up=d.up AND tx.t=100
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-01' AND '2026-06-30'
GROUP BY m.val ORDER BY 1 LIMIT 3;

-- ============ Q3: сумма по валютам за все 90 дней ============
\echo === Q3 wide
SELECT "CCY", sum(amount::numeric) FROM wide GROUP BY 1 ORDER BY 1;

\echo === Q3 flat
SELECT c.val, sum(a.val::numeric)
FROM flat c
JOIN flat a ON a.up=c.up AND a.t=1003
WHERE c.t=1045
GROUP BY c.val ORDER BY 1;

\echo === Q3 hier4
SELECT c.val, sum(a.val::numeric)
FROM hier4 c
JOIN hier4 tx ON tx.up=c.up AND tx.t=100
JOIN hier4 a  ON a.up=tx.id AND a.t=1003
WHERE c.t=1045
GROUP BY c.val ORDER BY 1;

-- ============ Q4: точечный поиск по PAN + полная карточка ============
\echo === Q4 wide
SELECT * FROM wide WHERE pan=:'pan' LIMIT 1;

\echo === Q4 flat
SELECT r.t, r.val FROM flat r WHERE r.up=(
  SELECT p.up FROM flat p WHERE p.t=1001 AND lower(left(p.val,127))=lower(:'pan') LIMIT 1
) ORDER BY r.t LIMIT 5;

\echo === Q4 hier4 (карточка + подъём к разрезу за вынесенными полями)
WITH tx AS (
  SELECT p.up AS id FROM hier4 p WHERE p.t=1001 AND lower(left(p.val,127))=lower(:'pan') LIMIT 1
)
SELECT r.t, r.val FROM hier4 r, tx WHERE r.up=tx.id
UNION ALL
SELECT r2.t, r2.val
FROM hier4 o, tx, hier4 r2
WHERE o.id=tx.id AND r2.up=o.up
ORDER BY 1 LIMIT 60;
