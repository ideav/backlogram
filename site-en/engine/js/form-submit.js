// ────────────────────────────────────────────────────────────────────────────
//
//
//
// ────────────────────────────────────────────────────────────────────────────
(function () {
    'use strict';

    var SCOPE_SELECTOR = '[data-submit-scope],[role="dialog"],dialog,.menu-modal,[class*="modal"],[class*="overlay"]';

    var PRIMARY_SELECTOR = [
        'button[type="submit"]',
        'input[type="submit"]',
        '[class*="-btn-primary"]',
        '[class*="-btn--primary"]',
        '.btn-primary',
        '.menu-modal-btn.save'
    ].join(',');

    function isTextEntry(el) {
        if (!el || el.disabled || el.readOnly) return false;
        var tag = el.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (tag === 'INPUT') {
            var t = String((el.getAttribute && el.getAttribute('type')) || 'text').toLowerCase();
            return ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image'].indexOf(t) === -1;
        }
        return el.isContentEditable === true;
    }

    function isVisible(el) {
        if (!el || el.disabled) return false;
        if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
        if (el.hidden) return false;
        if (typeof el.offsetParent !== 'undefined') {
            if (el.offsetParent !== null) return true;
            if (el.getClientRects && el.getClientRects().length > 0) return true;
            return false;
        }
        return true;
    }

    function firstVisible(scope, selector) {
        var list = scope.querySelectorAll(selector);
        for (var i = 0; i < list.length; i++) {
            if (isVisible(list[i])) return list[i];
        }
        return null;
    }

    function resolveSubmitTarget(el) {
        if (!el || typeof el.closest !== 'function') return null;
        var form = el.closest('form');
        if (form) return { kind: 'form', form: form };
        var scope = el.closest(SCOPE_SELECTOR);
        if (!scope) return null;
        var btn = firstVisible(scope, '[data-default-submit]') || firstVisible(scope, PRIMARY_SELECTOR);
        if (btn) return { kind: 'button', button: btn };
        return null;
    }

    function submitForm(form) {
        var btn = form.querySelector('[data-default-submit],button[type="submit"],input[type="submit"]');
        var withBtn = btn && isVisible(btn) ? btn : undefined;
        if (typeof form.requestSubmit === 'function') {
            try { form.requestSubmit(withBtn); return; } catch (e) { /* fallthrough */ }
        }
        if (withBtn) withBtn.click();
        else if (typeof form.submit === 'function') form.submit();
    }

    function onKeydown(e) {
        if (e.defaultPrevented) return;
        if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
        if (!isTextEntry(e.target)) return;
        var target;
        try { target = resolveSubmitTarget(e.target); } catch (err) { return; }
        if (!target) return;
        e.preventDefault();
        try {
            if (target.kind === 'form') submitForm(target.form);
            else if (target.kind === 'button') target.button.click();
        } catch (err) {  }
    }

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('keydown', onKeydown);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            resolveSubmitTarget: resolveSubmitTarget,
            isTextEntry: isTextEntry,
            isVisible: isVisible,
            SCOPE_SELECTOR: SCOPE_SELECTOR,
            PRIMARY_SELECTOR: PRIMARY_SELECTOR
        };
    }
})();
