//
//
//
//
(function () {
    'use strict';

    var DEFAULT_LIMIT = 5;

    function runWithConcurrency(thunks, limit) {
        var tasks = Array.isArray(thunks) ? thunks.slice() : [];
        var max = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, tasks.length || 1));
        var results = new Array(tasks.length);
        return new Promise(function (resolve, reject) {
            if (!tasks.length) { resolve(results); return; }
            var next = 0, active = 0, failed = false, firstError = null, settled = false;
            function settle() {
                if (settled) return;
                settled = true;
                if (firstError) reject(firstError); else resolve(results);
            }
            function start(idx) {
                active += 1;
                Promise.resolve().then(tasks[idx]).then(function (res) {
                    results[idx] = res; active -= 1; pump();
                }, function (err) {
                    failed = true; if (!firstError) firstError = err;
                    active -= 1; pump();
                });
            }
            function pump() {
                if (settled) return;
                if (active === 0 && (failed || next >= tasks.length)) { settle(); return; }
                while (!failed && active < max && next < tasks.length) start(next++);
            }
            pump();
        });
    }

    function limiter(fn, max) {
        var cap = Math.max(1, Number(max) || DEFAULT_LIMIT);
        var active = 0, queue = [];
        function release() {
            active -= 1;
            var nextRun = queue.shift();
            if (nextRun) nextRun();
        }
        return function () {
            var self = this, args = arguments;
            return new Promise(function (resolve, reject) {
                function run() {
                    active += 1;
                    Promise.resolve().then(function () { return fn.apply(self, args); })
                        .then(function (res) { release(); resolve(res); },
                              function (err) { release(); reject(err); });
                }
                if (active < cap) run(); else queue.push(run);
            });
        };
    }

    var api = { runWithConcurrency: runWithConcurrency, limiter: limiter, DEFAULT_LIMIT: DEFAULT_LIMIT };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.IntegramBatch = api;
})();
