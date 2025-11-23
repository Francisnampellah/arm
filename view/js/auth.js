// Shared authentication utilities

/**
 * Password toggle functionality
 * @param {string} passwordInputId - ID of password input element
 * @param {string} toggleButtonId - ID of toggle button element
 * @param {string} toggleIconId - ID of icon element
 */
export function initPasswordToggle(passwordInputId, toggleButtonId, toggleIconId) {
    const passwordInput = document.getElementById(passwordInputId);
    const passwordToggle = document.getElementById(toggleButtonId);
    const toggleIcon = document.getElementById(toggleIconId);
    
    if (!passwordInput || !passwordToggle || !toggleIcon) return;
    
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });
}

/**
 * Check if user is authenticated
 * @returns {Object|null} Returns user object if authenticated, null otherwise
 */
export function checkAuth() {
    const authToken = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (!authToken || !userStr) {
        return null;
    }
    
    try {
        return {
            token: authToken,
            user: JSON.parse(userStr)
        };
    } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
    }
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth() {
    if (!checkAuth()) {
        window.location.href = '/login';
    }
}

/**
 * Clear authentication data and redirect to login
 */
export function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

/**
 * Save authentication data
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
export function saveAuth(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
}