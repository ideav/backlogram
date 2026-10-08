
(function (root) {
    'use strict';

    var REF = /\[([^\]]+)\]/g;
    var KPI = /roi|margin|profitability/i;    // "is a KPI" heuristic until there is an explicit flag (D3)

    function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
    function qIndexFromYMD(ymd) { var y = +String(ymd).slice(0, 4), m = +String(ymd).slice(4, 6); return (y - 2024) * 4 + ((m - 1) / 3 | 0); }

    function modelFromReports(structRows, valueRows, quarters) {
        var qs = quarters || ['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025'];
        var rows = {}, series = {}, companies = [];
        (structRows || []).forEach(function (r) {
            var comp = r['Label'] || r.label || '', name = r.item;
            if (!comp || !name) return;
            if (!rows[comp]) { rows[comp] = []; companies.push(comp); }
            if (!rows[comp].some(function (x) { return x.name === name; }))
                rows[comp].push({ name: name, formula: r.formulas || '', level: +(r.level || 1) });
        });
        (valueRows || []).forEach(function (r) {
            var comp = r['Label'] || '', line = r.item;
            if (!comp || !line) return;
            var s = (series[comp] || (series[comp] = {}))[line] || ((series[comp][line]) = new Array(qs.length).fill(null));
            var raw = r.value ? JSON.parse('[' + r.value + ']') : [];
            raw.forEach(function (e) { var i = qIndexFromYMD(e.date); if (i >= 0 && i < s.length) s[i] = num(e.val); });
        });
        return { quarters: qs, companies: companies, rows: rows, series: series };
    }

    function ymd(d) { var s = String(d || ''); return s.length === 10 ? s.slice(6) + s.slice(3, 5) + s.slice(0, 2) : s; }

    function formulaByNames(formula, nameById) {
        return String(formula || '').replace(/\[([^\[\]]+)\]/g, function (whole, ref) {
            var name = nameById[String(ref).trim()];
            return name ? '[' + name + ']' : whole;
        });
    }

    function modelFromDashState(g) {
        g = g || root;
        var state = (g && typeof g.dashLiveState === 'function') ? g.dashLiveState() : null;
        if (!state) return { quarters: [], companies: [], rows: {}, series: {}, byCol: true };
        var items = state.items || {}, formulas = state.formulas || {}
            , values = state.values || {}, periods = state.periods || {};

        var cols = [];
        Object.keys(periods).forEach(function (dict) {
            var list = periods[dict];
            (Array.isArray(list) ? list : []).forEach(function (row) {
                var r = row && row.r;
                if (!r || !r[0] || !r[1] || !r[2]) return;
                if (!cols.some(function (c) { return c.name === r[0]; }))
                    cols.push({ name: r[0], fr: ymd(r[1]), to: ymd(r[2]) });
            });
        });
        cols.sort(function (a, b) { return a.fr < b.fr ? -1 : (a.fr > b.fr ? 1 : 0); });

        var rows = {}, series = {}, companies = [], nameById = {}, nameByKey = {};
        Object.keys(items).forEach(function (id) { if (items[id] && items[id].name) nameById[id] = items[id].name; });
        Object.keys(items).forEach(function (id) {
            var it = items[id], comp = it.label || '', name = it.name;
            if (!comp || !name) return;
            nameByKey[name.toLowerCase()] = name;
            if (!rows[comp]) { rows[comp] = []; companies.push(comp); }
            rows[comp].push({ name: name, formula: formulaByNames(formulas[id], nameById), level: +(it.level || 1) });
        });

        var groupsByLine = {}, chosen = {};
        Object.keys(values).forEach(function (key) {
            var parts = String(key).split(':'), line = nameByKey[parts[0]] || parts[0];
            (groupsByLine[line] || (groupsByLine[line] = [])).push(parts[1] || '');
        });
        Object.keys(groupsByLine).forEach(function (line) {
            var gs = groupsByLine[line].slice().sort();
            chosen[line] = gs.indexOf('') >= 0 ? '' : (gs.indexOf('actual') >= 0 ? 'actual' : gs[0]);
        });
        Object.keys(values).forEach(function (key) {
            var parts = String(key).split(':'), line = nameByKey[parts[0]] || parts[0], group = parts[1] || '';
            if (chosen[line] !== group) return;
            (values[key] || []).forEach(function (v) {
                var comp = v && v['Label'] || '';
                if (!comp) return;
                var col = null;
                for (var c = 0; c < cols.length; c++)
                    if (String(v.date) >= cols[c].fr && String(v.date) <= cols[c].to) { col = cols[c]; break; }
                if (!col) return;
                var s = (series[comp] || (series[comp] = {}))[line] || (series[comp][line] = {});
                s[col.name] = (s[col.name] || 0) + num(v.val);
            });
        });
        return { quarters: cols.map(function (c) { return c.name; }), companies: companies,
                 rows: rows, series: series, byCol: true };
    }

    function refsOf(formula) {
        var out = [], m; REF.lastIndex = 0;
        while ((m = REF.exec(formula || ''))) { var t = m[1].trim(); if (!/^[+-]?\d+$/.test(t) || !/^[+-]/.test(t)) out.push(t); }
        return out;
    }
    function classify(row) {
        if (KPI.test(row.name)) return 'kpi';
        return (row.formula && row.formula.trim()) ? 'computed' : 'input';
    }
    function buildGraph(model, company) {
        var rows = model.rows[company] || [], byName = {};
        rows.forEach(function (r) { byName[r.name] = r; });
        var nodes = rows.map(function (r) { return { name: r.name, kind: classify(r), formula: r.formula, refs: refsOf(r.formula) }; });
        var edges = [];
        nodes.forEach(function (n) { n.refs.forEach(function (ref) { if (byName[ref]) edges.push({ from: n.name, to: ref }); }); });
        return { company: company, nodes: nodes, edges: edges };
    }

    function evalFormula(formula, resolve, raw) {
        var expr = raw ? formula.replace(/Math\.round/g, '') : formula;
        expr = expr.replace(REF, function (_, name) { return '(' + resolve(name.trim()) + ')'; });
        return Function('"use strict";return (' + expr + ');')();
    }
    function periodValues(model, company, periodKey, overrides, raw) {
        var rows = model.rows[company] || [], byName = {}, cache = {}, ov = overrides || {};
        rows.forEach(function (r) { byName[r.name] = r; });
        function seriesVal(line) {
            var s = (model.series[company] || {})[line];
            if (!s) return 0;
            return num(model.byCol ? s[periodKey] : s[periodKey]);
        }
        function resolve(name) {
            if (name in cache) return cache[name];
            if (name in ov) return (cache[name] = ov[name]);
            var r = byName[name], v;
            if (r && r.formula && r.formula.trim()) v = evalFormula(r.formula, resolve, raw);
            else v = seriesVal(name);
            return (cache[name] = v);
        }
        rows.forEach(function (r) { resolve(r.name); });
        return cache;
    }
    function periodKeys(model) { return model.byCol ? model.quarters : model.quarters.map(function (_, i) { return i; }); }

    function goalSeek(model, company, kpiName, targetPct, periodKey) {
        var rows = model.rows[company] || [];
        var levers = rows.filter(function (r) { return classify(r) === 'input'; }).map(function (r) { return r.name; });
        var base = periodValues(model, company, periodKey, null, true);
        var roi0 = base[kpiName], target = roi0 * (1 + targetPct / 100);
        var lv = {}; levers.forEach(function (l) { lv[l] = (model.byCol ? (model.series[company][l] || {})[periodKey] : model.series[company][l][periodKey]); });
        function roiWith(l, val) { var o = {}; o[l] = val; return periodValues(model, company, periodKey, o, true)[kpiName]; }
        var scenarios = [];
        levers.forEach(function (l) {
            var d0 = Math.max(1, Math.abs(lv[l]) * 0.01);
            var sens = (roiWith(l, lv[l] + d0) - roi0) / d0;
            if (Math.abs(sens) < 1e-12) return;
            var newv = lv[l] + (target - roi0) / sens, roi = roiWith(l, newv);
            for (var it = 0; it < 6 && Math.abs(roi - target) > 0.01; it++) {
                var d = Math.max(1, Math.abs(newv) * 0.01);
                var slope = (roiWith(l, newv + d) - roi) / d;
                if (Math.abs(slope) < 1e-12) break;
                newv += (target - roi) / slope; roi = roiWith(l, newv);
            }
            scenarios.push({ lever: l, from: lv[l], to: newv, pct: lv[l] ? (newv - lv[l]) / lv[l] * 100 : Infinity,
                             sens: sens, roi: roi });
        });
        scenarios.sort(function (a, b) { return Math.abs(a.pct) - Math.abs(b.pct); });
        return { company: company, kpi: kpiName, current: roi0, target: target, levers: lv, scenarios: scenarios };
    }

    function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); var m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
    function findAnomalies(model, opts) {
        opts = opts || {}; var zt = opts.z || 3.5, drift = opts.drift || 0.05, flags = [];
        Object.keys(model.series || {}).forEach(function (comp) {
            if (comp === (opts.portfolio || 'Portfolio')) return;
            var lines = model.series[comp] || {};
            Object.keys(lines).forEach(function (line) {
                var arr = model.byCol ? model.quarters.map(function (q) { return lines[line][q]; }) : lines[line];
                var vals = (arr || []).filter(function (v) { return v != null; });
                if (vals.length < 4) return;
                var med = median(vals), mad = median(vals.map(function (v) { return Math.abs(v - med); })) || 1e-9;
                (arr || []).forEach(function (v, i) {
                    if (v == null) return; var z = 0.6745 * (v - med) / mad;
                    if (Math.abs(z) >= zt) flags.push({ type: 'outlier', company: comp, line: line, period: model.quarters[i],
                        value: v, median: med, delta: v - med, z: z });
                });
            });
            if (lines['Cost of sales'] && lines['Revenue']) {
                var rr = model.quarters.map(function (q, i) {
                    var c = model.byCol ? lines['Cost of sales'][q] : lines['Cost of sales'][i];
                    var r = model.byCol ? lines['Revenue'][q] : lines['Revenue'][i];
                    return r ? c / r : null;
                }).filter(function (x) { return x != null; });
                if (rr.length >= 4 && rr[rr.length - 1] - rr[0] > drift)
                    flags.push({ type: 'drift', company: comp, line: 'Cost of sales/Revenue',
                        from: rr[0], to: rr[rr.length - 1] });
            }
        });
        flags.sort(function (a, b) { return (Math.abs(b.z || b.to - b.from) || 0) - (Math.abs(a.z || a.to - a.from) || 0); });
        return flags;
    }

    function diagnose(model, company, kpiName) {
        var keys = periodKeys(model);
        var roi = keys.map(function (k) { return periodValues(model, company, k, null, true)[kpiName]; });
        if (roi[roi.length - 1] >= roi[0]) return { company: company, declining: false, roi: roi };
        var a = periodValues(model, company, keys[0], null, true), b = periodValues(model, company, keys[keys.length - 1], null, true);
        var factors = ['Revenue', 'Cost of sales', 'Gross profit', 'Operating expenses', 'EBITDA', 'Investments']
            .filter(function (n) { return n in a; })
            .map(function (n) { return { name: n, from: a[n], to: b[n], delta: b[n] - a[n] }; });
        var dRev = (b['Revenue'] || 0) - (a['Revenue'] || 0), dCost = (b['Cost of sales'] || 0) - (a['Cost of sales'] || 0);
        return { company: company, declining: true, roi: roi, from: roi[0], to: roi[roi.length - 1],
                 factors: factors, driver: Math.abs(dRev) >= Math.abs(dCost) ? 'falling revenue' : 'rising cost of sales',
                 gpContribRevenue: dRev, gpContribCost: -dCost };
    }

    var OPTI_FLAG = 'opti';
    function optiRequested(hash) {
        return String(hash == null ? '' : hash).replace(/^#/, '').split('&').some(function (p) {
            var t = p.trim().toLowerCase();
            return t === OPTI_FLAG || t.indexOf(OPTI_FLAG + '=') === 0;
        });
    }

    var API = {
        modelFromReports: modelFromReports, modelFromDashState: modelFromDashState,
        buildGraph: buildGraph, periodValues: periodValues, periodKeys: periodKeys,
        goalSeek: goalSeek, findAnomalies: findAnomalies, diagnose: diagnose, refsOf: refsOf, classify: classify,
        optiRequested: optiRequested
    };
    root.DashOptimize = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function fmt(n, d) { return (Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('en-US'); }

    function renderReport(model, company) {
        if (!company) return '<p class="opt-muted">The model is not loaded or has no rows with a company label.</p>';
        var g = buildGraph(model, company);
        var kpiNode = g.nodes.filter(function (n) { return n.kind === 'kpi'; })[0]
                  || g.nodes.filter(function (n) { return n.kind === 'computed'; }).slice(-1)[0];
        var keys = periodKeys(model), lastKey = keys[keys.length - 1];
        var h = ['<h5>Model: ' + esc(company) + '</h5>'];

        h.push('<h5>D1. Dependency graph</h5><table><tr><th>Row</th><th>Type</th><th>Depends on</th></tr>');
        g.nodes.forEach(function (n) {
            var kind = n.kind === 'kpi' ? 'KPI' : n.kind === 'computed' ? 'computed' : 'input';
            h.push('<tr><td>' + esc(n.name) + '</td><td>' + kind + '</td><td>' + esc(n.refs.join(', ')) + '</td></tr>');
        });
        h.push('</table>');

        // A goal-seek
        if (kpiNode) {
            try {
                var a = goalSeek(model, company, kpiNode.name, 20, lastKey);
                h.push('<h5>A. Raise "' + esc(kpiNode.name) + '" by 20% (' + esc(String(lastKey)) + ')</h5>');
                h.push('<p>Now ' + fmt(a.current, 2) + ' → target ' + fmt(a.target, 2) + '</p>');
                h.push('<table><tr><th>Lever</th><th>Change</th><th>Check</th></tr>');
                a.scenarios.forEach(function (s) {
                    h.push('<tr><td>' + esc(s.lever) + '</td><td>' + fmt(s.from, 0) + '→' + fmt(s.to, 0) +
                        ' (' + (s.pct >= 0 ? '+' : '') + fmt(s.pct, 1) + '%)</td><td>' + fmt(s.roi, 2) + '</td></tr>');
                });
                h.push('</table>');
            } catch (e) { h.push('<p class="opt-muted">A: ' + esc(e.message) + '</p>'); }
        }

        var flags = findAnomalies(model);
        h.push('<h5>B. Anomalies</h5>');
        if (!flags.length) h.push('<p class="opt-muted">none found</p>');
        else { h.push('<ul>'); flags.forEach(function (f) {
            if (f.type === 'outlier') h.push('<li class="opt-warn">' + esc(f.company) + ' / ' + esc(f.line) + ' / ' + esc(f.period) +
                ': ' + fmt(f.value, 0) + ' (median ' + fmt(f.median, 0) + ', dev ' + (f.delta >= 0 ? '+' : '') + fmt(f.delta, 0) + ', z=' + fmt(f.z, 1) + ')</li>');
            else h.push('<li class="opt-warn">' + esc(f.company) + ' / ' + esc(f.line) + ': drift ' + fmt(f.from * 100, 0) + '%→' + fmt(f.to * 100, 0) + '%</li>');
        }); h.push('</ul>'); }

        if (kpiNode) {
            var c = diagnose(model, company, kpiNode.name);
            h.push('<h5>C. Diagnostics: "' + esc(kpiNode.name) + '"</h5>');
            if (!c.declining) h.push('<p class="opt-muted">the metric is not declining</p>');
            else {
                h.push('<p>Dropped ' + fmt(c.from, 2) + ' → ' + fmt(c.to, 2) + '. Main driver: <b>' + esc(c.driver) + '</b>.</p>');
                h.push('<table><tr><th>Factor</th><th>Before→After</th><th>Δ</th></tr>');
                c.factors.forEach(function (f) { h.push('<tr><td>' + esc(f.name) + '</td><td>' + fmt(f.from, 0) + '→' + fmt(f.to, 0) + '</td><td>' + (f.delta >= 0 ? '+' : '') + fmt(f.delta, 0) + '</td></tr>'); });
                h.push('</table>');
            }
        }
        return h.join('');
    }

    if (typeof document !== 'undefined') {
        var enabled = optiRequested(root.location && root.location.hash);
        document.addEventListener('DOMContentLoaded', function () {
            var open = document.getElementById('dash-opt-open'),
                modal = document.getElementById('dash-opt-modal'),
                body = document.getElementById('dash-opt-body'),
                close = document.getElementById('dash-opt-close');
            if (!open || !modal) return;
            if (!enabled) {
                if (open.parentNode) open.parentNode.removeChild(open);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                return;
            }
            open.classList.add('dash-opt-on');
            open.addEventListener('click', function () {
                var model = modelFromDashState(root);
                var company = model.companies[0] || '';
                body.innerHTML = renderReport(model, company);
                modal.classList.add('open');
            });
            if (close) close.addEventListener('click', function () { modal.classList.remove('open'); });
            modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });
        });
    }
})(typeof window !== 'undefined' ? window : this);
