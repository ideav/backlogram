// HTML-разметка справочника API из данных src/data/apiDocs*.mjs.
//
// Общая для двух статических страниц: снапшота ideav.ru/api.html
// (scripts/prerender-api.mjs) и отдельной страницы integram.io/api.html
// (scripts/build-integram-io-api.mjs, backlogram#874).

export function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** Фрагменты в обратных кавычках — <code>, остальное экранируется. */
export function inline(text) {
  return String(text)
    .split('`')
    .map((part, i) => (i % 2 === 1 ? `<code>${escape(part)}</code>` : escape(part)))
    .join('')
}

/** Один блок темы; `cls` — префикс CSS-классов страницы. */
export function blockHtml(b, cls = 'api-prerender') {
  switch (b.t) {
    case 'p':
      return `<p>${inline(b.text)}</p>`
    case 'note':
      return `<p class="${cls}__note">${inline(b.text)}${b.link ? ` <a href="${escape(b.link.href)}">${escape(b.link.text)}</a>` : ''}</p>`
    case 'list':
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
    case 'code':
      return `${b.label ? `<p class="${cls}__label">${escape(b.label)}</p>` : ''}<pre><code>${escape(b.code)}</code></pre>`
    case 'table':
      return `<table><thead><tr>${b.head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
    default:
      throw new Error(`api docs: неизвестный блок ${b.t}`)
  }
}

/** Оглавление: разделы и их темы. */
export function tocHtml(sections) {
  return sections
    .map(
      (s) =>
        `<li><a href="#${s.id}">${escape(s.title)}</a><ul>${s.topics
          .map((t) => `<li><a href="#${t.id}">${escape(t.title)}</a></li>`)
          .join('')}</ul></li>`,
    )
    .join('')
}

/** Разделы целиком: <section> → <article> темы → блоки. */
export function sectionsHtml(sections, cls = 'api-prerender') {
  return sections
    .map(
      (s) => `
  <section id="${s.id}">
    <h2>${escape(s.title)}</h2>${s.topics
      .map(
        (t) => `
    <article id="${t.id}">
      <h3>${escape(t.title)}</h3>
      ${t.blocks.map((b) => blockHtml(b, cls)).join('\n      ')}
    </article>`,
      )
      .join('')}
  </section>`,
    )
    .join('')
}
