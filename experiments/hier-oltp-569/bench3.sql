\set ON_ERROR_STOP on
\timing on
-- ═══ Q1b: счёт по филиалам за 7 дней ═══
\echo === Q1b flat_c (корреляции)
SELECT count(*) FROM (SELECT g.val, count(*) c FROM flat_c d
 JOIN flat_c g ON g.up=d.up AND g.t=1051
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === Q1b hier4_c (разрез 4, корреляции, группа 31)
SELECT count(*) FROM (SELECT g.val, count(*) c FROM hier4_c d
 JOIN hier4_c g  ON g.up=d.up AND g.t=1051
 JOIN hier4_c tx ON tx.up=d.up AND tx.t=100
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === Q1b hier3_c (три уровня: L1 дата+филиал)
SELECT count(*) FROM (SELECT g.val, count(*) c FROM hier3_c d
 JOIN hier3_c g  ON g.up=d.up AND g.t=1051
 JOIN hier3_c l2 ON l2.up=d.up AND l2.t=201
 JOIN hier3_c tx ON tx.up=l2.id AND tx.t=100
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;

-- ═══ Q2: счёт по типам мерчанта за 30 дней ═══
\echo === Q2 flat_c
SELECT count(*) FROM (SELECT m.val, count(*) c FROM flat_c d
 JOIN flat_c m ON m.up=d.up AND m.t=1017
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY 1) x;
\echo === Q2 hier4_c
SELECT count(*) FROM (SELECT m.val, count(*) c FROM hier4_c d
 JOIN hier4_c m  ON m.up=d.up AND m.t=1017
 JOIN hier4_c tx ON tx.up=d.up AND tx.t=100
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY 1) x;
\echo === Q2 hier3_c (тип живёт на L2)
SELECT count(*) FROM (SELECT m.val, count(*) c FROM hier3_c d
 JOIN hier3_c l2 ON l2.up=d.up AND l2.t=201
 JOIN hier3_c m  ON m.up=l2.id AND m.t=1017
 JOIN hier3_c tx ON tx.up=l2.id AND tx.t=100
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY 1) x;

-- ═══ Q1: сумма по филиалам за 7 дней (мера на нижнем уровне) ═══
\echo === Q1 flat_c
SELECT count(*) FROM (SELECT g.val, sum(a.val::numeric) s FROM flat_c d
 JOIN flat_c g ON g.up=d.up AND g.t=1051
 JOIN flat_c a ON a.up=d.up AND a.t=1003
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === Q1 hier4_c
SELECT count(*) FROM (SELECT g.val, sum(a.val::numeric) s FROM hier4_c d
 JOIN hier4_c g  ON g.up=d.up AND g.t=1051
 JOIN hier4_c tx ON tx.up=d.up AND tx.t=100
 JOIN hier4_c a  ON a.up=tx.id AND a.t=1003
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === Q1 hier3_c
SELECT count(*) FROM (SELECT g.val, sum(a.val::numeric) s FROM hier3_c d
 JOIN hier3_c g  ON g.up=d.up AND g.t=1051
 JOIN hier3_c l2 ON l2.up=d.up AND l2.t=201
 JOIN hier3_c tx ON tx.up=l2.id AND tx.t=100
 JOIN hier3_c a  ON a.up=tx.id AND a.t=1003
 WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
