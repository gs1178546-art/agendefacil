// =============================================
// AgendeFácil - Client App Logic
// =============================================

// --- State ---
let currentDate = new Date();
let selectedDate = null;
let selectedTime = null;
let currentBusiness = null;
let currentService = null;

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// =============================================
// Data Helpers
// =============================================
function getBusinesses() {
    try {
        return JSON.parse(localStorage.getItem('agendafacil_businesses') || '[]');
    } catch (e) { return []; }
}

function getAdminSettingsFor(adminId) {
    const defaults = {
        workDays: { 0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: false },
        startHour: 7, endHour: 23, blockedDates: []
    };
    try {
        const all = JSON.parse(localStorage.getItem('agendafacil_allSettings') || '{}');
        if (all[adminId]) return all[adminId];
    } catch (e) {}
    // Fallback to old global settings
    try {
        const saved = localStorage.getItem('adminSettings');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaults;
}

function getBookings() {
    try { return JSON.parse(localStorage.getItem('bookings') || '[]'); }
    catch (e) { return []; }
}

function saveBooking(booking) {
    const bookings = getBookings();
    booking.id = Date.now();
    booking.status = 'pending';
    booking.createdAt = new Date().toISOString();
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// =============================================
// View Management
// =============================================
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
    window.scrollTo(0, 0);
    if (window.lucide) lucide.createIcons();
}

// =============================================
// VIEW 1: Businesses Grid
// =============================================
function renderBusinesses() {
    const businesses = getBusinesses();
    const grid = document.getElementById('businesses-grid');
    const noMsg = document.getElementById('no-businesses');
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    // Filter by search
    const filtered = businesses.filter(b => {
        const nameMatch = b.name.toLowerCase().includes(query);
        const serviceMatch = (b.services || []).some(s => s.name.toLowerCase().includes(query));
        return nameMatch || serviceMatch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        noMsg.style.display = 'flex';
        return;
    }

    noMsg.style.display = 'none';
    grid.innerHTML = '';

    filtered.forEach((biz, index) => {
        const card = document.createElement('div');
        card.classList.add('business-card', 'glass', 'stagger-in');
        card.style.animationDelay = (index * 0.08) + 's';
        card.onclick = () => openBusinessDetail(biz.adminId);

        const firstServiceImg = (biz.services || []).find(s => s.image);
        const coverImg = firstServiceImg
            ? `<img src="${firstServiceImg.image}" alt="${escapeHtml(biz.name)}" class="business-cover">`
            : `<div class="business-cover-placeholder"><i data-lucide="store"></i></div>`;

        const serviceCount = (biz.services || []).length;
        const servicePreview = (biz.services || []).slice(0, 3).map(s => s.name).join(' • ');

        card.innerHTML = `
            ${coverImg}
            <div class="business-card-body">
                <h3>${escapeHtml(biz.name)}</h3>
                <p class="business-desc">${escapeHtml(biz.description || 'Sem descrição')}</p>
                <div class="business-meta">
                    <span><i data-lucide="scissors" style="width:14px;height:14px;"></i> ${serviceCount} serviço${serviceCount !== 1 ? 's' : ''}</span>
                </div>
                ${servicePreview ? `<p class="business-services-preview">${escapeHtml(servicePreview)}</p>` : ''}
            </div>
        `;

        grid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// =============================================
// VIEW 2: Business Detail
// =============================================
function openBusinessDetail(adminId) {
    const businesses = getBusinesses();
    const biz = businesses.find(b => b.adminId === adminId);
    if (!biz) return;

    currentBusiness = biz;

    // Render hero
    const hero = document.getElementById('business-hero');
    const firstServiceImg = (biz.services || []).find(s => s.image);
    const coverImg = firstServiceImg
        ? `<img src="${firstServiceImg.image}" alt="${escapeHtml(biz.name)}" class="detail-cover">`
        : `<div class="detail-cover-placeholder"><i data-lucide="store" style="width:64px;height:64px;opacity:0.3;"></i></div>`;

    hero.innerHTML = `
        ${coverImg}
        <div class="detail-info">
            <h1>${escapeHtml(biz.name)}</h1>
            <p>${escapeHtml(biz.description || '')}</p>
            ${biz.phone ? `<span class="detail-contact"><i data-lucide="phone" style="width:14px;height:14px;"></i> ${escapeHtml(biz.phone)}</span>` : ''}
            ${biz.address ? `<span class="detail-contact"><i data-lucide="map-pin" style="width:14px;height:14px;"></i> ${escapeHtml(biz.address)}</span>` : ''}
        </div>
    `;

    // Render services
    const servicesList = document.getElementById('services-list');
    const services = biz.services || [];

    if (services.length === 0) {
        servicesList.innerHTML = '<div class="empty-state-large"><p>Esta empresa ainda não cadastrou serviços.</p></div>';
    } else {
        servicesList.innerHTML = '';
        services.forEach(svc => {
            const card = document.createElement('div');
            card.classList.add('service-card', 'glass');
            card.onclick = () => openBooking(svc);

            const svcImg = svc.image
                ? `<img src="${svc.image}" alt="${escapeHtml(svc.name)}" class="service-img">`
                : `<div class="service-img-placeholder"><i data-lucide="image" style="width:32px;height:32px;opacity:0.3;"></i></div>`;

            card.innerHTML = `
                ${svcImg}
                <div class="service-card-body">
                    <h3>${escapeHtml(svc.name)}</h3>
                    <p class="service-desc">${escapeHtml(svc.description || '')}</p>
                    <div class="service-meta">
                        <span class="service-price">R$ ${Number(svc.price || 0).toFixed(2)}</span>
                        <span class="service-duration"><i data-lucide="clock" style="width:14px;height:14px;"></i> ${svc.duration || 60} min</span>
                    </div>
                </div>
                <div class="service-action">
                    <button class="btn-primary">Agendar</button>
                </div>
            `;

            servicesList.appendChild(card);
        });
    }

    showView('business-detail');
}

// =============================================
// VIEW 3: Booking Calendar
// =============================================
function openBooking(service) {
    currentService = service;
    selectedDate = null;
    selectedTime = null;

    // Show service banner
    const banner = document.getElementById('selected-service-banner');
    banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:1rem;">
            <div>
                <h3 style="font-family:var(--font-heading);">${escapeHtml(currentBusiness.name)}</h3>
                <p style="color:var(--secondary);">${escapeHtml(service.name)} — <strong>R$ ${Number(service.price || 0).toFixed(2)}</strong> — ${service.duration || 60} min</p>
            </div>
        </div>
    `;

    // Reset time panel
    document.getElementById('time-placeholder').style.display = 'flex';
    document.getElementById('time-content').style.display = 'none';

    // Back button
    document.getElementById('back-to-services').onclick = () => openBusinessDetail(currentBusiness.adminId);

    showView('booking');
    renderCalendar();
}

// =============================================
// Calendar
// =============================================
function renderCalendar() {
    const grid = document.getElementById('calendar-days');
    grid.innerHTML = '';

    const settings = getAdminSettingsFor(currentBusiness.adminId);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('current-month-year').textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Prev month padding
    for (let i = firstDay; i > 0; i--) {
        const d = document.createElement('div');
        d.classList.add('calendar-day', 'disabled');
        d.textContent = prevLastDate - i + 1;
        grid.appendChild(d);
    }

    // Current month
    for (let i = 1; i <= lastDate; i++) {
        const d = document.createElement('div');
        d.classList.add('calendar-day');
        d.textContent = i;

        const dateObj = new Date(year, month, i);
        const dow = dateObj.getDay();
        const dateStr = formatDateISO(dateObj);

        if (dateObj.getTime() === today.getTime()) d.classList.add('today');

        if (dateObj < today) {
            d.classList.add('disabled');
        } else if (!settings.workDays[dow]) {
            d.classList.add('day-off');
        } else if ((settings.blockedDates || []).includes(dateStr)) {
            d.classList.add('day-off');
        } else {
            d.addEventListener('click', () => selectDate(dateObj, d));
        }

        if (selectedDate && dateObj.getTime() === selectedDate.getTime()) d.classList.add('active');
        grid.appendChild(d);
    }

    // Next month padding
    const total = firstDay + lastDate;
    const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= rem; i++) {
        const d = document.createElement('div');
        d.classList.add('calendar-day', 'disabled');
        d.textContent = i;
        grid.appendChild(d);
    }
}

function selectDate(date, el) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    selectedDate = date;
    selectedTime = null;

    document.getElementById('time-placeholder').style.display = 'none';
    document.getElementById('time-content').style.display = 'block';

    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('selected-date-display').textContent = `Horários — ${date.toLocaleDateString('pt-BR', opts)}`;
    renderTimeSlots();
}

function renderTimeSlots() {
    const grid = document.getElementById('time-slots');
    grid.innerHTML = '';
    const settings = getAdminSettingsFor(currentBusiness.adminId);
    const bookings = getBookings();
    const dateStr = formatDateISO(selectedDate);

    for (let h = settings.startHour; h <= settings.endHour; h++) {
        const timeStr = String(h).padStart(2, '0') + ':00';
        const slot = document.createElement('div');
        slot.classList.add('slot-item');
        slot.textContent = timeStr;

        const isBooked = bookings.some(
            b => b.businessId === currentBusiness.adminId && b.date === dateStr && b.time === timeStr && b.status !== 'cancelled'
        );

        if (isBooked) {
            slot.classList.add('unavailable');
            slot.title = 'Horário ocupado';
        } else {
            slot.addEventListener('click', () => openConfirmation(timeStr, slot));
        }
        grid.appendChild(slot);
    }
    if (window.lucide) lucide.createIcons();
}

function openConfirmation(time, el) {
    document.querySelectorAll('.slot-item').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    selectedTime = time;

    document.getElementById('summary-business').textContent = currentBusiness.name;
    document.getElementById('summary-service').textContent = currentService.name;
    document.getElementById('summary-date').textContent = selectedDate.toLocaleDateString('pt-BR');
    document.getElementById('summary-time').textContent = time;

    document.getElementById('confirmation-modal').classList.add('active');
    if (window.lucide) lucide.createIcons();
}

// =============================================
// Booking Submission
// =============================================
document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    if (!name || !email || !phone) return;

    saveBooking({
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        date: formatDateISO(selectedDate),
        time: selectedTime,
        service: currentService.name,
        serviceId: currentService.id,
        businessId: currentBusiness.adminId,
        businessName: currentBusiness.name
    });

    document.getElementById('confirmation-modal').classList.remove('active');
    this.reset();
    showToast();
    renderTimeSlots();
    loadUserSession(); // refill form
});

function showToast() {
    const t = document.getElementById('success-message');
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 4000);
}

// =============================================
// Helpers
// =============================================
function formatDateISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
}

// =============================================
// Theme
// =============================================
function initTheme() {
    const s = localStorage.getItem('theme') || 'dark';
    if (s === 'dark') document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// =============================================
// User Session
// =============================================
function loadUserSession() {
    try {
        const user = JSON.parse(localStorage.getItem('agendafacil_currentUser') || 'null');
        if (user) {
            const g = document.getElementById('user-greeting');
            if (g) g.textContent = `Olá, ${user.name.split(' ')[0]}!`;
            const n = document.getElementById('user-name');
            const e = document.getElementById('user-email');
            const p = document.getElementById('user-phone');
            if (n) n.value = user.name || '';
            if (e) e.value = user.email || '';
            if (p) p.value = user.phone || '';
        }
    } catch (e) {}
}

// =============================================
// Search
// =============================================
document.getElementById('search-input').addEventListener('input', renderBusinesses);

// =============================================
// Calendar Navigation
// =============================================
document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// =============================================
// Init
// =============================================
initTheme();
loadUserSession();
renderBusinesses();

// =============================================
// Confetti Effect
// =============================================
function launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#6366f1', '#a855f7', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.8 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        piece.style.width = (6 + Math.random() * 8) + 'px';
        piece.style.height = (6 + Math.random() * 8) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4000);
}

// Patch showToast to include confetti
const _origShowToast = showToast;
function showToast() {
    _origShowToast();
    launchConfetti();
}

