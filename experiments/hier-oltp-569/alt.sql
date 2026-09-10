\set ON_ERROR_STOP on
\timing on

-- ═══ Альтернатива 1: jsonb вместо EAV (habr 475178) ═══
DROP TABLE IF EXISTS jb;
\echo === build jsonb
CREATE TABLE jb AS SELECT id, to_jsonb(w) - 'id' AS doc FROM wide w;
ALTER TABLE jb ADD PRIMARY KEY (id);
\echo === index jsonb (btree под агрегаты)
CREATE INDEX jb_dt_gosb ON jb ((doc->>'DT'), (doc->>'Gosb'));
\echo === index jsonb (GIN, общий доступ по любому ключу)
CREATE INDEX jb_gin ON jb USING gin (doc jsonb_path_ops);
VACUUM ANALYZE jb;

-- ═══ Альтернатива 2: материализованное представление поверх плоских квартетов ═══
DROP MATERIALIZED VIEW IF EXISTS mv_flat;
\echo === build matview (flat)
CREATE MATERIALIZED VIEW mv_flat AS
SELECT d.val AS dt, g.val AS gosb, count(*) AS cnt, sum(a.val::numeric) AS amt
FROM flat d
JOIN flat g ON g.up=d.up AND g.t=1051
JOIN flat a ON a.up=d.up AND a.t=1003
WHERE d.t=1006
GROUP BY 1,2;
CREATE INDEX ON mv_flat (dt, gosb);
VACUUM ANALYZE mv_flat;

\echo === sizes
SELECT relname,
       pg_size_pretty(pg_relation_size(c.oid)) tbl,
       pg_size_pretty(pg_indexes_size(c.oid)) idx,
       pg_size_pretty(pg_total_relation_size(c.oid)) total
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relkind IN ('r','m') AND relname IN ('wide','flat','hier2','hier4','hier8','jb','mv_flat')
ORDER BY pg_total_relation_size(c.oid) DESC;
