/**
 * officeFlow Authentication Script
 * Handles login and registration forms with validation
 * Prepared for future Firebase integration
 */



// ===== PASSWORD TOGGLE FUNCTIONALITY =====

/**
 * Initialize password toggle functionality
 */
function initPasswordToggle() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
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



// ===== EVENT LISTENERS =====

/**
 * Initialize form event listeners
 */
function initFormListeners() {
    // Company option toggle
    const companyOptions = document.querySelectorAll('input[name="companyOption"]');
    if (companyOptions.length > 0) {
        companyOptions.forEach(option => {
            option.addEventListener('change', function() {
                const joinGroup = document.getElementById('joinCompanyGroup');
                const createGroup = document.getElementById('createCompanyGroup');
                
                if (this.value === 'join') {
                    joinGroup.style.display = 'block';
                    createGroup.style.display = 'none';
                    document.getElementById('companyCode').required = true;
                    document.getElementById('companyName').required = false;
                } else {
                    joinGroup.style.display = 'none';
                    createGroup.style.display = 'block';
                    document.getElementById('companyCode').required = false;
                    document.getElementById('companyName').required = true;
                }
            });
        });
    }
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');
            if (emailError) emailError.textContent = '';
            if (passwordError) passwordError.textContent = '';

            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            // Basic client-side validation
            if (!email) {
                if (emailError) emailError.textContent = 'Email is required.';
                return;
            }
            if (!password) {
                if (passwordError) passwordError.textContent = 'Password is required.';
                return;
            }

            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            try {
                const response = await fetch('http://localhost:3000/login-form-api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    alert(data.message || 'Login failed. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                // Store token in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert(data.message);
                
                // Redirect based on user role
                if (data.user && data.user.role === 'superadmin') {
                    window.location.href = '../../admin/pages/super_admin_dashboard.html';
                } else if (data.user && data.user.role === 'admin') {
                    window.location.href = '../../admin/pages/dashboard_admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('An error occurred. Please check your connection and try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            document.getElementById('fullNameError').textContent = '';
            document.getElementById('emailError').textContent = '';
            document.getElementById('passwordError').textContent = '';
            document.getElementById('confirmPasswordError').textContent = '';
            document.getElementById('companyCodeError').textContent = '';
            document.getElementById('companyNameError').textContent = '';

            const formData = new FormData(registerForm);
            const fullName = formData.get('fullName');
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const companyOption = formData.get('companyOption');
            const companyCode = formData.get('companyCode');
            const companyName = formData.get('companyName');

            // Basic client-side validation
            if (!fullName) {
                alert('Full name is required.');
                document.getElementById('fullNameError').textContent = 'Full name is required.';
                return;
            }
            if (!email) {
                alert('Email is required.');
                document.getElementById('emailError').textContent = 'Email is required.';
                return;
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('emailError').textContent = 'Please enter a valid email address.';
                return;
            }
            
            if (!password) {
                alert('Password is required.');
                document.getElementById('passwordError').textContent = 'Password is required.';
                return;
            }
            
            // Password strength validation
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long.';
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                document.getElementById('confirmPasswordError').textContent = 'Passwords do not match.';
                return;
            }

            // Company validation
            if (companyOption === 'join' && !companyCode) {
                alert('Company code is required.');
                document.getElementById('companyCodeError').textContent = 'Company code is required.';
                return;
            }

            if (companyOption === 'create' && !companyName) {
                alert('Company name is required.');
                document.getElementById('companyNameError').textContent = 'Company name is required.';
                return;
            }

            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

            try {
                const requestBody = {
                    fullName,
                    email,
                    password,
                    confirmPassword,
                    isCreatingCompany: companyOption === 'create'
                };

                if (companyOption === 'join') {
                    requestBody.companyCode = companyCode;
                } else {
                    requestBody.companyName = companyName;
                }

                const response = await fetch('http://localhost:3000/register-form-api', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    alert(data.message || 'Registration failed. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                alert(data.message);
                
                // Redirect to login page after successful registration
                window.location.href = 'login.html';
            } catch (err) {
                console.error('Registration error:', err);
                alert('An error occurred. Please check your connection and try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
}


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

// Initialize UI behavior on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initFormListeners();
});