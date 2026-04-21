(function () {
    const LOGIN_URL = 'https://mzztee-backend.onrender.com/api/auth/login';

    document.addEventListener('DOMContentLoaded', function () {
        if (localStorage.getItem('token')) {
            window.location.replace('admin.html');
            return;
        }

        const form = document.getElementById('loginForm');
        const errEl = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (!form) return;

        if (togglePassword && passwordInput) {
            function flipPasswordVisibility() {
                passwordInput.type =
                    passwordInput.type === 'password' ? 'text' : 'password';
                togglePassword.textContent =
                    passwordInput.type === 'password' ? '👁' : '🙈';
                togglePassword.setAttribute(
                    'aria-label',
                    passwordInput.type === 'password'
                        ? 'Show password'
                        : 'Hide password'
                );
            }

            togglePassword.addEventListener('click', function () {
                flipPasswordVisibility();
            });
            togglePassword.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    flipPasswordVisibility();
                }
            });
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (errEl) errEl.textContent = '';

            const usernameEl = document.getElementById('username');
            const passwordEl = document.getElementById('password');
            const username = usernameEl ? usernameEl.value.trim() : '';
            const password = passwordEl ? passwordEl.value : '';

            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';
            }

            try {
                const res = await fetch(LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: password }),
                });

                const data = await res.json().catch(function () {
                    return {};
                });

                if (res.ok && data.success && data.token) {
                    localStorage.setItem('token', data.token);
                    window.location.replace('admin.html');
                    return;
                }

                if (errEl) {
                    errEl.textContent =
                        data.message || 'Invalid credentials. Please try again.';
                }
            } catch (err) {
                console.error(err);
                if (errEl) {
                    errEl.textContent = 'Could not reach server. Is the API running?';
                }
            } finally {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
            }
        });
    });
})();
