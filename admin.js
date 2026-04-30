// =============================================
// AgendeFácil - Admin Panel Logic
// =============================================

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// =============================================
// Current Admin User
// =============================================
function getCurrentAdmin() {
    try { return JSON.parse(localStorage.getItem('agendafacil_currentUser') || 'null'); }
    catch (e) { return null; }
}

// =============================================
// Settings (per admin)
// =============================================
function getSettings() {
    const admin = getCurrentAdmin();
    const defaults = {
        workDays: { 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false },
        startHour: 7, endHour: 23, blockedDates: []
    };
    try {
        const all = JSON.parse(localStorage.getItem('agendafacil_allSettings') || '{}');
        if (all[admin.id]) return all[admin.id];
        // Legacy fallback
        const old = localStorage.getItem('adminSettings');
        if (old) return JSON.parse(old);
    } catch (e) {}
    return defaults;
}

function saveSettings(settings) {
    const admin = getCurrentAdmin();
    try {
        const all = JSON.parse(localStorage.getItem('agendafacil_allSettings') || '{}');
        all[admin.id] = settings;
        localStorage.setItem('agendafacil_allSettings', JSON.stringify(all));
    } catch (e) {}
    // Also save legacy
    localStorage.setItem('adminSettings', JSON.stringify(settings));
}

// =============================================
// Business Profile
// =============================================
function getBusinesses() {
    try { return JSON.parse(localStorage.getItem('agendafacil_businesses') || '[]'); }
    catch (e) { return []; }
}

function saveBusinesses(list) {
    localStorage.setItem('agendafacil_businesses', JSON.stringify(list));
}

function getMyBusiness() {
    const admin = getCurrentAdmin();
    const list = getBusinesses();
    return list.find(b => b.adminId === admin.id) || null;
}

function saveMyBusiness(data) {
    const admin = getCurrentAdmin();
    let list = getBusinesses();
    const idx = list.findIndex(b => b.adminId === admin.id);
    const biz = {
        adminId: admin.id,
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '',
        address: data.address || '',
        services: data.services || []
    };
    if (idx !== -1) list[idx] = biz;
    else list.push(biz);
    saveBusinesses(list);
    return biz;
}

// =============================================
// Bookings
// =============================================
function getBookings() {
    try { return JSON.parse(localStorage.getItem('bookings') || '[]'); }
    catch (e) { return []; }
}

function saveBookings(bookings) {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// =============================================
// Tab Navigation
// =============================================
function setupTabs() {
    document.querySelectorAll('.side-nav a[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            document.querySelectorAll('.side-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById('tab-' + tabId).classList.add('active');
            if (window.lucide) lucide.createIcons();
        });
    });
}

// =============================================
// Dashboard
// =============================================
function renderStats() {
    const admin = getCurrentAdmin();
    const bookings = getBookings().filter(b => b.businessId === admin.id);
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('stat-today').textContent = String(bookings.filter(b => b.date === today && b.status !== 'cancelled').length).padStart(2, '0');
    document.getElementById('stat-pending').textContent = String(bookings.filter(b => b.status === 'pending').length).padStart(2, '0');
    document.getElementById('stat-total').textContent = String(bookings.length).padStart(2, '0');
}

// =============================================
// Appointments Table
// =============================================
function renderTable(targetId, filterStatus) {
    const admin = getCurrentAdmin();
    const tbody = document.getElementById(targetId);
    let bookings = getBookings().filter(b => b.businessId === admin.id);

    bookings.sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));

    if (filterStatus && filterStatus !== 'all') {
        bookings = bookings.filter(b => b.status === filterStatus);
    }

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum agendamento.</td></tr>';
        return;
    }

    const labels = { pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado' };
    tbody.innerHTML = '';

    bookings.forEach(a => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><div class="client-cell"><span class="client-name">${esc(a.clientName)}</span><span class="client-meta">${esc(a.clientPhone || a.clientEmail || '')}</span></div></td>
            <td><div class="client-cell"><span class="client-name">${formatBR(a.date)}</span><span class="client-meta">${a.time}</span></div></td>
            <td>${esc(a.service || '')}</td>
            <td><span class="status-badge status-${a.status}">${labels[a.status] || a.status}</span></td>
            <td><div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                ${a.status === 'pending' ? `<button class="btn-success" onclick="confirmAppo(${a.id})">Confirmar</button>` : ''}
                ${a.status !== 'cancelled' ? `<button class="btn-danger" onclick="cancelAppo(${a.id})">Cancelar</button>` : ''}
            </div></td>
        `;
        tbody.appendChild(row);
    });
    if (window.lucide) lucide.createIcons();
}

function refreshTables() {
    const f = document.getElementById('filter-status').value;
    renderTable('dashboard-table-body', 'all');
    renderTable('appointments-table-body', f);
    renderStats();
}

window.confirmAppo = function(id) {
    const b = getBookings(); const a = b.find(x => x.id === id);
    if (a) { a.status = 'confirmed'; saveBookings(b); refreshTables(); toast('Agendamento confirmado!'); }
};
window.cancelAppo = function(id) {
    const b = getBookings(); const a = b.find(x => x.id === id);
    if (a) { a.status = 'cancelled'; saveBookings(b); refreshTables(); toast('Agendamento cancelado.'); }
};

// =============================================
// Business Profile Tab
// =============================================
function loadBusinessProfile() {
    const biz = getMyBusiness();
    if (biz) {
        document.getElementById('biz-name').value = biz.name || '';
        document.getElementById('biz-description').value = biz.description || '';
        document.getElementById('biz-phone').value = biz.phone || '';
        document.getElementById('biz-address').value = biz.address || '';
    }
}

function setupBusinessProfile() {
    document.getElementById('save-business-btn').addEventListener('click', () => {
        const biz = getMyBusiness() || {};
        biz.name = document.getElementById('biz-name').value.trim();
        biz.description = document.getElementById('biz-description').value.trim();
        biz.phone = document.getElementById('biz-phone').value.trim();
        biz.address = document.getElementById('biz-address').value.trim();

        saveMyBusiness(biz);
        toast('Informações da empresa salvas!');
    });
}

// =============================================
// Services Tab
// =============================================
let svcImageData = '';

function renderServices() {
    const biz = getMyBusiness();
    const container = document.getElementById('admin-services-container');
    const services = biz ? (biz.services || []) : [];

    if (services.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum serviço cadastrado. Clique em "Novo Serviço" para começar.</div>';
        return;
    }

    container.innerHTML = '';
    services.forEach(svc => {
        const item = document.createElement('div');
        item.classList.add('admin-service-item');

        const imgHtml = svc.image
            ? `<img src="${svc.image}" alt="${esc(svc.name)}">`
            : `<div class="placeholder-img"><i data-lucide="image" style="width:24px;height:24px;opacity:0.3;"></i></div>`;

        item.innerHTML = `
            ${imgHtml}
            <div class="admin-service-info">
                <h4>${esc(svc.name)}</h4>
                <p>R$ ${Number(svc.price || 0).toFixed(2)} — ${svc.duration || 60} min</p>
            </div>
            <div class="admin-service-actions">
                <button class="btn-secondary" onclick="editService(${svc.id})" style="padding:0.4rem 0.8rem;font-size:0.8rem;">Editar</button>
                <button class="btn-danger" onclick="deleteService(${svc.id})" style="font-size:0.8rem;">Excluir</button>
            </div>
        `;
        container.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

window.openServiceModal = function(editId) {
    document.getElementById('service-modal-title').textContent = editId ? 'Editar Serviço' : 'Novo Serviço';
    document.getElementById('svc-edit-id').value = editId || '';
    document.getElementById('svc-name').value = '';
    document.getElementById('svc-description').value = '';
    document.getElementById('svc-price').value = '';
    document.getElementById('svc-duration').value = '60';
    document.getElementById('svc-img-preview').style.display = 'none';
    document.getElementById('svc-upload-text').style.display = 'block';
    svcImageData = '';

    if (editId) {
        const biz = getMyBusiness();
        const svc = (biz.services || []).find(s => s.id === editId);
        if (svc) {
            document.getElementById('svc-name').value = svc.name;
            document.getElementById('svc-description').value = svc.description || '';
            document.getElementById('svc-price').value = svc.price;
            document.getElementById('svc-duration').value = svc.duration || 60;
            if (svc.image) {
                document.getElementById('svc-img-preview').src = svc.image;
                document.getElementById('svc-img-preview').style.display = 'block';
                document.getElementById('svc-upload-text').style.display = 'none';
                svcImageData = svc.image;
            }
        }
    }

    document.getElementById('service-modal').classList.add('active');
    if (window.lucide) lucide.createIcons();
};

window.editService = function(id) { openServiceModal(id); };

window.deleteService = function(id) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    const biz = getMyBusiness();
    biz.services = (biz.services || []).filter(s => s.id !== id);
    saveMyBusiness(biz);
    renderServices();
    toast('Serviço excluído.');
};

function setupServiceForm() {
    // Image upload
    document.getElementById('svc-file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            svcImageData = ev.target.result;
            document.getElementById('svc-img-preview').src = svcImageData;
            document.getElementById('svc-img-preview').style.display = 'block';
            document.getElementById('svc-upload-text').style.display = 'none';
        };
        reader.readAsDataURL(file);
    });

    // Form submit
    document.getElementById('service-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const editId = document.getElementById('svc-edit-id').value;
        const name = document.getElementById('svc-name').value.trim();
        const desc = document.getElementById('svc-description').value.trim();
        const price = parseFloat(document.getElementById('svc-price').value);
        const duration = parseInt(document.getElementById('svc-duration').value);

        if (!name || isNaN(price)) return;

        let biz = getMyBusiness();
        if (!biz) {
            // Auto-create business if not exists
            biz = saveMyBusiness({ name: 'Minha Empresa', services: [] });
        }

        if (!biz.services) biz.services = [];

        if (editId) {
            const svc = biz.services.find(s => s.id === parseInt(editId));
            if (svc) {
                svc.name = name;
                svc.description = desc;
                svc.price = price;
                svc.duration = duration;
                if (svcImageData) svc.image = svcImageData;
            }
        } else {
            biz.services.push({
                id: Date.now(),
                name, description: desc, price, duration,
                image: svcImageData || ''
            });
        }

        saveMyBusiness(biz);
        document.getElementById('service-modal').classList.remove('active');
        renderServices();
        toast(editId ? 'Serviço atualizado!' : 'Serviço criado!');
    });
}

// =============================================
// Settings: Work Days
// =============================================
function renderDayToggles() {
    const settings = getSettings();
    const container = document.getElementById('day-toggles');
    container.innerHTML = '';
    DAY_NAMES.forEach((name, i) => {
        const li = document.createElement('li');
        li.classList.add('day-toggle-item');
        li.innerHTML = `<span>${name}</span><label class="toggle-switch"><input type="checkbox" data-day="${i}" ${settings.workDays[i] !== false ? 'checked' : ''}><span class="toggle-slider"></span></label>`;
        container.appendChild(li);
    });
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const day = parseInt(e.target.getAttribute('data-day'));
            const s = getSettings();
            s.workDays[day] = e.target.checked;
            saveSettings(s);
            toast(`${DAY_NAMES[day]} ${e.target.checked ? 'ativado' : 'desativado'}!`);
        });
    });
}

function renderHourSelectors() {
    const settings = getSettings();
    const startSel = document.getElementById('start-hour');
    const endSel = document.getElementById('end-hour');
    startSel.innerHTML = ''; endSel.innerHTML = '';
    for (let h = 0; h <= 23; h++) {
        const lbl = String(h).padStart(2, '0') + ':00';
        startSel.innerHTML += `<option value="${h}" ${h === settings.startHour ? 'selected' : ''}>${lbl}</option>`;
        endSel.innerHTML += `<option value="${h}" ${h === settings.endHour ? 'selected' : ''}>${lbl}</option>`;
    }
    document.getElementById('save-hours-btn').addEventListener('click', () => {
        const s = getSettings();
        const st = parseInt(startSel.value), en = parseInt(endSel.value);
        if (st >= en) { toast('O início deve ser antes do fim!'); return; }
        s.startHour = st; s.endHour = en;
        saveSettings(s);
        toast(`Horário: ${String(st).padStart(2,'0')}:00 às ${String(en).padStart(2,'0')}:00`);
    });
}

function renderBlockedDates() {
    const settings = getSettings();
    const container = document.getElementById('blocked-dates-list');
    if (!settings.blockedDates || settings.blockedDates.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma data bloqueada.</p>';
        return;
    }
    container.innerHTML = '';
    [...settings.blockedDates].sort().forEach(d => {
        const div = document.createElement('div');
        div.classList.add('blocked-date-item');
        div.innerHTML = `<span>${formatBR(d)}</span><button class="btn-danger" onclick="removeBlocked('${d}')">Remover</button>`;
        container.appendChild(div);
    });
}

function setupBlockedDates() {
    document.getElementById('add-blocked-date').addEventListener('click', () => {
        const input = document.getElementById('block-date-input');
        const d = input.value;
        if (!d) { toast('Selecione uma data.'); return; }
        const s = getSettings();
        if (!s.blockedDates) s.blockedDates = [];
        if (s.blockedDates.includes(d)) { toast('Data já bloqueada.'); return; }
        s.blockedDates.push(d);
        saveSettings(s);
        input.value = '';
        renderBlockedDates();
        toast(`Data ${formatBR(d)} bloqueada!`);
    });
}

window.removeBlocked = function(d) {
    const s = getSettings();
    s.blockedDates = (s.blockedDates || []).filter(x => x !== d);
    saveSettings(s);
    renderBlockedDates();
    toast(`Data ${formatBR(d)} desbloqueada!`);
};

// =============================================
// Filter
// =============================================
document.getElementById('filter-status').addEventListener('change', () => {
    renderTable('appointments-table-body', document.getElementById('filter-status').value);
});

// =============================================
// Helpers
// =============================================
function formatBR(d) { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function toast(msg) {
    document.getElementById('admin-toast-text').textContent = msg;
    document.getElementById('admin-toast').classList.add('active');
    setTimeout(() => document.getElementById('admin-toast').classList.remove('active'), 3000);
}

// =============================================
// Theme
// =============================================
(function() {
    const s = localStorage.getItem('theme') || 'dark';
    if (s === 'dark') document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
})();
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// =============================================
// Account Management (Change Email / Password)
// =============================================
function setupAccountTab() {
    const admin = getCurrentAdmin();

    // Show current email
    document.getElementById('account-current-email').value = admin.email || '';

    // Hide messages
    function hideAccountMsgs() {
        document.getElementById('email-error').classList.remove('visible');
        document.getElementById('email-success').classList.remove('visible');
        document.getElementById('pass-error').classList.remove('visible');
        document.getElementById('pass-success').classList.remove('visible');
    }

    // --- CHANGE EMAIL ---
    document.getElementById('save-email-btn').addEventListener('click', () => {
        hideAccountMsgs();
        const newEmail = document.getElementById('account-new-email').value.trim().toLowerCase();

        if (!newEmail) {
            document.getElementById('email-error-text').textContent = 'Digite o novo e-mail.';
            document.getElementById('email-error').classList.add('visible');
            return;
        }

        // Basic email validation
        if (!newEmail.includes('@') || !newEmail.includes('.')) {
            document.getElementById('email-error-text').textContent = 'E-mail inválido.';
            document.getElementById('email-error').classList.add('visible');
            return;
        }

        // Check if email already in use by another user
        const users = JSON.parse(localStorage.getItem('agendafacil_users') || '[]');
        const existing = users.find(u => u.email === newEmail && u.id !== admin.id);
        if (existing) {
            document.getElementById('email-error-text').textContent = 'Este e-mail já está em uso.';
            document.getElementById('email-error').classList.add('visible');
            return;
        }

        // Update in users list
        const userIdx = users.findIndex(u => u.id === admin.id);
        if (userIdx !== -1) {
            users[userIdx].email = newEmail;
            localStorage.setItem('agendafacil_users', JSON.stringify(users));
        }

        // Update current session
        admin.email = newEmail;
        localStorage.setItem('agendafacil_currentUser', JSON.stringify(admin));

        // Update display
        document.getElementById('account-current-email').value = newEmail;
        document.getElementById('account-new-email').value = '';
        document.getElementById('email-success').classList.add('visible');

        // Update greeting
        const g = document.getElementById('admin-greeting');
        if (g) g.textContent = `Olá, ${admin.name.split(' ')[0]}!`;

        toast('E-mail atualizado com sucesso!');
    });

    // --- CHANGE PASSWORD ---
    document.getElementById('save-pass-btn').addEventListener('click', () => {
        hideAccountMsgs();

        const currentPass = document.getElementById('account-current-pass').value;
        const newPass = document.getElementById('account-new-pass').value;
        const confirmPass = document.getElementById('account-confirm-pass').value;

        if (!currentPass || !newPass || !confirmPass) {
            document.getElementById('pass-error-text').textContent = 'Preencha todos os campos.';
            document.getElementById('pass-error').classList.add('visible');
            return;
        }

        // Verify current password
        const users = JSON.parse(localStorage.getItem('agendafacil_users') || '[]');
        const user = users.find(u => u.id === admin.id);
        if (!user || user.password !== currentPass) {
            document.getElementById('pass-error-text').textContent = 'Senha atual incorreta.';
            document.getElementById('pass-error').classList.add('visible');
            return;
        }

        if (newPass.length < 6) {
            document.getElementById('pass-error-text').textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
            document.getElementById('pass-error').classList.add('visible');
            return;
        }

        if (newPass !== confirmPass) {
            document.getElementById('pass-error-text').textContent = 'As senhas não coincidem.';
            document.getElementById('pass-error').classList.add('visible');
            return;
        }

        // Update password
        user.password = newPass;
        localStorage.setItem('agendafacil_users', JSON.stringify(users));

        // Clear fields
        document.getElementById('account-current-pass').value = '';
        document.getElementById('account-new-pass').value = '';
        document.getElementById('account-confirm-pass').value = '';
        document.getElementById('pass-success').classList.add('visible');

        toast('Senha atualizada com sucesso!');
    });
}

// =============================================
// Init
// =============================================
setupTabs();
renderStats();
refreshTables();
loadBusinessProfile();
setupBusinessProfile();
renderServices();
setupServiceForm();
renderDayToggles();
renderHourSelectors();
renderBlockedDates();
setupBlockedDates();
setupAccountTab();
