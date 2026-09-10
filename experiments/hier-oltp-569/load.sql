-- Загрузка пяти лейаутов. Пути подставляются psql-переменной :dir
\set ON_ERROR_STOP on
\timing on

DROP TABLE IF EXISTS wide, flat, hier2, hier4, hier8;

CREATE TABLE wide (
  id int8 primary key,
  pan text, code text, amount text, settlement text, billing text, "DT" text,
  billing_fee text, rate text, rate_billing text, audit_no text, "time" text, "TX_DT" text,
  "DTexpire" text, "DTsettle" text, "DTconvert" text, "DTcapture" text, "Merchant_Type" text,
  "ACC" text, "Pext" text, "ICC" text, "POS_mode" text, "APAN" text, "ISO" text, "PC" text,
  "CC" text, "R" text, "TR_fee" text, "S_fee" text, "TP_fee" text, "SP_fee" text,
  "Acq_IIC" text, "Fwd_IIC" text, "PAN_extended" text, "T2" text, "T3" text, "RRN" text,
  "Auth" text, "RC" text, "SRC" text, "CATI" text, "CAIC" text, "CAN" text, "ARD" text,
  "T1" text, "CCY" text, "CCYs" text, "CCYb" text, "PIN_hash" text, "SRCI" text,
  "toExport" text, "Gosb" text, "Memorial" text, "Status" text
);

CREATE TABLE flat  (id int8, up int8, t int8, val text);
CREATE TABLE hier2 (id int8, up int8, t int8, val text);
CREATE TABLE hier4 (id int8, up int8, t int8, val text);
CREATE TABLE hier8 (id int8, up int8, t int8, val text);

\copy wide  from :'dir'/wide.csv  with (format csv)
\copy flat  from :'dir'/flat.csv  with (format csv)
\copy hier2 from :'dir'/hier2.csv with (format csv)
\copy hier4 from :'dir'/hier4.csv with (format csv)
\copy hier8 from :'dir'/hier8.csv with (format csv)

-- индексы как в статье habr 900308: (up,t) и (t, lower(left(val,127)))
ALTER TABLE flat  ADD PRIMARY KEY (id);
ALTER TABLE hier2 ADD PRIMARY KEY (id);
ALTER TABLE hier4 ADD PRIMARY KEY (id);
ALTER TABLE hier8 ADD PRIMARY KEY (id);
CREATE INDEX ON flat  (up, t);
CREATE INDEX ON hier2 (up, t);
CREATE INDEX ON hier4 (up, t);
CREATE INDEX ON hier8 (up, t);
CREATE INDEX ON flat  (t, lower(left(val,127)));
CREATE INDEX ON hier2 (t, lower(left(val,127)));
CREATE INDEX ON hier4 (t, lower(left(val,127)));
CREATE INDEX ON hier8 (t, lower(left(val,127)));
-- широкой таблице — эквивалентные индексы под те же запросы
CREATE INDEX ON wide ("DT", "Gosb");
CREATE INDEX ON wide (pan);

VACUUM ANALYZE wide; VACUUM ANALYZE flat; VACUUM ANALYZE hier2;
VACUUM ANALYZE hier4; VACUUM ANALYZE hier8;

SELECT relname,
       pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
       pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relkind='r' ORDER BY relname;

SELECT 'flat' l, count(*) FROM flat UNION ALL
SELECT 'hier2', count(*) FROM hier2 UNION ALL
SELECT 'hier4', count(*) FROM hier4 UNION ALL
SELECT 'hier8', count(*) FROM hier8 UNION ALL
SELECT 'wide', count(*) FROM wide;
