(function () {
    const token = localStorage.getItem("token");
    const appRoot = document.getElementById("adminApp");
    const loader = document.getElementById("adminLoader");

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    if (loader) loader.style.display = "none";
    if (appRoot) appRoot.style.display = "block";

    const API_ROOT = 'https://mzztee-backend.onrender.com/api/bookings';

    let tbody;
    let statusEl;
    let refreshBtn;
    let logoutBtn;

    function authHeaders() {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }
        return headers;
    }

    function redirectToLogin() {
        localStorage.removeItem('token');
        window.location.replace('login.html');
    }

    function requireToken() {
        if (!localStorage.getItem('token')) {
            redirectToLogin();
            return false;
        }
        return true;
    }

    function handleUnauthorized(status) {
        if (status === 401) {
            redirectToLogin();
            return true;
        }
        return false;
    }

    function safe(val) {
        if (val === null || val === undefined || val === '') {
            return '—';
        }
        return val;
    }

    function createdAtLabel(val) {
        if (val === null || val === undefined || val === '') {
            return '—';
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? '—' : d.toLocaleString();
    }

    function normalizeStatus(raw) {
        if (raw === 'approved' || raw === 'completed' || raw === 'pending') {
            return raw;
        }
        return 'pending';
    }

    function showAdminToast(message, variant) {
        const v = variant === 'error' ? 'error' : 'success';
        const el = document.createElement('div');
        el.className = 'toast admin-toast admin-toast--' + v;
        el.setAttribute('role', 'status');
        el.textContent = message;
        document.body.appendChild(el);
        requestAnimationFrame(function () {
            el.classList.add('active');
        });
        setTimeout(function () {
            el.classList.remove('active');
            setTimeout(function () {
                el.remove();
            }, 320);
        }, 2200);
    }

    function showDeleteConfirmToast(onConfirm) {
        document.querySelectorAll('.toast.admin-delete-confirm').forEach(function (n) {
            n.remove();
        });

        const toast = document.createElement('div');
        toast.className = 'toast toast-warning admin-delete-confirm';
        toast.setAttribute('role', 'dialog');
        toast.setAttribute('aria-modal', 'true');

        const msg = document.createElement('div');
        msg.className = 'toast-message';
        msg.textContent = 'Are you sure you want to delete this booking?';

        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'toast-btn cancel-btn';
        cancelBtn.textContent = 'Cancel';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'toast-btn delete-btn';
        deleteBtn.textContent = 'Delete';

        actions.appendChild(cancelBtn);
        actions.appendChild(deleteBtn);
        toast.appendChild(msg);
        toast.appendChild(actions);
        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('active');
        });

        function dismiss() {
            toast.classList.remove('active');
            setTimeout(function () {
                toast.remove();
            }, 220);
        }

        cancelBtn.addEventListener('click', dismiss);

        deleteBtn.addEventListener('click', function () {
            dismiss();
            setTimeout(function () {
                try {
                    var result = onConfirm();
                    if (result && typeof result.then === 'function') {
                        result.catch(function (err) {
                            console.error(err);
                            showAdminToast('Failed to delete booking', 'error');
                        });
                    }
                } catch (err) {
                    console.error(err);
                    showAdminToast('Failed to delete booking', 'error');
                }
            }, 220);
        });
    }

    function appendTextCell(tr, text, label) {
        const td = document.createElement('td');
        td.setAttribute('data-label', label);

        const span = document.createElement('span');
        span.className = 'admin-td-value';
        span.textContent = text;

        td.appendChild(span);
        tr.appendChild(td);
    }

    function appendStatusCell(tr, rawStatus) {
        const status = normalizeStatus(rawStatus);
        const td = document.createElement('td');
        td.setAttribute('data-label', 'Status');
        const value = document.createElement('span');
        value.className = 'admin-td-value';
        const span = document.createElement('span');
        span.className = 'admin-badge status-badge admin-badge--' + status;
        span.textContent = status;
        value.appendChild(span);
        td.appendChild(value);
        tr.appendChild(td);
    }

    function appendActionsCell(tr, id) {
        const td = document.createElement('td');
        td.className = 'admin-actions-cell';
        td.setAttribute('data-label', 'Actions');
        const wrap = document.createElement('div');
        wrap.className = 'actions-container admin-td-value admin-td-value--actions';

        const approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'admin-btn admin-btn--approve';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', function () {
            updateStatus(id, 'approved');
        });

        const completeBtn = document.createElement('button');
        completeBtn.type = 'button';
        completeBtn.className = 'admin-btn admin-btn--complete';
        completeBtn.textContent = 'Complete';
        completeBtn.addEventListener('click', function () {
            updateStatus(id, 'completed');
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'admin-btn admin-btn--delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function () {
            showDeleteConfirmToast(async function () {
                const ok = await deleteBooking(id);
                if (ok) {
                    showAdminToast('Booking deleted', 'success');
                    await loadBookings();
                } else {
                    showAdminToast('Failed to delete booking', 'error');
                }
            });
        });

        wrap.appendChild(approveBtn);
        wrap.appendChild(completeBtn);
        wrap.appendChild(deleteBtn);
        td.appendChild(wrap);
        tr.appendChild(td);
    }

    async function loadBookings() {
        if (!tbody || !statusEl) return;
        if (!requireToken()) return;

        statusEl.textContent = 'Loading bookings…';
        statusEl.classList.remove('admin-status--error');
        tbody.innerHTML = '';
        if (refreshBtn) refreshBtn.disabled = true;

        try {
            const response = await fetch(API_ROOT, {
                headers: authHeaders(),
            });

            if (handleUnauthorized(response.status)) {
                return;
            }

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            const json = await response.json();
            if (!json.success) {
                throw new Error(json.message || 'Invalid response');
            }

            const bookings = Array.isArray(json.data) ? json.data : [];

            if (bookings.length === 0) {
                statusEl.textContent = 'No bookings yet';
                return;
            }

            statusEl.textContent = '';

            bookings.forEach(function (booking) {
                const tr = document.createElement('tr');

                appendTextCell(tr, safe(booking.name), 'Name');
                appendTextCell(tr, safe(booking.email), 'Email');
                appendTextCell(tr, safe(booking.phone), 'Phone');
                appendTextCell(tr, safe(booking.service), 'Service');
                appendTextCell(tr, safe(booking.date), 'Date');
                appendTextCell(tr, safe(booking.message), 'Message');
                appendTextCell(tr, createdAtLabel(booking.createdAt), 'Created At');

                appendStatusCell(tr, booking.status);
                appendActionsCell(tr, booking._id);

                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
            statusEl.textContent = 'Failed to load bookings';
            statusEl.classList.add('admin-status--error');
        } finally {
            if (refreshBtn) refreshBtn.disabled = false;
        }
    }

    async function updateStatus(id, status) {
        if (!requireToken()) return;

        try {
            const res = await fetch(API_ROOT + '/' + encodeURIComponent(id), {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status: status }),
            });

            if (handleUnauthorized(res.status)) {
                return;
            }

            if (res.ok) {
                await loadBookings();
            } else {
                console.error('PATCH failed', res.status);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteBooking(id) {
        if (!requireToken()) return false;

        try {
            const res = await fetch(API_ROOT + '/' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: authHeaders(),
            });

            if (handleUnauthorized(res.status)) {
                return false;
            }

            if (res.ok) {
                return true;
            }
            console.error('DELETE failed', res.status);
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    window.updateStatus = updateStatus;
    window.deleteBooking = deleteBooking;
    window.loadBookings = loadBookings;

    document.addEventListener('DOMContentLoaded', function () {
        if (!localStorage.getItem('token')) {
            window.location.replace('login.html');
            return;
        }

        tbody = document.getElementById('bookingsBody');
        statusEl = document.getElementById('statusMessage');
        refreshBtn = document.getElementById('refreshBtn');
        logoutBtn = document.getElementById('logoutBtn');

        loadBookings();
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadBookings);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                localStorage.removeItem('token');
                window.location.replace('login.html');
            });
        }
    });
})();
