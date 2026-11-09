// Данные компании по ИНН → поля калькулятора потерь (backlogram#913).
// Ответ приходит из /inn-lookup.php (ФНС «Прозрачный бизнес»). Общий для
// React-страницы и теста: вся арифметика подстановки — здесь.

import { LOSS_BA_URL } from '../data/lossLandings.mjs'

/** Контрольные цифры ИНН: 10 знаков — юрлицо, 12 — ИП. Та же проверка, что в inn-lookup.php. */
export function innValid(raw) {
  const inn = String(raw ?? '').replace(/\D/g, '')
  const d = [...inn].map(Number)
  const sum = (w) => (w.reduce((s, k, i) => s + k * d[i], 0) % 11) % 10
  if (inn.length === 10) return sum([2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[9]
  if (inn.length === 12) {
    return sum([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[10] && sum([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[11]
  }
  return false
}

// Допущения подстановки — те же, что показываем пользователю в карточке.
export const TABLES_PER_EMPLOYEE = 0.2 // как у /cost-of-inaction: 40 таблиц на 200 человек
export const CONTRIB_RATE = 0.3 // основной тариф страховых взносов
export const HOURS_PER_WEEK = 40
const RATE_MIN = 300
const RATE_MAX = 5000

const round = (x, step) => Math.round(x / step) * step

/** Полных лет с даты регистрации «2022-05-06» на дату `now`. */
export function companyAge(regDate, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(regDate ?? '')
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  let age = now.getFullYear() - y
  if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age -= 1
  return age >= 0 ? age : null
}

/**
 * Профиль из inn-lookup.php → значения полей калькулятора и пояснения, откуда
 * каждое взялось. `weeks` — рабочих недель в году (допущение калькулятора).
 *
 * Возвращает { values: { id: число }, facts: [{ id, label, value, source }] }:
 * в values только то, что удалось вывести; остальные поля остаются по умолчанию.
 */
export function profileToValues(profile, weeks = 47) {
  const values = {}
  const facts = []
  const rev = profile?.revenue?.rub
  if (rev > 0) {
    values.rev = Math.round(rev / 1e5) / 10 // млн ₽ с одним знаком
    facts.push({ id: 'rev', label: `Выручка за ${profile.revenue.year} год`, value: values.rev, unit: 'млн ₽', source: 'бухотчётность' })
  }
  const emp = profile?.employees?.n
  if (emp > 0) {
    values.emp = emp
    facts.push({ id: 'emp', label: `Среднесписочная численность за ${profile.employees.year} год`, value: emp, unit: 'чел.', source: 'ФНС' })
    values.xls = Math.max(3, Math.round(emp * TABLES_PER_EMPLOYEE))
    facts.push({ id: 'xls', label: 'Рабочих Excel-таблиц', value: values.xls, unit: 'шт.', source: `оценка: ${String(TABLES_PER_EMPLOYEE).replace('.', ',')} на сотрудника` })
    const contrib = profile?.contributions?.rub
    if (contrib > 0 && weeks > 0) {
      // Фонд оплаты труда ≈ взносы / тариф; час сотрудника с налогами = (ФОТ + взносы) / люди / часы в году.
      const rate = (contrib / CONTRIB_RATE + contrib) / emp / (weeks * HOURS_PER_WEEK)
      if (rate >= RATE_MIN && rate <= RATE_MAX) {
        values.a_rate = round(rate, 50)
        facts.push({ id: 'a_rate', label: 'Стоимость часа сотрудника с налогами', value: values.a_rate, unit: '₽', source: `оценка по страховым взносам за ${profile.contributions.year} год` })
      }
    }
  }
  return { values, facts }
}

// ОКВЭД → отрасль конфигуратора ideav.ru/ai-transform/before-after.html
// (python2node#1206, backlogram#919).
// Конфигуратор читает отрасль из хэша (#food) и открывается с её набором решений.
// Цифры компании туда не передаются: полей под них в конфигураторе нет, а ИНН и
// название в адресе увидела бы Метрика. Ключ — класс ОКВЭД (две первые цифры).
const OKVED_INDUSTRY = [
  [[1, 3], 'agro'],
  [[10, 11], 'food'],
  [[23, 23], 'construction'], // стройматериалы
  [[12, 33], 'make-to-order'], // прочая обрабатывающая промышленность
  [[41, 43], 'construction'],
  [[45, 45], 'auto'],
  [[46, 46], 'distribution'],
  [[47, 47], 'retail'],
  [[49, 53], 'logistics'],
  [[62, 62], 'projects'],
  [[64, 66], 'finance'],
  [[68, 68], 'realty'],
  [[69, 74], 'projects'],
  [[78, 78], 'hr'],
  [[86, 86], 'clinics'],
  [[93, 93], 'leisure'],
]

/** «46.90» → 'distribution'; неизвестный или пустой код → null (конфигуратор по умолчанию). */
export function okvedToIndustry(okved) {
  const m = /^(\d{2})/.exec(String(okved ?? '').trim())
  if (!m) return null
  const cls = Number(m[1])
  const hit = OKVED_INDUSTRY.find(([[from, to]]) => cls >= from && cls <= to)
  return hit ? hit[1] : null
}

/** Ссылка в конфигуратор с отраслью компании, если её удалось определить. */
export function aiTransformUrl(profile) {
  const id = okvedToIndustry(profile?.okved)
  return id ? `${LOSS_BA_URL}#${id}` : LOSS_BA_URL
}
