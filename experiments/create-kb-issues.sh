#!/usr/bin/env bash
set -euo pipefail

REPO="ideav/backlogram"
SRC_ROOT="https://github.com/ideav/crm/blob/main/docs/integram-article-reviews"

# slug|number|shortTitle|compare
articles=(
  "01-google-sheets-150k|01|150 000 записей вместо Google Sheets|Google Sheets"
  "02-excel-row-limit|02|Уйти от лимита строк Excel|Excel"
  "03-excel-file-versions|03|Одна версия вместо рассылок Excel|Excel и локальные файлы"
  "04-related-tables|04|Связанные таблицы без ВПР|Excel и Google Sheets"
  "05-access-rights|05|Права доступа из коробки|Excel, Google Sheets, простые no-code-таблицы"
  "06-airtable-control|06|Собственный контур вместо SaaS|Airtable"
  "07-notion-relational-data|07|Реляционная база вместо Notion|Notion"
  "08-html-templates|08|HTML-шаблоны вместо конструктора|Airtable Interfaces, Notion views и другие закрытые конструкторы интерфейсов"
  "09-custom-development-prototype|09|Прототип быстрее заказной разработки|заказная разработка"
  "10-no-release-changes|10|Изменения без релиза|заказная разработка"
  "11-ai-interface-data-safety|11|AI делает интерфейс, не данные|вайб-кодинг (генерация приложений через ИИ)"
  "12-ai-prototype-rewrite|12|Без переписывания после демо|вайб-кодинг и быстрые AI-прототипы"
  "13-api-json-export|13|API вместо ручных выгрузок|Excel, Google Sheets, Notion, ручные выгрузки"
  "14-forms-reports-dashboards|14|Формы, отчёты и дашборды в одном|связка таблиц, форм, BI и автоматизаторов"
  "15-local-control-files|15|Локальное развёртывание и контроль|облачные no-code-сервисы и внешний подряд"
)

for entry in "${articles[@]}"; do
  IFS='|' read -r slug number shortTitle compare <<< "$entry"
  title="Страница базы знаний №${number}: ${shortTitle}"
  body=$(cat <<EOF
Доработать страницу базы знаний №${number} — **${shortTitle}**.

- **Сравнение:** ${compare}
- **Источник:** [${slug}.md](${SRC_ROOT}/${slug}.md)
- **URL страницы:** \`/knowledge-base/${slug}.html\`

В PR #157 уже добавлен раздел «База знаний» с базовым контентом всех 15 статей, выведенным из markdown-файлов репозитория \`ideav/crm\`. Эта задача — про доработку **конкретной** страницы:

- сверить тексты разделов «Контекст», «Что делает Интеграм иначе», «Ограничения», «Вывод» с актуальной версией исходника;
- добавить иллюстрации/диаграммы при необходимости;
- доработать SEO (\`<title>\`, \`<meta description>\`, OG-теги);
- проверить мобильную вёрстку и тёмную тему;
- при необходимости — обогатить структуру (под-разделы, цитаты, ссылки на смежные статьи базы знаний).

Связано с #156. Базовая структура — в \`src/data/knowledgeBase.ts\` (запись \`${slug}\`) и в \`src/pages/KnowledgeBaseArticle.tsx\`.
EOF
)
  echo "Creating issue for ${slug}..."
  gh issue create --repo "$REPO" --title "$title" --body "$body"
done

# Issue 16 — split of article 14
echo "Creating split-issue (depends on ideav/crm#2622)..."
gh issue create --repo "$REPO" \
  --title "Разделить статью базы знаний №14 «Формы, отчёты и дашборды» на 3 части" \
  --body "$(cat <<'EOF'
Статья базы знаний №14 — **«Формы, отчёты и дашборды в одном»** — будет разделена на 3 отдельных материала:

1. Формы
2. Отчёты
3. Дашборды

Структуру разделения определяет апстрим-задача [`ideav/crm#2622`](https://github.com/ideav/crm/issues/2622) в репозитории `ideav/crm`. **Эту задачу нужно запускать только после завершения работы по `ideav/crm#2622`** — когда там появятся 3 готовых markdown-файла, мы:

- разнесём их по 3 записям в `src/data/knowledgeBase.ts` (с новыми slug-ами),
- удалим или перенаправим старую запись `14-forms-reports-dashboards`,
- обновим нумерацию остальных статей (если потребуется),
- добавим перенаправления со старого URL `/knowledge-base/14-forms-reports-dashboards.html` на индекс или на форму.

Связано с #156. Базовый раздел добавлен в PR #157.

> Заблокировано: [`ideav/crm#2622`](https://github.com/ideav/crm/issues/2622).
EOF
)"

echo "Done."
