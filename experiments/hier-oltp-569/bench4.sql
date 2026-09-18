-- bench4.sql — три оси, которых нет в bench.sql / bench2.sql / bench3.sql / alt_bench.sql.
--
-- Зачем. Прежние четыре скрипта меряют пять форм запроса: четыре агрегата по заранее
-- известным размерностям и один точечный поиск по заранее проиндексированной колонке.
-- Это домашняя территория фиксированной схемы, и квартеты там проигрывают по построению.
-- Ни один запрос не требует того, за что в модели заплачено: поиска по произвольному
-- реквизиту (индекс (t, lower(left(val,127))) — это 3081 МБ из 5896), связи как ребра
-- и расширения схемы без DDL.
--
-- Протокол тот же, что в статье: агрегаты обёрнуты в count(*), планы — через
-- EXPLAIN (ANALYZE, BUFFERS). Времена брать со второго прогона подряд.
--
-- ВНИМАНИЕ: секция S3 меняет данные (ALTER TABLE, UPDATE, INSERT). Прогонять последней;
-- после неё перезалить корпус через load.sql + alt.sql, иначе прежние замеры поедут.
--
-- Коды типов из gen.py: REQ[n] = 1001 + индекс в NAMES, поэтому
--   pan=1001, amount=1003, DT=1006, Merchant_Type=1017, RRN=1036, CCY=1045, Gosb=1051.
-- Служебные: t=100 — транзакция, t=200 — разрез.

\set ON_ERROR_STOP on
\timing on

\echo
\echo ================================================================
\echo == S1. Поиск по реквизиту, под который не заведён свой индекс
\echo ================================================================
-- RRN не входит ни в один индекс широкой таблицы: там PK(id), (DT,Gosb) и (pan).
-- У квартетов он покрыт общим (t, lower(left(val,127))), у jsonb — GIN jsonb_path_ops.
-- Чтобы широкая таблица умела то же самое по всем 45 реквизитам, ей нужно 45 индексов
-- (~23 МБ каждый по замеру 67 МБ на три) — около гигабайта и 45 DDL.

SELECT "RRN" AS rrn FROM wide WHERE id = 500000 \gset

\echo === S1 wide (RRN) — колонка без индекса, ожидается Seq Scan
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM wide WHERE "RRN" = :'rrn';

\echo === S1 flat (RRN) — общий индекс по значению любого реквизита
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM flat WHERE t = 1036 AND lower(left(val,127)) = lower(:'rrn');

\echo === S1 hier4 (RRN)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM hier4 WHERE t = 1036 AND lower(left(val,127)) = lower(:'rrn');

\echo === S1 jb (RRN) — GIN jsonb_path_ops
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM jb WHERE doc @> jsonb_build_object('RRN', :'rrn');

\echo
\echo ================================================================
\echo == S2. Связь: обход по ребру против сборки группы по значениям
\echo ================================================================
-- Задача: «дай все транзакции той же группы, что транзакция с этим PAN, и сумму их amount».
-- У квартетов группа — это ребро up, обход идёт по id одним запросом.
-- У широкой таблицы и jsonb та же группа восстанавливается сравнением четырёх полей.
-- Ожидание честное: на этом корпусе связь ВЫРОЖДЕНА (она выводится из значений полей),
-- поэтому выигрыша ребра здесь может и не быть. Это сам по себе результат: он объясняет,
-- почему преимущество графа на банковской транзакции показать нельзя.

SELECT pan AS pan FROM wide WHERE id = 500000 \gset

\echo === S2 hier4 — одним запросом по рёбрам: pan → транзакция → разрез → соседи → amount
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
WITH tx AS (
  SELECT q.up AS tx_id FROM hier4 q
   WHERE q.t = 1001 AND lower(left(q.val,127)) = lower(:'pan')
), cut AS (
  SELECT t2.up AS cut_id FROM hier4 t2 JOIN tx ON t2.id = tx.tx_id
), sib AS (
  SELECT s.id FROM hier4 s JOIN cut ON s.up = cut.cut_id AND s.t = 100
)
SELECT count(*) AS siblings, sum(a.val::numeric) AS amount
  FROM sib JOIN hier4 a ON a.up = sib.id AND a.t = 1003;

\echo === S2 wide — группа восстанавливается сравнением четырёх колонок
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) AS siblings, sum(amount::numeric) AS amount FROM wide
 WHERE ("DT", "Gosb", "CCY", "Merchant_Type") =
       (SELECT "DT", "Gosb", "CCY", "Merchant_Type" FROM wide WHERE pan = :'pan');

\echo === S2 jb шаг 1 из 2: прочитать документ по PAN (время считать вместе с шагом 2)
SELECT doc->>'DT' AS jd, doc->>'Gosb' AS jg, doc->>'CCY' AS jc, doc->>'Merchant_Type' AS jm
  FROM jb WHERE doc @> jsonb_build_object('pan', :'pan') \gset

\echo === S2 jb шаг 2 из 2: соседи по четырём значениям
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) AS siblings, sum((doc->>'amount')::numeric) AS amount FROM jb
 WHERE doc @> jsonb_build_object('DT', :'jd', 'Gosb', :'jg',
                                 'CCY', :'jc', 'Merchant_Type', :'jm');

\echo
\echo ================================================================
\echo == S3. Новый 55-й реквизит: цена расширения схемы
\echo ================================================================
-- Дальше данные меняются. Перезалить корпус после прогона.
-- Вариант «реквизит нужен не всем»: добавить WHERE id % 100 = 0 в S3b, S3c и S3d.

\echo === S3 размеры до
SELECT relname, pg_size_pretty(pg_total_relation_size(c.oid)) AS total
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND relname IN ('wide','flat','hier4','jb')
 ORDER BY relname;

\echo === S3a wide: ALTER TABLE ADD COLUMN без DEFAULT — правка каталога
ALTER TABLE wide ADD COLUMN "Loyalty" text;

\echo === S3b wide: заполнить у миллиона строк — перезапись всех строк
UPDATE wide SET "Loyalty" = 'L' || (id % 1000);

\echo === S3c jb: дописать ключ в каждый документ — перезапись всех документов
UPDATE jb SET doc = doc || jsonb_build_object('Loyalty', 'L' || (id % 1000));

\echo === S3d flat: новый реквизит строками, t=1054 — только вставка
INSERT INTO flat (id, up, t, val)
SELECT (SELECT max(id) FROM flat) + row_number() OVER (), q.id, 1054, 'L' || (q.id % 1000)
  FROM flat q WHERE q.t = 100;

\echo === S3e hier4: то же
INSERT INTO hier4 (id, up, t, val)
SELECT (SELECT max(id) FROM hier4) + row_number() OVER (), q.id, 1054, 'L' || (q.id % 1000)
  FROM hier4 q WHERE q.t = 100;

\echo === S3 размеры после, до VACUUM — здесь виден раздув от перезаписи
SELECT relname, pg_size_pretty(pg_total_relation_size(c.oid)) AS total
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND relname IN ('wide','flat','hier4','jb')
 ORDER BY relname;

VACUUM (ANALYZE) wide;
VACUUM (ANALYZE) jb;
VACUUM (ANALYZE) flat;
VACUUM (ANALYZE) hier4;

\echo === S3 размеры после VACUUM ANALYZE
SELECT relname, pg_size_pretty(pg_total_relation_size(c.oid)) AS total
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND relname IN ('wide','flat','hier4','jb')
 ORDER BY relname;

\echo
\echo == Готово. Корпус изменён: перезалить load.sql + alt.sql перед другими замерами.
