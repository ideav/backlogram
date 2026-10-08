
(function () {
    'use strict';

    var AI_AGENT_OPEN_DBS = ['ateh', 'ateh1'];

    var IntegramAiAgentChat = {
        attachments: [],
        sending: false,

        pollIntervalMs: 2500,
        thinkStart: 0,
        activeJobId: null,
        pollJobId: null,
        pollTimer: null,
        tickTimer: null,
        currentBubble: null,
        rendered: {},
        localActivity: false,
        resumeChecked: false,

        init: function () {
            this.rendered = {};
            this.toggle = document.getElementById('ai-chat-toggle');
            this.panel = document.getElementById('ai-agent-panel');
            this.backdrop = document.getElementById('ai-agent-backdrop');
            this.closeBtn = document.getElementById('ai-agent-close');
            this.input = document.getElementById('ai-agent-input');
            this.sendBtn = document.getElementById('ai-agent-send');
            this.attachBtn = document.getElementById('ai-agent-attach');
            this.fileInput = document.getElementById('ai-agent-files');
            this.messages = document.getElementById('ai-agent-messages');
            this.attachmentsList = document.getElementById('ai-agent-attachments');
            this.statusEl = document.getElementById('ai-agent-status');

            if (!this.toggle || !this.panel) return false;

            if (!this.isAgentAllowed()) {
                this.toggle.style.display = 'none';
                return false;
            }

            var self = this;

            this.toggle.addEventListener('click', function () { self.togglePanel(); });
            if (this.closeBtn) this.closeBtn.addEventListener('click', function () { self.closePanel(); });
            if (this.backdrop) this.backdrop.addEventListener('click', function () { self.closePanel(); });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && self.isOpen()) self.closePanel();
            });

            if (this.sendBtn) this.sendBtn.addEventListener('click', function () { self.send(); });

            if (this.input) {
                this.input.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        self.send();
                    }
                });
            }

            if (this.attachBtn && this.fileInput) {
                this.attachBtn.addEventListener('click', function () { self.fileInput.click(); });
                this.fileInput.addEventListener('change', function () {
                    self.addFiles(self.fileInput.files);
                    self.fileInput.value = '';
                });
            }

            this.resume();

            return true;
        },

        isOpen: function () {
            return this.panel && this.panel.classList.contains('open');
        },

        togglePanel: function () {
            if (this.isOpen()) this.closePanel(); else this.openPanel();
        },

        openPanel: function () {
            if (!this.panel) return;
            this.panel.classList.add('open');
            this.panel.setAttribute('aria-hidden', 'false');
            this.panel.removeAttribute('inert');
            if (this.backdrop) this.backdrop.hidden = false;
            if (this.toggle) this.toggle.setAttribute('aria-expanded', 'true');
            if (this.input) this.input.focus();
            this.resume();
            this.scrollToBottom();
        },

        closePanel: function () {
            if (!this.panel) return;
            this.panel.classList.remove('open');
            this.panel.setAttribute('aria-hidden', 'true');
            this.panel.setAttribute('inert', '');
            if (this.backdrop) this.backdrop.hidden = true;
            if (this.toggle) this.toggle.setAttribute('aria-expanded', 'false');
        },

        getCurrentDbName: function () {
            if (typeof db !== 'undefined' && db) return String(db);
            if (typeof window !== 'undefined' && window.db) return String(window.db);
            var parts = window.location.pathname.split('/').filter(Boolean);
            return parts.length > 0 ? parts[0] : '';
        },

        getCurrentUserName: function () {
            if (typeof user !== 'undefined' && user) return String(user);
            if (typeof window !== 'undefined' && window.user) return String(window.user);
            return '';
        },

        //
        isAgentAllowed: function () {
            var u = this.getCurrentUserName().toLowerCase();
            var d = this.getCurrentDbName().toLowerCase();
            if (u === '') return false;
            if (AI_AGENT_OPEN_DBS.indexOf(d) !== -1) return true;
            return u === d;
        },

        getXsrfToken: function () {
            if (typeof xsrf !== 'undefined' && xsrf) return String(xsrf);
            if (typeof window !== 'undefined' && window.xsrf) return String(window.xsrf);
            var meta = document.querySelector ? document.querySelector('meta[name="_xsrf"]') : null;
            return meta ? meta.getAttribute('content') : '';
        },

        getAgentUrl: function () {
            var dbName = this.getCurrentDbName() || 'my';
            return '/' + encodeURIComponent(dbName) + '/ai/agent?JSON=1';
        },

        getStatusUrl: function (jobId) {
            var base = this.getAgentUrl();
            return jobId
                ? base + '&job=' + encodeURIComponent(jobId)
                : base + '&latest=1';
        },

        addFiles: function (fileList) {
            if (!fileList || !fileList.length) return;
            for (var i = 0; i < fileList.length; i++) {
                this.attachments.push(fileList[i]);
            }
            this.renderAttachments();
        },

        removeAttachment: function (index) {
            this.attachments.splice(index, 1);
            this.renderAttachments();
        },

        renderAttachments: function () {
            if (!this.attachmentsList) return;
            var self = this;
            this.attachmentsList.innerHTML = '';
            this.attachments.forEach(function (file, index) {
                var li = document.createElement('li');
                li.className = 'ai-agent-attachment';

                var icon = document.createElement('i');
                icon.className = 'pi pi-file';
                li.appendChild(icon);

                var name = document.createElement('span');
                name.className = 'ai-agent-attachment-name';
                name.textContent = file.name;
                li.appendChild(name);

                var remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'ai-agent-attachment-remove';
                remove.title = 'Remove file';
                remove.setAttribute('aria-label', 'Remove file');
                remove.innerHTML = '<i class="pi pi-times"></i>';
                remove.addEventListener('click', function () { self.removeAttachment(index); });
                li.appendChild(remove);

                self.attachmentsList.appendChild(li);
            });
        },

        setStatus: function (text) {
            if (this.statusEl) this.statusEl.textContent = text;
        },


        waitMessage: function (elapsedMs) {
            elapsedMs = elapsedMs || 0;
            if (elapsedMs < 12000)
                return 'Thinking…';
            if (elapsedMs < 45000)
                return 'Thinking. This may take up to a minute, please wait…';
            return 'The task is queued and the answer will arrive a bit later. You can close the window: '
                + 'the result will be saved and shown when you come back, even from another browser.';
        },

        statusMessage: function (elapsedMs) {
            elapsedMs = elapsedMs || 0;
            if (elapsedMs < 12000)
                return 'AI agent is thinking…';
            if (elapsedMs < 45000)
                return 'AI agent is thinking, it needs a bit more time…';
            return 'Task queued, the answer is coming soon…';
        },

        send: function () {
            if (this.sending) return;
            var text = this.input ? this.input.value.trim() : '';
            if (!text && !this.attachments.length) return;

            this.localActivity = true;
            this.addMessage('user', text || '(attachments)');

            var form = new FormData();
            form.append('_xsrf', this.getXsrfToken());
            form.append('message', text);
            this.attachments.forEach(function (file) {
                form.append('files[]', file, file.name);
            });

            if (this.input) this.input.value = '';
            this.attachments = [];
            this.renderAttachments();

            this.beginWaiting(null);

            var self = this;
            fetch(this.getAgentUrl(), {
                method: 'POST',
                body: form,
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                return response.json().catch(function () { return null; }).then(function (data) {
                    return { status: response.status, ok: response.ok, data: data };
                });
            }).then(function (result) {
                self.handleSubmitResponse(result);
            }).catch(function () {
                self.recoverAfterSubmitFailure();
            });
        },

        handleSubmitResponse: function (result) {
            var data = result.data;

            if (result.status === 402 && data) {
                this.replaceThinking(this.getErrorText(data) || 'AI agent access is not paid.', data.payUrl);
                this.endWaiting();
                return;
            }

            if (!result.ok && (!data || !data.job)) {
                this.replaceThinking(this.getErrorText(data) || 'AI agent is unavailable. Please try again later.');
                this.endWaiting();
                return;
            }

            this.routeJob(data && data.job ? data.job : null, false);
        },

        recoverAfterSubmitFailure: function () {
            var self = this;
            fetch(this.getStatusUrl(null), {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                return response.json().catch(function () { return null; });
            }).then(function (data) {
                var job = data && data.job ? data.job : null;
                if (job) {
                    self.routeJob(job, false);
                } else {
                    self.replaceThinking('Could not reach the AI agent. Please try again later.');
                    self.endWaiting();
                }
            }).catch(function () {
                self.replaceThinking('Could not reach the AI agent. Please try again later.');
                self.endWaiting();
            });
        },

        routeJob: function (job, fromPoll) {
            if (!job) {
                if (!fromPoll) {
                    this.replaceThinking('AI agent is unavailable. Please try again later.');
                    this.endWaiting();
                }
                return;
            }
            this.activeJobId = job.id;

            if (job.status === 'done') {
                this.finalizeAnswer(job);
                this.endWaiting();
                return;
            }
            if (job.status === 'error') {
                this.replaceThinking(this.getErrorText(job.result) || job.error || 'AI agent finished with an error.');
                this.endWaiting();
                return;
            }
            if (!this.currentBubble) this.currentBubble = this.addThinkingBubble();
            if (!this.sending) this.beginWaiting(job.id);
            this.ensurePolling(job.id);
        },

        finalizeAnswer: function (job) {
            var content = this.getAssistantContent(job.result) || 'AI agent returned no answer.';
            this.replaceThinking(content);
            if (job.id) this.rendered[job.id] = true;
        },


        beginWaiting: function (jobId) {
            this.sending = true;
            if (this.sendBtn) this.sendBtn.disabled = true;
            if (this.attachBtn) this.attachBtn.disabled = true;
            this.thinkStart = this.now();
            if (!this.currentBubble) this.currentBubble = this.addThinkingBubble();
            this.activeJobId = jobId || this.activeJobId;
            this.updateWaiting();
            this.startTick();
        },

        endWaiting: function () {
            this.sending = false;
            if (this.sendBtn) this.sendBtn.disabled = false;
            if (this.attachBtn) this.attachBtn.disabled = false;
            this.stopTick();
            this.stopPolling();
            this.activeJobId = null;
            this.currentBubble = null;
            if (this.statusEl) this.statusEl.classList.remove('is-waiting');
            this.setStatus('Ready');
        },

        startTick: function () {
            this.stopTick();
            var self = this;
            if (typeof setInterval === 'undefined') return;
            this.tickTimer = setInterval(function () { self.updateWaiting(); }, 1000);
        },

        stopTick: function () {
            if (this.tickTimer && typeof clearInterval !== 'undefined') clearInterval(this.tickTimer);
            this.tickTimer = null;
        },

        updateWaiting: function () {
            var elapsed = this.now() - this.thinkStart;
            if (this.statusEl) this.statusEl.classList.add('is-waiting');
            this.setStatus(this.statusMessage(elapsed));
            if (this.currentBubble && this.currentBubble.label)
                this.currentBubble.label.textContent = this.waitMessage(elapsed);
        },

        ensurePolling: function (jobId) {
            if (!jobId) return;
            this.activeJobId = jobId;
            if (this.pollTimer && this.pollJobId === jobId) return;
            this.stopPolling();
            this.pollJobId = jobId;
            var self = this;
            if (typeof setInterval === 'undefined') return;
            this.pollTimer = setInterval(function () { self.pollOnce(); }, this.pollIntervalMs);
        },

        stopPolling: function () {
            if (this.pollTimer && typeof clearInterval !== 'undefined') clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.pollJobId = null;
        },

        pollOnce: function () {
            var jobId = this.pollJobId;
            if (!jobId) return;
            var self = this;
            fetch(this.getStatusUrl(jobId), {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                return response.json().catch(function () { return null; });
            }).then(function (data) {
                if (!data || !data.job) return;
                self.routeJob(data.job, true);
            }).catch(function () {
            });
        },


        resume: function () {
            if (this.resumeChecked) return;
            this.resumeChecked = true;
            if (this.localActivity) return;
            if (typeof fetch === 'undefined') return;
            var self = this;
            fetch(this.getStatusUrl(null), {
                credentials: 'same-origin',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                return response.json().catch(function () { return null; });
            }).then(function (data) {
                var job = data && data.job ? data.job : null;
                if (!job || self.localActivity) return;
                self.restoreJob(job);
            }).catch(function () {});
        },

        restoreJob: function (job) {
            if (!job || !job.id || this.rendered[job.id]) return;
            this.addMessage('user', job.message || '(attachments)');
            this.rendered[job.id] = true;

            if (job.status === 'done') {
                this.addMessage('assistant', this.getAssistantContent(job.result) || 'AI agent returned no answer.');
                return;
            }
            if (job.status === 'error') {
                this.addMessage('assistant', this.getErrorText(job.result) || job.error || 'AI agent finished with an error.');
                return;
            }
            this.currentBubble = this.addThinkingBubble();
            this.beginWaiting(job.id);
            this.ensurePolling(job.id);
        },


        getAssistantContent: function (data) {
            if (!data) return '';
            if (data.assistant && typeof data.assistant.content === 'string') return data.assistant.content;
            if (typeof data.content === 'string') return data.content;
            if (typeof data.message === 'string') return data.message;
            return '';
        },

        getErrorText: function (data) {
            if (!data) return '';
            if (typeof data.error === 'string') return data.error;
            if (data.error && data.error.message) return data.error.message;
            return '';
        },

        addMessage: function (role, text, payUrl) {
            if (!this.messages) return null;
            var wrap = document.createElement('div');
            wrap.className = 'ai-chat-message ' + (role === 'user' ? 'ai-chat-message-user' : 'ai-chat-message-assistant');

            var author = document.createElement('div');
            author.className = 'ai-chat-message-author';
            author.textContent = role === 'user' ? 'You' : 'AI agent';
            wrap.appendChild(author);

            var body = document.createElement('div');
            body.className = 'ai-chat-message-text';
            body.textContent = text;
            wrap.appendChild(body);

            if (payUrl) this.appendPayLink(wrap, payUrl);

            this.messages.appendChild(wrap);
            this.scrollToBottom();
            return wrap;
        },

        appendPayLink: function (wrap, payUrl) {
            var link = document.createElement('a');
            link.className = 'ai-chat-message-pay';
            link.href = payUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = 'Go to payment';
            wrap.appendChild(link);
        },

        addThinkingBubble: function () {
            if (!this.messages) return null;
            var wrap = document.createElement('div');
            wrap.className = 'ai-chat-message ai-chat-message-assistant ai-chat-message-thinking';

            var author = document.createElement('div');
            author.className = 'ai-chat-message-author';
            author.textContent = 'AI agent';
            wrap.appendChild(author);

            var body = document.createElement('div');
            body.className = 'ai-chat-message-text';

            var dots = document.createElement('span');
            dots.className = 'ai-agent-typing';
            dots.setAttribute('aria-hidden', 'true');
            dots.innerHTML = '<i></i><i></i><i></i>';
            body.appendChild(dots);

            var label = document.createElement('span');
            label.className = 'ai-agent-thinking-label';
            label.textContent = this.waitMessage(0);
            body.appendChild(label);

            wrap.appendChild(body);
            this.messages.appendChild(wrap);
            this.scrollToBottom();
            return { el: wrap, label: label };
        },

        replaceThinking: function (text, payUrl) {
            var bubble = this.currentBubble;
            if (bubble && bubble.el) {
                bubble.el.className = 'ai-chat-message ai-chat-message-assistant';
                var body = bubble.el.querySelector('.ai-chat-message-text');
                if (body) {
                    body.innerHTML = '';
                    body.textContent = text;
                }
                if (payUrl) this.appendPayLink(bubble.el, payUrl);
                this.scrollToBottom();
            } else {
                this.addMessage('assistant', text, payUrl);
            }
            this.currentBubble = null;
        },

        scrollToBottom: function () {
            var body = this.messages ? this.messages.parentNode : null;
            if (body && typeof body.scrollTop === 'number') body.scrollTop = body.scrollHeight;
        },

        now: function () {
            return (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0;
        }
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { IntegramAiAgentChat.init(); });
        } else {
            IntegramAiAgentChat.init();
        }
    }

    if (typeof window !== 'undefined') window.IntegramAiAgentChat = IntegramAiAgentChat;
    if (typeof module !== 'undefined' && module.exports) module.exports = IntegramAiAgentChat;
})();
