\set ON_ERROR_STOP on
\echo === PLAN Q1b flat (счёт по филиалам, 7 дней)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT g.val, count(*)
FROM flat d JOIN flat g ON g.up=d.up AND g.t=1051
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val;
\echo === PLAN Q1b hier2
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT g.val, count(*)
FROM hier2 d
JOIN hier2 g  ON g.up=d.up AND g.t=1051
JOIN hier2 tx ON tx.up=d.up AND tx.t=100
WHERE d.t=1006 AND lower(left(d.val,127)) BETWEEN '2026-06-10' AND '2026-06-16'
GROUP BY g.val;
\echo === PLAN F110 Q1 flat (сумма по датам, вся история)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT d.val, sum(r.val::numeric)
FROM f_flat d JOIN f_flat r ON r.up=d.up AND r.t=2103
WHERE d.t=2101 GROUP BY d.val;
\echo === PLAN F110 Q1 hier
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT f.val, sum(r.val::numeric)
FROM f_hier f
JOIN f_hier i ON i.up=f.id AND i.t=301
JOIN f_hier r ON r.up=i.id AND r.t=2103
WHERE f.t=300 GROUP BY f.val;
