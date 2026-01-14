/**
 * officeFlow Landing Page Script
 * Handles landing page interactions and animations
 */

// ===== SMOOTH SCROLLING & NAVIGATION =====

/**
 * Handle smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Handle navbar scroll effects
 */
function initNavbarEffects() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        });
    }
}

// ===== INTERSECTION OBSERVER ANIMATIONS =====

/**
 * Initialize scroll-triggered animations
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe other animated elements
    const animatedElements = document.querySelectorAll('.cta-section, .footer');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// ===== INTERACTIVE ELEMENTS =====

/**
 * Add hover effects to interactive elements
 */
function initInteractiveEffects() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.cta-btn, .nav-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .cta-btn, .nav-btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== PERFORMANCE OPTIMIZATIONS =====

/**
 * Lazy load images and optimize performance
 */
function initPerformanceOptimizations() {
    // Preload critical resources
    const criticalResources = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = resource;
        document.head.appendChild(link);
    });
    
    // Optimize scroll performance
    let ticking = false;
    
    function updateScrollEffects() {
        // Update any scroll-based effects here
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });
}

// ===== ACCESSIBILITY ENHANCEMENTS =====

/**
 * Enhance accessibility features
 */
function initAccessibilityFeatures() {
    // Add keyboard navigation support
    const focusableElements = document.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.tagName === 'A' || this.tagName === 'BUTTON') {
                    this.click();
                }
            }
        });
    });
    
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content ID
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.id = 'main-content';
    }
}

// ===== ANALYTICS & TRACKING =====

/**
 * Track user interactions for analytics
 */
function initAnalytics() {
    // Track CTA button clicks
    const ctaButtons = document.querySelectorAll('.cta-btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            console.log('CTA clicked:', buttonText);
            
            // Here you would send data to your analytics service
            // Example: gtag('event', 'click', { event_category: 'CTA', event_label: buttonText });
        });
    });
    
    // Track navigation clicks
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent.trim();
            console.log('Navigation clicked:', buttonText);
        });
    });
    
    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', function() {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            
            // Track milestone scroll depths
            if (maxScrollDepth >= 25 && maxScrollDepth < 50) {
                console.log('Scroll depth: 25%');
            } else if (maxScrollDepth >= 50 && maxScrollDepth < 75) {
                console.log('Scroll depth: 50%');
            } else if (maxScrollDepth >= 75 && maxScrollDepth < 90) {
                console.log('Scroll depth: 75%');
            } else if (maxScrollDepth >= 90) {
                console.log('Scroll depth: 90%');
            }
        }
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize all landing page functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('officeFlow Landing Page Initialized');
    
    // Initialize all components
    initSmoothScrolling();
    initNavbarEffects();
    initScrollAnimations();
    initInteractiveEffects();
    initPerformanceOptimizations();
    initAccessibilityFeatures();
    initAnalytics();
    
    // Add loading complete class for CSS animations
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
    
    console.log('Landing page ready for user interaction');
});

// ===== ERROR HANDLING =====

/**
 * Global error handler for landing page
 */
window.addEventListener('error', function(e) {
    console.error('Landing page error:', e.error);
    
    // Graceful degradation - ensure basic functionality works
    const criticalElements = document.querySelectorAll('.nav-btn, .cta-btn');
    criticalElements.forEach(element => {
        if (!element.onclick) {
            element.addEventListener('click', function(e) {
                // Ensure navigation works even if other scripts fail
                if (this.href) {
                    window.location.href = this.href;
                }
            });
        }
    });
});

/**
 * Handle offline/online states
 */
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    console.log('Connection lost - landing page will continue to work');
});