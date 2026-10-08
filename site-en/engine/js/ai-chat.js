// ============================================================
// Shared AI Chat Controller
// ============================================================

(function() {
    'use strict';

    class IntegramAiChatController {
        constructor() {
            this.aiChatCookieKey = 'integram_ai_chat_settings';
            this.aiChatStorageKey = 'integram_ai_chat_settings';
            this.legacyAiChatStorageKey = 'cabinet_ai_chat_settings';
            this.aiServiceProfiles = this.getDefaultAiServiceProfiles();
            this.aiActiveProviderId = 'gemini';
            this.aiCommandPrompts = this.getAiCommandPrompts();
            this.aiCommandQueue = [];
            this.aiChatConnected = false;
        }

        init() {
            const toggleBtn = document.getElementById('ai-chat-toggle');
            const panel = document.getElementById('ai-chat-panel');
            const backdrop = document.getElementById('ai-chat-backdrop');
            if (!toggleBtn || !panel || !backdrop) return false;

            this.loadAiServiceSettings();
            this.populateAiServiceForm();
            this.populateAiDatabaseSelect();
            this.renderAiCommandQueue();
            this.setupAiChatEvents();

            return true;
        }

        getDefaultAiServiceProfiles() {
            return {
                gemini: {
                    label: 'Google Gemini',
                    endpoint: 'https://aiplatform.googleapis.com/v1/projects/{project_id}/locations/global/endpoints/openapi/chat/completions',
                    defaultProjectNumber: '944712482341',
                    model: 'google/gemini-2.5-flash',
                    tokenMode: 'adc',
                    defaultTokenMode: 'adc',
                    credentialModeLocked: true,
                    token: '',
                    chargeBalance: false
                },
                integram: {
                    label: 'Integram AI',
                    endpoint: '/my/ai/chat',
                    model: 'auto',
                    tokenMode: 'rotating',
                    token: '',
                    chargeBalance: true
                },
                openai: {
                    label: 'ChatGPT / OpenAI',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    model: 'gpt-4.1-mini',
                    tokenMode: 'own',
                    token: '',
                    chargeBalance: false
                },
                deepseek: {
                    label: 'DeepSeek',
                    endpoint: 'https://api.deepseek.com/chat/completions',
                    model: 'deepseek-chat',
                    tokenMode: 'own',
                    token: '',
                    chargeBalance: false
                },
                groq: {
                    label: 'Groq',
                    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
                    model: 'llama-3.3-70b-versatile',
                    tokenMode: 'own',
                    token: '',
                    chargeBalance: false
                },
                mistral: {
                    label: 'Mistral AI',
                    endpoint: 'https://api.mistral.ai/v1/chat/completions',
                    model: 'mistral-large-latest',
                    tokenMode: 'own',
                    token: '',
                    chargeBalance: false
                },
                custom: {
                    label: 'Other API',
                    endpoint: '',
                    model: '',
                    tokenMode: 'own',
                    token: '',
                    chargeBalance: false
                }
            };
        }

        getAiCommandPrompts() {
            return {
                base: [
                    'You are the Integram AI assistant for managing the databases available to the user.',
                    'Work only with databases from the list available to the user.',
                    'Before changing structure, workspaces or files, return a command plan in JSON.',
                    'Do not delete data, tables, columns or files without explicit user confirmation.',
                    'Each command must include the action type, target database, a human-readable description and a list of checks.'
                ].join(' '),
                free_task: [
                    'Analyze the user task and return a JSON plan.',
                    'If the task concerns data structure, workspace layout or templates, propose safe commands with a preliminary check.'
                ].join(' '),
                create_table: [
                    'Command: create a table.',
                    'Clarify the entity name, main fields, field types, required flags, uniqueness and relations.',
                    'Build create_table and add_column commands for the Integram API without running them before confirmation.',
                    'Include a name-conflict check and a list of test records if the user described them.'
                ].join(' '),
                create_structure: [
                    'Command: create a structure.',
                    'Describe the set of related tables, lookups, relations, constraints and the migration order.',
                    'Build the structure commands so they can be run step by step and rolled back before being applied.',
                    'Split the changes into independent blocks and state which existing tables are affected.'
                ].join(' '),
                create_workspace: [
                    'Command: create a workspace.',
                    'Define the required queries, reports, forms, HTML/CSS/JS templates and the publishing folder.',
                    'Build commands to prepare reports and template files without overwriting existing files unless confirmed.',
                    'Specify data sources, filter parameters, access rights and manual checks after publishing.'
                ].join(' ')
            };
        }

        setupAiChatEvents() {
            const toggleBtn = document.getElementById('ai-chat-toggle');
            const panel = document.getElementById('ai-chat-panel');
            const backdrop = document.getElementById('ai-chat-backdrop');
            const closeBtn = document.getElementById('ai-chat-close');
            const providerSelect = document.getElementById('ai-service-provider');
            const tokenModeSelect = document.getElementById('ai-token-mode');
            const saveBtn = document.getElementById('ai-save-settings-btn');
            const connectBtn = document.getElementById('ai-connect-service-btn');
            const sendBtn = document.getElementById('ai-chat-send');
            const input = document.getElementById('ai-chat-input');

            toggleBtn.addEventListener('click', () => this.openAiChat());
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeAiChat());
            backdrop.addEventListener('click', () => this.closeAiChat());

            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && panel.classList.contains('open')) {
                    this.closeAiChat();
                }
            });

            if (providerSelect) {
                providerSelect.addEventListener('change', () => {
                    this.collectAiServiceForm();
                    this.aiActiveProviderId = providerSelect.value;
                    this.aiChatConnected = false;
                    this.populateAiServiceForm();
                });
            }

            if (tokenModeSelect) {
                tokenModeSelect.addEventListener('change', () => this.updateAiTokenInputState());
            }

            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveAiServiceSettings());
            }

            if (connectBtn) {
                connectBtn.addEventListener('click', () => this.connectAiService());
            }

            document.querySelectorAll('[data-ai-command]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.sendAiChatMessage(btn.dataset.aiCommand, btn.textContent.trim());
                });
            });

            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendAiChatMessage());
            }

            if (input) {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        this.sendAiChatMessage();
                    }
                });
            }
        }

        openAiChat() {
            const panel = document.getElementById('ai-chat-panel');
            const backdrop = document.getElementById('ai-chat-backdrop');
            const toggleBtn = document.getElementById('ai-chat-toggle');
            const input = document.getElementById('ai-chat-input');

            if (!panel || !backdrop) return;

            backdrop.hidden = false;
            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            panel.removeAttribute('inert');

            setTimeout(() => {
                if (input) input.focus();
            }, 0);
        }

        closeAiChat() {
            const panel = document.getElementById('ai-chat-panel');
            const backdrop = document.getElementById('ai-chat-backdrop');
            const toggleBtn = document.getElementById('ai-chat-toggle');

            if (!panel || !backdrop) return;

            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
            backdrop.hidden = true;
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            panel.setAttribute('inert', '');
        }

        loadAiServiceSettings() {
            const raw = this.readAiServiceStorage() || this.readAiServiceCookie();
            if (!raw) {
                this.clearAiServiceCookie();
                return;
            }

            try {
                const saved = JSON.parse(raw);
                if (saved && saved.profiles) {
                    Object.keys(saved.profiles).forEach(id => {
                        if (this.aiServiceProfiles[id]) {
                            this.aiServiceProfiles[id] = Object.assign({}, this.aiServiceProfiles[id], saved.profiles[id]);
                        }
                    });
                }
                if (saved && saved.activeProviderId && this.aiServiceProfiles[saved.activeProviderId]) {
                    this.aiActiveProviderId = saved.activeProviderId;
                }
                this.normalizeAiServiceProfiles();
                this.persistAiServiceSettings();
            } catch (err) {
                console.warn('[ai-chat] settings ignored:', err);
                this.clearAiServiceCookie();
            }
        }

        readAiServiceCookie() {
            if (typeof document === 'undefined' || !document.cookie) return '';

            const match = document.cookie.match(new RegExp('(?:^|; )' + this.escapeRegExp(this.aiChatCookieKey) + '=([^;]*)'));
            if (!match) return '';

            try {
                return decodeURIComponent(match[1]);
            } catch (err) {
                return match[1];
            }
        }

        readAiServiceStorage() {
            const storage = this.getAiLocalStorage();
            if (!storage || !storage.getItem) return '';

            return storage.getItem(this.aiChatStorageKey) || storage.getItem(this.legacyAiChatStorageKey) || '';
        }

        writeAiServiceStorage(value) {
            const storage = this.getAiLocalStorage();
            if (!storage || !storage.setItem) throw new Error('localStorage is unavailable');

            storage.setItem(this.aiChatStorageKey, value);
            if (this.legacyAiChatStorageKey !== this.aiChatStorageKey && storage.removeItem) {
                storage.removeItem(this.legacyAiChatStorageKey);
            }
        }

        getAiLocalStorage() {
            if (typeof localStorage !== 'undefined') return localStorage;
            if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
            return null;
        }

        normalizeAiServiceProfiles() {
            Object.keys(this.aiServiceProfiles).forEach(id => {
                const profile = this.aiServiceProfiles[id];
                if (profile.credentialModeLocked) {
                    profile.tokenMode = profile.defaultTokenMode || profile.tokenMode;
                    profile.token = '';
                }
            });
        }

        populateAiServiceForm() {
            const providerSelect = document.getElementById('ai-service-provider');
            const endpointInput = document.getElementById('ai-service-endpoint');
            const modelInput = document.getElementById('ai-service-model');
            const tokenModeSelect = document.getElementById('ai-token-mode');
            const tokenInput = document.getElementById('ai-service-token');
            const chargeCheckbox = document.getElementById('ai-charge-balance');
            const profile = this.getActiveAiProfile();

            if (providerSelect) providerSelect.value = this.aiActiveProviderId;
            if (endpointInput) endpointInput.value = profile.endpoint || '';
            if (modelInput) modelInput.value = profile.model || '';
            if (tokenModeSelect) tokenModeSelect.value = profile.tokenMode || 'own';
            if (tokenInput) tokenInput.value = profile.token || '';
            if (chargeCheckbox) chargeCheckbox.checked = !!profile.chargeBalance;

            this.updateAiTokenInputState();
            this.updateAiStatus(this.aiChatConnected ? 'Connected: ' + profile.label : 'Not connected');
        }

        collectAiServiceForm() {
            const endpointInput = document.getElementById('ai-service-endpoint');
            const modelInput = document.getElementById('ai-service-model');
            const tokenModeSelect = document.getElementById('ai-token-mode');
            const tokenInput = document.getElementById('ai-service-token');
            const chargeCheckbox = document.getElementById('ai-charge-balance');
            const profile = this.getActiveAiProfile();

            profile.endpoint = endpointInput ? endpointInput.value.trim() : profile.endpoint;
            profile.model = modelInput ? modelInput.value.trim() : profile.model;
            if (profile.credentialModeLocked) {
                profile.tokenMode = profile.defaultTokenMode || profile.tokenMode;
                profile.token = '';
            } else {
                profile.tokenMode = tokenModeSelect ? tokenModeSelect.value : profile.tokenMode;
                profile.token = tokenInput ? tokenInput.value.trim() : profile.token;
            }
            profile.chargeBalance = chargeCheckbox ? chargeCheckbox.checked : profile.chargeBalance;

            return profile;
        }

        updateAiTokenInputState() {
            const tokenModeSelect = document.getElementById('ai-token-mode');
            const tokenInput = document.getElementById('ai-service-token');
            const chargeCheckbox = document.getElementById('ai-charge-balance');
            const profile = this.getActiveAiProfile();
            if (!tokenModeSelect || !tokenInput) return;

            const useRotatingTokens = tokenModeSelect.value === 'rotating';
            const useApplicationDefaultCredentials = tokenModeSelect.value === 'adc';
            tokenModeSelect.disabled = !!profile.credentialModeLocked;
            tokenInput.disabled = useRotatingTokens || useApplicationDefaultCredentials;
            tokenInput.placeholder = useApplicationDefaultCredentials
                ? 'Application Default Credentials'
                : (useRotatingTokens ? 'Token rotation' : 'Enter API token');
            if (useRotatingTokens || useApplicationDefaultCredentials) tokenInput.value = '';
            if (chargeCheckbox && useRotatingTokens) chargeCheckbox.checked = true;
        }

        saveAiServiceSettings() {
            this.collectAiServiceForm();
            try {
                this.persistAiServiceSettings();
                const stateEl = document.getElementById('ai-settings-state');
                if (stateEl) stateEl.textContent = 'Settings saved to localStorage';
                this.notify('AI service settings saved', 'success');
            } catch (err) {
                console.error('[ai-chat] settings save failed:', err);
                this.notify('Could not save AI service settings', 'error');
            }
        }

        persistAiServiceSettings() {
            this.writeAiServiceStorage(this.serializeAiServiceSettings());
            this.clearAiServiceCookie();
        }

        serializeAiServiceSettings() {
            return JSON.stringify(this.getAiServiceSettingsSnapshot());
        }

        getAiServiceSettingsSnapshot() {
            this.normalizeAiServiceProfiles();
            return {
                activeProviderId: this.aiActiveProviderId,
                profiles: this.aiServiceProfiles
            };
        }

        clearAiServiceCookie() {
            if (typeof document === 'undefined') return;

            document.cookie = this.aiChatCookieKey + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';
        }

        connectAiService() {
            const profile = this.collectAiServiceForm();
            if (profile.tokenMode === 'own' && !profile.token) {
                this.notify('Enter API token', 'error');
                return;
            }

            this.aiChatConnected = true;
            this.updateAiStatus('Connected: ' + profile.label);
            const stateEl = document.getElementById('ai-settings-state');
            if (stateEl) stateEl.textContent = 'Connection ready';
            const credentialText = profile.tokenMode === 'adc'
                ? ' via Application Default Credentials'
                : '';
            this.addAiChatMessage('assistant', 'Connection' + credentialText + ' is ready. Requests will be sent through the server endpoint.');
        }

        getActiveAiProfile() {
            return this.aiServiceProfiles[this.aiActiveProviderId] || this.aiServiceProfiles.custom;
        }

        updateAiStatus(text) {
            const statusEl = document.getElementById('ai-chat-status');
            if (statusEl) statusEl.textContent = text;
        }

        populateAiDatabaseSelect() {
            const select = document.getElementById('ai-target-db');
            if (!select) return;

            const current = select.value;
            const dbNames = this.getAccessibleAiDbs();
            select.innerHTML = dbNames.map(dbName => {
                return '<option value="' + this.escapeHtml(dbName) + '">' + this.escapeHtml(this.getAiDbLabel(dbName)) + '</option>';
            }).join('');

            if (current && dbNames.includes(current)) {
                select.value = current;
            } else if (dbNames.length > 0) {
                select.value = dbNames[0];
            }
        }

        getAccessibleAiDbs() {
            const dbNames = new Set();
            const currentDb = this.getCurrentDbName();
            if (currentDb) dbNames.add(currentDb);

            this.getCookieDbNames().forEach(dbName => {
                if (dbName) dbNames.add(dbName);
            });

            if (dbNames.size === 0) dbNames.add('my');

            return Array.from(dbNames).sort((a, b) => {
                if (currentDb && a === currentDb) return -1;
                if (currentDb && b === currentDb) return 1;
                if (a === 'my') return -1;
                if (b === 'my') return 1;
                return a.localeCompare(b);
            });
        }

        getCookieDbNames() {
            if (typeof CookieUtil !== 'undefined' && CookieUtil.getAllIdb) {
                return CookieUtil.getAllIdb();
            }

            return document.cookie.split(';').map(cookie => cookie.trim()).reduce((items, cookie) => {
                if (cookie.indexOf('idb_') === 0) {
                    const name = cookie.split('=')[0].slice(4);
                    if (name) items.push(name);
                }
                return items;
            }, []);
        }

        getCurrentDbName() {
            if (typeof db !== 'undefined' && db) return String(db);

            const parts = window.location.pathname.split('/').filter(Boolean);
            return parts.length > 0 ? parts[0] : '';
        }

        getAiDbLabel(dbName) {
            const currentDb = this.getCurrentDbName();
            if (dbName === 'my') return 'My account (my)';
            if (currentDb && dbName === currentDb) return dbName + ' (current)';
            return dbName;
        }

        getSelectedAiDb() {
            const select = document.getElementById('ai-target-db');
            return select && select.value ? select.value : (this.getCurrentDbName() || 'my');
        }

        getAiChatServerUrl() {
            const dbName = this.getCurrentDbName() || this.getSelectedAiDb() || 'my';
            return '/' + encodeURIComponent(dbName) + '/ai/chat?JSON=1';
        }

        async sendAiChatMessage(commandType, presetText) {
            const input = document.getElementById('ai-chat-input');
            const text = (presetText || (input ? input.value : '')).trim();
            if (!text) return;

            this.collectAiServiceForm();
            this.addAiChatMessage('user', text);
            if (input && !presetText) input.value = '';

            const inferredCommand = commandType || this.inferAiCommandType(text);
            const payload = this.buildAiRequestPayload(text, inferredCommand);
            const command = this.createAiCommandFromPayload(payload);
            command.status = 'Sending';
            this.aiCommandQueue.unshift(command);
            this.renderAiCommandQueue();

            try {
                this.persistAiServiceSettings();
                const result = await this.callAiChatServer(payload);
                this.applyAiServerResponse(command, result);
            } catch (err) {
                console.error('[ai-chat] server request failed:', err);
                command.status = 'Error';
                command.error = err && err.message ? err.message : 'Unknown error';
                this.renderAiCommandQueue();
                this.addAiChatMessage('assistant', 'Could not get a server response: ' + command.error);
                this.notify('The AI server returned an error', 'error');
            }
        }

        inferAiCommandType(text) {
            const lower = text.toLowerCase();
            if (lower.includes('table')) return 'create_table';
            if (lower.includes('structur')) return 'create_structure';
            if (lower.includes('workspace') || lower.includes('template')) return 'create_workspace';
            return 'free_task';
        }

        buildAiRequestPayload(message, commandType) {
            const profile = this.getActiveAiProfile();
            const selectedDb = this.getSelectedAiDb();

            return {
                provider: {
                    id: this.aiActiveProviderId,
                    label: profile.label,
                    endpoint: profile.endpoint,
                    model: profile.model,
                    tokenMode: profile.tokenMode,
                    hasUserToken: !!profile.token,
                    credentialSource: this.getAiCredentialSource(profile),
                    applicationDefaultCredentials: profile.tokenMode === 'adc',
                    tokenRotation: profile.tokenMode === 'rotating' ? 'integram_service_tokens' : null,
                    chargeBalance: !!profile.chargeBalance
                },
                context: {
                    targetDb: selectedDb,
                    currentDb: this.getCurrentDbName(),
                    currentAction: typeof action !== 'undefined' ? action : '',
                    accessibleDbs: this.getAccessibleAiDbs(),
                    menu: this.getMenuContext(),
                    userId: typeof uid !== 'undefined' ? uid : ''
                },
                commandType: commandType,
                prompts: {
                    system: this.aiCommandPrompts.base,
                    command: this.aiCommandPrompts[commandType] || this.aiCommandPrompts.free_task
                },
                messages: [
                    { role: 'user', content: message }
                ]
            };
        }

        getAiCredentialSource(profile) {
            if (profile.tokenMode === 'adc') return 'application_default_credentials';
            if (profile.tokenMode === 'rotating') return 'integram_service_tokens';
            if (profile.token) return 'user_api_token';
            return 'not_configured';
        }

        getMenuContext() {
            if (typeof menuData === 'undefined' || !Array.isArray(menuData)) return [];

            return menuData.map(item => {
                return {
                    id: item.menu_id || '',
                    parentId: item.menu_up || '',
                    name: item.name || '',
                    href: item.href || ''
                };
            }).filter(item => item.name || item.href);
        }

        createAiCommandFromPayload(payload) {
            const commandType = payload.commandType || 'free_task';
            const title = this.getAiCommandLabel(commandType);

            return {
                id: 'ai-cmd-' + Date.now() + '-' + Math.random().toString(16).slice(2),
                type: commandType,
                title: title,
                targetDb: payload.context.targetDb,
                provider: payload.provider.label,
                status: 'Prepared',
                payload: payload
            };
        }

        async callAiChatServer(payload) {
            const fetchFn = typeof fetch === 'function'
                ? fetch
                : (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : null);
            if (!fetchFn) {
                throw new Error('Fetch API is unavailable');
            }

            const response = await fetchFn(this.getAiChatServerUrl(), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify({
                    _xsrf: this.getXsrfToken(),
                    payload: payload,
                    settings: this.getAiServiceSettingsSnapshot()
                })
            });

            let data = null;
            try {
                data = await response.json();
            } catch (err) {
                data = null;
            }

            if (!response.ok || this.getAiServerError(data)) {
                throw new Error(this.getAiServerError(data) || ('HTTP ' + response.status));
            }

            return data || {};
        }

        applyAiServerResponse(command, response) {
            command.serverResponse = response;
            if (response && response.command) {
                command.title = response.command.title || command.title;
                command.status = response.command.status || 'Response received';
            } else {
                command.status = 'Response received';
            }
            if (response && response.provider) {
                command.provider = response.provider.label || response.provider.id || command.provider;
            }
            this.renderAiCommandQueue();

            const content = response && response.assistant && response.assistant.content
                ? response.assistant.content
                : 'Server response received. The command was updated in the queue.';
            this.addAiChatMessage('assistant', content);
        }

        getAiServerError(data) {
            if (!data) return '';
            if (typeof data.error === 'string') return data.error;
            if (Array.isArray(data) && data[0] && data[0].error) return data[0].error;
            if (Array.isArray(data.error) && data.error[0] && data.error[0].message) return data.error[0].message;
            if (data.error && data.error.message) return data.error.message;
            return '';
        }

        getXsrfToken() {
            if (typeof xsrf !== 'undefined' && xsrf) return String(xsrf);
            if (typeof window !== 'undefined' && window.xsrf) return String(window.xsrf);
            const meta = document.querySelector ? document.querySelector('meta[name="_xsrf"]') : null;
            return meta ? meta.getAttribute('content') : '';
        }

        getAiCommandLabel(commandType) {
            const labels = {
                create_table: 'Create table',
                create_structure: 'Create structure',
                create_workspace: 'Create workspace',
                free_task: 'AI task'
            };
            return labels[commandType] || labels.free_task;
        }

        addAiChatMessage(role, text) {
            const messages = document.getElementById('ai-chat-messages');
            if (!messages) return;

            const el = document.createElement('div');
            el.className = 'ai-chat-message ' + (role === 'user' ? 'ai-chat-message-user' : 'ai-chat-message-assistant');
            el.innerHTML = [
                '<div class="ai-chat-message-author">' + (role === 'user' ? 'You' : 'Integram AI') + '</div>',
                '<div class="ai-chat-message-text">' + this.escapeHtml(text) + '</div>'
            ].join('');
            messages.appendChild(el);
            messages.scrollTop = messages.scrollHeight;
        }

        renderAiCommandQueue() {
            const queue = document.getElementById('ai-command-queue');
            if (!queue) return;

            if (this.aiCommandQueue.length === 0) {
                queue.innerHTML = '<div class="ai-command-empty">No commands yet</div>';
                return;
            }

            queue.innerHTML = this.aiCommandQueue.map(command => {
                return [
                    '<div class="ai-command-card" data-ai-command-id="' + this.escapeHtml(command.id) + '">',
                    '  <div class="ai-command-card-header">',
                    '    <div class="ai-command-title">' + this.escapeHtml(command.title) + '</div>',
                    '    <span class="ai-command-status">' + this.escapeHtml(command.status) + '</span>',
                    '  </div>',
                    '  <div class="ai-command-meta">Database: ' + this.escapeHtml(command.targetDb) + ' · Service: ' + this.escapeHtml(command.provider) + '</div>',
                    '  <div class="ai-command-meta">Prompt: ' + this.escapeHtml(command.payload.prompts.command) + '</div>',
                    '  <div class="ai-command-actions">',
                    '    <button type="button" class="btn-secondary btn-small" data-ai-command-copy="' + this.escapeHtml(command.id) + '"><i class="pi pi-copy"></i><span>JSON</span></button>',
                    '    <button type="button" class="btn-primary btn-small" data-ai-command-run="' + this.escapeHtml(command.id) + '"><i class="pi pi-play"></i><span>Run</span></button>',
                    '  </div>',
                    '</div>'
                ].join('');
            }).join('');

            queue.querySelectorAll('[data-ai-command-copy]').forEach(btn => {
                btn.addEventListener('click', () => this.copyAiCommandPayload(btn.dataset.aiCommandCopy));
            });
            queue.querySelectorAll('[data-ai-command-run]').forEach(btn => {
                btn.addEventListener('click', () => this.runAiCommandStub(btn.dataset.aiCommandRun));
            });
        }

        copyAiCommandPayload(commandId) {
            const command = this.aiCommandQueue.find(item => item.id === commandId);
            if (!command) return;

            const payload = JSON.stringify(command.payload, null, 2);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(payload).then(() => {
                    this.notify('Command JSON copied', 'success');
                }).catch(err => {
                    console.error('[ai-chat] command copy failed:', err);
                    this.notify('Could not copy JSON', 'error');
                });
            } else if (this.copyTextFallback(payload)) {
                this.notify('Command JSON copied', 'success');
            } else {
                this.notify('Clipboard is unavailable', 'error');
            }
        }

        copyTextFallback(text) {
            const field = document.createElement('textarea');
            field.value = text;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed';
            field.style.left = '-9999px';
            document.body.appendChild(field);
            field.select();

            let copied = false;
            try {
                copied = document.execCommand('copy');
            } catch (err) {
                copied = false;
            }

            field.remove();
            return copied;
        }

        runAiCommandStub(commandId) {
            const command = this.aiCommandQueue.find(item => item.id === commandId);
            if (!command) return;

            command.status = 'Stub';
            this.renderAiCommandQueue();
            this.notify('The command is ready to run. The server handler will be added later.', 'info');
        }

        notify(message, type) {
            if (typeof showToast === 'function') {
                showToast(message, type);
            } else {
                console.log('[ai-chat]', type || 'info', message);
            }
        }

        escapeHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        escapeRegExp(value) {
            return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }

    window.IntegramAiChatController = IntegramAiChatController;

    document.addEventListener('DOMContentLoaded', () => {
        const aiChatController = new IntegramAiChatController();
        if (aiChatController.init()) {
            window._aiChatController = aiChatController;
        }
    });
})();
