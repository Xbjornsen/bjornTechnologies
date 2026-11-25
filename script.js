// ============================================
// MOTION PREFERENCES & BACKGROUND ANIMATION
// ============================================
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

function syncBackgroundMotion() {
    document.documentElement.classList.toggle('bg-paused', document.hidden);
}
document.addEventListener('visibilitychange', syncBackgroundMotion);
syncBackgroundMotion();

// ============================================
// HERO BEAR WALK CYCLE
// Lightweight SVG joint animation. Pauses when the tab is hidden
// and holds a standing pose when the user prefers reduced motion.
// ============================================
(function initBearWalk() {
    const root = document.querySelector('.hero-bear');
    if (!root) return;

    const $ = (sel) => root.querySelector(sel);
    const joints = {
        bob: $('.bear-bob'),
        head: $('.bear-head-joint'),
        hindNearHip: $('.hind-near-hip'),
        hindNearKnee: $('.hind-near-knee'),
        hindNearAnkle: $('.hind-near-ankle'),
        frontNearHip: $('.front-near-hip'),
        frontNearKnee: $('.front-near-knee'),
        frontNearAnkle: $('.front-near-ankle'),
        hindFarHip: $('.hind-far-hip'),
        hindFarKnee: $('.hind-far-knee'),
        hindFarAnkle: $('.hind-far-ankle'),
        frontFarHip: $('.front-far-hip'),
        frontFarKnee: $('.front-far-knee'),
        frontFarAnkle: $('.front-far-ankle')
    };
    if (Object.values(joints).some((el) => !el)) return;

    const CYCLE_MS = 2000;

    // Keyframes are [phase 0–1, value]. Linear between stops is enough
    // because the stops themselves are placed at stance/swing transitions.
    const hindHip = [[0, -20], [0.31, 2], [0.62, 24], [0.74, 6], [0.86, -24], [1, -20]];
    const hindKnee = [[0, 12], [0.25, 6], [0.55, 10], [0.62, 16], [0.74, 52], [0.86, 28], [0.96, 14], [1, 12]];
    const hindAnkle = [[0, 3], [0.2, 1], [0.55, -16], [0.62, -14], [0.74, -26], [0.9, 6], [1, 3]];
    const frontHip = [[0, -18], [0.3, 2], [0.6, 20], [0.72, 4], [0.86, -22], [1, -18]];
    const frontKnee = [[0, 14], [0.22, 8], [0.52, 12], [0.6, 18], [0.72, 58], [0.86, 30], [0.96, 16], [1, 14]];
    const frontAnkle = [[0, 2], [0.22, -8], [0.52, -18], [0.6, -14], [0.72, -28], [0.9, 4], [1, 2]];

    function wrap(t) {
        return ((t % 1) + 1) % 1;
    }

    function sample(keys, t) {
        const p = wrap(t);
        for (let i = 0; i < keys.length - 1; i++) {
            const [t0, v0] = keys[i];
            const [t1, v1] = keys[i + 1];
            if (p >= t0 && p <= t1) {
                const u = (p - t0) / (t1 - t0);
                return v0 + (v1 - v0) * u;
            }
        }
        return keys[keys.length - 1][1];
    }

    function rotate(el, deg) {
        el.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ')');
    }

    function pose(t) {
        const bobY = Math.cos(t * Math.PI * 4) * 2.4;
        const bobR = Math.sin(t * Math.PI * 2) * -1.0;
        joints.bob.setAttribute('transform', 'translate(0,' + bobY.toFixed(2) + ') rotate(' + bobR.toFixed(2) + ')');
        rotate(joints.head, 6 + Math.sin((t - 0.08) * Math.PI * 2) * 3.2);

        const legs = [
            { hip: joints.hindNearHip, knee: joints.hindNearKnee, ankle: joints.hindNearAnkle, phase: 0, kind: 'hind' },
            { hip: joints.frontNearHip, knee: joints.frontNearKnee, ankle: joints.frontNearAnkle, phase: 0.09, kind: 'front' },
            { hip: joints.hindFarHip, knee: joints.hindFarKnee, ankle: joints.hindFarAnkle, phase: 0.5, kind: 'hind' },
            { hip: joints.frontFarHip, knee: joints.frontFarKnee, ankle: joints.frontFarAnkle, phase: 0.59, kind: 'front' }
        ];
        legs.forEach((leg) => {
            const p = t - leg.phase;
            if (leg.kind === 'hind') {
                rotate(leg.hip, sample(hindHip, p));
                rotate(leg.knee, sample(hindKnee, p));
                rotate(leg.ankle, sample(hindAnkle, p));
            } else {
                rotate(leg.hip, sample(frontHip, p));
                rotate(leg.knee, sample(frontKnee, p));
                rotate(leg.ankle, sample(frontAnkle, p));
            }
        });
    }

    function poseStand() {
        joints.bob.setAttribute('transform', 'translate(0,0)');
        rotate(joints.head, 6);
        rotate(joints.hindNearHip, -6);
        rotate(joints.hindFarHip, -6);
        rotate(joints.hindNearKnee, 14);
        rotate(joints.hindFarKnee, 14);
        rotate(joints.hindNearAnkle, -6);
        rotate(joints.hindFarAnkle, -6);
        rotate(joints.frontNearHip, 4);
        rotate(joints.frontFarHip, 4);
        rotate(joints.frontNearKnee, 12);
        rotate(joints.frontFarKnee, 12);
        rotate(joints.frontNearAnkle, -12);
        rotate(joints.frontFarAnkle, -12);
    }

    let raf = null;
    let lastTs = null;
    let phase = 0;

    function frame(now) {
        if (document.hidden || prefersReducedMotion()) {
            raf = null;
            lastTs = null;
            return;
        }
        if (lastTs != null) phase += (now - lastTs) / CYCLE_MS;
        lastTs = now;
        pose(phase);
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (prefersReducedMotion()) {
            if (raf != null) cancelAnimationFrame(raf);
            raf = null;
            lastTs = null;
            poseStand();
            return;
        }
        if (raf == null) {
            lastTs = null;
            raf = requestAnimationFrame(frame);
        }
    }

    function stop() {
        if (raf != null) cancelAnimationFrame(raf);
        raf = null;
        lastTs = null;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });
    reducedMotionQuery.addEventListener?.('change', start);

    poseStand();
    start();
})();


// ============================================
// MAIN SITE FUNCTIONALITY
// ============================================

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

function setMenuOpen(open) {
    navLinks.classList.toggle('active', open);
    mobileMenuBtn.classList.toggle('active', open);
    mobileMenuBtn.setAttribute('aria-expanded', String(open));
}

mobileMenuBtn.addEventListener('click', () => {
    setMenuOpen(!navLinks.classList.contains('active'));
});

// Close mobile menu when clicking a link, or pressing Escape
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        setMenuOpen(false);
        mobileMenuBtn.focus();
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

        // Bare "#" (logo links) — scroll to top. querySelector('#') would throw.
        if (href === '#') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior });
            history.replaceState(null, '', window.location.pathname);
            return;
        }

        let target = null;
        try { target = document.querySelector(href); } catch (_) { return; }
        if (!target) return;

        e.preventDefault();
        const headerOffset = 80;
        const offsetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior });
    });
});

// Navbar scroll effect (colours live in styles.css: .navbar / .navbar.scrolled)
const navbar = document.querySelector('.navbar');

if (navbar) {
    const updateNavbar = () => navbar.classList.toggle('scrolled', window.pageYOffset > 50);
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
}

// Contact Form Handling (only present on the homepage)
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Honeypot — real users never tick the hidden botcheck box
        if (data.botcheck) return;

        // Basic validation
        if (!data.name || !data.email || !data.service) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        const token = getTurnstileToken(this);
        if (!token) {
            showNotification('Please complete the verification check before sending your message.', 'error');
            return;
        }
        formData.set('cf-turnstile-response', token);

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://bjorn-contact.bjorntechnologies.workers.dev', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Thank you! We\'ll be in touch soon to schedule your call.', 'success');
                this.reset();
            } else {
                showNotification('Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            showNotification('Something went wrong. Please try again.', 'error');
        } finally {
            resetTurnstile();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function getTurnstileToken(form) {
    const field = form.querySelector('[name="cf-turnstile-response"]');
    if (field && field.value) return field.value;
    if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
        try {
            return window.turnstile.getResponse() || '';
        } catch (error) {
            return '';
        }
    }
    return '';
}

function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
        try {
            window.turnstile.reset();
        } catch (error) {
            // Widget may not have rendered yet
        }
    }
}

// Notification System
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const text = document.createElement('span');
    text.textContent = message;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.innerHTML = '&times;';
    notification.append(text, closeBtn);

    // Add styles dynamically
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--color-accent-gradient)' : 'var(--color-error)'};
        color: ${type === 'success' ? 'var(--color-bg-primary)' : '#fff'};
        border-radius: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg) translateY(0)';
            entry.target.dataset.revealed = 'true';
        }
    });
}, observerOptions);

// Apply scroll animations to service cards and process steps
if (!prefersReducedMotion()) {
    ['.service-card', '.process-step'].forEach(selector => {
        document.querySelectorAll(selector).forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s, box-shadow 0.35s ease`;
            observer.observe(card);
        });
    });
} else {
    document.querySelectorAll('.service-card').forEach(card => { card.dataset.revealed = 'true'; });
}

// ============================================
// 3D CARD TILT ON MOUSE MOVE
// ============================================
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.querySelectorAll('.service-card').forEach(card => {
    if (!canHover) return;
    card.addEventListener('mousemove', (e) => {
        if (card.dataset.revealed !== 'true' || prefersReducedMotion()) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -6;
        const rotateY = ((x - cx) / cx) * 9;
        card.style.transition = 'transform 0.08s ease, box-shadow 0.35s ease';
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
});

// ============================================
// HERO PARALLAX ON SCROLL
// ============================================
const heroBg    = document.querySelector('.hero-bg');
const heroFloor = document.querySelector('.hero-floor');
const heroOrbs  = document.querySelectorAll('.hero-orb');
const heroEl    = document.querySelector('.hero');

window.addEventListener('scroll', () => {
    if (prefersReducedMotion()) return;
    const scrollY = window.pageYOffset;
    const heroH   = heroEl ? heroEl.offsetHeight : window.innerHeight;
    if (scrollY > heroH) return;

    const p = scrollY / heroH; // 0..1

    if (heroBg) {
        heroBg.style.transform = `translateY(${scrollY * 0.25}px)`;
    }
    if (heroFloor) {
        heroFloor.style.transform = `translateX(-50%) perspective(500px) rotateX(70deg) translateY(${scrollY * -0.3}px)`;
    }
    heroOrbs.forEach((orb, i) => {
        const factor = 0.08 + i * 0.06;
        orb.style.transform = `translateY(${scrollY * factor}px)`;
    });
}, { passive: true });
