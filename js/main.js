// ===========================
// Utility Functions
// ===========================

/**
 * Intersection Observer for scroll animations
 */
const observeElements = (selector, callback, options = {}) => {
    const defaultOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
            }
        });
    }, defaultOptions);

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => observer.observe(el));
};

/**
 * Smooth scroll to element
 */
const smoothScroll = (target) => {
    const element = document.querySelector(target);
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

// ===========================
// Header Navigation
// ===========================

const initHeader = () => {
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav__link');

    // Header scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            smoothScroll(target);

            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });

    // CTA buttons smooth scroll
    const ctaButtons = document.querySelectorAll('a[href="#contact"]');
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            smoothScroll('#contact');
        });
    });
};

// ===========================
// Floating CTA Button
// ===========================

const initFloatingCTA = () => {
    const floatingCta = document.getElementById('floatingCta');
    if (!floatingCta) return;

    window.addEventListener('scroll', () => {
        // Show floating CTA after scrolling past hero section
        if (window.pageYOffset > window.innerHeight) {
            floatingCta.classList.add('show');
        } else {
            floatingCta.classList.remove('show');
        }
    });

    floatingCta.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScroll('#contact');
    });
};

// ===========================
// Scroll Animations
// ===========================

const initScrollAnimations = () => {
    // Animate cards on scroll
    observeElements('.about__card', (element) => {
        element.classList.add('animate');
    });

    // Animate feature items with stagger
    const featureItems = document.querySelectorAll('.feature-item');
    observeElements('.feature-item', (element) => {
        const index = Array.from(featureItems).indexOf(element);
        setTimeout(() => {
            element.classList.add('animate');
        }, index * 100);
    });

    // Animate result cards with stagger
    const resultCards = document.querySelectorAll('.result-card');
    observeElements('.result-card', (element) => {
        const index = Array.from(resultCards).indexOf(element);
        setTimeout(() => {
            element.classList.add('animate');
        }, index * 100);
    });

    // Animate pricing cards
    const pricingCards = document.querySelectorAll('.pricing-card');
    observeElements('.pricing-card', (element) => {
        const index = Array.from(pricingCards).indexOf(element);
        setTimeout(() => {
            element.classList.add('animate');
        }, index * 150);
    });

    // Animate review cards
    const reviewCards = document.querySelectorAll('.review-card');
    observeElements('.review-card', (element) => {
        const index = Array.from(reviewCards).indexOf(element);
        setTimeout(() => {
            element.classList.add('animate');
        }, index * 100);
    });

    // Animate FAQ items
    const faqItems = document.querySelectorAll('.faq-item');
    observeElements('.faq-item', (element) => {
        const index = Array.from(faqItems).indexOf(element);
        setTimeout(() => {
            element.classList.add('animate');
        }, index * 50);
    });
};

// ===========================
// FAQ Accordion
// ===========================

const initFAQ = () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-item__question');

        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
};

// ===========================
// Number Counter Animation
// ===========================

const initNumberCounters = () => {
    const animateNumber = (element, target) => {
        const duration = 2000; // 2 seconds
        const start = 0;
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            // Get the suffix (%, 万, + etc.)
            const suffix = element.querySelector('span')?.textContent || '';
            element.innerHTML = current + (suffix ? `<span>${suffix}</span>` : '');

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.innerHTML = target + (suffix ? `<span>${suffix}</span>` : '');
            }
        };

        requestAnimationFrame(updateNumber);
    };

    const animateToUnlimited = (element) => {
        const duration = 2000; // 2 seconds to count to 99
        const pauseDuration = 500; // pause at 99
        const start = 0;
        const target = 99;
        const startTime = performance.now();

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                // Show 99 for a moment
                element.textContent = '99';
                setTimeout(() => {
                    // Then change to 無制限
                    element.textContent = '無制限';
                }, pauseDuration);
            }
        };

        requestAnimationFrame(updateNumber);
    };

    const resultNumbers = document.querySelectorAll('.result-card__number');

    observeElements('.result-card__number', (element) => {
        // Check if this element should count to unlimited
        if (element.hasAttribute('data-count-to-unlimited')) {
            animateToUnlimited(element);
            return;
        }

        const text = element.textContent.trim();
        const numberMatch = text.match(/\d+/);

        if (numberMatch) {
            const targetNumber = parseInt(numberMatch[0]);
            animateNumber(element, targetNumber);
        }
    }, { threshold: 0.5 });
};

// ===========================
// Video Background Handler
// ===========================

const initVideoBackground = () => {
    const video = document.querySelector('.hero__video');

    if (video) {
        // Ensure video plays on mobile devices
        video.play().catch(error => {
            console.log('Video autoplay failed:', error);
        });

        // Pause video when not in viewport to save resources
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play();
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(video);
    }
};

// ===========================
// Lazy Loading for Images
// ===========================

const initLazyLoading = () => {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
};

// ===========================
// Performance Optimization
// ===========================

/**
 * Debounce function to limit function calls
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function to limit function calls
 */
const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ===========================
// Form Validation (if needed in future)
// ===========================

const initFormValidation = () => {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Add your form validation logic here
            const formData = new FormData(form);

            // Example: Send to backend or handle submission
            console.log('Form submitted:', Object.fromEntries(formData));
        });
    });
};

// ===========================
// Accessibility Enhancements
// ===========================

const initA11y = () => {
    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close mobile menu if open
            const navMenu = document.getElementById('navMenu');
            const navToggle = document.getElementById('navToggle');

            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }

            // Close any open FAQ items
            document.querySelectorAll('.faq-item.active').forEach(item => {
                item.classList.remove('active');
            });
        }
    });

    // Add focus visible for better keyboard navigation
    document.addEventListener('mousedown', () => {
        document.body.classList.add('using-mouse');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.remove('using-mouse');
        }
    });
};

// ===========================
// Analytics Event Tracking (placeholder)
// ===========================

const initAnalytics = () => {
    // Track CTA clicks
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-line');
    ctaButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Send event to analytics
            if (window.gtag) {
                gtag('event', 'cta_click', {
                    'event_category': 'engagement',
                    'event_label': button.textContent.trim()
                });
            }
        });
    });

    // Track section views
    const sections = document.querySelectorAll('section[id]');
    observeElements('section[id]', (element) => {
        if (window.gtag) {
            gtag('event', 'section_view', {
                'event_category': 'engagement',
                'event_label': element.id
            });
        }
    }, { threshold: 0.5 });
};

// ===========================
// Page Load Performance
// ===========================

const optimizePageLoad = () => {
    // Preload critical resources
    const preloadLink = (href, as) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = href;
        document.head.appendChild(link);
    };

    // Remove loading class after page load
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
};

// ===========================
// Initialize All Functions
// ===========================

const init = () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
};

const initializeApp = () => {
    console.log('Re:ラボ LP initialized');

    // Initialize core features
    initHeader();
    initFloatingCTA();
    initScrollAnimations();
    initFAQ();
    initNumberCounters();
    initVideoBackground();
    initLazyLoading();
    initA11y();
    optimizePageLoad();

    // Initialize analytics if available
    if (window.gtag) {
        initAnalytics();
    }

    // Log page view
    console.log('Page loaded successfully');
};

// Start the application
init();

// ===========================
// Export for module usage (optional)
// ===========================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        smoothScroll,
        debounce,
        throttle,
        observeElements
    };
}
