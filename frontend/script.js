document.addEventListener('DOMContentLoaded', () => {

    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.toggle('ph-list', !navLinks.classList.contains('active'));
            icon.classList.toggle('ph-x', navLinks.classList.contains('active'));
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileToggle.querySelector('i').classList.remove('ph-x');
                mobileToggle.querySelector('i').classList.add('ph-list');
            });
        });
    }

    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        });
    });

    async function submitBooking(formData, button) {
        const originalText = button.textContent;
        button.textContent = "Sending...";
        button.disabled = true;

        try {
            console.log("Sending form data:", formData);

            const response = await fetch('https://mzztee-backend.onrender.com/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log(result);

            if (response.ok) {
                showToast("Appointment request sent successfully!");
            } else {
                showToast("Failed to send booking.");
            }

        } catch (error) {
            console.error(error);
            showToast("Server error.");
        }

        button.textContent = originalText;
        button.disabled = false;
    }
    

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!validateBookingForm()) return;

            const formData = {
                name: document.getElementById('bookingName').value,
                email: document.getElementById('bookingEmail').value,
                phone: document.getElementById('bookingPhone').value.trim(),
                service: document.getElementById('bookingService').value,
                date: document.getElementById('bookingDate').value,
                message: document.getElementById('bookingMessage').value
            };

            submitBooking(formData, bookingForm.querySelector('button[type="submit"]'));

            bookingForm.reset();
        });
    }
});

function clearFieldError(field) {
    field.classList.remove('error');
    const err = document.getElementById(field.id + 'Error');
    if (err) err.textContent = '';
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(fieldId + 'Error');
    if (field) field.classList.add('error');
    if (err) err.textContent = message;
}

function validateBookingForm() {
    let ok = true;
    ['bookingName', 'bookingEmail', 'bookingPhone', 'bookingService', 'bookingDate'].forEach(id => {
        const f = document.getElementById(id);
        const e = document.getElementById(id + 'Error');
        if (f) f.classList.remove('error');
        if (e) e.textContent = '';
    });
    const name = document.getElementById('bookingName');
    if (!name || !name.value.trim()) {
        showError('bookingName', 'Please enter your full name.');
        ok = false;
    }
    const email = document.getElementById('bookingEmail');
    const emailVal = email && email.value.trim();
    if (!emailVal) {
        showError('bookingEmail', 'Please enter your email.');
        ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        showError('bookingEmail', 'Please enter a valid email.');
        ok = false;
    }
    const phone = document.getElementById('bookingPhone');
    const phoneVal = phone && phone.value.trim();
    if (!phoneVal) {
        showError('bookingPhone', 'Please enter your phone number.');
        ok = false;
    }
    const service = document.getElementById('bookingService');
    if (!service || !service.value) {
        showError('bookingService', 'Please select a service.');
        ok = false;
    }
    const date = document.getElementById('bookingDate');
    if (!date || !date.value) {
        showError('bookingDate', 'Please select a date.');
        ok = false;
    }
    return ok;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3200);
}

function openLightbox(element) {
    const lightbox = document.getElementById('lightbox');
    const img = element && element.querySelector('img');
    if (!lightbox || !img) return;
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || 'Fullscreen view';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event.target === document.getElementById('lightbox-img')) return;
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}