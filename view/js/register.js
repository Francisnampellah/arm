// Register page functionality
import { initPasswordToggle } from './auth.js';
import { t, setLanguage, getCurrentLanguage } from './i18n/translations.js';

const STRAPI_URL = 'http://localhost:1337';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements configuration
const requirements = {
    length: { element: null, test: (pwd) => pwd.length >= 8 },
    uppercase: { element: null, test: (pwd) => /[A-Z]/.test(pwd) },
    lowercase: { element: null, test: (pwd) => /[a-z]/.test(pwd) },
    number: { element: null, test: (pwd) => /[0-9]/.test(pwd) },
    special: { element: null, test: (pwd) => /[!@#$%^&*]/.test(pwd) },
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const passwordInput = document.getElementById('password');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const emailInput = document.getElementById('email');
    const emailValidation = document.getElementById('emailValidation');
    const passwordValidation = document.getElementById('passwordValidation');
    
    // Initialize password requirements elements
    requirements.length.element = document.getElementById('req-length');
    requirements.uppercase.element = document.getElementById('req-uppercase');
    requirements.lowercase.element = document.getElementById('req-lowercase');
    requirements.number.element = document.getElementById('req-number');
    requirements.special.element = document.getElementById('req-special');
    
    // Initialize password toggle
    initPasswordToggle('password', 'passwordToggle', 'toggleIcon');
    
    // Show password requirements on focus
    passwordInput.addEventListener('focus', () => {
        passwordRequirements.classList.add('show');
    });
    
    // Hide password requirements on blur if empty
    passwordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        if (password === '') {
            passwordRequirements.classList.remove('show');
        }
    });
    
    // Email validation
    emailInput.addEventListener('input', () => {
        const email = emailInput.value.trim();
        if (email === '') {
            emailInput.classList.remove('valid', 'invalid');
            emailValidation.classList.remove('show');
            return;
        }
        
        if (emailRegex.test(email)) {
            emailInput.classList.remove('invalid');
            emailInput.classList.add('valid');
            emailValidation.textContent = t('validEmailFormat');
            emailValidation.classList.remove('error');
            emailValidation.classList.add('success', 'show');
        } else {
            emailInput.classList.remove('valid');
            emailInput.classList.add('invalid');
            emailValidation.textContent = t('invalidEmailFormat');
            emailValidation.classList.remove('success');
            emailValidation.classList.add('error', 'show');
        }
    });
    
    // Password strength validation
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        // Show requirements if hidden and user is typing
        if (password.length > 0 && !passwordRequirements.classList.contains('show')) {
            passwordRequirements.classList.add('show');
        }
        
        // Check each requirement
        let allValid = true;
        for (const [key, req] of Object.entries(requirements)) {
            if (req.test(password)) {
                req.element.classList.add('valid');
            } else {
                req.element.classList.remove('valid');
                allValid = false;
            }
        }
        
        // Update input styling and validation message
        if (password === '') {
            passwordInput.classList.remove('valid', 'invalid');
            passwordValidation.classList.remove('show');
        } else if (allValid) {
            passwordInput.classList.remove('invalid');
            passwordInput.classList.add('valid');
            passwordValidation.textContent = t('strongPassword');
            passwordValidation.classList.remove('error');
            passwordValidation.classList.add('success', 'show');
        } else {
            passwordInput.classList.remove('valid');
            passwordInput.classList.add('invalid');
            passwordValidation.textContent = t('passwordTooWeak');
            passwordValidation.classList.remove('success');
            passwordValidation.classList.add('error', 'show');
        }
    });
    
    // Form submission
    document.getElementById('registerForm').addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    const submitBtn = document.getElementById('submitBtn');
    
    // Hide previous messages
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    // Get form data
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate email format
    if (!emailRegex.test(email)) {
        errorDiv.textContent = t('emailRequired');
        errorDiv.classList.add('show');
        document.getElementById('email').focus();
        return;
    }
    
    // Validate password strength
    let passwordValid = true;
    for (const req of Object.values(requirements)) {
        if (!req.test(password)) {
            passwordValid = false;
            break;
        }
    }
    
    if (!passwordValid) {
        errorDiv.textContent = t('passwordTooWeak');
        errorDiv.classList.add('show');
        document.getElementById('password').focus();
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = t('registering');
    
    try {
        const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || data.message || t('registrationFailed'));
        }
        
        // Success
        successDiv.textContent = t('registrationSuccess');
        successDiv.classList.add('show');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        
    } catch (error) {
        errorDiv.textContent = error.message || t('registrationError');
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = t('register');
    }
}

// Language switcher initialization
document.addEventListener('DOMContentLoaded', () => {
    const langSwitcher = document.getElementById('languageSwitcher');
    if (langSwitcher) {
        langSwitcher.value = getCurrentLanguage();
        langSwitcher.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            updatePageText();
        });
        updatePageText();
    }
});

function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}