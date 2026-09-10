\set ON_ERROR_STOP on
\timing on
DROP TABLE IF EXISTS flat_c, hier4_c, hier3_c;
CREATE TABLE flat_c  (id int8, up int8, t int8, val text);
CREATE TABLE hier4_c (id int8, up int8, t int8, val text);
CREATE TABLE hier3_c (id int8, up int8, t int8, val text);
\copy flat_c  from 'C:/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569/flat_c.csv'  with (format csv)
\copy hier4_c from 'C:/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569/hier4_c.csv' with (format csv)
\copy hier3_c from 'C:/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569/hier3_c.csv' with (format csv)
ALTER TABLE flat_c  ADD PRIMARY KEY (id);
ALTER TABLE hier4_c ADD PRIMARY KEY (id);
ALTER TABLE hier3_c ADD PRIMARY KEY (id);
CREATE INDEX ON flat_c  (up, t);
CREATE INDEX ON hier4_c (up, t);
CREATE INDEX ON hier3_c (up, t);
CREATE INDEX ON flat_c  (t, lower(left(val,127)));
CREATE INDEX ON hier4_c (t, lower(left(val,127)));
CREATE INDEX ON hier3_c (t, lower(left(val,127)));
VACUUM ANALYZE flat_c; VACUUM ANALYZE hier4_c; VACUUM ANALYZE hier3_c;
SELECT relname, pg_size_pretty(pg_total_relation_size(c.oid)) total, pg_size_pretty(pg_relation_size(c.oid)) tbl
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relkind='r' AND relname IN ('flat_c','hier4_c','hier3_c') ORDER BY 1;
