// =============================================
// AgendeFácil - Login / Register Logic
// =============================================

// =============================================
// Users Storage
// =============================================
function getUsers() {
    try {
        const saved = localStorage.getItem('agendafacil_users');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
}

function saveUsers(users) {
    localStorage.setItem('agendafacil_users', JSON.stringify(users));
}

function setCurrentUser(user) {
    localStorage.setItem('agendafacil_currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    try {
        const saved = localStorage.getItem('agendafacil_currentUser');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
}

function logout() {
    localStorage.removeItem('agendafacil_currentUser');
    window.location.href = 'login.html';
}

// =============================================
// Seed 100 Admin Accounts (runs once)
// =============================================
(function seedAdmins() {
    if (localStorage.getItem('agendafacil_admins_seeded')) return;

    const users = getUsers();

    for (let i = 1; i <= 100; i++) {
        const num = String(i).padStart(2, '0');
        const email = `admin${num}@gmail.com`;

        // Only add if not already exists
        if (!users.find(u => u.email === email)) {
            users.push({
                id: 1000000 + i,
                name: `Administrador ${num}`,
                email: email,
                phone: '',
                password: `admin${num}`,
                role: 'admin',
                profileComplete: true,
                createdAt: new Date().toISOString()
            });
        }
    }

    saveUsers(users);
    localStorage.setItem('agendafacil_admins_seeded', 'true');
})();

// =============================================
// Tab Switching
// =============================================
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-form="${tab}"]`).classList.add('active');

    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(tab + '-form').classList.add('active');

    hideErrors();
}

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        switchTab(tab.getAttribute('data-form'));
    });
});

window.switchTab = switchTab;

// =============================================
// Password Visibility Toggle
// =============================================
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// =============================================
// Error Display
// =============================================
function showLoginError(msg) {
    const el = document.getElementById('login-error');
    document.getElementById('login-error-text').textContent = msg;
    el.classList.add('visible');
}

function showRegisterError(msg) {
    const el = document.getElementById('register-error');
    document.getElementById('register-error-text').textContent = msg;
    el.classList.add('visible');
    document.getElementById('register-success').classList.remove('visible');
}

function showRegisterSuccess() {
    document.getElementById('register-success').classList.add('visible');
    document.getElementById('register-error').classList.remove('visible');
}

function hideErrors() {
    document.querySelectorAll('.error-message, .success-msg').forEach(el => el.classList.remove('visible'));
}

// =============================================
// Login
// =============================================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    hideErrors();

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showLoginError('Preencha todos os campos.');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showLoginError('E-mail ou senha incorretos.');
        return;
    }

    // Save session
    setCurrentUser({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileComplete: user.profileComplete || false,
        categories: user.categories || []
    });

    // Redirect based on role
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else if (!user.profileComplete) {
        window.location.href = 'perfil.html';
    } else {
        window.location.href = 'index.html';
    }
});

// =============================================
// Register (only clients can register)
// =============================================
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    hideErrors();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    // Validation
    if (!name || !email || !password) {
        showRegisterError('Preencha todos os campos obrigatórios.');
        return;
    }

    if (password.length < 6) {
        showRegisterError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (password !== confirm) {
        showRegisterError('As senhas não coincidem.');
        return;
    }

    const users = getUsers();

    // Check if email exists
    if (users.find(u => u.email === email)) {
        showRegisterError('Este e-mail já está cadastrado.');
        return;
    }

    // Create user — ALWAYS as client (admins are pre-seeded)
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone,
        password: password,
        role: 'client',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Show success and switch to login
    showRegisterSuccess();
    document.getElementById('register-form').reset();

    // After 2 seconds, switch to login tab
    setTimeout(() => {
        switchTab('login');
        document.getElementById('login-email').value = email;
        document.getElementById('login-email').focus();
    }, 2000);
});

// =============================================
// Theme
// =============================================
(function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    if (saved === 'dark') document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
})();

// =============================================
// Password Strength Indicator
// =============================================
(function setupPasswordStrength() {
    const input = document.getElementById('register-password');
    const container = document.getElementById('password-strength');
    const label = document.getElementById('strength-text');
    if (!input || !container) return;

    input.addEventListener('input', () => {
        const val = input.value;
        container.className = '';
        if (val.length === 0) { label.textContent = ''; return; }

        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        if (score <= 2) { container.className = 'strength-weak'; label.textContent = 'Fraca'; }
        else if (score <= 3) { container.className = 'strength-medium'; label.textContent = 'Média'; }
        else { container.className = 'strength-strong'; label.textContent = 'Forte'; }
    });
})();

// =============================================
// Social Login (Google & Facebook via Firebase)
// =============================================
function handleSocialLogin(provider) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        showLoginError('Firebase não configurado. Configure o firebase-config.js com suas credenciais.');
        return;
    }

    const config = firebase.app().options;
    if (!config.apiKey || config.apiKey === 'SUA_API_KEY') {
        showLoginError('Configure suas credenciais Firebase em firebase-config.js para ativar login social.');
        return;
    }

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const fbUser = result.user;
            const users = getUsers();

            // Check if user already exists
            let user = users.find(u => u.email === fbUser.email);

            if (!user) {
                // Create new user from social login
                user = {
                    id: Date.now(),
                    name: fbUser.displayName || 'Usuário',
                    email: fbUser.email,
                    phone: fbUser.phoneNumber || '',
                    password: '__social_' + Date.now(),
                    role: 'client',
                    photoURL: fbUser.photoURL || '',
                    socialProvider: result.additionalUserInfo?.providerId || 'social',
                    createdAt: new Date().toISOString()
                };
                users.push(user);
                saveUsers(users);
            }

            // Save session
            setCurrentUser({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                photoURL: user.photoURL || fbUser.photoURL || '',
                profileComplete: user.profileComplete || false,
                categories: user.categories || []
            });

            // Redirect
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (!user.profileComplete) {
                window.location.href = 'perfil.html';
            } else {
                window.location.href = 'index.html';
            }
        })
        .catch((error) => {
            console.error('Social login error:', error);
            if (error.code === 'auth/popup-closed-by-user') return;
            if (error.code === 'auth/account-exists-with-different-credential') {
                showLoginError('Este e-mail já está vinculado a outro método de login.');
            } else {
                showLoginError('Erro ao fazer login. Tente novamente.');
            }
        });
}

// Google Login
document.getElementById('google-login-btn')?.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    handleSocialLogin(provider);
});

// Facebook Login
document.getElementById('facebook-login-btn')?.addEventListener('click', () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    handleSocialLogin(provider);
});

// =============================================
// Auto-redirect if already logged in
// =============================================
(function checkAuth() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (!user.profileComplete) {
            window.location.href = 'perfil.html';
        } else {
            window.location.href = 'index.html';
        }
    }
})();

