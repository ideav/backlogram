// ============================================================
// Cabinet Page Controller
// ============================================================

class CabinetController {
    constructor() {
        this.userData = null;
        this.databases = [];
        this.currentSection = 'databases';
        this.apiConfig = new ApiConfig();

        this.me = null; // user identifier for save API
        this.originalProfileValues = {}; // tracks original values to detect changes

        // Databases tab state
        this.dbSortField = null; // 'name' | 'count' | 'date'
        this.dbSortDir = 'asc';  // 'asc' | 'desc'
        this.dbSearchQuery = '';

        // Community tab state
        this.communityInvites = [];
        this.communityTab = 'my-invites';
        this.communityArchive = false;
        this.communityRequestsType = 'to-me';
        this.communitySearchQuery = '';

    }

    async init() {
        // Check authentication first
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            window.location.href = '/start';
            return;
        }

        // Setup menu navigation
        this.setupMenuNavigation();

        // Setup sidebar toggle
        this.setupSidebarToggle();

        // Setup form handlers
        this.setupFormHandlers();

        // Setup databases controls (sort, search, create)
        this.setupDatabasesControls();

        // Setup community (cooperation) tabs
        this.setupCommunityTabs();

        // Setup user menu dropdown
        this.setupUserMenuDropdown();

        // Setup logout button
        this.setupLogout();

        // Load user data
        await this.loadUserData();

        // Show section from URL hash, or default to 'databases'
        const { section, subTab, extra } = this.parseUrlHash();
        const validSections = ['databases', 'community', 'profile'];
        const targetSection = (section && validSections.includes(section)) ? section : 'databases';
        this.showSection(targetSection);
        if (subTab) this.showSubTab(targetSection, subTab);
        // Handle deep-link: #community/requests/request/{dbName}
        if (targetSection === 'community' && subTab === 'requests' && extra[0] === 'request' && extra[1]) {
            this.openCreateRequestForm(extra[1]);
        }
    }

    async checkAuth() {
        // Check for any valid idb_* cookie
        const cookies = document.cookie.split(';');
        for (const c of cookies) {
            const trimmed = c.trim();
            if (trimmed.startsWith('idb_')) {
                console.log('[cabinet] Found auth cookie:', trimmed.split('=')[0]);
                return true;
            }
        }
        console.log('[cabinet] No auth cookie found');
        return false;
    }

    setupSidebarToggle() {
        const sidebar = document.getElementById('cabinet-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (!sidebar || !toggleBtn) return;

        // Restore collapsed state from localStorage (desktop only — mobile uses horizontal tab bar)
        const isMobile = () => window.innerWidth <= 900;
        if (!isMobile() && localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
            toggleBtn.title = 'Expand menu';
        }

        toggleBtn.addEventListener('click', () => {
            const isCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
            toggleBtn.title = isCollapsed ? 'Expand menu' : 'Collapse menu';
        });
    }

    setupMenuNavigation() {
        const menuItems = document.querySelectorAll('.cabinet-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.showSection(section);
                this.updateUrlHash(section);

                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Restore section from URL hash on load
        window.addEventListener('hashchange', () => {
            const { section, subTab, extra } = this.parseUrlHash();
            if (section) {
                this.showSection(section);
                if (subTab) this.showSubTab(section, subTab);
                // Handle deep-link: #community/requests/request/{dbName}
                if (section === 'community' && subTab === 'requests' && extra[0] === 'request' && extra[1]) {
                    this.openCreateRequestForm(extra[1]);
                }
            }
        });
    }

    // Parse URL hash into section, optional sub-tab, and optional extra path segments
    // Format: #section or #section/subtab or #section/subtab/action/param
    parseUrlHash() {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return { section: null, subTab: null, extra: [] };
        const parts = hash.split('/');
        return { section: parts[0] || null, subTab: parts[1] || null, extra: parts.slice(2) };
    }

    // Update the URL hash to reflect current section and optional sub-tab
    updateUrlHash(section, subTab) {
        const newHash = subTab ? section + '/' + subTab : section;
        history.replaceState(null, '', '#' + newHash);
    }

    // Activate a sub-tab within a given section without triggering full tab setup
    showSubTab(section, subTab) {
        if (section === 'community') {
            const tabs = document.querySelectorAll('.community-tab');
            const contents = document.querySelectorAll('.community-tab-content');
            tabs.forEach(t => {
                if (t.dataset.communityTab === subTab) t.classList.add('active');
                else t.classList.remove('active');
            });
            contents.forEach(c => c.style.display = 'none');
            const content = document.getElementById('community-tab-' + subTab);
            if (content) content.style.display = '';
            this.communityTab = subTab;
            const inviteBtn = document.getElementById('invite-btn');
            if (inviteBtn) inviteBtn.style.display = subTab === 'my-invites' ? '' : 'none';
            this.renderCommunityData();
        }
    }

    showSection(sectionName) {
        this.currentSection = sectionName;

        // Hide all sections
        const sections = document.querySelectorAll('.cabinet-section');
        sections.forEach(s => s.style.display = 'none');

        // Hide loading state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.style.display = 'none';

        // Show requested section
        const section = document.getElementById('section-' + sectionName);
        if (section) {
            section.style.display = '';
        }

        // Sync active menu item
        const menuItems = document.querySelectorAll('.cabinet-menu-item');
        menuItems.forEach(mi => {
            if (mi.dataset.section === sectionName) {
                mi.classList.add('active');
            } else {
                mi.classList.remove('active');
            }
        });
    }

    async loadUserData() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.style.display = '';

        try {
            // Call the API endpoint: report/313?JSON_KV
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/my/report/313?JSON_KV';

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();
            console.log('[cabinet] User data loaded:', data);

            // Parse the response - it's an array of database records
            if (Array.isArray(data) && data.length > 0) {
                this.userData = data[0]; // First record contains user info
                this.me = this.userData.User || null;
                this.databases = data;
                this.populateUserData();
            } else {
                console.warn('[cabinet] No user data received');
            }
        } catch (err) {
            console.error('[cabinet] Error loading user data:', err);
        } finally {
            if (loadingState) loadingState.style.display = 'none';
            // Show default section after loading
            this.showSection(this.currentSection);
        }
    }

    populateUserData() {
        if (!this.userData) return;

        // Update account info in navbar
        this.updateNavbarAccount();

        // Populate profile section
        this.populateProfile();

        // Populate databases section
        this.populateDatabases();

        // Load community (cooperation) data
        this.loadCommunityData();
    }

    updateNavbarAccount() {
        const emailEl = document.getElementById('account-email');
        const avatarEl = document.getElementById('account-avatar');

        if (emailEl && this.userData.Email) {
            emailEl.textContent = this.userData.Email;
        }

        if (avatarEl && this.userData.Email) {
            avatarEl.textContent = this.userData.Email.charAt(0).toUpperCase();
        }

        // If there's a photo, show it in avatar
        if (avatarEl && this.userData.Photo) {
            avatarEl.innerHTML = '<img src="' + this.userData.Photo + '" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
        }
    }

    populateProfile() {
        // Name
        const nameInput = document.getElementById('profile-name');
        if (nameInput) nameInput.value = this.userData.Name || '';

        // Phone
        const phoneInput = document.getElementById('profile-phone');
        if (phoneInput) phoneInput.value = this.userData.Phone || '';

        // Email (readonly)
        const emailInput = document.getElementById('profile-email');
        if (emailInput) emailInput.value = this.userData.Email || '';

        // About (Notes)
        const aboutInput = document.getElementById('profile-about');
        if (aboutInput) aboutInput.value = this.userData.Notes || '';

        // Public profile checkbox (IsPublic: empty = no, any value = yes)
        const publicCheckbox = document.getElementById('profile-public');
        if (publicCheckbox) {
            publicCheckbox.checked = !!(this.userData.IsPublic);
        }

        // Store original values for change detection
        this.originalProfileValues = {
            'profile-name': this.userData.Name || '',
            'profile-phone': this.userData.Phone || '',
            'profile-about': this.userData.Notes || '',
            'profile-public': !!(this.userData.IsPublic)
        };

        // Hide save button initially
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) saveBtn.style.display = 'none';

        // Set up change detection on editable profile fields
        ['profile-name', 'profile-phone', 'profile-about'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.onProfileChange());
        });

        // Change detection for public profile checkbox
        if (publicCheckbox) {
            publicCheckbox.addEventListener('change', () => this.onProfileChange());
        }

        // Photo preview (Photo field contains a relative path)
        if (this.userData.Photo) {
            const photoPreview = document.getElementById('profile-photo-preview');
            if (photoPreview) {
                photoPreview.innerHTML = '<img src="' + this.userData.Photo + '" alt="Profile photo">';
            }
        }
    }

    populateDatabases() {
        const container = document.getElementById('databases-list');
        if (!container) return;

        container.innerHTML = '';

        // Apply search filter
        const query = this.dbSearchQuery.trim().toLowerCase();
        let dbs = this.databases.filter(db => {
            if (!query) return true;
            const fields = [
                db.DB || '',
                db.Template || '',
                db.Description || '',
                db.Count || '',
                db.Date || '',
                db.RegDate || '',
                db['Plan date'] || '',
                db.PublicName || ''
            ];
            return fields.some(f => f.toLowerCase().includes(query));
        });

        // Apply sort
        if (this.dbSortField) {
            const dir = this.dbSortDir === 'asc' ? 1 : -1;
            dbs = dbs.slice().sort((a, b) => {
                if (this.dbSortField === 'name') {
                    return dir * (a.DB || '').localeCompare(b.DB || '');
                }
                if (this.dbSortField === 'count') {
                    return dir * (parseInt(a.Count || '0', 10) - parseInt(b.Count || '0', 10));
                }
                if (this.dbSortField === 'date') {
                    // Date format: DD.MM.YYYY
                    const parseDate = s => {
                        if (!s) return 0;
                        const p = s.split('.');
                        if (p.length !== 3) return 0;
                        return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
                    };
                    return dir * (parseDate(a.Date) - parseDate(b.Date));
                }
                return 0;
            });
        }

        // Show DB limit warning if needed (free plan: max 3 DBs)
        const planId = parseInt(this.userData && this.userData.PlanID || '0', 10);
        const createForm = document.getElementById('create-db-form');
        const limitWarning = document.getElementById('db-limit-warning');
        const submitBtn = document.getElementById('create-db-submit-btn');
        const nameInput = document.getElementById('new-db-name');
        const templateSelect = document.getElementById('new-db-template');
        const atLimit = this.databases.length >= 3 && planId < 1147;
        if (limitWarning) limitWarning.style.display = atLimit ? '' : 'none';
        if (submitBtn) submitBtn.disabled = atLimit;
        if (nameInput) nameInput.disabled = atLimit;
        if (templateSelect) templateSelect.disabled = atLimit;

        if (dbs.length === 0) {
            container.innerHTML = '<p class="empty-message">No databases yet</p>';
            return;
        }

        dbs.forEach(db => {
            const card = document.createElement('div');
            card.className = 'database-card';

            const templateLabel = db.Template || 'default';
            const description = db.Description || '';
            const recordCount = db.Count || '0';
            const publicName = db.PublicName || '';
            const registrationOpen = !!(db.Register);
            const tokenLifetime = db.TTL || '';
            const dbId = db.DBID;
            const createdDate = db.Date ? this.formatDate(db.Date) : '';

            const dbNameCapitalized = db.DB ? db.DB.charAt(0).toUpperCase() + db.DB.slice(1) : '';

            card.innerHTML = `
                <div class="database-info">
                    <div class="database-name-row">
                        <a class="database-name-link" href="https://${this.apiConfig.host}/${db.DB}" target="${this.escapeHtml(db.DB)}">${this.escapeHtml(dbNameCapitalized)}</a>
                        <span class="database-id-inline">#${this.escapeHtml(dbId)}</span>
                        ${createdDate ? `<span class="database-created-date">Created: ${this.escapeHtml(createdDate)}</span>` : ''}
                    </div>
                    <div class="database-stats">
                        <span class="database-stat"><span>Template:</span> <strong>${this.escapeHtml(templateLabel)}</strong></span>
                        <span class="database-stat"><span>Usage:</span> <strong>${recordCount}</strong></span>
                    </div>
                    <div class="database-edit-fields">
                        <div class="database-field-group">
                            <label class="database-field-label">Description</label>
                            <textarea class="database-field-input database-description-input" rows="2" data-field="t276">${this.escapeHtml(description)}</textarea>
                        </div>
                        <div class="database-field-group">
                            <label class="database-field-label">Public name</label>
                            <input type="text" class="database-field-input database-public-name-input" maxlength="127" pattern="[A-Za-z\\u0410-\\u044F\\u0401\\u04510-9\\s.,!?;:—\\u2026\\u00AB\\u00BB'&quot;\\-]+" data-field="t305" data-dbname="${this.escapeHtml(db.DB)}" value="${this.escapeHtml(publicName)}">
                        </div>
                        <div class="database-field-group database-field-group-row database-inline-row">
                            <label class="database-field-label database-inline-label">
                                <input type="checkbox" class="database-checkbox" data-field="t367"${registrationOpen ? ' checked' : ''}>
                                Registration open
                            </label>
                            <label class="database-field-label database-inline-label">
                                Token lifetime, minutes
                                <input type="number" class="database-field-input database-field-input-short" min="0" step="1" data-field="t369" value="${this.escapeHtml(tokenLifetime)}" autocomplete="off">
                            </label>
                        </div>
                        <div class="database-save-row">
                            <button type="button" class="btn-primary btn-small database-save-btn" style="display:none">Save</button>
                            <span class="database-save-status"></span>
                            <button type="button" class="btn-secondary btn-small database-restore-admin-btn" title="If the administrator was deleted or their role was changed, restore it here">Restore admin</button>
                        </div>
                    </div>
                </div>
            `;

            // Track original values for change detection
            const origValues = {
                t276: description,
                t305: publicName,
                t367: registrationOpen,
                t369: tokenLifetime
            };

            // Set up change detection
            card.querySelectorAll('[data-field]').forEach(input => {
                const eventType = input.type === 'checkbox' ? 'change' : 'input';
                input.addEventListener(eventType, () => {
                    this.onDbFieldChange(card, origValues);
                });
            });

            // Save public name to cookie when edited
            const publicNameInput = card.querySelector('.database-public-name-input');
            if (publicNameInput) {
                publicNameInput.addEventListener('input', () => {
                    const dbName = publicNameInput.dataset.dbname;
                    if (dbName) {
                        document.cookie = 'idbname_' + dbName + '=' + encodeURIComponent(publicNameInput.value) + ';path=/;max-age=31536000';
                    }
                });
            }

            // Set up save button
            const saveBtn = card.querySelector('.database-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveDatabase(dbId, card, origValues));
            }

            // Set up restore admin button
            const restoreAdminBtn = card.querySelector('.database-restore-admin-btn');
            if (restoreAdminBtn) {
                restoreAdminBtn.addEventListener('click', () => this.restoreAdmin(db.DB, restoreAdminBtn));
            }

            container.appendChild(card);
        });
    }

    onDbFieldChange(card, origValues) {
        const saveBtn = card.querySelector('.database-save-btn');
        if (!saveBtn) return;

        const hasChanges = Array.from(card.querySelectorAll('[data-field]')).some(input => {
            const field = input.dataset.field;
            if (input.type === 'checkbox') {
                return input.checked !== origValues[field];
            }
            return input.value !== origValues[field];
        });

        saveBtn.style.display = hasChanges ? '' : 'none';
    }

    async saveDatabase(dbId, card, origValues) {
        const saveBtn = card.querySelector('.database-save-btn');
        const statusEl = card.querySelector('.database-save-status');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/my/_m_set/' + encodeURIComponent(dbId) + '?JSON';

            const fd = new FormData();
            card.querySelectorAll('[data-field]').forEach(input => {
                if (input.type === 'checkbox') {
                    fd.append(input.dataset.field, input.checked ? '1' : '');
                } else {
                    fd.append(input.dataset.field, input.value);
                }
            });
            fd.append('_xsrf', xsrf);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const result = await response.json();
            const serverError = Array.isArray(result) ? (result[0] && result[0].error) : result.error;
            if (serverError) {
                throw new Error(serverError);
            }

            // Update original values after successful save
            card.querySelectorAll('[data-field]').forEach(input => {
                const field = input.dataset.field;
                if (input.type === 'checkbox') {
                    origValues[field] = input.checked;
                } else {
                    origValues[field] = input.value;
                }
            });

            // Save public name to cookie after successful save
            const publicNameInput = card.querySelector('.database-public-name-input');
            if (publicNameInput) {
                const dbName = publicNameInput.dataset.dbname;
                if (dbName) {
                    document.cookie = 'idbname_' + dbName + '=' + encodeURIComponent(publicNameInput.value) + ';path=/;max-age=31536000';
                }
            }

            if (saveBtn) saveBtn.style.display = 'none';
            showToast('Database settings saved', 'success');
        } catch (err) {
            console.error('[cabinet] Error saving database settings:', err);
            showToast('Failed to save database settings: ' + err.message, 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    async restoreAdmin(dbName, btn) {
        if (btn) btn.disabled = true;
        try {
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/' + encodeURIComponent(dbName) + '/restore_admin';

            const fd = new FormData();
            fd.append('_xsrf', xsrf);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();
            if (data && data.result === 'ok') {
                showToast('Administrator restored', 'success');
            } else {
                showToast('Error: ' + JSON.stringify(data), 'error');
            }
        } catch (err) {
            console.error('[cabinet] Error restoring admin:', err);
            showToast('Failed to restore administrator', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    setupFormHandlers() {
        // Save profile button
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        // Photo upload
        const uploadPhotoBtn = document.getElementById('upload-photo-btn');
        const photoInput = document.getElementById('profile-photo');
        if (uploadPhotoBtn && photoInput) {
            uploadPhotoBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

    }

    onProfileChange() {
        const saveBtn = document.getElementById('save-profile-btn');
        if (!saveBtn) return;

        const textChanged = ['profile-name', 'profile-phone', 'profile-about'].some(id => {
            const el = document.getElementById(id);
            return el && el.value !== this.originalProfileValues[id];
        });

        const publicCheckbox = document.getElementById('profile-public');
        const publicChanged = publicCheckbox && (publicCheckbox.checked !== this.originalProfileValues['profile-public']);

        saveBtn.style.display = (textChanged || publicChanged) ? '' : 'none';
    }

    async saveProfile() {
        if (!this.me) {
            console.error('[cabinet] Cannot save profile: user identifier (me) is not set');
            showToast('Failed to save profile', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/my/_m_save/' + this.me + '?JSON';

            const photoInput = document.getElementById('profile-photo');
            const hasPhoto = photoInput && photoInput.files && photoInput.files.length > 0;

            const fd = new FormData();
            fd.append('t33', document.getElementById('profile-name')?.value || '');
            fd.append('t30', document.getElementById('profile-phone')?.value || '');
            fd.append('t39', document.getElementById('profile-about')?.value || '');
            const publicCheckbox = document.getElementById('profile-public');
            fd.append('t307', publicCheckbox && publicCheckbox.checked ? '1' : '');
            if (hasPhoto) {
                fd.append('t38', photoInput.files[0]);
            }
            fd.append('_xsrf', xsrf);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const result = await response.json();
            const serverError = Array.isArray(result) ? (result[0] && result[0].error) : result.error;
            if (serverError) {
                throw new Error(serverError);
            }

            // Update original values after successful save
            this.originalProfileValues['profile-name'] = document.getElementById('profile-name')?.value || '';
            this.originalProfileValues['profile-phone'] = document.getElementById('profile-phone')?.value || '';
            this.originalProfileValues['profile-about'] = document.getElementById('profile-about')?.value || '';
            this.originalProfileValues['profile-public'] = !!(publicCheckbox && publicCheckbox.checked);

            if (saveBtn) saveBtn.style.display = 'none';
            showToast('Profile saved', 'success');
        } catch (err) {
            console.error('[cabinet] Error saving profile:', err);
            showToast('Failed to save profile: ' + err.message, 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoPreview = document.getElementById('profile-photo-preview');
            if (photoPreview) {
                photoPreview.innerHTML = '<img src="' + e.target.result + '" alt="Profile photo">';
            }
        };
        reader.readAsDataURL(file);

        // Show save button since there's a new photo to save
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) saveBtn.style.display = '';
    }

    // ============================================================
    // Community (Cooperation) Section
    // ============================================================

    setupCommunityTabs() {
        // Tab switching
        const tabs = document.querySelectorAll('.community-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.communityTab;
                this.communityTab = tabName;

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const contents = document.querySelectorAll('.community-tab-content');
                contents.forEach(c => c.style.display = 'none');
                const content = document.getElementById('community-tab-' + tabName);
                if (content) content.style.display = '';

                // Show/hide invite button based on active tab
                const inviteBtn = document.getElementById('invite-btn');
                if (inviteBtn) inviteBtn.style.display = tabName === 'my-invites' ? '' : 'none';

                // Hide invite form when switching tabs
                const inviteForm = document.getElementById('invite-form');
                if (inviteForm) inviteForm.style.display = 'none';

                // Hide create request form and button when switching tabs
                const createRequestForm = document.getElementById('create-request-form');
                if (createRequestForm) createRequestForm.style.display = 'none';
                const createRequestBtn = document.getElementById('create-request-btn');
                if (createRequestBtn) createRequestBtn.style.display = 'none';

                this.renderCommunityData();

                // Update URL hash
                this.updateUrlHash('community', tabName);
            });
        });

        // Setup invite button and form
        this.setupInviteForm();

        // Setup create request button and form
        this.setupCreateRequestForm();

        // Active/Archive radio toggle
        document.querySelectorAll('input[name="community-archive"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.communityArchive = radio.value === 'archive';
                this.renderCommunityData();
            });
        });

        // Requests sub-filter (to my DB / my requests)
        document.querySelectorAll('input[name="community-requests-type"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.communityRequestsType = radio.value;
                const createRequestBtn = document.getElementById('create-request-btn');
                if (createRequestBtn) createRequestBtn.style.display = radio.value === 'from-me' ? '' : 'none';
                // Hide form when switching sub-filter
                const createRequestForm = document.getElementById('create-request-form');
                if (createRequestForm) createRequestForm.style.display = 'none';
                this.renderCommunityData();
            });
        });

        // Search input — filter on input
        const communitySearch = document.getElementById('community-search');
        if (communitySearch) {
            communitySearch.addEventListener('input', () => {
                this.communitySearchQuery = communitySearch.value;
                this.renderCommunityData();
            });
        }
    }

    async loadCommunityData() {
        try {
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/my/report/380?JSON_KV';

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();
            console.log('[cabinet] Community data loaded:', data);

            if (Array.isArray(data)) {
                this.communityInvites = data;
            } else {
                this.communityInvites = [];
            }

            this.renderCommunityData();
        } catch (err) {
            console.error('[cabinet] Error loading community data:', err);
            this.communityInvites = [];
            this.renderCommunityData();
        }
    }

    communityItemMatchesSearch(item, query) {
        if (!query) return true;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const fields = [
            item.DB || '',
            item.Name || '',
            item.Description || '',
            item.State || '',
            item.GuestUser || '',
            item.HostUser || ''
        ];
        return fields.some(f => f.toLowerCase().includes(q));
    }

    highlightCommunityText(text, query) {
        if (!query) return this.escapeHtml(text);
        const q = query.trim();
        if (!q) return this.escapeHtml(text);
        const escaped = this.escapeHtml(text);
        const escapedQ = this.escapeHtml(q);
        // Case-insensitive replace
        const regex = new RegExp('(' + escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return escaped.replace(regex, '<mark class="community-search-highlight">$1</mark>');
    }

    renderCommunityData() {
        const currentUid = uid; // from global var set in <script> tag
        const isArchive = this.communityArchive;
        const searchQuery = this.communitySearchQuery || '';
        const isSearching = searchQuery.trim().length > 0;
        const archiveStatuses = ['373', '374'];

        const filterByArchive = (items) => {
            return items.filter(item => {
                const inArchive = archiveStatuses.includes(item.StateID);
                return isArchive ? inArchive : !inArchive;
            });
        };

        const filterBySearch = (items) => {
            if (!isSearching) return items;
            return items.filter(item => this.communityItemMatchesSearch(item, searchQuery));
        };

        if (isSearching) {
            // When searching: show all matching cards across all tabs and statuses
            // Tab 1: My invitations
            const myInvites = filterBySearch(
                this.communityInvites.filter(i => i.HostUserID === currentUid && i.StateID !== '375')
            );
            this.renderCommunityList('community-my-invites-list', myInvites, 'my-invites', searchQuery);

            // Tab 2: Invitations to me
            const invitationsToMe = filterBySearch(
                this.communityInvites.filter(i =>
                    i.HostUserID !== currentUid &&
                    (i.GuestUserID === currentUid || i.GuestUserID === '') &&
                    i.StateID !== '375'
                )
            );
            this.renderCommunityList('community-invitations-list', invitationsToMe, 'invitations', searchQuery);

            // Tab 3: Requests
            const allRequests = this.communityInvites.filter(i => i.StateID === '375');
            const myRequests = filterBySearch(allRequests.filter(i =>
                i.HostUserID === currentUid || i.GuestUserID === currentUid
            ));
            this.renderCommunityList('community-requests-list', myRequests, 'requests', searchQuery);
        } else {
            // Normal mode: respect archive filter and tab filters
            // Tab 1: My invitations (HostUserID === uid), excluding requests (StateID === '375')
            const myInvites = filterByArchive(
                this.communityInvites.filter(i => i.HostUserID === currentUid && i.StateID !== '375')
            );
            this.renderCommunityList('community-my-invites-list', myInvites, 'my-invites', '');

            // Tab 2: Invitations to me (GuestUserID === uid OR GuestUserID is empty), excluding own invitations and requests (StateID === '375')
            const invitationsToMe = filterByArchive(
                this.communityInvites.filter(i =>
                    i.HostUserID !== currentUid &&
                    (i.GuestUserID === currentUid || i.GuestUserID === '') &&
                    i.StateID !== '375'
                )
            );
            this.renderCommunityList('community-invitations-list', invitationsToMe, 'invitations', '');

            // Tab 3: Requests (StateID === "375")
            const allRequests = this.communityInvites.filter(i => i.StateID === '375');
            let requests;
            if (this.communityRequestsType === 'to-me') {
                // Requests to my DB
                requests = filterByArchive(allRequests.filter(i => i.HostUserID === currentUid));
            } else {
                // My requests to other DBs
                requests = filterByArchive(allRequests.filter(i => i.GuestUserID === currentUid));
            }
            this.renderCommunityList('community-requests-list', requests, 'requests', '');
        }
    }

    formatCommunityDate(inviteDate) {
        if (!inviteDate) return '';
        const ts = parseInt(inviteDate, 10);
        if (!isNaN(ts) && ts > 1000000000) {
            const d = new Date(ts * 1000);
            // Date and time without seconds
            return d.toLocaleDateString('en-US') + ' ' +
                d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return inviteDate;
    }

    buildCommunityNameDesc(name, description) {
        // Returns "(name, description)" or "(name)" or "(description)" or "" if both empty
        const parts = [];
        if (name) parts.push(this.escapeHtml(name));
        if (description) parts.push(this.escapeHtml(description));
        return parts.length > 0 ? ' (' + parts.join(', ') + ')' : '';
    }

    renderCommunityList(containerId, items, tabType, searchQuery) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (items.length === 0) {
            const isSearching = searchQuery && searchQuery.trim().length > 0;
            const emptyMsg = isSearching ? 'Nothing found' : (this.communityArchive ? 'Archive is empty' : 'No records');
            container.innerHTML = '<p class="empty-message">' + emptyMsg + '</p>';
            return;
        }

        container.innerHTML = '';
        const isArchive = this.communityArchive;

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'community-card';

            const statusClass = this.getStatusClass(item.StateID);
            const statusLabel = item.State || '';
            const dbName = item.DB || '';
            const publicName = item.Name || '';
            const description = item.Description || '';
            const guestUser = item.GuestUser || '';
            const isPublic = !item.GuestUserID; // public invite if no GuestUserID
            const dateStr = this.formatCommunityDate(item.Invite);
            const nameDesc = this.buildCommunityNameDesc(publicName, description);
            const stateId = item.StateID || '';
            const recordId = item.InviteID || '';

            // DB name is bold; it's a hyperlink if invitation accepted or DB is my own
            const isMyDb = tabType === 'my-invites' ||
                (tabType === 'requests' && this.communityRequestsType === 'to-me');
            const isAccepted = stateId === '372';
            const dbEscaped = this.escapeHtml(dbName);
            const dbHighlighted = this.highlightCommunityText(dbName, searchQuery);
            const dbBold = isMyDb || isAccepted
                ? '<a href="/' + dbEscaped + '" target="' + dbEscaped + '"><strong>' + dbHighlighted + '</strong></a>'
                : '<strong>' + dbHighlighted + '</strong>';

            // Build name/desc with highlight
            const nameDescParts = [];
            if (publicName) nameDescParts.push(this.highlightCommunityText(publicName, searchQuery));
            if (description) nameDescParts.push(this.highlightCommunityText(description, searchQuery));
            const nameDescHighlighted = nameDescParts.length > 0 ? ' (' + nameDescParts.join(', ') + ')' : '';

            const guestUserHighlighted = this.highlightCommunityText(guestUser, searchQuery);

            let titleHtml = '';
            if (tabType === 'my-invites') {
                // Public invite:   "{DB} (name, desc)"
                if (guestUser) {
                    titleHtml = this.escapeHtml(dateStr) + ': Personal invite for ' +
                        '<strong>' + guestUserHighlighted + '</strong>' +
                        ' to ' + dbBold + nameDescHighlighted;
                } else {
                    titleHtml = this.escapeHtml(dateStr) + ': ' + dbBold + nameDescHighlighted;
                }
            } else if (tabType === 'invitations') {
                // Public invite:   "{DB} (name, desc)"
                if (!isPublic) {
                    titleHtml = this.escapeHtml(dateStr) + ': Personal invite to ' +
                        dbBold + nameDescHighlighted;
                } else {
                    titleHtml = this.escapeHtml(dateStr) + ': ' + dbBold + nameDescHighlighted;
                }
            } else if (tabType === 'requests') {
                const requestsType = this.communityRequestsType;
                if (requestsType === 'to-me' || searchQuery) {
                    titleHtml = this.escapeHtml(dateStr) + ': Access for ' +
                        '<strong>' + guestUserHighlighted + '</strong>' +
                        ' to database ' + dbBold + nameDescHighlighted;
                } else {
                    titleHtml = this.escapeHtml(dateStr) + ': Database ' + dbBold + nameDescHighlighted;
                }
            }

            // Build right badges
            let badgesHtml = '';
            if (isPublic) { // && (tabType === 'invitations' || (tabType === 'requests' && this.communityRequestsType === 'from-me'))) {
                badgesHtml += '<span class="community-card-status status-public">public</span>';
            }
            badgesHtml += '<span class="community-card-status ' + statusClass + '">' + this.escapeHtml(statusLabel) + '</span>';

            // Build action buttons
            let actionsHtml = '';
            if (tabType === 'my-invites' && !isArchive) {
                actionsHtml += '<button type="button" class="btn-secondary btn-small community-action-btn" ' +
                    'data-action="revoke" data-id="' + this.escapeHtml(recordId) + '">' +
                    'Revoke</button>';
            } else if (tabType === 'invitations') {
                if (stateId === '371' || stateId === '373') {
                    actionsHtml +=
                        '<button type="button" class="btn-primary btn-small community-action-btn" ' +
                        'data-action="accept" data-id="' + this.escapeHtml(recordId) + '" data-tab-type="invitations">' +
                        'Accept</button>' +
                        '<button type="button" class="btn-danger btn-small community-action-btn" ' +
                        'data-action="reject" data-id="' + this.escapeHtml(recordId) + '" data-tab-type="invitations">' +
                        'Decline</button>';
                }
            } else if (tabType === 'requests') {
                if (this.communityRequestsType === 'to-me') {
                    actionsHtml +=
                        '<button type="button" class="btn-primary btn-small community-action-btn" ' +
                        'data-action="accept" data-id="' + this.escapeHtml(recordId) + '" data-tab-type="requests">' +
                        'Accept</button>' +
                        '<button type="button" class="btn-danger btn-small community-action-btn" ' +
                        'data-action="reject" data-id="' + this.escapeHtml(recordId) + '" data-tab-type="requests">' +
                        'Decline</button>';
                } else {
                    actionsHtml += '<button type="button" class="btn-secondary btn-small community-action-btn" ' +
                        'data-action="revoke-request" data-id="' + this.escapeHtml(recordId) + '">' +
                        'Withdraw request</button>';
                }
            }

            card.innerHTML =
                '<div class="community-card-header">' +
                    '<span class="community-card-title">' + titleHtml + '</span>' +
                    '<div class="community-card-badges">' + badgesHtml + '</div>' +
                '</div>' +
                (actionsHtml ? '<div class="community-card-actions">' + actionsHtml + '</div>' : '');

            // Attach action button listeners
            card.querySelectorAll('.community-action-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const id = btn.dataset.id;
                    this.handleCommunityAction(action, id, item, card);
                });
            });

            container.appendChild(card);
        });
    }

    getStatusClass(stateId) {
        switch (stateId) {
            case '371': return 'status-new';
            case '372': return 'status-accepted';
            case '373': return 'status-rejected';
            case '374': return 'status-revoked';
            case '375': return 'status-request';
            default: return '';
        }
    }

    async handleCommunityAction(action, id, item, card) {
        const btn = card.querySelector('[data-action="' + action + '"]');
        if (btn) btn.disabled = true;

        try {
            const host = this.apiConfig.host;
            let response;

            if (action === 'revoke') {
                // Revoke endpoint: /my/report/236429/?JSON_KV&FR_InviteID=<id>
                const url = 'https://' + host + '/my/report/236429/?JSON_KV&confirmed=1&FR_InviteID=' + encodeURIComponent(id);

                const fd = new FormData();
                fd.append('_xsrf', xsrf);

                response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const data = await response.json();
                console.log('[cabinet] Revoke response:', data);

                if (!Array.isArray(data) || data.length === 0 || !data[0].InviteID) {
                    throw new Error('Unexpected revoke response');
                }
            } else if (action === 'revoke-request') {
                // Revoke request endpoint: /my/report/236536/?JSON_KV&confirmed=1&FR_InviteID=<id>
                const url = 'https://' + host + '/my/report/236536/?JSON_KV&confirmed=1&FR_InviteID=' + encodeURIComponent(id);

                const fd = new FormData();
                fd.append('_xsrf', xsrf);

                response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const data = await response.json();
                console.log('[cabinet] Revoke request response:', data);

                if (!Array.isArray(data) || data.length === 0 || !data[0].InviteID) {
                    throw new Error('Unexpected revoke-request response');
                }
            } else if (action === 'accept') {
                // Invitations use report/inviteAccept; requests use report/inviteRequestAccept (236472)
                const tabType = btn ? btn.dataset.tabType : 'requests';
                const reportId = tabType === 'invitations' ? 'inviteAccept' : 'inviteRequestAccept';
                const url = 'https://' + host + '/my/report/' + reportId + '/?JSON_KV&confirmed=1&FR_InviteID=' + encodeURIComponent(id);

                const fd = new FormData();
                fd.append('_xsrf', xsrf);
                fd.append('cmd', '372');

                response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const acceptData = await response.json();
                const acceptTabType = btn ? btn.dataset.tabType : 'requests';
                if (acceptTabType === 'requests') {
                    // inviteRequestAccept: success = non-empty InviteID
                    if (!Array.isArray(acceptData) || acceptData.length === 0 || !acceptData[0].InviteID) {
                        throw new Error('Operation failed');
                    }
                } else {
                    if (!Array.isArray(acceptData) || acceptData.length === 0 || acceptData[0]['Status'] !== '372') {
                        throw new Error('Operation failed');
                    }
                }
            } else if (action === 'reject') {
                // Invitations use report/inviteAccept; requests use report/inviteRequestAccept (236472)
                const tabType = btn ? btn.dataset.tabType : 'requests';
                const reportId = tabType === 'invitations' ? 'inviteAccept' : 'inviteRequestAccept';
                const url = 'https://' + host + '/my/report/' + reportId + '/?JSON_KV&confirmed=1&FR_InviteID=' + encodeURIComponent(id);

                const fd = new FormData();
                fd.append('_xsrf', xsrf);
                fd.append('cmd', '373');

                response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const rejectData = await response.json();
                if (tabType === 'requests') {
                    // inviteRequestAccept: success = non-empty InviteID
                    if (!Array.isArray(rejectData) || rejectData.length === 0 || !rejectData[0].InviteID) {
                        throw new Error('Operation failed');
                    }
                } else {
                    if (!Array.isArray(rejectData) || rejectData.length === 0 || rejectData[0]['Status'] !== '373') {
                        throw new Error('Operation failed');
                    }
                }
            } else {
                // Action endpoint: /my/_invite_action/?JSON&id=<id>&action=<action>
                const url = 'https://' + host + '/my/_invite_action/?JSON' +
                    '&id=' + encodeURIComponent(id) +
                    '&action=' + encodeURIComponent(action);

                const fd = new FormData();
                fd.append('_xsrf', xsrf);

                response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
            }

            // Reload community data to reflect new state
            await this.loadCommunityData();

            const messages = { revoke: 'Invitation revoked', 'revoke-request': 'Request withdrawn', accept: 'Accepted', reject: 'Declined' };
            showToast(messages[action] || 'Done', 'success');
        } catch (err) {
            console.error('[cabinet] Error performing community action:', err);
            showToast('Action failed', 'error');
            if (btn) btn.disabled = false;
        }
    }

    setupInviteForm() {
        const inviteBtn = document.getElementById('invite-btn');
        const inviteForm = document.getElementById('invite-form');
        const submitBtn = document.getElementById('invite-submit-btn');
        const cancelBtn = document.getElementById('invite-cancel-btn');

        // Show invite button on initial load since my-invites tab is active by default
        if (inviteBtn) inviteBtn.style.display = '';

        if (inviteBtn && inviteForm) {
            inviteBtn.addEventListener('click', () => {
                const isVisible = inviteForm.style.display !== 'none';
                if (!isVisible) {
                    // Populate DB dropdown with user's own databases
                    const dbSelect = document.getElementById('invite-db');
                    if (dbSelect) {
                        dbSelect.innerHTML = '';
                        this.databases.forEach(db => {
                            const opt = document.createElement('option');
                            opt.value = db.DB || '';
                            opt.textContent = db.DB || '';
                            dbSelect.appendChild(opt);
                        });
                    }
                }
                inviteForm.style.display = isVisible ? 'none' : '';
            });
        }

        if (cancelBtn && inviteForm) {
            cancelBtn.addEventListener('click', () => {
                inviteForm.style.display = 'none';
                this.resetInviteForm();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.sendInvite());
        }
    }

    resetInviteForm() {
        const userInput = document.getElementById('invite-user');
        const descrInput = document.getElementById('invite-descr');
        if (userInput) userInput.value = '';
        if (descrInput) descrInput.value = '';
    }

    setupCreateRequestForm() {
        const createRequestBtn = document.getElementById('create-request-btn');
        const createRequestForm = document.getElementById('create-request-form');
        const submitBtn = document.getElementById('request-submit-btn');
        const cancelBtn = document.getElementById('request-cancel-btn');

        if (createRequestBtn && createRequestForm) {
            createRequestBtn.addEventListener('click', () => {
                const isVisible = createRequestForm.style.display !== 'none';
                createRequestForm.style.display = isVisible ? 'none' : '';
                if (!isVisible) {
                    const dbInput = document.getElementById('request-db');
                    if (dbInput) dbInput.focus();
                }
            });
        }

        if (cancelBtn && createRequestForm) {
            cancelBtn.addEventListener('click', () => {
                createRequestForm.style.display = 'none';
                this.resetCreateRequestForm();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.sendRequest());
        }
    }

    resetCreateRequestForm() {
        const dbInput = document.getElementById('request-db');
        const descrInput = document.getElementById('request-descr');
        const errEl = document.getElementById('request-db-error');
        if (dbInput) { dbInput.value = ''; dbInput.classList.remove('input-invalid'); }
        if (descrInput) descrInput.value = '';
        if (errEl) errEl.style.display = 'none';
    }

    async sendRequest() {
        const dbInput = document.getElementById('request-db');
        const descrInput = document.getElementById('request-descr');
        const errEl = document.getElementById('request-db-error');
        const submitBtn = document.getElementById('request-submit-btn');

        const dbName = dbInput ? dbInput.value.trim() : '';
        const descr = descrInput ? descrInput.value.trim() : '';

        if (!dbName) {
            showToast('Enter a database name', 'error');
            return;
        }

        // Check if the entered DB is one of the user's own databases
        const ownDbs = this.databases.map(d => (d.DB || '').toLowerCase());
        if (ownDbs.includes(dbName.toLowerCase())) {
            if (errEl) { errEl.textContent = 'You cannot request access to your own database'; errEl.style.display = ''; }
            if (dbInput) dbInput.classList.add('input-invalid');
            return;
        }

        if (errEl) errEl.style.display = 'none';
        if (dbInput) dbInput.classList.remove('input-invalid');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const host = this.apiConfig.host;
            const url = 'https://' + host + '/my/report/236495/?JSON_KV&confirmed=1&FR_DB=' + encodeURIComponent(dbName);

            const fd = new FormData();
            fd.append('_xsrf', xsrf);
            if (descr) fd.append('descr', descr);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            const text = await response.text();
            console.log('[cabinet] Create request response:', text);

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                console.error('[cabinet] Create request response is not valid JSON:', text);
                if (errEl) { errEl.textContent = 'Database not found or hidden by its owner'; errEl.style.display = ''; }
                if (dbInput) dbInput.classList.add('input-invalid');
                return;
            }

            // Expect 1 row with "Invite" field; empty array = DB not found
            if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].Invite) {
                console.error('[cabinet] Create request: DB not found, response:', parsed);
                if (errEl) { errEl.textContent = 'Database not found or hidden by its owner'; errEl.style.display = ''; }
                if (dbInput) dbInput.classList.add('input-invalid');
                return;
            }

            console.log('[cabinet] Request created:', parsed);
            showToast('Request sent', 'success');

            // Hide form and reset
            const createRequestForm = document.getElementById('create-request-form');
            if (createRequestForm) createRequestForm.style.display = 'none';
            this.resetCreateRequestForm();

            // Switch to "from-me" view and reload data
            this.communityRequestsType = 'from-me';
            const fromMeRadio = document.querySelector('input[name="community-requests-type"][value="from-me"]');
            if (fromMeRadio) fromMeRadio.checked = true;

            await this.loadCommunityData();
        } catch (err) {
            console.error('[cabinet] Error sending request:', err);
            showToast('Failed to send request', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    async sendInvite() {
        const dbSelect = document.getElementById('invite-db');
        const userInput = document.getElementById('invite-user');
        const descrInput = document.getElementById('invite-descr');
        const submitBtn = document.getElementById('invite-submit-btn');

        const db = dbSelect ? dbSelect.value.trim() : '';
        const user = userInput ? userInput.value.trim() : '';
        const descr = descrInput ? descrInput.value.trim() : '';

        if (!db) {
            showToast('Select a database', 'error');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
            const host = this.apiConfig.host;
            const reportId = user ? '385' : '236801';
            const url = 'https://' + host + '/my/report/' + reportId + '?JSON_KV';

            const fd = new FormData();
            fd.append('confirmed', '1');
            fd.append('_xsrf', xsrf);
            fd.append('db', db);
            if (user) fd.append('user', user);
            if (descr) fd.append('descr', descr);

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            const text = await response.text();
            console.log('[cabinet] Invite response:', text);

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                console.error('[cabinet] Invite response is not valid JSON:', text);
                showToast('Error: ' + text, 'error');
                return;
            }

            // Check for error field in response
            if (parsed && parsed.error) {
                console.error('[cabinet] Invite error from server:', parsed.error);
                showToast('Error: ' + parsed.error, 'error');
                return;
            }

            // When a user was specified, verify Invitee is non-empty (empty means user not found)
            if (user) {
                const record = Array.isArray(parsed) ? parsed[0] : parsed;
                if (!record || !record.Invitee) {
                    console.error('[cabinet] Invite error: user not found, response:', parsed);
                    showToast('Error: user not found', 'error');
                    return;
                }
            }

            // Valid JSON response — success
            console.log('[cabinet] Invite created:', parsed);
            showToast('Invitation sent', 'success');

            // Hide form and reset
            const inviteForm = document.getElementById('invite-form');
            if (inviteForm) inviteForm.style.display = 'none';
            this.resetInviteForm();

            // Reload community data to show new invite
            await this.loadCommunityData();
        } catch (err) {
            console.error('[cabinet] Error sending invite:', err);
            showToast('Failed to send invitation', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    // Open create request form pre-filled with dbName (used by deep-link)
    openCreateRequestForm(dbName) {
        // Switch to "from-me" sub-filter
        this.communityRequestsType = 'from-me';
        const fromMeRadio = document.querySelector('input[name="community-requests-type"][value="from-me"]');
        if (fromMeRadio) fromMeRadio.checked = true;

        const createRequestBtn = document.getElementById('create-request-btn');
        if (createRequestBtn) createRequestBtn.style.display = '';

        // Show the form
        const createRequestForm = document.getElementById('create-request-form');
        if (createRequestForm) createRequestForm.style.display = '';

        // Pre-fill the DB name
        const dbInput = document.getElementById('request-db');
        if (dbInput) dbInput.value = dbName;

        this.renderCommunityData();
    }

    setupDatabasesControls() {
        // Create DB button — toggle form
        const createBtn = document.getElementById('create-db-btn');
        const createForm = document.getElementById('create-db-form');
        const cancelBtn = document.getElementById('create-db-cancel-btn');
        const submitBtn = document.getElementById('create-db-submit-btn');
        const nameInput = document.getElementById('new-db-name');

        if (createBtn && createForm) {
            createBtn.addEventListener('click', () => {
                const isVisible = createForm.style.display !== 'none';
                createForm.style.display = isVisible ? 'none' : '';
                if (!isVisible && nameInput) {
                    nameInput.focus();
                }
            });
        }

        if (cancelBtn && createForm) {
            cancelBtn.addEventListener('click', () => {
                createForm.style.display = 'none';
                this.resetCreateDbForm();
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.createDatabase());
        }

        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.createDatabase();
                // Clear error on input
                const errEl = document.getElementById('new-db-name-error');
                if (errEl) { errEl.style.display = 'none'; nameInput.classList.remove('input-invalid'); }
            });
        }

        // Sort button — toggle dropdown
        const sortBtn = document.getElementById('databases-sort-btn');
        const sortDropdown = document.getElementById('databases-sort-dropdown');
        if (sortBtn && sortDropdown) {
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = sortDropdown.style.display !== 'none';
                sortDropdown.style.display = isOpen ? 'none' : '';
            });

            document.addEventListener('click', (e) => {
                if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
                    sortDropdown.style.display = 'none';
                }
            });

            sortDropdown.querySelectorAll('.sort-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    this.dbSortField = opt.dataset.sort;
                    this.dbSortDir = opt.dataset.dir;
                    sortDropdown.style.display = 'none';

                    // Mark active
                    sortDropdown.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');

                    this.populateDatabases();
                });
            });
        }

        // Search input — filter on input
        const searchInput = document.getElementById('databases-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.dbSearchQuery = searchInput.value;
                this.populateDatabases();
            });
        }
    }

    resetCreateDbForm() {
        const nameInput = document.getElementById('new-db-name');
        const errEl = document.getElementById('new-db-name-error');
        const planId = parseInt(this.userData && this.userData.PlanID || '0', 10);
        const atLimit = this.databases.length >= 3 && planId < 1147;
        if (nameInput) { nameInput.value = ''; nameInput.classList.remove('input-invalid'); nameInput.disabled = atLimit; }
        if (errEl) errEl.style.display = 'none';
        const submitBtn = document.getElementById('create-db-submit-btn');
        if (submitBtn) { submitBtn.disabled = atLimit; submitBtn.textContent = 'Create'; }
        const templateSelect = document.getElementById('new-db-template');
        if (templateSelect) templateSelect.disabled = atLimit;
    }

    async createDatabase() {
        const nameInput = document.getElementById('new-db-name');
        const templateSelect = document.getElementById('new-db-template');
        const errEl = document.getElementById('new-db-name-error');
        const submitBtn = document.getElementById('create-db-submit-btn');

        if (!nameInput || !templateSelect) return;

        const dbName = nameInput.value.trim();
        const template = templateSelect.value;

        // Validate name: 3-15 latin chars/digits, starting with a letter
        if (!(/^[a-zA-Z][a-zA-Z0-9]{2,14}$/).test(dbName)) {
            if (errEl) {
                errEl.textContent = '3 to 15 Latin letters and digits, starting with a letter';
                errEl.style.display = '';
            }
            nameInput.classList.add('input-invalid');
            nameInput.focus();
            return;
        }

        if (errEl) errEl.style.display = 'none';
        nameInput.classList.remove('input-invalid');

        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Checking...'; }
        if (nameInput) nameInput.disabled = true;

        try {
            const host = this.apiConfig.host;

            // Step 1: Check if DB name is taken (report/292)
            const checkFd = new FormData();
            checkFd.append('_xsrf', xsrf);
            const checkUrl = 'https://' + host + '/my/report/292?JSON&FR_DB=' + encodeURIComponent(dbName);
            const checkResp = await fetch(checkUrl, {
                method: 'POST',
                credentials: 'include',
                body: checkFd
            });

            if (!checkResp.ok) throw new Error('HTTP ' + checkResp.status);

            const checkData = await checkResp.json();
            // If DB field is '0' — name is free; otherwise — taken
            const dbExists = this.getJsonValue(checkData, 'DB', 0);
            if (dbExists !== '0' && dbExists !== 0 && dbExists !== '') {
                // Name is taken
                if (errEl) {
                    errEl.textContent = 'This name is taken, please choose another';
                    errEl.style.display = '';
                }
                nameInput.classList.add('input-invalid');
                nameInput.disabled = false;
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create'; }
                return;
            }

            // Step 2: Create the database (_new_db/)
            if (submitBtn) submitBtn.textContent = 'Creating...';
            const createFd = new FormData();
            createFd.append('_xsrf', xsrf);
            const createUrl = 'https://' + host + '/my/_new_db/?JSON&db=' + encodeURIComponent(dbName) + '&template=' + encodeURIComponent(template);
            const createResp = await fetch(createUrl, {
                method: 'POST',
                credentials: 'include',
                body: createFd
            });

            if (!createResp.ok) throw new Error('HTTP ' + createResp.status);

            // Success: hide form, reload databases
            const createForm = document.getElementById('create-db-form');
            if (createForm) createForm.style.display = 'none';
            this.resetCreateDbForm();

            showToast('Database created', 'success');

            // Reload user data to refresh the list
            await this.loadUserData();
        } catch (err) {
            console.error('[cabinet] Error creating database:', err);
            showToast('Failed to create database', 'error');
            if (nameInput) nameInput.disabled = false;
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create'; }
        }
    }

    // Helper: get value from JSON_KV-style response
    getJsonValue(json, colName, rowIndex) {
        if (!json || !json.columns || !json.data) return '';
        for (let i = 0; i < json.columns.length; i++) {
            if (json.columns[i].name === colName) {
                return json.data[i][rowIndex] !== undefined ? json.data[i][rowIndex] : '';
            }
        }
        return '';
    }

    setupUserMenuDropdown() {
        const menuToggle = document.getElementById('user-menu-toggle');
        const menuDropdown = document.getElementById('user-menu-dropdown');
        const menuWrapper = menuToggle ? menuToggle.closest('.user-menu-wrapper') : null;

        if (!menuToggle || !menuDropdown) return;

        // Toggle dropdown on click
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menuDropdown.style.display !== 'none';
            menuDropdown.style.display = isOpen ? 'none' : '';
            if (menuWrapper) {
                menuWrapper.classList.toggle('open', !isOpen);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.style.display = 'none';
                if (menuWrapper) {
                    menuWrapper.classList.remove('open');
                }
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                // Use the theme manager from app.js if available
                if (window._app && window._app.theme) {
                    window._app.theme.toggleTheme();
                } else {
                    // Fallback: toggle manually
                    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                }
                this.updateThemeMenuLabels();
            });
        }

        // Initialize labels
        this.updateThemeMenuLabels();
    }

    updateThemeMenuLabels() {
        const themeIcon = document.getElementById('theme-icon');
        const themeValue = document.getElementById('theme-value');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (themeIcon) {
            themeIcon.innerHTML = isDark ? '<i class="pi pi-sun"></i>' : '<i class="pi pi-moon"></i>';
        }
        if (themeValue) {
            themeValue.textContent = isDark ? 'Light' : 'Dark';
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Delete all idb_* cookies
                const cookies = document.cookie.split(';');
                cookies.forEach(c => {
                    const name = c.split('=')[0].trim();
                    if (name.startsWith('idb_')) {
                        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                    }
                });

                // Redirect to index
                window.location.href = '/start';
            });
        }

        const logoutEverywhereBtn = document.getElementById('logout-everywhere-btn');
        if (logoutEverywhereBtn) {
            logoutEverywhereBtn.addEventListener('click', async () => {
                try { await fetch('/my/exit'); } catch (e) {}
                window.location.href = '/my';
            });
        }
    }

    isDatePassed(dateStr) {
        // Input format: DD.MM.YYYY
        if (!dateStr) return false;
        const parts = dateStr.split('.');
        if (parts.length !== 3) return false;
        const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return date < new Date();
    }

    formatDate(dateStr) {
        // Input format: DD.MM.YYYY
        if (!dateStr) return '-';

        const parts = dateStr.split('.');
        if (parts.length !== 3) return dateStr;

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parts[2];

        if (month >= 0 && month < 12) {
            return months[month] + ' ' + day + ', ' + year;
        }

        return dateStr;
    }

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Initialize cabinet when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app.js to initialize first
    setTimeout(() => {
        const cabinet = new CabinetController();
        window._cabinetController = cabinet;
        cabinet.init();
    }, 100);
});
