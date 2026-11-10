// Отчёты ядра для стенда #918 — те же запросы, что в обычной схеме (queries.sql)
import { post } from './api.mjs';
import fs from 'fs';
const s = JSON.parse(fs.readFileSync('state.json', 'utf8'));
async function rep(name, limit, cols) {
  const f = { t22: name }; if (limit) f.t134 = String(limit);
  const q = +(await post('/_m_new/22?JSON&up=1', f)).id;
  for (const c of cols) await post(`/_m_new/28?JSON&up=${q}`, Object.fromEntries(Object.entries(c).map(([k, v]) => [k, String(v)])));
  return q;
}
const A = { t28: s.A, t100: 'author' }, Bk = { t28: s.B, t100: 'book' }, P = { t28: s.rPages, t100: 'pages' }, Y = { t28: s.rYear, t100: 'year' };
s.reports = {
  q1_author_like: await rep('q1_author_like', 1000, [A, Bk, P, Y]),          // FR_author=%aro% | lac% | =Волков
  q3_book_like_af: await rep('q3_book_like_af', 50, [A, Bk, P, Y]),          // автор первым, FR_book=%лые пар%
  q3_book_like_bf: await rep('q3_book_like_bf', 50, [Bk, A, P, Y]),          // книга первой
  q4_pages_year: await rep('q4_pages_year', 50, [Bk, A, P, Y]),              // FR_pages=150&FR_year=1972
  q5_by_year: await rep('q5_by_year', 0, [{ ...Y, t109: 1 }, { t28: s.B, t100: 'books', t104: 'COUNT' }]),
  q6_pages_by_author: await rep('q6_pages_by_author', 0, [{ t28: s.A, t100: 'author_id', t104: 'abn_ID' }, A, { t28: s.rPages, t100: 'pages_sum', t104: 'SUM' }]),
  q7_top10_authors: await rep('q7_top10_authors', 10, [{ t28: s.A, t100: 'author_id', t104: 'abn_ID' }, A, { t28: s.B, t100: 'books', t104: 'COUNT', t109: -1 }]),
};
fs.writeFileSync('state.json', JSON.stringify(s, null, 1));
console.log(s.reports);
