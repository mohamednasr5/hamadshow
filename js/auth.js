/*========================================
  NASR LIVE - Authentication Module
  ========================================*/

const NasrAuth = (() => {
    'use strict';

    function init() {
        const loginForm = document.getElementById('login-form');
        const togglePwdBtn = document.querySelector('.toggle-password');
        const logoutBtn = document.getElementById('btn-logout');
        const btnBackMain = document.getElementById('btn-back-main');

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        if (togglePwdBtn) {
            togglePwdBtn.addEventListener('click', togglePassword);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (btnBackMain) {
            btnBackMain.addEventListener('click', () => {
                NasrApp.showScreen('main-menu-screen');
            });
        }

        // Pre-fill DNS from config if set
        const dnsInput = document.getElementById('login-dns');
        if (dnsInput && window.dns) {
            dnsInput.value = window.dns;
        }

        // Check for saved session
        checkSession();
    }

    function togglePassword() {
        const pwdInput = document.getElementById('login-password');
        const icon = document.querySelector('.toggle-password i');
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            pwdInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const dns = document.getElementById('login-dns').value.trim();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const errorEl = document.getElementById('login-error');
        const btnLogin = document.getElementById('btn-login');

        if (!dns || !username || !password) {
            errorEl.textContent = 'يرجى ملء جميع الحقول';
            errorEl.classList.remove('hidden');
            return;
        }

        // Show loading
        btnLogin.classList.add('loading');
        errorEl.classList.add('hidden');

        const result = await NasrAPI.login(dns, username, password);

        btnLogin.classList.remove('loading');

        if (result.success) {
            errorEl.classList.add('hidden');
            NasrUtils.showToast('تم تسجيل الدخول بنجاح', 'success');
            updateMainMenuInfo();
            NasrApp.showScreen('main-menu-screen');
        } else {
            errorEl.textContent = result.error || 'فشل تسجيل الدخول';
            errorEl.classList.remove('hidden');
        }
    }

    function handleLogout() {
        NasrAPI.logout();
        NasrApp.destroyPlayer();
        NasrApp.showScreen('login-screen');
        NasrUtils.showToast('تم تسجيل الخروج', 'info');
    }

    function checkSession() {
        const session = NasrAPI.restoreSession();
        if (session && session.userInfo && session.userInfo.auth === 1) {
            updateMainMenuInfo();
            NasrApp.showScreen('main-menu-screen');
        }
    }

    function updateMainMenuInfo() {
        const info = NasrAPI.getUserInfo();
        if (!info) return;

        const welcomeText = document.getElementById('welcome-text');
        const accountStatus = document.getElementById('account-status-text');
        const accountExpiry = document.getElementById('account-expiry');

        if (welcomeText) {
            welcomeText.textContent = `مرحباً، ${info.username || ''}`;
        }

        if (accountStatus) {
            const now = Math.floor(Date.now() / 1000);
            if (info.exp_date && info.exp_date > now) {
                accountStatus.textContent = 'الحساب نشط';
                accountStatus.style.color = 'var(--success)';
            } else if (info.exp_date) {
                accountStatus.textContent = 'الحساب منتهي';
                accountStatus.style.color = 'var(--danger)';
            }
        }

        if (accountExpiry && info.exp_date) {
            const expiryDate = new Date(info.exp_date * 1000);
            accountExpiry.textContent = 'ينتهي: ' + expiryDate.toLocaleDateString('ar-EG');
        }
    }

    return { init, handleLogout, updateMainMenuInfo, checkSession };
})();