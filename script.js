// ============================================
// ANIMATED CIRCUIT/NEURAL NETWORK BACKGROUND
// ============================================
const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');

// Configuration
const config = {
    nodeCount: 35,
    connectionDistance: 120,
    nodeSpeed: 0.15,
    pulseSpeed: 0.01,
    nodeSize: { min: 1, max: 2 },
    colors: {
        node: '#d4a574',
        nodePulse: '#b8860b',
        connection: 'rgba(212, 165, 116, 0.08)',
        connectionActive: 'rgba(212, 165, 116, 0.2)'
    }
};

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Node class
class Node {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * config.nodeSpeed;
        this.vy = (Math.random() - 0.5) * config.nodeSpeed;
        this.radius = Math.random() * (config.nodeSize.max - config.nodeSize.min) + config.nodeSize.min;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = config.pulseSpeed + Math.random() * 0.01;
        this.connections = [];
        this.isActive = false;
        this.activeTimer = 0;
    }

    update() {
        // Move node
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Keep in bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));

        // Update pulse
        this.pulsePhase += this.pulseSpeed;

        // Random activation (neural firing)
        if (Math.random() < 0.0003) {
            this.isActive = true;
            this.activeTimer = 40;
        }

        if (this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer === 0) this.isActive = false;
        }
    }

    draw() {
        const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
        const currentRadius = this.radius + pulse * 1.5;

        // Glow effect for active nodes
        if (this.isActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius * 3, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentRadius * 3
            );
            gradient.addColorStop(0, 'rgba(212, 165, 116, 0.15)');
            gradient.addColorStop(1, 'rgba(212, 165, 116, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Main node
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.isActive ? config.colors.nodePulse : config.colors.node;
        ctx.globalAlpha = 0.6 + pulse * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Create nodes
const nodes = [];
for (let i = 0; i < config.nodeCount; i++) {
    nodes.push(new Node());
}

// Data pulse class (traveling along connections)
class DataPulse {
    constructor(startNode, endNode) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.progress = 0;
        this.speed = 0.02 + Math.random() * 0.02;
        this.alive = true;
    }

    update() {
        this.progress += this.speed;
        if (this.progress >= 1) {
            this.alive = false;
            // Chance to activate the end node
            if (Math.random() < 0.3) {
                this.endNode.isActive = true;
                this.endNode.activeTimer = 40;
            }
        }
    }

    draw() {
        const x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
        const y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = config.colors.nodePulse;
        ctx.fill();

        // Trail effect
        const trailLength = 0.1;
        const trailStart = Math.max(0, this.progress - trailLength);
        const trailX = this.startNode.x + (this.endNode.x - this.startNode.x) * trailStart;
        const trailY = this.startNode.y + (this.endNode.y - this.startNode.y) * trailStart;

        const gradient = ctx.createLinearGradient(trailX, trailY, x, y);
        gradient.addColorStop(0, 'rgba(212, 165, 116, 0)');
        gradient.addColorStop(1, 'rgba(212, 165, 116, 0.6)');

        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

const dataPulses = [];

// Draw connections between nodes
function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectionDistance) {
                const opacity = 1 - (distance / config.connectionDistance);
                const isActiveConnection = nodes[i].isActive || nodes[j].isActive;

                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);

                if (isActiveConnection) {
                    ctx.strokeStyle = `rgba(212, 165, 116, ${opacity * 0.25})`;
                    ctx.lineWidth = 1;

                    // Spawn data pulse occasionally
                    if (Math.random() < 0.005 && dataPulses.length < 8) {
                        const startNode = nodes[i].isActive ? nodes[i] : nodes[j];
                        const endNode = nodes[i].isActive ? nodes[j] : nodes[i];
                        dataPulses.push(new DataPulse(startNode, endNode));
                    }
                } else {
                    ctx.strokeStyle = `rgba(212, 165, 116, ${opacity * 0.05})`;
                    ctx.lineWidth = 0.5;
                }

                ctx.stroke();
            }
        }
    }
}

// Animation loop
function animate() {
    // Clear canvas with fade effect for trails
    ctx.fillStyle = 'rgba(26, 20, 16, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear more aggressively periodically to prevent buildup
    if (Math.random() < 0.01) {
        ctx.fillStyle = 'rgba(26, 20, 16, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw connections first (behind nodes)
    drawConnections();

    // Update and draw data pulses
    for (let i = dataPulses.length - 1; i >= 0; i--) {
        dataPulses[i].update();
        if (dataPulses[i].alive) {
            dataPulses[i].draw();
        } else {
            dataPulses.splice(i, 1);
        }
    }

    // Update and draw nodes
    nodes.forEach(node => {
        node.update();
        node.draw();
    });

    requestAnimationFrame(animate);
}

// Start animation
animate();

// Randomly activate nodes periodically
setInterval(() => {
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    randomNode.isActive = true;
    randomNode.activeTimer = 30;
}, 4000);

// ============================================
// MAIN SITE FUNCTIONALITY
// ============================================

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.style.background = 'rgba(26, 20, 16, 0.98)';
    } else {
        navbar.style.background = 'rgba(26, 20, 16, 0.9)';
    }

    lastScroll = currentScroll;
});

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

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

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
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
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Notification System
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles dynamically
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)' : '#ff4444'};
        color: ${type === 'success' ? '#0a0a0f' : '#fff'};
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
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply scroll animations to service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});
