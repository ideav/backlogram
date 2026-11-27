// Вопросы, на которые текстовый поиск уже отвечает верно (issue-946, help-table-gone):
// гибрид не должен их терять. Ожидание — id статьи или 'section:<id раздела>' в топ-3.
export const HELP_LEXICAL = [
  ['куда делась моя таблица', ['structure-table-gone']],
  ['пропала таблица', ['structure-table-gone']],
  ['не вижу таблицу Пользователь', ['structure-table-gone']],
  ['исчезла таблица из списка', ['structure-table-gone']],
  ['таблица пропала из меню', ['structure-table-gone']],
  ['потерялась таблица', ['structure-table-gone']],
  ['не отображается таблица в списке', ['structure-table-gone']],
  ['почему админ не видит таблицу', ['structure-table-gone']],
  ['как сделать выпадающий список', ['section:structure', 'section:recipes']],
  ['чтобы менеджер видел только своих клиентов', ['section:access', 'section:recipes']],
  ['кнопка, которая меняет статус', ['section:automation', 'section:recipes']],
  ['загрузить данные из Excel', ['section:data', 'section:recipes']],
  ['график продаж на дашборде', ['section:queries', 'section:recipes']],
  ['подключить ИИ-агента к базе', ['section:api', 'section:recipes']],
  ['своя страница с формой', ['section:templater', 'section:recipes']],
]

export const hit = (article, expect) =>
  expect.some((e) => (e.startsWith('section:') ? article.sectionId === e.slice(8) : article.id === e))
