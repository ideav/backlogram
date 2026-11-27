// «Куда делась моя таблица?» находится по живым формулировкам (ideav/python2node#1464).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIndex, search } from '../src/lib/helpSearch.mjs'
import { HELP_ARTICLES } from '../src/data/helpCenter.mjs'

const index = buildIndex(HELP_ARTICLES)

test('статья «Куда делась моя таблица?» — первая по похожим вопросам', () => {
  for (const q of [
    'куда делась моя таблица',
    'пропала таблица',
    'не вижу таблицу Пользователь',
    'исчезла таблица из списка',
    'таблица пропала из меню',
    'потерялась таблица',
    'не отображается таблица в списке',
    'почему админ не видит таблицу',
  ]) {
    const top = search(index, q, 1)[0]?.article.id
    assert.equal(top, 'structure-table-gone', `«${q}» → ${top}`)
  }
})
