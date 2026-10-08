//
//
//
//
(function () {
    'use strict';

    var Journal = (typeof require === 'function') ? require('./import-journal.js')
                : (typeof window !== 'undefined' ? window.ImportJournal : null);
    var Batch = (typeof require === 'function') ? require('./integram-batch.js')
              : (typeof window !== 'undefined' ? window.IntegramBatch : null);


    function cellVal(cell) { return cell && cell.v != null ? cell.v : null; }
    function cellText(cell) {
        var v = cellVal(cell);
        return (typeof v === 'string') ? v.trim() : '';
    }
    function cellNum(cell) {
        var v = cellVal(cell);
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v);
        return null;
    }
    function isYearNum(n) { return n != null && n === Math.round(n) && n >= 1990 && n <= 2100; }

    function periodHeader(row) {
        var cols = [], years = [];
        for (var c = 0; c < row.length; c++) {
            var n = cellNum(row[c]);
            if (isYearNum(n) && (!years.length || n > years[years.length - 1])) { cols.push(c); years.push(n); }
        }
        if (years.length < 3) return null;
        var totalCol = null;
        for (var t = cols[cols.length - 1] + 1; t < row.length && t <= cols[cols.length - 1] + 3; t++) {
            if (/total/i.test(cellText(row[t]))) { totalCol = t; break; }
        }
        return { cols: cols, years: years, totalCol: totalCol };
    }

    function rowLabels(row, firstPeriodCol) {
        var texts = [];
        for (var c = 0; c < firstPeriodCol && c < row.length; c++) {
            var s = cellText(row[c]);
            if (s !== '') texts.push({ col: c, text: s });
        }
        if (!texts.length) return { name: '', label: '' };
        if (texts.length === 1) return { name: texts[0].text, label: '' };
        return { name: texts[texts.length - 1].text, label: texts[0].text };
    }

    function formulaRefs(formula) {
        var out = [];
        var re = /\$?([A-Z]{1,3})\$?(\d+)/g, m;
        while ((m = re.exec(String(formula || ''))) !== null) {
            var col = 0, s = m[1];
            for (var i = 0; i < s.length; i++) col = col * 26 + (s.charCodeAt(i) - 64);
            out.push({ col: col - 1, row: Number(m[2]) - 1 });
        }
        return out;
    }

    // → { panels: [{ title, years, rows: [{ name, label, values, total, formula }] }], journal: [] }
    function recognizeSheet(sheetName, grid, opts) {
        opts = opts || {};
        var journal = opts.journal || Journal.createJournal({ tool: 'dash-import', source: sheetName });
        var panels = [];
        var head = null, panel = null, pendingTitle = '', panelIndex = 0;

        function pushJournal(kind, rowIdx, colIdx, what, why) {
            journal.add({ kind: kind, where: 'sheet "' + sheetName + '"',
                          address: cellAddr(rowIdx, colIdx), what: what, why: why });
        }

        for (var r = 0; r < grid.length; r++) {
            var row = grid[r] || [];
            var h = periodHeader(row);
            if (h) {
                head = h;
                panel = { title: pendingTitle || ('Panel ' + (++panelIndex)), years: h.years.slice(),
                          totalCol: h.totalCol, rows: [], headRow: r };
                if (pendingTitle) panelIndex++;
                panels.push(panel);
                pendingTitle = '';
                continue;
            }
            if (!head) {
                var pre = rowLabels(row, row.length);
                if (pre.name) pendingTitle = pre.name;
                continue;
            }
            var lab = rowLabels(row, head.cols[0]);
            var values = {}, hasValue = false, formula = null;
            for (var i = 0; i < head.cols.length; i++) {
                var cell = row[head.cols[i]];
                var n = cellNum(cell);
                if (n != null) { values[head.years[i]] = n; hasValue = true; }
                if (cell && cell.f && !formula) formula = cell.f;
            }
            var total = head.totalCol != null ? cellNum(row[head.totalCol]) : null;

            if (!hasValue) {
                if (lab.name) pendingTitle = lab.name;
                continue;
            }
            if (pendingTitle && panel && panel.rows.length) {
                panel = { title: pendingTitle, years: head.years.slice(), totalCol: head.totalCol,
                          rows: [], headRow: panel.headRow };
                panels.push(panel);
                pendingTitle = '';
            }
            if (!lab.name) {
                pushJournal('unnamed-row', r, head.cols[0], 'row with numbers but no label',
                    'no source for the model row name — row not imported');
                continue;
            }
            var moved = null;
            if (formula) {
                var refs = formulaRefs(formula);
                var panelHeadRow = panel.headRow;
                var outside = refs.filter(function (ref) {
                    var inPeriodCols = head.cols.indexOf(ref.col) !== -1 || ref.col === head.totalCol;
                    var inPanel = ref.row > panelHeadRow;
                    return !inPeriodCols || !inPanel;
                });
                if (outside.length) {
                    pushJournal('formula', r, head.cols[0], '=' + formula,
                        'formula refers outside its panel (parameters on the right or another section) — values imported as numbers, formula not');
                } else {
                    moved = formula;
                }
            }
            panel.rows.push({ name: lab.name, label: lab.label, values: values,
                              total: total, formula: moved, srcRow: r + 1 });
        }
        (opts.merges || []).forEach(function (m) {
            journal.add({ kind: 'merge', where: 'sheet "' + sheetName + '"', address: m,
                what: 'merged cells', 
                why: 'the model does not reproduce merges — columns are built by period' });
        });
        panels.forEach(function (p) {
            if (!/^Panel \d+$/.test(p.title)) return;
            var first = p.rows.filter(function (r) { return r.label; })[0];
            if (first) p.title = first.label;
        });
        return { panels: panels.filter(function (p) { return p.rows.length; }), journal: journal };
    }

    function cellAddr(rowIdx, colIdx) {
        var n = (colIdx == null ? 0 : colIdx) + 1, s = '';
        while (n) { var rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
        return s + ((rowIdx == null ? 0 : rowIdx) + 1);
    }

    function recognizeModel(fileName, grids) {
        var model = { name: modelNameFromFile(fileName), sheets: [] };
        var journal = Journal.createJournal({
            tool: 'dash-import', source: modelNameFromFile(fileName), target: 'dashboard model' });
        (grids || []).forEach(function (g) {
            var res = recognizeSheet(g.name, g.grid || [], { merges: g.merges, journal: journal });
            model.sheets.push({ name: g.name, panels: res.panels });
        });
        journal.moved(model.sheets.reduce(function (a, s) {
            return a + s.panels.reduce(function (b, p) { return b + p.rows.length; }, 0); }, 0));
        model.years = [];
        model.sheets.forEach(function (s) {
            s.panels.forEach(function (p) {
                p.years.forEach(function (y) { if (model.years.indexOf(y) === -1) model.years.push(y); });
            });
        });
        model.years.sort(function (a, b) { return a - b; });
        return { model: model, journal: journal };
    }

    function modelNameFromFile(fileName) {
        var base = String(fileName || '').split(/[\\/]/).pop();
        return base.replace(/\.(xlsx|xlsm|xls)$/i, '').trim() || 'Model';
    }

    function periodValues(years, extra) {
        var list = (years || []).slice().sort(function (a, b) { return a - b; });
        if (!list.length) return [];
        var n = extra == null ? 3 : extra, last = list[list.length - 1], out = list.slice();
        for (var i = 1; i <= n; i++) out.push(last + i);
        return out;
    }

    function yearDictRows(years, extra) {
        return periodValues(years, extra).map(function (y) {
            return { name: String(y), from: '01.01.' + y, to: '31.12.' + y };
        });
    }

    //
    //

    //   needed:   [{ name, key?, fields? }]
    function dictPlan(needed, existing, opts) {
        opts = opts || {};
        var byName = {}, byKey = {}, index = {}, create = [], patch = [];
        (existing || []).forEach(function (rec) {
            var r = (rec && rec.r) || [];
            var name = String(r[0] == null ? '' : r[0]).trim();
            var key = opts.keyCol == null ? '' : String(r[opts.keyCol] == null ? '' : r[opts.keyCol]).trim();
            if (name && !byName[name]) byName[name] = { id: String(rec.i), key: key };
            if (key && !byKey[key]) byKey[key] = String(rec.i);
        });
        var queued = {};
        (needed || []).forEach(function (want) {
            var name = String(want.name == null ? '' : want.name).trim();
            var key = want.key == null ? '' : String(want.key).trim();
            var slot = key || name;
            if (!name || index[slot] || queued[slot]) return;
            queued[slot] = 1;
            var found = key ? byKey[key] : (byName[name] && byName[name].id);
            if (found) { index[slot] = found; return; }
            var sameName = byName[name];
            if (key && sameName && !sameName.key && opts.keyReq) {
                var f = {};
                f[opts.keyReq] = key;
                patch.push({ id: sameName.id, name: name, key: key, fields: f });
                index[slot] = sameName.id;
                return;
            }
            var fields = {};
            Object.keys(want.fields || {}).forEach(function (k) { fields[k] = want.fields[k]; });
            if (key && opts.keyReq) fields[opts.keyReq] = key;
            create.push({ name: name, key: key, fields: fields });
        });
        return { create: create, patch: patch, index: index };
    }

    // → [{ key, name, table, needed, keyCol, keyReq }]
    function dictSpecs(schema, model, extra) {
        schema = schema || {};
        var dicts = schema.dicts || {};
        var years = yearDictRows((model && model.years) || [], extra);
        var needLine = ((model && model.sheets) || []).some(function (s) {
            return (s.panels || []).some(function (p) { return p.totalCol != null; }); });
        var rgTypes = [{ name: 'Repeating group', key: 'rg' }];
        if (needLine) rgTypes.push({ name: 'Row total', key: 'line' });
        return [
            { key: 'period', name: 'Period', table: dicts.period,
              needed: [{ name: schema.periodName || 'Year' }] },
            { key: 'years', name: schema.periodName || 'Year', table: dicts.years,
              needed: years.map(function (y) {
                  var f = {};
                  f[(schema.req || {}).yearFrom] = y.from;
                  f[(schema.req || {}).yearTo] = y.to;
                  return { name: y.name, fields: f };
              }) },
            { key: 'rgTypes', name: 'RG type', table: dicts.rgTypes, keyCol: 1,
              keyReq: (schema.req || {}).rgTypeCode, needed: rgTypes },
            { key: 'budget', name: 'Budget line', table: dicts.budget,
              needed: budgetRowNames(model || {}).map(function (n) { return { name: n }; }) }
        ];
    }

    function findReq(table, reqName) {
        return ((table && table.reqs) || []).filter(function (r) {
            if (String(r.val || '').trim() === reqName) return true;
            var attrs = {};
            try { attrs = JSON.parse(r.attrs || '{}'); } catch (e) { attrs = {}; }
            return String(attrs.alias || '').trim() === reqName;
        })[0] || null;
    }

    function periodDictTable(metadata, name, fallbackId) {
        var wanted = String(name || '').trim();
        var named = (metadata || []).filter(function (t) {
            return String(t.val || '').trim() === wanted; });
        var withBounds = named.filter(function (t) { return findReq(t, 'From') && findReq(t, 'To'); });
        var table = withBounds[0] || named[0] ||
            (fallbackId ? (metadata || []).filter(function (t) {
                return String(t.id) === String(fallbackId); })[0] : null);
        if (!table) return null;
        var from = findReq(table, 'From'), to = findReq(table, 'To');
        return { id: Number(table.id), name: String(table.val || '').trim(),
                 from: from ? Number(from.id) : null, to: to ? Number(to.id) : null };
    }


    function budgetRowNames(model) {
        var seen = {}, out = [];
        (model.sheets || []).forEach(function (s) {
            (s.panels || []).forEach(function (p) {
                (p.rows || []).forEach(function (r) {
                    var name = String(r.name || '').trim();
                    if (name && !seen[name]) { seen[name] = 1; out.push(name); }
                });
            });
        });
        return out;
    }

    function valueDateForYear(year) { return '01.01.' + String(year); }

    function valueKey(rowName, year, label) {
        return [String(rowName || '').trim(), String(year), String(label || '').trim()].join('\u0001');
    }

    function rgTypeIdsByCode(rows) {
        var out = {};
        (rows || []).forEach(function (rec) {
            var code = String((rec.r && rec.r[1]) || '').trim();
            if (code) out[code] = String(rec.i);
        });
        return out;
    }


    function buildCreateOps(model, schema, existing) {
        existing = existing || {};
        var ops = [], seq = 0;
        function ref() { return '$' + (++seq); }

        var periodOp = null;
        if (!existing.periodTableId) {
            periodOp = { op: 'create-period-dict', ref: ref(), name: schema.periodName || 'Year',
                         values: periodValues(model.years, 3) };
            ops.push(periodOp);
        } else {
            ops.push({ op: 'fill-period-dict', tableId: existing.periodTableId,
                       values: periodValues(model.years, 3) });
        }

        var dashRef;
        if (existing.dashboardId) {
            dashRef = existing.dashboardId;
            ops.push({ op: 'reuse-dashboard', id: existing.dashboardId, name: model.name });
        } else {
            dashRef = ref();
            ops.push({ op: 'create-dashboard', ref: dashRef, table: schema.dashboard, name: model.name,
                       period: periodOp ? periodOp.ref : existing.periodTableId });
        }

        model.sheets.forEach(function (sheet) {
            var known = (existing.sheetsByName || {})[sheet.name];
            var sheetRef;
            if (known) { sheetRef = known; ops.push({ op: 'reuse-sheet', id: known, name: sheet.name }); }
            else {
                sheetRef = ref();
                ops.push({ op: 'create-sheet', ref: sheetRef, table: schema.sheet, up: dashRef, name: sheet.name });
            }
            sheet.panels.forEach(function (panel) {
                var panelRef = ref();
                ops.push({ op: 'create-panel', ref: panelRef, table: schema.panel, up: sheetRef, name: panel.title });
                ops.push({ op: 'create-rg', ref: ref(), table: schema.rg, up: panelRef,
                           rgType: schema.rgTypes.rg, ord: 1 });
                if (panel.totalCol != null) {
                    ops.push({ op: 'create-rg', ref: ref(), table: schema.rg, up: panelRef,
                               rgType: schema.rgTypes.line, ord: 2 });
                }
                panel.rows.forEach(function (row) {
                    var rowRef = ref();
                    ops.push({ op: 'create-row', ref: rowRef, table: schema.row, up: panelRef,
                               name: row.name, label: row.label, formula: row.formula });
                    Object.keys(row.values).forEach(function (year) {
                        ops.push({ op: 'create-value', table: schema.values, item: rowRef,
                                   period: Number(year), value: row.values[year] });
                    });
                });
            });
        });
        return ops;
    }



    function gridsFromWorkbook(XLSX, workbook) {
        return (workbook.SheetNames || []).map(function (name) {
            var ws = workbook.Sheets[name];
            var ref = ws['!ref'] || 'A1';
            var range = XLSX.utils.decode_range(ref);
            var grid = [];
            for (var r = range.s.r; r <= range.e.r; r++) {
                var line = [];
                for (var c = range.s.c; c <= range.e.c; c++) {
                    var cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
                    line.push(cell ? { v: cell.v, f: cell.f || null } : null);
                }
                grid.push(line);
            }
            var merges = (ws['!merges'] || []).map(function (m) { return XLSX.utils.encode_range(m); });
            return { name: name, grid: grid, merges: merges };
        });
    }

    function newObjectPath(tableId, up) {
        var parent = (up === undefined || up === null || up === '' || Number(up) === 0) ? 1 : up;
        return '_m_new/' + tableId + '?JSON&up=' + encodeURIComponent(parent);
    }

    function childListPath(tableId, parentId, limit) {
        return 'object/' + tableId + '/?JSON_OBJ&LIMIT=0,' + (limit || 500) +
               '&F_U=' + encodeURIComponent(parentId);
    }

    function modelDateRange(years) {
        var list = (years || []).slice().sort(function (a, b) { return a - b; });
        if (!list.length) return null;
        return { from: '01.01.' + list[0], to: '31.12.' + list[list.length - 1] };
    }


    function resolveSchema(metadata) {
        var byId = {}, byName = {};
        (metadata || []).forEach(function (t) {
            byId[String(t.id)] = t;
            (byName[String(t.val || '').trim()] = byName[String(t.val || '').trim()] || []).push(t);
        });
        function req(tableId, reqName) { return findReq(byId[String(tableId)], reqName); }
        function reqId(tableId, reqName) { var q = req(tableId, reqName); return q ? Number(q.id) : null; }
        function linked(tableId, reqName) {
            var q = req(tableId, reqName);
            var target = q && (q.arr_id || q.ref);
            return target ? String(target) : null;
        }
        var dashboard = (byName['Dashboard'] || []).filter(function (t) {
            return linked(t.id, 'Sheet'); })[0];
        dashboard = dashboard ? String(dashboard.id) : null;

        var sheet = dashboard ? linked(dashboard, 'Sheet') : null;
        var panel = sheet ? linked(sheet, 'Panel') : null;
        var row = panel ? linked(panel, 'Row') : null;
        var rg = panel ? linked(panel, 'RG') : null;
        var values = ((byName['Value'] || [])[0] || {}).id;
        values = values ? String(values) : null;

        var schema = {
            dashboard: num(dashboard), sheet: num(sheet), panel: num(panel), row: num(row), rg: num(rg),
            rgTypeDict: num(rg ? linked(rg, 'RG type') : null),
            values: num(values),
            budgetRows: num(values ? linked(values, 'Budget line') : null),
            periodDict: num(dashboard ? linked(dashboard, 'Period') : null),
            yearTable: num(sheet ? linked(sheet, 'Year') : null),
            req: {
                dashPeriod: dashboard ? reqId(dashboard, 'Period') : null,
                dashFrom: dashboard ? reqId(dashboard, 'From') : null,
                dashTo: dashboard ? reqId(dashboard, 'To') : null,
                rowFormula: row ? reqId(row, 'Formula') : null,
                rowLabel: row ? reqId(row, 'Label') : null,
                rgType: rg ? reqId(rg, 'RG type') : null,
                valDate: values ? reqId(values, 'Date') : null,
                valRow: values ? reqId(values, 'Budget line') : null,
                valLabel: values ? reqId(values, 'Label') : null,
                rgTypeCode: rg && linked(rg, 'RG type') ? reqId(linked(rg, 'RG type'), 'Code') : null
            },
            periodName: 'Year'
        };
        schema.missing = ['dashboard', 'sheet', 'panel', 'row', 'rg', 'values']
            .filter(function (k) { return !schema[k]; });

        var period = periodDictTable(metadata, schema.periodName, schema.yearTable);
        schema.periodTable = period ? period.id : null;
        schema.req.yearFrom = period ? period.from : null;
        schema.req.yearTo = period ? period.to : null;
        schema.periodDictProblem = !period
            ? 'the database has no lookup table "' + schema.periodName + '" — nowhere to store model years'
            : (!period.from || !period.to
                ? 'table "' + period.name + '" has no "From" and "To" columns — without bounds the period is not' +
                  ' included in the model'
                : null);

        schema.dicts = {
            period: schema.periodDict, years: schema.periodTable,
            rgTypes: schema.rgTypeDict, budget: schema.budgetRows
        };
        schema.dictProblems = [];
        if (schema.periodDictProblem) schema.dictProblems.push(schema.periodDictProblem);
        if (!schema.periodDict)
            schema.dictProblems.push('no "Period" lookup — the dashboard cannot name its axis');
        if (!schema.req.dashPeriod)
            schema.dictProblems.push('"Dashboard" has no "Period" column — nowhere to set the axis type');
        if (!schema.rgTypeDict)
            schema.dictProblems.push('no "RG type" lookup — panels will have no columns');
        else if (!schema.req.rgTypeCode)
            schema.dictProblems.push('the "RG type" lookup has no "Code" column — the workspace ' +
                'compares the code (`rg`, `line`), the name means nothing to it');
        if (!schema.req.rgType)
            schema.dictProblems.push('"RG" has no "RG type" reference — nowhere to set the column mode');
        if (!schema.budgetRows)
            schema.dictProblems.push('no "Budget line" lookup — nothing to link the numbers to');
        if (!schema.req.valRow)
            schema.dictProblems.push('"Value" has no "Budget line" reference — the number will be left ' +
                'without a row');
        return schema;
    }
    function num(v) { return v == null || v === '' ? null : Number(v); }


    function createTrace(meta, now) {
        var clock = now || function () { return Date.now(); };
        var t0 = clock(), entries = [], counters = {};
        function push(kind, step, data) {
            var e = { ms: clock() - t0, kind: kind, step: step,
                      data: data === undefined ? null : data };
            entries.push(e);
            return e;
        }
        return {
            add:   function (step, data) { return push('step', step, data); },
            api:   function (step, data) { return push('api', step, data); },
            error: function (step, data) { return push('error', step, data); },
            count: function (name, by) { counters[name] = (counters[name] || 0) + (by == null ? 1 : by); },
            counters: function () { return counters; },
            all: function () { return entries.slice(); },
            errors: function () { return entries.filter(function (e) { return e.kind === 'error'; }); },
            toJSON: function () {
                var out = { tool: 'dash-import', entries: entries.slice(), counters: counters };
                Object.keys(meta || {}).forEach(function (k) { out[k] = meta[k]; });
                return out;
            },
            toText: function (limit) {
                var max = limit == null ? 200 : limit;
                var lines = entries.slice(0, max).map(function (e) {
                    return '+' + e.ms + 'ms  ' + (e.kind === 'error' ? '⛔ ' : '') + e.step +
                           (e.data == null ? '' : '  ' + JSON.stringify(e.data));
                });
                if (entries.length > max) {
                    lines.push('… ' + (entries.length - max) + ' more entries — see the downloaded file');
                    entries.slice(max).filter(function (e) { return e.kind === 'error'; })
                        .forEach(function (e) {
                            lines.push('+' + e.ms + 'ms  ⛔ ' + e.step +
                                       (e.data == null ? '' : '  ' + JSON.stringify(e.data)));
                        });
                }
                var names = Object.keys(counters);
                if (names.length) lines.push('— total: ' + names.map(function (n) {
                    return n + ' ' + counters[n]; }).join(', '));
                return lines.join('\n');
            }
        };
    }

    var api = {
        newObjectPath: newObjectPath,
        childListPath: childListPath,
        modelDateRange: modelDateRange,
        resolveSchema: resolveSchema,
        periodDictTable: periodDictTable,
        yearDictRows: yearDictRows,
        dictPlan: dictPlan,
        dictSpecs: dictSpecs,
        createTrace: createTrace,
        budgetRowNames: budgetRowNames,
        valueDateForYear: valueDateForYear,
        valueKey: valueKey,
        rgTypeIdsByCode: rgTypeIdsByCode,
        recognizeModel: recognizeModel,
        recognizeSheet: recognizeSheet,
        periodHeader: periodHeader,
        rowLabels: rowLabels,
        periodValues: periodValues,
        buildCreateOps: buildCreateOps,
        modelNameFromFile: modelNameFromFile,
        gridsFromWorkbook: gridsFromWorkbook,
        formulaRefs: formulaRefs
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.DashImport = api;


    if (typeof document === 'undefined') return;
    var root = document.getElementById('dash-import');
    if (!root) return;

    var DB = root.getAttribute('data-db') || '';
    var XSRF = root.getAttribute('data-xsrf') || '';
    var state = { model: null, journal: [], fileName: '', trace: createTrace({ db: DB }) };

    function el(id) { return document.getElementById(id); }
    function status(text, kind) {
        var box = el('di-status');
        box.textContent = text || '';
        box.className = 'di-status' + (kind ? ' di-status-' + kind : '');
    }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

    function api2(path, form) {
        var opts = { method: form ? 'POST' : 'GET', credentials: 'same-origin' };
        if (form) { form.append('_xsrf', XSRF); opts.body = form; }
        return fetch('/' + DB + '/' + path, opts).then(function (resp) {
            return resp.text().then(function (text) {
                var data = null;
                try { data = JSON.parse(text); } catch (e) { data = null; }
                if (!resp.ok) {
                    var msg = (data && data[0] && data[0].error) || text.slice(0, 200);
                    state.trace.error(opts.method + ' ' + path, { status: resp.status, answer: msg });
                    throw new Error(path + ' → ' + resp.status + ' ' + msg);
                }
                state.trace.api(opts.method + ' ' + path, {
                    status: resp.status,
                    rows: Array.isArray(data) ? data.length : undefined,
                    id: (data && !Array.isArray(data) && (data.id || data.ID)) || undefined
                });
                return data;
            });
        });
    }
    var post5 = Batch.limiter(api2, 5);

    function createObj(tableId, up, mainValue, fields) {
        var f = new FormData();
        f.append('t' + tableId, mainValue == null ? '' : String(mainValue));
        Object.keys(fields || {}).forEach(function (k) { f.append('t' + k, String(fields[k])); });
        return post5(newObjectPath(tableId, up), f).then(function (res) {
            var id = res && (res.id || res.ID || (res[0] && res[0].id));
            if (!id) {
                state.trace.error('create in table ' + tableId + ' — response has no id',
                                  { up: up, value: mainValue, answer: res });
                throw new Error('create in table ' + tableId + ': response has no id');
            }
            state.trace.add('created in table ' + tableId,
                            { id: String(id), up: up == null ? 1 : up, value: mainValue, fields: fields });
            return String(id);
        });
    }

    function setObj(objId, fields) {
        var keys = Object.keys(fields || {}).filter(function (k) {
            return k && k !== 'null' && k !== 'undefined' && fields[k] != null && fields[k] !== ''; });
        if (!keys.length) return Promise.resolve(String(objId));
        var f = new FormData();
        keys.forEach(function (k) { f.append('t' + k, String(fields[k])); });
        return api2('_m_set/' + objId + '?JSON', f).then(function () {
            state.trace.add('update record ' + objId, { fields: fields });
            return String(objId);
        });
    }
    function makeField(reqId, value) {
        var f = {};
        if (reqId && value) f[reqId] = value;
        return f;
    }


    function renderDebug() {
        el('di-debug-text').value = state.trace.toText();
        var errs = state.trace.errors().length;
        el('di-debug-count').textContent = state.trace.all().length + ' steps' +
            (errs ? ', errors ' + errs : '');
        el('di-debug-step').hidden = false;
    }
    function debugFileName() {
        var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
        var stamp = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
                    p(d.getHours()) + p(d.getMinutes());
        var name = String((state.model && state.model.name) || 'model').replace(/[\\/:*?"<>|]/g, '_');
        return 'dash-import-' + name + '-' + stamp + '.json';
    }

    function withXLSX() {
        if (window.XLSX) return Promise.resolve(window.XLSX);
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = '/js/xlsx0.18.5.full.min.js';
            s.onload = function () { resolve(window.XLSX); };
            s.onerror = function () { reject(new Error('failed to load the xlsx reader library')); };
            document.head.appendChild(s);
        });
    }

    function renderPreview() {
        var m = state.model;
        var sheets = m.sheets.length;
        var panels = m.sheets.reduce(function (a, s) { return a + s.panels.length; }, 0);
        var rows = m.sheets.reduce(function (a, s) {
            return a + s.panels.reduce(function (b, p) { return b + p.rows.length; }, 0); }, 0);
        var values = m.sheets.reduce(function (a, s) {
            return a + s.panels.reduce(function (b, p) {
                return b + p.rows.reduce(function (c, r) { return c + Object.keys(r.values).length; }, 0); }, 0); }, 0);
        el('di-summary').innerHTML =
            '<b>' + esc(m.name) + '</b> · sheets ' + sheets + ' · panels ' + panels +
            ' · rows ' + rows + ' · values ' + values +
            ' · periods ' + (m.years[0] || '—') + '…' + (m.years[m.years.length - 1] || '—');

        var html = '';
        m.sheets.forEach(function (s) {
            html += '<div class="di-sheet"><div class="di-sheet-name">Sheet "' + esc(s.name) + '"</div>';
            s.panels.forEach(function (p) {
                html += '<div class="di-panel"><div class="di-panel-name">' + esc(p.title) +
                        ' <span class="di-dim">rows ' + p.rows.length +
                        (p.totalCol != null ? ', has "Total"' : '') + '</span></div><ul class="di-rows">';
                p.rows.forEach(function (r) {
                    html += '<li>' + esc(r.name) +
                            (r.label ? ' <span class="di-dim">[' + esc(r.label) + ']</span>' : '') +
                            (r.formula ? ' <span class="di-f">ƒ ' + esc(r.formula) + '</span>' : '') + '</li>';
                });
                html += '</ul></div>';
            });
            html += '</div>';
        });
        el('di-preview').innerHTML = html;
        el('di-preview-step').hidden = false;

        el('di-journal-count').textContent = state.journal.count() ? state.journal.count() : '— none';
        el('di-journal-text').value = state.journal.toIssueMarkdown();
        el('di-journal-step').hidden = false;
        el('di-create-step').hidden = false;
    }

    el('di-file').addEventListener('change', function (ev) {
        var file = ev.target.files && ev.target.files[0];
        if (!file) return;
        state.fileName = file.name;
        el('di-file-name').textContent = file.name;
        status('Reading file…');
        state.trace = createTrace({ db: DB, file: file.name });
        state.trace.add('file selected', { name: file.name, size: file.size });
        withXLSX().then(function (XLSX) {
            return file.arrayBuffer().then(function (buf) {
                var wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
                var res = recognizeModel(file.name, gridsFromWorkbook(XLSX, wb));
                state.model = res.model; state.journal = res.journal;
                state.trace.add('file parsed', {
                    model: res.model.name, years: res.model.years,
                    sheets: res.model.sheets.map(function (s) {
                        return { name: s.name, panels: s.panels.map(function (p) {
                            return { title: p.title, rows: p.rows.length,
                                     total: p.totalCol != null }; }) };
                    }),
                    journal: res.journal.count()
                });
                renderPreview();
                renderDebug();
                status('Parsed. Review the structure — nothing has been written to the database yet.', 'ok');
            });
        }).catch(function (e) {
            state.trace.error('parse file', { message: e.message });
            renderDebug();
            status('Could not parse the file: ' + e.message, 'err');
        });
    });

    el('di-journal-copy').addEventListener('click', function () {
        var ta = el('di-journal-text');
        ta.select();
        try { document.execCommand('copy'); status('Log copied — paste it into an issue.', 'ok'); }
        catch (e) { status('Copy the log text manually.', 'err'); }
    });

    el('di-debug-download').addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(state.trace.toJSON(), null, 2)],
                            { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = debugFileName();
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        status('Debug file downloaded: ' + a.download, 'ok');
    });

    el('di-debug-copy').addEventListener('click', function () {
        var ta = el('di-debug-text');
        ta.select();
        try { document.execCommand('copy'); status('Trace copied.', 'ok'); }
        catch (e) { status('Copy the trace text manually.', 'err'); }
    });

    el('di-create').addEventListener('click', function () {
        if (!state.model) return;
        var btn = el('di-create');
        btn.disabled = true;
        status('Reading database schema…');
        var schema, dashId, sheetIds = {}, dicts = {}, dictCounts = {};
        api2('metadata?JSON').then(function (meta) {
            schema = resolveSchema(meta);
            state.trace.add('database schema', {
                dashboard: schema.dashboard, sheet: schema.sheet, panel: schema.panel,
                row: schema.row, rg: schema.rg, values: schema.values,
                dicts: schema.dicts, req: schema.req, missing: schema.missing,
                dictProblems: schema.dictProblems
            });
            renderDebug();
            if (schema.missing.length) throw new Error('the database lacks model tables: ' + schema.missing.join(', '));
            if (schema.dictProblems.length)
                throw new Error('model lookups: ' + schema.dictProblems.join('; '));
            status('Checking lookups…');
            var specs = dictSpecs(schema, state.model, 3);
            var chain = Promise.resolve();
            specs.forEach(function (spec) {
                chain = chain.then(function () {
                    return api2('object/' + spec.table + '/?JSON_OBJ&LIMIT=0,5000');
                }).then(function (rows) {
                    var plan = dictPlan(spec.needed, rows,
                                        { keyCol: spec.keyCol, keyReq: spec.keyReq });
                    dicts[spec.key] = plan.index;
                    dictCounts[spec.name] = { before: (rows || []).length,
                                              create: plan.create.length,
                                              patch_code: plan.patch.length };
                    state.trace.add('lookup "' + spec.name + '"', {
                        table: spec.table, before: (rows || []).length,
                        create: plan.create.map(function (r) { return r.key || r.name; }),
                        patch_code: plan.patch.map(function (r) { return r.name + '→' + r.key; })
                    });
                    return Batch.runWithConcurrency(
                        plan.patch.map(function (p) {
                            return function () { return setObj(p.id, p.fields); };
                        }).concat(plan.create.map(function (rec) {
                            return function () {
                                return createObj(spec.table, null, rec.name, rec.fields)
                                    .then(function (id) { plan.index[rec.key || rec.name] = id; });
                            };
                        })), 5);
                });
            });
            return chain;
        }).then(function () {
            return api2('object/' + schema.dashboard + '/?JSON_OBJ&LIMIT=0,500');
        }).then(function (list) {
            function dashFields(periodId) {
                var f = makeField(schema.req.dashPeriod, periodId);
                var range = modelDateRange(state.model.years);
                if (range && schema.req.dashFrom) f[schema.req.dashFrom] = range.from;
                if (range && schema.req.dashTo) f[schema.req.dashTo] = range.to;
                return f;
            }
            var periodId = dicts.period[schema.periodName];
            if (!periodId)
                throw new Error('the "Period" lookup has no "' + schema.periodName +
                                '" record — the model cannot set its axis, there will be no columns');
            var found = (list || []).filter(function (r) {
                return String(r.r && r.r[0]).trim() === state.model.name; })[0];
            if (found) {
                dashId = String(found.i);
                status('Model found — appending sheets…');
                return setObj(dashId, dashFields(periodId));
            }
            status('Creating model…');
            return createObj(schema.dashboard, null, state.model.name, dashFields(periodId))
                .then(function (id) { dashId = id; });
        }).then(function () {
            return api2(childListPath(schema.sheet, dashId)).then(function (list) {
                (list || []).forEach(function (r) { sheetIds[String(r.r && r.r[0]).trim()] = String(r.i); });
            }).catch(function () {  });
        }).then(function () {
            var ctx = { rgTypes: dicts.rgTypes, budget: dicts.budget };
            if (!schema.values) { ctx.seenValues = {}; return ctx; }
            return api2('object/' + schema.values + '/?JSON_OBJ&LIMIT=0,5000').then(function (list) {
                var seen = {};
                (list || []).forEach(function (r) {
                    var row = String((r.r && r.r[2]) || '').split(':').slice(1).join(':').trim();
                    var year = String((r.r && r.r[1]) || '').slice(-4);
                    var label = String((r.r && r.r[6]) || '').trim();
                    if (row && year) seen[valueKey(row, year, label)] = true;
                });
                ctx.seenValues = seen;
                return ctx;
            }).catch(function () { ctx.seenValues = {}; return ctx; });
        }).then(function (ctx) {
            var chain = Promise.resolve();
            var created = { sheets: 0, panels: 0, rows: 0, rgs: 0, values: 0, budget: 0, skipped: 0 };
            state.model.sheets.forEach(function (sheet) {
                chain = chain.then(function () {
                    if (sheetIds[sheet.name]) return sheetIds[sheet.name];
                    created.sheets++;
                    return createObj(schema.sheet, dashId, sheet.name, {});
                }).then(function (sheetId) {
                    var inner = Promise.resolve();
                    sheet.panels.forEach(function (panel) {
                        inner = inner.then(function () {
                            created.panels++;
                            return createObj(schema.panel, sheetId, panel.title, {});
                        }).then(function (panelId) {
                            var rgChain = Promise.resolve().then(function () {
                                created.rgs++;
                                var f = {}; f[schema.req.rgType] = ctx.rgTypes.rg;
                                return createObj(schema.rg, panelId, '', f);
                            });
                            if (panel.totalCol != null) {
                                rgChain = rgChain.then(function () {
                                    created.rgs++;
                                    var f2 = {}; f2[schema.req.rgType] = ctx.rgTypes.line;
                                    return createObj(schema.rg, panelId, '', f2);
                                });
                            }
                            return rgChain.then(function () {
                                return Batch.runWithConcurrency(panel.rows.map(function (row) {
                                    return function () {
                                        created.rows++;
                                        var f = {};
                                        if (schema.req.rowFormula && row.formula) f[schema.req.rowFormula] = row.formula;
                                        if (schema.req.rowLabel) f[schema.req.rowLabel] = state.model.name;
                                        if (!ctx.budget[row.name])
                                            throw new Error('the "Budget line" lookup has no "' +
                                                row.name + '" record — nowhere to write this row\'s numbers');
                                        var rowOp = createObj(schema.row, panelId, row.name, f);
                                        var valueOps = Object.keys(row.values).map(function (year) {
                                            var key = valueKey(row.name, year, state.model.name);
                                            if (ctx.seenValues[key]) { created.skipped++; return null; }
                                            ctx.seenValues[key] = true;
                                            return function () {
                                                created.values++;
                                                var vf = {};
                                                if (schema.req.valDate) vf[schema.req.valDate] = valueDateForYear(year);
                                                if (schema.req.valRow) vf[schema.req.valRow] = ctx.budget[row.name];
                                                if (schema.req.valLabel) vf[schema.req.valLabel] = state.model.name;
                                                return createObj(schema.values, null, row.values[year], vf);
                                            };
                                        }).filter(Boolean);
                                        return Promise.all([rowOp, Batch.runWithConcurrency(valueOps, 5)]);
                                    };
                                }), 5);
                            });
                        });
                    });
                    return inner;
                });
            });
            return chain.then(function () { return created; });
        }).then(function (created) {
            ['sheets', 'panels', 'rows', 'rgs', 'values', 'skipped'].forEach(function (k) {
                state.trace.count(k, created[k]); });
            var createdYears = (dictCounts[schema.periodName] || {}).create || 0;
            state.trace.count('years', createdYears);
            state.trace.add('done', { dashboard: dashId, created: created,
                                        dicts: dictCounts });
            renderDebug();
            status('Done: years ' + createdYears + ', sheets ' + created.sheets +
                   ', panels ' + created.panels +
                   ', rows ' + created.rows + ', columns (RG) ' + created.rgs +
                   ', values ' + created.values +
                   (created.skipped ? ' (already existed: ' + created.skipped + ')' : '') +
                   '. Model: ' + state.model.name +
                   ' (dash/' + dashId + ').', 'ok');
            el('di-target').innerHTML = '<a href="/' + DB + '/dash/' + dashId + '" target="_blank">Open model</a>';
            btn.disabled = false;
        }).catch(function (e) {
            state.trace.error('write aborted', { message: e.message });
            renderDebug();
            status('Write aborted: ' + e.message +
                   '. Whatever was created remains in the database; download the debug log and attach it to an issue.', 'err');
            btn.disabled = false;
        });
    });
})();
