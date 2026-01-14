/**
 * officeFlow Authentication Script
 * Handles login and registration forms with validation
 * Prepared for future Firebase integration
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Display error message for a specific field
 * @param {string} fieldId - The ID of the field
 * @param {string} message - Error message to display
 */
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.classList.add('error');
    }
}

/**
 * Clear error message for a specific field
 * @param {string} fieldId - The ID of the field
 */
function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement && inputElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        inputElement.classList.remove('error');
    }
}

/**
 * Clear all error messages
 */
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-input');
    
    errorElements.forEach(element => {
        element.textContent = '';
        element.classList.remove('show');
    });
    
    inputElements.forEach(element => {
        element.classList.remove('error');
    });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
function validatePassword(password) {
    if (password.length < 6) {
        return {
            isValid: false,
            message: 'Password must be at least 6 characters long'
        };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter'
        };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        };
    }
    
    if (!/(?=.*\d)/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number'
        };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Show loading state on submit button
 * @param {HTMLElement} button - Submit button element
 */
function showLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
}

/**
 * Hide loading state on submit button
 * @param {HTMLElement} button - Submit button element
 */
function hideLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

/**
 * Simulate API call delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== PASSWORD TOGGLE FUNCTIONALITY =====

/**
 * Initialize password toggle functionality
 */
function initPasswordToggle() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('.form-input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// ===== FORM VALIDATION =====

/**
 * Validate login form
 * @param {FormData} formData - Form data to validate
 * @returns {boolean} - True if form is valid
 */
function validateLoginForm(formData) {
    let isValid = true;
    clearAllErrors();
    
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Email validation
    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showError('password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate registration form
 * @param {FormData} formData - Form data to validate
 * @returns {boolean} - True if form is valid
 */
function validateRegisterForm(formData) {
    let isValid = true;
    clearAllErrors();
    
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const agreeTerms = formData.get('agreeTerms');
    
    // Full name validation
    if (!fullName) {
        showError('fullName', 'Full name is required');
        isValid = false;
    } else if (fullName.length < 2) {
        showError('fullName', 'Full name must be at least 2 characters long');
        isValid = false;
    }
    
    // Email validation
    if (!email) {
        showError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showError('password', 'Password is required');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            showError('password', passwordValidation.message);
            isValid = false;
        }
    }
    
    // Confirm password validation
    if (!confirmPassword) {
        showError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    // Terms agreement validation
    if (!agreeTerms) {
        alert('Please agree to the Terms of Service to continue');
        isValid = false;
    }
    
    return isValid;
}

// ===== AUTHENTICATION SIMULATION =====

/**
 * Simulate login process
 * @param {FormData} formData - Login form data
 */
async function simulateLogin(formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password:', '*'.repeat(password.length));
    console.log('Remember Me:', formData.get('rememberMe') ? 'Yes' : 'No');
    
    // Simulate API call delay
    await delay(1500);
    
    // Simulate login success
    console.log('Login successful!');
    
    // Determine user type based on email domain (simulation)
    // In real implementation, this would come from Firebase/backend
    const isAdmin = email.includes('admin') || email.includes('manager');
    
    if (isAdmin) {
        console.log('Redirecting to admin dashboard...');
        // Simulate redirect to admin dashboard
        alert('Login successful! Redirecting to admin dashboard...');
        // In real implementation: window.location.href = '../admin/pages/dashboard.html';
    } else {
        console.log('Redirecting to user dashboard...');
        // Simulate redirect to user dashboard
        alert('Login successful! Redirecting to user dashboard...');
        // In real implementation: window.location.href = 'dashboard.html';
    }
}

/**
 * Simulate registration process
 * @param {FormData} formData - Registration form data
 */
async function simulateRegister(formData) {
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const password = formData.get('password');
    
    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Full Name:', fullName);
    console.log('Email:', email);
    console.log('Password:', '*'.repeat(password.length));
    
    // Simulate API call delay
    await delay(2000);
    
    // Simulate registration success
    console.log('Registration successful!');
    alert('Registration successful! Please check your email for verification.');
    
    // Redirect to login page
    console.log('Redirecting to login page...');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// ===== EVENT LISTENERS =====

/**
 * Initialize form event listeners
 */
function initFormListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = document.getElementById('loginBtn');
            
            if (validateLoginForm(formData)) {
                showLoading(submitBtn);
                
                try {
                    await simulateLogin(formData);
                } catch (error) {
                    console.error('Login error:', error);
                    alert('Login failed. Please try again.');
                } finally {
                    hideLoading(submitBtn);
                }
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = document.getElementById('registerBtn');
            
            if (validateRegisterForm(formData)) {
                showLoading(submitBtn);
                
                try {
                    await simulateRegister(formData);
                } catch (error) {
                    console.error('Registration error:', error);
                    alert('Registration failed. Please try again.');
                } finally {
                    hideLoading(submitBtn);
                }
            }
        });
    }
}

/**
 * Initialize real-time validation
 */
function initRealTimeValidation() {
    // Clear errors on input focus
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            clearError(this.id);
        });
        
        // Real-time email validation
        if (input.type === 'email') {
            input.addEventListener('blur', function() {
                if (this.value && !isValidEmail(this.value)) {
                    showError(this.id, 'Please enter a valid email address');
                }
            });
        }
        
        // Real-time password confirmation
        if (input.id === 'confirmPassword') {
            input.addEventListener('input', function() {
                const password = document.getElementById('password').value;
                if (this.value && this.value !== password) {
                    showError(this.id, 'Passwords do not match');
                } else {
                    clearError(this.id);
                }
            });
        }
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize all functionality when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('officeFlow Authentication System Initialized');
    
    // Initialize all components
    initPasswordToggle();
    initFormListeners();
    initRealTimeValidation();
    
    // Add some visual feedback for better UX
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    console.log('Ready for user interaction');
});

// ===== FIREBASE INTEGRATION PREPARATION =====

/**
 * TODO: Firebase Authentication Integration
 * 
 * When Firebase is set up, replace the simulation functions with:
 * 
 * 1. Import Firebase Auth:
 *    import { auth } from './firebase-config.js';
 *    import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
 * 
 * 2. Replace simulateLogin with:
 *    async function loginUser(email, password) {
 *        try {
 *            const userCredential = await signInWithEmailAndPassword(auth, email, password);
 *            const user = userCredential.user;
 *            // Handle successful login
 *            return user;
 *        } catch (error) {
 *            // Handle login errors
 *            throw error;
 *        }
 *    }
 * 
 * 3. Replace simulateRegister with:
 *    async function registerUser(email, password, fullName) {
 *        try {
 *            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 *            const user = userCredential.user;
 *            // Update user profile with full name
 *            await updateProfile(user, { displayName: fullName });
 *            return user;
 *        } catch (error) {
 *            // Handle registration errors
 *            throw error;
 *        }
 *    }
 * 
 * 4. Add proper error handling for Firebase auth errors
 * 5. Implement user role management (admin vs regular user)
 * 6. Add email verification flow
 * 7. Implement password reset functionality
 */