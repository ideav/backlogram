\set ON_ERROR_STOP on
\timing on
\echo === Q1 flat: сумма руб по датам (вся история)
SELECT d.val, sum(r.val::numeric)
FROM f_flat d JOIN f_flat r ON r.up=d.up AND r.t=2103
WHERE d.t=2101 GROUP BY d.val ORDER BY 1 DESC LIMIT 3;
\echo === Q1 hier
SELECT f.val, sum(r.val::numeric)
FROM f_hier f
JOIN f_hier i ON i.up=f.id AND i.t=301
JOIN f_hier r ON r.up=i.id AND r.t=2103
WHERE f.t=300 GROUP BY f.val ORDER BY 1 DESC LIMIT 3;
\echo === Q2 flat: динамика кода A/5.2 по датам
SELECT d.val, r.val
FROM f_flat i
JOIN f_flat d ON d.up=i.id AND d.t=2101
JOIN f_flat r ON r.up=i.id AND r.t=2103
WHERE i.t=301 AND lower(left(i.val,127))='a/5.2' ORDER BY 1 DESC LIMIT 3;
\echo === Q2 hier
SELECT f.val, r.val
FROM f_hier i
JOIN f_hier f ON f.id=i.up AND f.t=300
JOIN f_hier r ON r.up=i.id AND r.t=2103
WHERE i.t=301 AND lower(left(i.val,127))='a/5.2' ORDER BY 1 DESC LIMIT 3;
\echo === Q3 flat: все показатели даты 2010-05-14
SELECT count(*), sum(r.val::numeric)
FROM f_flat d
JOIN f_flat r ON r.up=d.up AND r.t=2103
WHERE d.t=2101 AND lower(left(d.val,127))='2010-05-14';
\echo === Q3 hier
SELECT count(*), sum(r.val::numeric)
FROM f_hier f
JOIN f_hier i ON i.up=f.id AND i.t=301
JOIN f_hier r ON r.up=i.id AND r.t=2103
WHERE f.t=300 AND lower(left(f.val,127))='2010-05-14';
