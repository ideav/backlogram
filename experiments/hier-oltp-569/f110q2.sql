\set ON_ERROR_STOP on
\timing on
\echo === Q1full flat: сумма руб по ВСЕМ датам (полная агрегация)
SELECT count(*), sum(s) FROM (
  SELECT d.val v, sum(r.val::numeric) s
  FROM f_flat d JOIN f_flat r ON r.up=d.up AND r.t=2103
  WHERE d.t=2101 GROUP BY d.val) x;
\echo === Q1full hier
SELECT count(*), sum(s) FROM (
  SELECT f.val v, sum(r.val::numeric) s
  FROM f_hier f
  JOIN f_hier i ON i.up=f.id AND i.t=301
  JOIN f_hier r ON r.up=i.id AND r.t=2103
  WHERE f.t=300 GROUP BY f.val) x;
\echo === Q1y flat: сумма руб по датам за ГОД (2010)
SELECT count(*), sum(s) FROM (
  SELECT d.val v, sum(r.val::numeric) s
  FROM f_flat d JOIN f_flat r ON r.up=d.up AND r.t=2103
  WHERE d.t=2101 AND lower(left(d.val,127)) BETWEEN '2010-01-01' AND '2010-12-31'
  GROUP BY d.val) x;
\echo === Q1y hier
SELECT count(*), sum(s) FROM (
  SELECT f.val v, sum(r.val::numeric) s
  FROM f_hier f
  JOIN f_hier i ON i.up=f.id AND i.t=301
  JOIN f_hier r ON r.up=i.id AND r.t=2103
  WHERE f.t=300 AND lower(left(f.val,127)) BETWEEN '2010-01-01' AND '2010-12-31'
  GROUP BY f.val) x;
