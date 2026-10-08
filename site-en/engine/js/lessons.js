/**
 * Interactive lessons (#708).
 *
 * A floating guide that walks the user through the workplaces of their database:
 * a step says what to do on the current page, marks the menu items to click in gold
 * and, where possible, checks the result through the JSON API and moves on by itself.
 *
 * Lessons are started from the Lessons tab of the home page (info.html):
 *     IntegramLessons.start('overview')
 * Progress is kept per database in localStorage (key lessons_{db}).
 */
(function () {
    'use strict';

    if (typeof db === 'undefined' || !db) return;

    var KEY = 'lessons_' + db;
    var POLL_MS = 2500;
    var SAMPLE_FILE = '/assets/lessons/movies.csv';

    // ── State ────────────────────────────────────────────────────────────────

    function load() {
        try {
            var s = JSON.parse(localStorage.getItem(KEY) || '{}');
            if (s && typeof s === 'object') return s;
        } catch (e) { /* storage blocked or broken: start clean */ }
        return {};
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }
    var state = load();
    state.done = state.done || {};
    state.vars = state.vars || {};

    // ── Helpers ──────────────────────────────────────────────────────────────

    function page() {
        var p = decodeURIComponent(location.pathname);
        var pre = '/' + db;
        if (p.indexOf(pre) === 0) p = p.slice(pre.length);
        return p.replace(/^\/+|\/+$/g, '');
    }
    function onPage(list) {
        var p = page();
        return list.some(function (x) {
            if (x === '') return p === '' || p === 'info';
            return p === x || p.indexOf(x + '/') === 0;
        });
    }
    function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }
    function url(path) { return '/' + db + '/' + path; }

    function getJSON(path) {
        return fetch(url(path), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function (r) { return r.text(); })
            .then(function (t) { try { return JSON.parse(t); } catch (e) { return null; } })
            .catch(function () { return null; });
    }

    // Top-level tables: {id: name}
    function tables() { return getJSON('dict?JSON').then(function (j) { return j || {}; }); }
    function tableId(names) {
        names = [].concat(names).map(norm);
        return tables().then(function (t) {
            for (var id in t) if (names.indexOf(norm(t[id])) >= 0) return id;
            return null;
        });
    }
    // Records of a type: [{i, u, o, r:[name, ...]}]
    function records(type, parent) {
        return getJSON('object/' + type + '?JSON_OBJ&LIMIT=1000' + (parent ? '&F_U=' + parent : ''))
            .then(function (j) { return Array.isArray(j) ? j : []; });
    }
    function recordId(type, names, parent) {
        names = [].concat(names).map(norm);
        return records(type, parent).then(function (rows) {
            for (var i = 0; i < rows.length; i++)
                if (names.indexOf(norm(rows[i].r && rows[i].r[0])) >= 0) return rows[i].i;
            return null;
        });
    }
    // Column names of a table
    function columns(id) {
        return getJSON('metadata/' + id + '?JSON').then(function (j) {
            return (j && j.reqs || []).map(function (r) { return norm(r.val); });
        });
    }
    function hasColumns(tableNames, cols) {
        return tableId(tableNames).then(function (id) {
            if (!id) return false;
            return columns(id).then(function (have) {
                return [].concat(cols).every(function (c) {
                    c = norm(c);
                    return have.some(function (h) { return h === c || h.indexOf(c) === 0; });
                });
            });
        });
    }

    // ── Lessons ──────────────────────────────────────────────────────────────
    //
    // A step: { on: [pages], title, html, hl: [menu hrefs], sel: [css selectors],
    //           check: () => Promise<bool>, next: true (manual "Next" button) }.
    // When the user is not on one of step.on pages, the panel asks to open the first
    // of them and marks its menu item.

    var MENU_NAMES = {
        '': 'Home', tables: 'Tables', upload: 'Upload', 'table/18': 'Users', sql: 'Queries',
        forms: 'Forms', quiz: 'Surveys', edit_types: 'Structure', dir_admin: 'Files'
    };
    var MENU_HREF = { forms: 'forms?EDIT' };

    var LESSONS = {
        overview: {
            title: 'Overview',
            steps: [
                { on: [''], title: 'Quick tour of Integram',
                  html: '<p>This is a quick tour of the system: I will show you where everything is. Follow my tips, and I will mark the elements you need to click with a <span class="lsn-hl lsn-hl-inline">gold frame</span>.</p>'
                      + '<p>Drag this window by its header if it covers something, or collapse it with the <b>–</b> button.</p>',
                  next: true },
                { on: [''], title: 'The menu',
                  html: '<p>On the left is the menu with the most useful workplaces. Its items are just records in the <i>Menu</i> table of your role, so you can rename, reorder and add your own items later.</p><p>Let\'s look at them one by one. Click <b>Tables</b>.</p>',
                  hl: ['tables'], check: function () { return onPage(['tables']); } },
                { on: ['tables'], title: 'Tables',
                  html: '<p>These are the tables of your database. Even an empty system has the basic tables every app needs: users, roles, queries and lookups. The ORGANIZER folder in the menu also has ready-made tables for tasks, deals and contacts.</p>'
                      + '<p>Click a table name to open it, or create a new table with <b>+ New table</b>. Now open <b>Users</b> in the menu.</p>',
                  hl: ['table/18'], check: function () { return onPage(['table/18']); } },
                { on: ['table/18'], title: 'Users',
                  html: '<p>This is the list of users. Initially there is only you — the administrator, named the same as your database. You can add users here and assign roles to them: a role defines access to tables and workplaces and the menu the user sees.</p>'
                      + '<p>Above the grid are its controls: add a record, refresh, filters and sorting, column settings and export. Any table in Integram works the same way.</p><p>Next, open <b>Queries</b>.</p>',
                  hl: ['sql'], check: function () { return onPage(['sql']); } },
                { on: ['sql'], title: 'Query builder',
                  html: '<p>This is the most powerful data tool you can find in no-code builders. A query picks columns from any number of linked tables, filters, groups and sorts them and calculates totals.</p>'
                      + '<p>You already have several service queries here — for example, <i>MyRoleMenu</i> builds the menu you see on the left. We will create our own queries in the lessons.</p><p>Now open <b>Forms</b>.</p>',
                  hl: ['forms'], check: function () { return onPage(['forms']); } },
                { on: ['forms'], title: 'Forms',
                  html: '<p>Here you build forms and dashboards: panels with tables for data entry, reports, charts and pivot tables. The list is empty for now — we will make a form in the Forms lesson.</p><p>Next, open <b>Structure</b>.</p>',
                  hl: ['edit_types'], check: function () { return onPage(['edit_types']); } },
                { on: ['edit_types'], title: 'Data structure editor',
                  html: '<p>Here you edit the structure of your tables: the set of columns, links to other tables, required and calculated fields. You can build a structure of linked data of any complexity — we will do this in the last lesson.</p>'
                      + '<p>The <b>Files</b> menu opens the file manager, where you edit page templates (including the home page) and keep your files.</p>',
                  hl: ['dir_admin'], next: true },
                { on: [], title: 'Your account',
                  html: '<p>The menu in the top right corner links to your account, the theme and font settings, password change and logout. In <i>My account</i> you can create more databases and change your plan.</p>'
                      + '<p>The chat button next to it opens the AI assistant that can build tables and queries for you.</p><p>That\'s the end of the tour. Go back to the <a href="' + url('') + '">home page</a> and start the next lesson: <b>Data import</b>.</p>',
                  sel: ['#user-menu-toggle', '#ai-chat-toggle'], next: true, last: true }
            ]
        },

        upload: {
            title: 'Data import',
            steps: [
                { on: ['upload'], title: 'Instant import of data',
                  html: '<p>In this lesson we will create tables straight from a file. Integram recognises column names and data types, and creates lookups for repeating values.</p>'
                      + '<p>Download the sample file with 1000 famous movies: <a href="' + SAMPLE_FILE + '" download="movies.csv"><b>movies.csv</b></a>.</p>'
                      + '<p>This is the <b>Upload</b> workplace. Press <b>Next</b> when you have the file.</p>',
                  hl: ['upload'], next: true },
                { on: ['upload'], title: 'Choose the file',
                  html: '<p>In the target table list choose <b>*** Create a new table from file ***</b>, then pick the downloaded <i>movies.csv</i> with <b>Choose file</b> (or open it in a text editor, copy everything and paste it into the text field).</p>'
                      + '<p>Press <b>Check</b>: Integram parses the text and shows how it will be imported. The first row becomes the table and column names.</p>',
                  next: true },
                { on: ['upload'], title: 'Set up the import',
                  html: '<p>Press <b>Configure</b>: besides the file settings (headers, delimiter, encoding) it shows a card for each column of the future table. Here you can rename, skip and reorder columns and change their types:</p><ul>'
                      + '<li>uncheck <b>Rank</b> — it is just the row number in the file;</li>'
                      + '<li>rename <b>Title</b> to <b>Movie</b> — this will be the table name;</li>'
                      + '<li>click the link icon on <b>Director</b> once to make it a reference, so that directors become a lookup table;</li>'
                      + '<li>click the link icon on <b>Genre</b> and <b>Actors</b> twice to make them multiple choice — a movie has several of them;</li>'
                      + '<li>switch the type of <b>Description</b> from chars to <b>memo</b> for a multi-line input.</li></ul>'
                      + '<p>Press <b>Refresh</b> to apply the changes and check the preview below.</p>',
                  next: true },
                { on: ['upload'], title: 'Check and upload',
                  html: '<p>Press <b>Statistics</b> to see the minimum, maximum, totals and the number of empty cells per column — handy to reconcile with the source spreadsheet.</p>'
                      + '<p>When everything looks right, press <b>Upload</b> and then <b>Yes, upload</b>. The log shows which tables and columns were created; then the data is loaded at 500–3000 records per second.</p>'
                      + '<p class="lsn-wait">Stay on this page until the upload reaches 100%…</p>',
                  check: function () {
                      return tableId(['Movie', 'Movies', 'Title']).then(function (id) {
                          // Leaving the page too early breaks the import: wait for the 100% line
                          return !!id && (!onPage(['upload']) || /\(100%\)/.test(document.body.innerText));
                      });
                  } },
                { on: ['tables'], title: 'Your new tables',
                  html: '<p>Done! Open <b>Tables</b>: there are the movies plus the lookups Integram filled from the file — directors, genres and actors.</p><p>Open the movie table.</p>',
                  hl: ['tables'],
                  check: function () {
                      return tableId(['Movie', 'Movies', 'Title']).then(function (id) {
                          if (id) state.vars.movie = id;
                          return !!id && onPage(['table/' + id, 'object/' + id]);
                      });
                  } },
                { on: ['table', 'object'], title: 'The movie table',
                  html: '<p>This is the data you imported. Sort it by any column with a click on its name, and click again for the reverse order. Try the filters above the grid: for example, show the movies of 2016 only.</p>'
                      + '<p>Click a value in the first column to edit a record. To add columns to this table, use the <b>Structure</b> menu.</p>'
                      + '<p>Congratulations — you can import data into Integram! The next lesson is <b>Queries</b>.</p>',
                  next: true, last: true }
            ]
        },

        queries: {
            title: 'Queries',
            needs: 'upload',
            steps: [
                { on: ['sql'], title: 'Create a query',
                  html: '<p>A query tells Integram which data to take from the tables and what to do with it. We will calculate the average movie length by year of release.</p>'
                      + '<p>Open the query list with the list icon, type <b>Average duration</b> in the <i>Search / New query</i> field and press <b>Create query</b>.</p>',
                  hl: ['sql'],
                  check: function () {
                      return recordId(22, 'Average duration').then(function (id) {
                          if (id) state.vars.query = id;
                          return !!id;
                      });
                  } },
                { on: ['sql'], title: 'Add columns',
                  html: '<p>The query is empty so far. On the right, under <i>Add a column</i>, choose the <b>Movie</b> table and then its column <b>Movie -> Year</b>. Add two more the same way: <b>Movie -> Runtime (Minutes)</b> and <b>Movie</b> itself.</p>'
                      + '<p>Notice that once you add a column, the table list keeps only the tables linked to the ones already in the query.</p>'
                      + '<p class="lsn-wait">I am waiting for 3 columns in the query…</p>',
                  check: function () {
                      if (!state.vars.query) return Promise.resolve(false);
                      return records(28, state.vars.query).then(function (r) { return r.length >= 3; });
                  } },
                { on: ['sql'], title: 'Aggregates',
                  html: '<p>Now let\'s calculate. Press the <b>Function</b> button: a row of lists appears under the column names. Choose <b>AVG</b> (average) under <i>Runtime</i> and <b>COUNT</b> under <i>Movie</i>. Integram groups the rows by the remaining column — the year.</p>'
                      + '<p>The builder shows the first rows of the result right away, so you see each change on the fly.</p>',
                  next: true },
                { on: ['sql'], title: 'Sorting and totals',
                  html: '<p>Press <b>Sort</b> and click the arrows icon under <i>Year</i>: the badge 1 shows it is the first sort column, and one more click reverses the order. You can sort by several columns.</p>'
                      + '<p>Press <b>Totals</b> and choose <b>SUM</b> under <i>Movie</i>: the total row shows 1000 movies.</p>',
                  next: true },
                { on: ['sql'], title: 'Filters',
                  html: '<p>Press <b>Filter</b>, type <b>2016</b> in the <i>From</i> field under <i>Year</i> and press Enter: only that year is left. Fill in <i>To</i> as well to get a range.</p>'
                      + '<p>Now clear the filter field and press Enter again: in the next lesson this query draws a chart of all the years.</p>',
                  next: true },
                { on: ['sql', 'report'], title: 'What we have learned',
                  html: '<p>You selected data from linked tables, grouped it, calculated averages and counts, sorted, filtered and added totals. Highlighted buttons mean a setting is in use.</p>'
                      + '<p>Click the query name to see it as a report, the way users will see it. The query builder can do much more: formulas, nested queries and even creating, updating and deleting records.</p>'
                      + '<p>The next lesson is <b>Forms</b> — we will put this query on a chart.</p>',
                  next: true, last: true }
            ]
        },

        forms: {
            title: 'Forms',
            needs: 'queries',
            steps: [
                { on: ['forms'], title: 'Create a form',
                  html: '<p>In the form builder you make data entry forms and dashboards with tables, charts and pivots. We will make a form to add users and a chart of movie statistics.</p>'
                      + '<p>Open <b>Forms</b>, type <b>Stats</b> in the <i>New form name</i> field and press <b>Create form</b>.</p>',
                  hl: ['forms'],
                  check: function () {
                      return recordId(137, 'Stats').then(function (id) {
                          if (id) state.vars.form = id;
                          return !!id;
                      });
                  } },
                { on: ['forms'], title: 'A panel to add users',
                  html: '<p>A form consists of panels. Each panel shows a table or a query in a certain way.</p>'
                      + '<p>Press <b>Add panel</b>, enter the title <b>Users</b> and choose the <b>Data entry form</b> type. Set <i>Data source</i> to <b>Table (object)</b>, pick <b>User</b> and press <b>Add</b>. Users can now be added right on the form.</p>'
                      + '<p>If the new panel says <i>Set up a data source</i>, refresh the page.</p>',
                  check: function () {
                      if (!state.vars.form) return Promise.resolve(false);
                      return records(138, state.vars.form).then(function (r) { return r.length >= 1; });
                  } },
                { on: ['forms'], title: 'A chart panel',
                  html: '<p>Add one more panel: the title <b>Average duration by year</b>, the <b>Line chart</b> type, <i>Data source</i> — <b>Query (report)</b> and the <b>Average duration</b> query from the previous lesson. It draws the movie length and count by year.</p>',
                  check: function () {
                      if (!state.vars.form) return Promise.resolve(false);
                      return records(138, state.vars.form).then(function (r) { return r.length >= 2; });
                  } },
                { on: ['forms'], title: 'Run the form',
                  html: function () {
                      return '<p>You are in the edit mode. <a href="' + url('forms/' + state.vars.form) + '">Open the form</a> as users will see it, add a user through the first panel and check the chart. The <b>Edit</b> button brings you back to the builder.</p>'
                      + '<p>Important: to let other users open the form, their role needs read access to the tables and queries the form uses.</p>'
                      + '<p>The last lesson is <b>Data structures</b>.</p>';
                  },
                  next: true, last: true }
            ]
        },

        structure: {
            title: 'Data structures',
            steps: [
                { on: ['edit_types'], title: 'A reading list app',
                  html: '<p>In this lesson we will design a small app from scratch: a list of books with authors and reading statuses. The same way you will build the apps you need.</p>'
                      + '<p>Open <b>Structure</b>. Type <b>Book</b> in the <i>Search / New table</i> field, keep the SHORT type and press <b>Create</b>.</p>',
                  hl: ['edit_types'],
                  check: function () { return tableId('Book').then(Boolean); } },
                { on: ['edit_types'], title: 'Book properties',
                  html: '<p>You taught the system a new term. The new <b>Book</b> card is at the bottom of the page: click the name <b>Book</b> in it to open its settings.</p>'
                      + '<p>At the bottom of the card pick a column in the list and press <b>Add column</b>. Terms the system already knows can be reused by any table — add <b>Start date (date)</b> and <b>Notes (memo)</b>, a multi-line text.</p>'
                      + '<p class="lsn-wait">I am waiting for both columns…</p>',
                  check: function () { return hasColumns('Book', ['Start date', 'Notes']); } },
                { on: ['edit_types'], title: 'A lookup: reading status',
                  html: '<p>We want to choose a status from a list: <i>To read</i>, <i>Reading</i>, <i>Finished</i>. In the same list pick <i>--- add new ---</i>, type <b>Reading status</b>, tick <b>Link</b> and press <b>Create</b>: Integram creates the lookup table and links the book to it.</p>',
                  check: function () { return hasColumns('Book', ['Reading status']); } },
                { on: ['edit_types'], title: 'A linked table: authors',
                  html: '<p>Authors deserve their own table with properties. Create the table <b>Author</b> with the field at the top of the page, open its card and add new columns <b>Country</b> and <b>Website</b> (<i>--- add new ---</i>, SHORT, <b>Create</b>).</p>'
                      + '<p>Then press <b>Create link</b> in the Author card: the column list gets <b>-->Author</b>, a reference to authors. Add it to the <b>Book</b>. Linked tables are drawn to the right of the table that refers to them.</p>',
                  check: function () {
                      return Promise.all([hasColumns('Author', ['Country', 'Website']), hasColumns('Book', ['Author'])])
                          .then(function (r) { return r[0] && r[1]; });
                  } },
                { on: ['tables'], title: 'Fill in the data',
                  html: '<p>The structure is ready. Open <b>Tables</b> and then the <b>Book</b> table.</p>',
                  hl: ['tables'],
                  check: function () {
                      return tableId('Book').then(function (id) {
                          if (id) state.vars.book = id;
                          return !!id && onPage(['table/' + id, 'object/' + id]);
                      });
                  } },
                { on: ['table', 'object'], title: 'Your first book',
                  html: '<p>Add a record with the <b>+</b> button: type a book title, set the date, choose a reading status (type a new value to add it to the lookup) and an author, then save.</p>'
                      + '<p class="lsn-wait">I am waiting for the first book…</p>',
                  check: function () {
                      if (!state.vars.book) return Promise.resolve(false);
                      return records(state.vars.book).then(function (r) { return r.length >= 1; });
                  } },
                { on: [], title: 'You have built an app',
                  html: '<p>You designed linked tables, a lookup and a reference, and filled them with data. Add a menu item for the Book table, build a query and a form on top of it — and it is an app for your team.</p>'
                      + '<p>Thank you for taking the lessons! See the <a href="/knowledge-base" target="_blank">knowledge base</a> for more.</p>',
                  next: true, last: true }
            ]
        }
    };
    var ORDER = ['overview', 'upload', 'queries', 'forms', 'structure'];

    // ── Panel ────────────────────────────────────────────────────────────────

    var CSS = ''
        + '#lsn-box{position:fixed;right:24px;bottom:24px;width:360px;max-width:calc(100vw - 32px);z-index:2000;'
        + 'background:var(--card-bg,#fff);color:var(--text-primary,#222);border:1px solid #e0c34a;border-radius:12px;'
        + 'box-shadow:0 8px 30px rgba(0,0,0,.18);font-size:14px;line-height:1.45}'
        + '#lsn-box .lsn-head{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:move;'
        + 'background:#fff6d6;color:#5a4500;border-radius:12px 12px 0 0;user-select:none;touch-action:none}'
        + '#lsn-box .lsn-title{flex:1;font-weight:600}'
        + '#lsn-box .lsn-count{font-size:12px;opacity:.75}'
        + '#lsn-box .lsn-x{border:0;background:none;font-size:18px;line-height:1;cursor:pointer;color:inherit;padding:0 4px}'
        + '#lsn-box .lsn-body{padding:12px 14px;max-height:50vh;overflow:auto}'
        + '#lsn-box .lsn-body p{margin:0 0 8px}#lsn-box .lsn-body ul{margin:0 0 8px;padding-left:18px}'
        + '#lsn-box .lsn-wait{font-size:12px;opacity:.7}'
        + '#lsn-box .lsn-foot{display:flex;gap:8px;align-items:center;padding:0 14px 12px}'
        + '#lsn-box .lsn-btn{border:1px solid #c9a227;background:#c9a227;color:#fff;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:13px}'
        + '#lsn-box .lsn-btn.lsn-sec{background:none;color:inherit;border-color:#bbb}'
        + '#lsn-box .lsn-stop{margin-left:auto;font-size:12px;opacity:.7;cursor:pointer;text-decoration:underline}'
        + '#lsn-box.lsn-min .lsn-body,#lsn-box.lsn-min .lsn-foot{display:none}'
        + '.lsn-hl{outline:3px solid gold !important;outline-offset:-1px;border-radius:8px;box-shadow:0 0 12px rgba(255,200,0,.6) !important}'
        + '.lsn-hl-inline{padding:0 4px}';

    var box, poll, busy = false;

    function ensureBox() {
        if (box) return box;
        var st = document.createElement('style');
        st.textContent = CSS;
        document.head.appendChild(st);
        box = document.createElement('div');
        box.id = 'lsn-box';
        box.innerHTML = '<div class="lsn-head"><span class="lsn-title"></span><span class="lsn-count"></span>'
            + '<button class="lsn-x" data-act="min" title="Collapse">–</button></div>'
            + '<div class="lsn-body"></div><div class="lsn-foot"></div>';
        document.body.appendChild(box);
        box.addEventListener('click', function (e) {
            var a = e.target.closest('[data-act]');
            if (!a) return;
            var act = a.getAttribute('data-act');
            if (act === 'min') { state.min = !state.min; save(); render(); }
            else if (act === 'next') advance();
            else if (act === 'back') { if (state.step > 0) { state.step--; save(); render(); } }
            else if (act === 'stop') stop();
            else if (act === 'go') location.href = a.getAttribute('data-href');
        });
        drag(box.querySelector('.lsn-head'));
        if (state.pos) place(state.pos.x, state.pos.y);
        return box;
    }

    function place(x, y) {
        x = Math.max(0, Math.min(x, window.innerWidth - 120));
        y = Math.max(0, Math.min(y, window.innerHeight - 40));
        box.style.left = x + 'px'; box.style.top = y + 'px';
        box.style.right = 'auto'; box.style.bottom = 'auto';
    }

    function drag(handle) {
        var sx, sy, ox, oy, on = false;
        handle.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button')) return;
            var r = box.getBoundingClientRect();
            on = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
            handle.setPointerCapture(e.pointerId);
        });
        handle.addEventListener('pointermove', function (e) {
            if (on) place(ox + e.clientX - sx, oy + e.clientY - sy);
        });
        handle.addEventListener('pointerup', function () {
            if (!on) return;
            on = false;
            state.pos = { x: parseInt(box.style.left, 10), y: parseInt(box.style.top, 10) };
            save();
        });
    }

    // ── Highlighting ─────────────────────────────────────────────────────────

    function clearHl() {
        document.querySelectorAll('.lsn-hl:not(.lsn-hl-inline)').forEach(function (el) { el.classList.remove('lsn-hl'); });
    }
    function menuItem(href) {
        var h = MENU_HREF[href] || href;
        return document.querySelector('.app-menu-item[data-href="' + h + '"]')
            || document.querySelector('.app-menu a[href="' + url(h) + '"]');
    }
    function hlMenu(href) {
        var el = menuItem(href);
        if (!el) return;
        el.classList.add('lsn-hl');
        // An item inside a collapsed folder: mark the folder too
        var sub = el.closest('.app-submenu');
        if (sub && !sub.classList.contains('expanded')) {
            var folder = document.querySelector('[data-menu-id="' + sub.getAttribute('data-parent') + '"]');
            if (folder) folder.classList.add('lsn-hl');
        }
    }
    function applyHl(step) {
        clearHl();
        (step.hl || []).forEach(hlMenu);
        (step.sel || []).forEach(function (s) {
            document.querySelectorAll(s).forEach(function (el) { el.classList.add('lsn-hl'); });
        });
    }

    // Page hints (js/hints.js and the info pop-ups of table.html) cover the page and block
    // clicks. They all stay silent while hints_mode is 'off', so a running lesson switches
    // them off and gives the user's own setting back when it ends.
    function muteHints() {
        try {
            if (!('hintsPrev' in state)) { state.hintsPrev = localStorage.getItem('hints_mode'); save(); }
            localStorage.setItem('hints_mode', 'off');
        } catch (e) { /* ignore */ }
    }
    function restoreHints() {
        if (!('hintsPrev' in state)) return;
        try {
            if (state.hintsPrev === null) localStorage.removeItem('hints_mode');
            else localStorage.setItem('hints_mode', state.hintsPrev);
        } catch (e) { /* ignore */ }
        delete state.hintsPrev;
    }
    function hideHints() {
        document.querySelectorAll('[id$="-hint-box"]').forEach(function (el) { el.style.display = 'none'; });
    }

    // ── Flow ─────────────────────────────────────────────────────────────────

    function current() {
        var l = state.cur && LESSONS[state.cur];
        if (!l) return null;
        var s = l.steps[state.step || 0];
        return s ? { lesson: l, step: s } : null;
    }

    function render() {
        var c = current();
        if (!c) { if (box) box.style.display = 'none'; clearHl(); return; }
        ensureBox();
        box.style.display = '';
        box.classList.toggle('lsn-min', !!state.min);
        hideHints();
        var s = c.step, n = c.lesson.steps.length, i = state.step || 0;
        box.querySelector('.lsn-title').textContent = c.lesson.title + ': ' + s.title;
        box.querySelector('.lsn-count').textContent = (i + 1) + '/' + n;
        box.querySelector('.lsn-x').textContent = state.min ? '+' : '–';

        var body = typeof s.html === 'function' ? s.html() : s.html, foot = '';
        var away = s.on.length && !onPage(s.on);
        // A step that waits for the user to open a menu item is fine on any page
        if (away && !(s.hl && s.check)) {
            var target = s.on[0];
            body = '<p>Open <b>' + esc(MENU_NAMES[target] || target) + '</b> to continue the lesson.</p>';
            if (MENU_NAMES[target] !== undefined)
                foot += '<button class="lsn-btn" data-act="go" data-href="' + esc(url(MENU_HREF[target] || target)) + '">Open</button>';
            clearHl();
            if (target) hlMenu(target);
        } else {
            applyHl(s);
            if (s.next) foot += '<button class="lsn-btn" data-act="next">' + (s.last ? 'Finish' : 'Next') + '</button>';
        }
        if (i > 0) foot += '<button class="lsn-btn lsn-sec" data-act="back">Back</button>';
        if (!s.last) foot += '<a class="lsn-stop" data-act="stop">Stop the lesson</a>';
        box.querySelector('.lsn-body').innerHTML = body;
        box.querySelector('.lsn-foot').innerHTML = foot;
    }

    function advance() {
        var c = current();
        if (!c) return;
        if (c.step.last) return finish();
        state.step = (state.step || 0) + 1;
        save();
        render();
    }

    function finish() {
        state.done[state.cur] = true;
        state.cur = null; state.step = 0;
        restoreHints();
        save();
        render();
        markCards();
    }

    function stop() {
        state.cur = null; state.step = 0;
        restoreHints();
        save();
        render();
    }

    function tick() {
        var c = current();
        if (!c || busy) return;
        hideHints();
        if (!c.step.check) return;
        if (c.step.on.length && !onPage(c.step.on) && !c.step.hl) return;
        busy = true;
        var at = state.cur + ':' + state.step;
        Promise.resolve(c.step.check()).then(function (ok) {
            busy = false;
            if (ok && at === state.cur + ':' + state.step) advance();
        }, function () { busy = false; });
    }

    function start(name) {
        if (!LESSONS[name]) return;
        state.cur = name; state.step = 0; state.min = false;
        muteHints();
        save();
        var first = LESSONS[name].steps[0];
        // Jump to the first workplace of the lesson right away
        if (first.on.length && !onPage(first.on) && first.on[0] !== '') {
            location.href = url(MENU_HREF[first.on[0]] || first.on[0]);
            return;
        }
        render();
    }

    // ── Home page cards ──────────────────────────────────────────────────────

    function markCards() {
        document.querySelectorAll('[data-lesson]').forEach(function (card) {
            var name = card.getAttribute('data-lesson');
            var done = !!state.done[name];
            card.classList.toggle('lsn-done', done);
            var st = card.querySelector('.lsn-status');
            if (st) st.textContent = done ? '✓ Completed' : (state.cur === name ? 'In progress' : '');
            var need = LESSONS[name] && LESSONS[name].needs;
            var hint = card.querySelector('.lsn-needs');
            if (hint) hint.style.display = need && !state.done[need] ? '' : 'none';
        });
    }

    window.IntegramLessons = { start: start, stop: stop, order: ORDER, lessons: LESSONS };

    function init() {
        if (state.cur) muteHints();
        markCards();
        render();
        // The sidebar is built on DOMContentLoaded by main-app.js: mark menu items once it exists
        setTimeout(render, 300);
        poll = setInterval(tick, POLL_MS);
        tick();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
