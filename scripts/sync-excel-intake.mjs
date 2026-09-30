#!/usr/bin/env node
/**
 * Копирует библиотеку контура подтверждения (issue #624) в вебрут лендинга
 * excel-to-app.ru.
 *
 * Зачем копии, а не общий файл: лендинг — отдельный домен со своим вебрутом
 * (site-excel/public), файлов основного сайта там нет и появиться им негде;
 * `order.php` намеренно не делит код с эндпоинтами ideav.ru. При этом сам
 * контур подтверждения должен быть один и тот же — расхождение между двумя
 * реализациями double opt-in означало бы разный срок ссылки, разный токен и
 * разные письма на двух доменах.
 *
 * Поэтому источник один (public/intake-*.php), а в site-excel/public лежат
 * сгенерированные копии. Тест tests/excel-landing-confirm.test.mjs падает,
 * если копия разошлась с источником, — так правка в одном месте не остаётся
 * незамеченной во втором.
 *
 * Запуск: node scripts/sync-excel-intake.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

/**
 * Файлы, которые нужны лендингу. Из всего intake-shared.php им требуется
 * только intake_config() — его лендинг объявляет сам поверх order_config().
 */
export const SHARED_FILES = [
  'intake-mail.php',         // транспорт и тексты обоих писем
  'intake-queue.php',        // очередь заявок, токены, статусы
  'intake-confirm-page.php', // страницы, которые видит клиент по ссылке
  'intake-build.php',        // протокол моста claim/deliver/fail/status
]

/** Текст сгенерированной копии по исходнику. Та же функция используется в тесте. */
export function render(source, name) {
  const marker = '<?php\n'
  if (!source.startsWith(marker)) {
    throw new Error(`${name}: ожидается файл, начинающийся с <?php`)
  }
  const banner = [
    '<?php',
    '/**',
    ` * СГЕНЕРИРОВАННАЯ КОПИЯ public/${name} — править здесь нельзя.`,
    ' *',
    ' * Лендинг excel-to-app.ru живёт в отдельном вебруте, файлов основного сайта',
    ' * в нём нет, а контур подтверждения адреса нужен тот же самый (issue #624).',
    ' * Обновить: `node scripts/sync-excel-intake.mjs`. Расхождение с источником',
    ' * ловит tests/excel-landing-confirm.test.mjs.',
    ' */',
    '',
  ].join('\n')
  return banner + source.slice(marker.length)
}

function main() {
  for (const name of SHARED_FILES) {
    const source = readFileSync(join(root, 'public', name), 'utf8')
    const target = join(root, 'site-excel/public', name)
    writeFileSync(target, render(source, name))
    console.log(`синхронизировано: site-excel/public/${name}`)
  }
}

// Запущен напрямую — синхронизируем; импортирован тестом — только экспорты.
if (basename(process.argv[1] ?? '') === 'sync-excel-intake.mjs') {
  main()
}
