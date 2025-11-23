// Login page functionality
import { initPasswordToggle, saveAuth } from './auth.js';
import { t, setLanguage, getCurrentLanguage } from './i18n/translations.js';

const STRAPI_URL = 'http://localhost:1337';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (localStorage.getItem('authToken')) {
        window.location.href = '/dashboard';
        return;
    }
    
    // Initialize password toggle
    initPasswordToggle('password', 'passwordToggle', 'toggleIcon');
    
    // Forgot password link (placeholder)
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        alert(t('forgotPasswordSoon'));
    });
    
    // Form submission
    document.getElementById('loginForm').addEventListener('submit', handleSubmit);

    // Language switcher initialization
    const langSwitcher = document.getElementById('languageSwitcher');
    if (langSwitcher) {
        langSwitcher.value = getCurrentLanguage();
        langSwitcher.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            updatePageText();
        });
        updatePageText();
    }

    function updatePageText() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }
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
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!identifier || !password) {
        errorDiv.textContent = t('fillAllFields');
        errorDiv.classList.add('show');
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = t('loggingIn');
    
    try {
        const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier, // Can be email or username
                password,
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || data.message || t('loginFailed'));
        }
        
        // Success - store JWT token and user data
        if (data.jwt && data.user) {
            saveAuth(data.jwt, data.user);
            
            // Show success message
            successDiv.textContent = t('loginSuccess');
            successDiv.classList.add('show');
            
            // Redirect to dashboard after 1 second
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            throw new Error(t('invalidServerResponse'));
        }
        
    } catch (error) {
        errorDiv.textContent = error.message || t('loginError');
        errorDiv.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = t('login');
    }
}

