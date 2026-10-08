//
//
//
//
(function () {
    'use strict';

    var KINDS = {
        'formula':      { title: 'Formulas that were not carried over',
                          hint: 'the formula refers outside the imported range' },
        'unnamed-row':  { title: 'Rows without a name',
                          hint: 'there is nowhere to take the record key from' },
        'merge':        { title: 'Merged cells',
                          hint: 'the target does not reproduce merged cells' },
        'unknown-type': { title: 'Unrecognized values',
                          hint: 'the value type is not mapped to a target column' },
        'skipped':      { title: 'Skipped on purpose',
                          hint: 'the content is not part of the imported model' },
        'other':        { title: 'Other', hint: '' }
    };

    function createJournal(context) {
        var ctx = context || {};
        var entries = [];
        var counters = { moved: 0 };

        function add(entry) {
            var e = entry || {};
            var kind = KINDS[e.kind] ? e.kind : 'other';
            entries.push({
                kind: kind,
                where: e.where == null ? '' : String(e.where),
                address: e.address == null ? '' : String(e.address),
                what: e.what == null ? '' : String(e.what),
                why: e.why == null ? (KINDS[kind].hint || '') : String(e.why)
            });
            return entries.length;
        }

        function moved(n) { counters.moved = Number(n) || 0; return counters.moved; }

        function all() { return entries.slice(); }
        function count() { return entries.length; }
        function byKind() {
            var out = {};
            entries.forEach(function (e) { (out[e.kind] = out[e.kind] || []).push(e); });
            return out;
        }
        function summary() {
            return { moved: counters.moved, skipped: entries.length, byKind: (function () {
                var c = {}; entries.forEach(function (e) { c[e.kind] = (c[e.kind] || 0) + 1; }); return c;
            })() };
        }

        function toIssueMarkdown() {
            var title = 'Not imported: ' + (ctx.source || 'unnamed source');
            var out = ['## ' + title, ''];
            if (ctx.tool) out.push('Tool: `' + ctx.tool + '`' + (ctx.target ? ', target: ' + ctx.target : ''), '');
            var s = summary();
            out.push('Records imported: **' + s.moved + '**, left out: **' + s.skipped + '**.', '');
            if (!entries.length) { out.push('Everything was imported.'); return out.join('\n'); }
            var groups = byKind();
            Object.keys(groups).forEach(function (kind) {
                out.push('### ' + KINDS[kind].title + ' — ' + groups[kind].length, '');
                out.push('| where | address | what | why |');
                out.push('|---|---|---|---|');
                groups[kind].forEach(function (e) {
                    out.push('| ' + cell(e.where) + ' | `' + e.address + '` | `' + cell(e.what) + '` | ' + cell(e.why) + ' |');
                });
                out.push('');
            });
            return out.join('\n');
        }
        function cell(s) { return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n+/g, ' '); }

        function toRows() {
            return entries.map(function (e) {
                return { tool: ctx.tool || '', source: ctx.source || '', kind: e.kind,
                         where: e.where, address: e.address, what: e.what, why: e.why };
            });
        }

        return { add: add, moved: moved, all: all, count: count, byKind: byKind,
                 summary: summary, toIssueMarkdown: toIssueMarkdown, toRows: toRows, context: ctx };
    }

    var api = { createJournal: createJournal, KINDS: KINDS };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.ImportJournal = api;
})();
