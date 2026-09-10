\set ON_ERROR_STOP on
\timing on
DROP TABLE IF EXISTS f_flat, f_hier;
CREATE TABLE f_flat (id int8, up int8, t int8, val text);
CREATE TABLE f_hier (id int8, up int8, t int8, val text);
\copy f_flat from 'C:/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569/f_flat.csv' with (format csv)
\copy f_hier from 'C:/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569/f_hier.csv' with (format csv)
ALTER TABLE f_flat ADD PRIMARY KEY (id);
ALTER TABLE f_hier ADD PRIMARY KEY (id);
CREATE INDEX ON f_flat (up, t);
CREATE INDEX ON f_hier (up, t);
CREATE INDEX ON f_flat (t, lower(left(val,127)));
CREATE INDEX ON f_hier (t, lower(left(val,127)));
VACUUM ANALYZE f_flat; VACUUM ANALYZE f_hier;
SELECT relname, pg_size_pretty(pg_relation_size(c.oid)) tbl,
       pg_size_pretty(pg_indexes_size(c.oid)) idx,
       pg_size_pretty(pg_total_relation_size(c.oid)) total
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relkind='r' AND relname LIKE 'f\_%' ORDER BY 1;
