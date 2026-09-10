#!/bin/bash
set -e
D=/mnt/c/Users/drynn/AppData/Local/Temp/claude/C--Users-drynn/9bdd2b2f-6e82-48d6-8bc6-57943c9e81a0/scratchpad/bench569
CH=~/ch/clickhouse
DATA=~/data
CHD=~/chdata

mkdir -p "$DATA" "$CHD"
if [ ! -f "$DATA/wide.csv" ]; then
  echo "== copying CSVs into WSL fs"
  time cp "$D/wide.csv" "$DATA/wide.csv"
  time cp "$D/flat.csv" "$DATA/flat.csv"
fi
ls -la "$DATA"

q() { "$CH" local --path "$CHD" --query "$1"; }

echo "== create tables"
q "DROP TABLE IF EXISTS wide_ch"
q "DROP TABLE IF EXISTS flat_ch"

# Реалистичная типизация: как эту таблицу завёл бы инженер ClickHouse.
q "CREATE TABLE wide_ch (
  id UInt64,
  pan String, code String,
  amount Decimal(18,2), settlement Decimal(18,2), billing Decimal(18,2),
  DT Date,
  billing_fee Decimal(18,2), rate String, rate_billing String,
  audit_no String, time String, TX_DT Date,
  DTexpire String, DTsettle Date, DTconvert Date, DTcapture Date,
  Merchant_Type LowCardinality(String),
  ACC String, Pext String, ICC String,
  POS_mode LowCardinality(String), APAN String,
  ISO LowCardinality(String), PC LowCardinality(String),
  CC LowCardinality(String), R LowCardinality(String),
  TR_fee Decimal(18,2), S_fee Decimal(18,2), TP_fee Decimal(18,2), SP_fee Decimal(18,2),
  Acq_IIC String, Fwd_IIC String, PAN_extended String, T2 String, T3 String,
  RRN String, Auth String, RC LowCardinality(String), SRC LowCardinality(String),
  CATI String, CAIC String, CAN String, ARD String, T1 String,
  CCY LowCardinality(String), CCYs LowCardinality(String), CCYb LowCardinality(String),
  PIN_hash String, SRCI LowCardinality(String), toExport LowCardinality(String),
  Gosb LowCardinality(String), Memorial String, Status LowCardinality(String)
) ENGINE = MergeTree ORDER BY (DT, Gosb)"

# Тот же EAV-квартет, но в колоночнике.
q "CREATE TABLE flat_ch (id UInt64, up UInt64, t UInt32, val String)
   ENGINE = MergeTree ORDER BY (t, val)"

echo "== load wide"
time "$CH" local --path "$CHD" --query "INSERT INTO wide_ch FORMAT CSV" < "$DATA/wide.csv"
echo "== load flat (EAV)"
time "$CH" local --path "$CHD" --query "INSERT INTO flat_ch FORMAT CSV" < "$DATA/flat.csv"

echo "== sizes"
q "SELECT table,
          formatReadableSize(sum(data_compressed_bytes)) AS compressed,
          formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed,
          sum(rows) AS rows
   FROM system.parts WHERE active AND table IN ('wide_ch','flat_ch')
   GROUP BY table FORMAT PrettyCompact"
