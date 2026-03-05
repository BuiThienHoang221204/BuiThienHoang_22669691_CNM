// Modern E-Commerce App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    menuToggle.style.cssText = `
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1100;
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: var(--shadow-md);
    `;
    
    document.body.appendChild(menuToggle);
    
    // Handle mobile sidebar toggle
    menuToggle.addEventListener('click', function() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.transform = sidebar.style.transform === 'translateX(0px)' ? 'translateX(-100%)' : 'translateX(0px)';
        }
    });
    
    // Show mobile menu on small screens
    function handleResize() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.transform = '';
            }
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Active nav link highlighting
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath.includes(href) && href !== '/')) {
            link.classList.add('active');
        }
    });
    
    // Smooth animations for cards
    const cards = document.querySelectorAll('.card');
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
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Enhanced form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateInput(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateInput(this);
                }
            });
        });
        
        form.addEventListener('submit', function(e) {
            // Only validate if there are required inputs
            if (inputs.length === 0) {
                return; // Let form submit normally
            }
            
            let isValid = true;
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                console.log('Form validation failed - form submission prevented');
            } else {
                console.log('Form validation passed - allowing submission');
            }
        });
    });
    
    function validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        
        // Remove existing error
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-text');
        if (existingError) {
            existingError.remove();
        }
        
        // Validate
        if (input.hasAttribute('required') && !value) {
            showError(input, 'Trường này là bắt buộc');
            isValid = false;
        } else if (input.type === 'email' && value && !isValidEmail(value)) {
            showError(input, 'Email không hợp lệ');
            isValid = false;
        } else if (input.type === 'number' && value) {
            const num = parseFloat(value);
            const min = parseFloat(input.getAttribute('min'));
            const max = parseFloat(input.getAttribute('max'));
            
            if (min !== null && num < min) {
                showError(input, `Giá trị phải >= ${min}`);
                isValid = false;
            } else if (max !== null && num > max) {
                showError(input, `Giá trị phải <= ${max}`);
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function showError(input, message) {
        input.classList.add('error');
        const errorEl = document.createElement('div');
        errorEl.className = 'error-text';
        errorEl.textContent = message;
        errorEl.style.cssText = 'color: var(--danger-color); font-size: 0.875rem; margin-top: 0.25rem;';
        input.parentNode.appendChild(errorEl);
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Image preview for file inputs
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    let preview = input.parentNode.querySelector('.image-preview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.className = 'image-preview';
                        preview.style.cssText = 'margin-top: 1rem; text-align: center;';
                        input.parentNode.appendChild(preview);
                    }
                    
                    preview.innerHTML = `
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: var(--shadow-sm);">
                        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-light);">Preview: ${file.name}</p>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    });
    
    // Loading states for buttons
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        const form = button.closest('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                // Only show loading if form is valid
                if (form.checkValidity()) {
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
                    button.disabled = true;
                    
                    // Re-enable after 5 seconds as fallback
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.disabled = false;
                    }, 5000);
                }
            });
        }
    });
    
    // Auto-hide alerts
    const alerts = document.querySelectorAll('[style*="background: #fed7d7"], [style*="background: #c6f6d5"]');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
});