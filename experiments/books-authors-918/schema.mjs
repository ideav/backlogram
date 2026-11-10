import { get, post } from './api.mjs';
import fs from 'fs';
const A = +(await post('/_d_new?JSON=1', { t: '3', val: 'Автор', unique: '1' })).obj;
const B = +(await post('/_d_new?JSON=1', { t: '3', val: 'Книга' })).obj;
const ref = +(await post(`/_d_ref/${A}?JSON=1`)).obj;
const rAuthor = +(await post(`/_d_req/${B}?JSON=1`, { t: String(ref) })).id;
const tPages = +(await post('/_d_new?JSON=1', { t: '13', val: 'Страниц' })).obj;
const rPages = +(await post(`/_d_req/${B}?JSON=1`, { t: String(tPages) })).id;
const tYear = +(await post('/_d_new?JSON=1', { t: '13', val: 'Год' })).obj;
const rYear = +(await post(`/_d_req/${B}?JSON=1`, { t: String(tYear) })).id;
const s = { A, B, ref, rAuthor, tPages, rPages, tYear, rYear };
// two sample objects to see the row pattern
const a = await post(`/_m_new/${A}?JSON&up=1`, { [`t${A}`]: 'Пример Автор' });
const b = await post(`/_m_new/${B}?JSON&up=1`, { [`t${B}`]: 'Пример книга', [`t${rAuthor}`]: String(a.id || a.obj), [`t${rPages}`]: '150', [`t${rYear}`]: '1972' });
s.sample = { a, b };
fs.writeFileSync('state.json', JSON.stringify(s, null, 1));
console.log(JSON.stringify(s));
