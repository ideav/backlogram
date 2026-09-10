\set ON_ERROR_STOP on
\timing on
\echo === JB Q1 сумма по филиалам, 7 дней
SELECT count(*) FROM (SELECT doc->>'Gosb' g, sum((doc->>'amount')::numeric) s FROM jb
 WHERE doc->>'DT' BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === JB Q1b счёт по филиалам, 7 дней
SELECT count(*) FROM (SELECT doc->>'Gosb' g, count(*) c FROM jb
 WHERE doc->>'DT' BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === JB Q2 счёт по типам, 30 дней
SELECT count(*) FROM (SELECT doc->>'Merchant_Type' m, count(*) c FROM jb
 WHERE doc->>'DT' BETWEEN '2026-06-01' AND '2026-06-30' GROUP BY 1) x;
\echo === JB Q3 сумма по валютам, 90 дней
SELECT count(*) FROM (SELECT doc->>'CCY' c, sum((doc->>'amount')::numeric) s FROM jb GROUP BY 1) x;
\echo === JB Q4 точечно по PAN (GIN)
SELECT count(*) FROM (SELECT doc FROM jb WHERE doc @> '{"pan":"4625092648361236"}' LIMIT 1) x;

\echo === MV Q1 сумма по филиалам, 7 дней (матвью поверх flat)
SELECT count(*) FROM (SELECT gosb, sum(amt) FROM mv_flat WHERE dt BETWEEN '2026-06-10' AND '2026-06-16' GROUP BY 1) x;
\echo === MV Q3 сумма по валютам — НЕВОЗМОЖНА: валюты нет в этом матвью
\echo === MV REFRESH (полный пересчёт)
REFRESH MATERIALIZED VIEW mv_flat;
