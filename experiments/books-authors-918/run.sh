#!/usr/bin/env bash
# Стенд замера «книги и авторы»: обычная схема MySQL против ядра Интеграм.
# Запуск: CRM_DIR=/путь/к/ideav-crm ./run.sh [раундов]
set -euo pipefail
cd "$(dirname "$0")"
: "${CRM_DIR:?укажите CRM_DIR — путь к клону ideav/crm}"
export CRM_DIR
N="${1:-7}"
dc() { docker compose "$@"; }
sql() { dc exec -T db mysql -uroot -proot918 --local-infile=1 "$@"; }

dc up -d --build --wait
sql ideav < mkbase.sql          # таблица bk в структуре ядра, служебный пользователь и токен стенда
sql ideav < ru_tpl.sql          # служебные строки шаблона ядра (id < 2000): типы, отчёты, меню
node schema.mjs                 # таблицы «Автор» и «Книга» через API ядра -> state.json
python3 gen.py                  # синтетические данные, seed 918: 142 654 автора, 1 048 552 книги
for f in classic_author.tsv classic_books.tsv eav_rows.tsv; do dc cp "$f" db:/tmp/; done
sql < load.sql                  # обычная схема (индексы как в 2018 году) + строки ядра
node reports.mjs                # запросы q1–q7 как отчёты ядра -> state.json
dc restart db && dc up -d --wait
dc exec -T app php /bench/bench.php v0-2018idx "$N"

sql < idx-v1.sql                # индексы, которые добавил бы DBA: (year,pages), (author,pages)
dc restart db && dc up -d --wait
dc exec -T app php /bench/bench.php v1-fairidx "$N"
