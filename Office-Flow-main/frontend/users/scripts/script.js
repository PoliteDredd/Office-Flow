/**
 * officeFlow Authentication Script (Firebase Edition)
 * Handles login and registration using Firebase Authentication
 */

// ================= FIREBASE SETUP =================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxB4aP9vgKM0Sqke9VNNLwGeXDu_rDvwo",
  authDomain: "office-flow-2232d.firebaseapp.com",
  projectId: "office-flow-2232d",
  storageBucket: "office-flow-2232d.firebasestorage.app",
  messagingSenderId: "1009116060762",
  appId: "1:1009116060762:web:722004573be18d20980c63"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ================= UTILITY FUNCTIONS =================

function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + "Error");
  const inputElement = document.getElementById(fieldId);

  if (errorElement && inputElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
    inputElement.classList.add("error");
  }
}

function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
  document.querySelectorAll(".form-input").forEach(el => el.classList.remove("error"));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showLoading(button) {
  button.classList.add("loading");
  button.disabled = true;
}

function hideLoading(button) {
  button.classList.remove("loading");
  button.disabled = false;
}


// ================= PASSWORD TOGGLE =================

function initPasswordToggle() {
  document.querySelectorAll(".password-toggle").forEach(toggle => {
    toggle.addEventListener("click", function () {
      const input = this.parentElement.querySelector(".form-input");
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      }
    });
  });
}


// ================= FORM VALIDATION =================

function validateRegisterForm(formData) {
  clearAllErrors();
  let valid = true;

  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const agreeTerms = document.getElementById("agreeTerms").checked;

  if (!fullName || fullName.length < 2) {
    showError("fullName", "Full name is required");
    valid = false;
  }

  if (!email || !isValidEmail(email)) {
    showError("email", "Enter a valid email address");
    valid = false;
  }

  if (!password || password.length < 6) {
    showError("password", "Password must be at least 6 characters");
    valid = false;
  }

  if (password !== confirmPassword) {
    showError("confirmPassword", "Passwords do not match");
    valid = false;
  }

  if (!agreeTerms) {
    alert("You must agree to the Terms of Service");
    valid = false;
  }

  return valid;
}

function validateLoginForm(formData) {
  clearAllErrors();
  let valid = true;

  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !isValidEmail(email)) {
    showError("email", "Enter a valid email");
    valid = false;
  }

  if (!password) {
    showError("password", "Password is required");
    valid = false;
  }

  return valid;
}


// ================= FIREBASE AUTH =================

async function registerUser(formData, submitBtn) {
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const password = formData.get("password");

  showLoading(submitBtn);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });

    alert("🎉 Account created successfully! Welcome to officeFlow.");
    window.location.href = "index.html"; // Redirect to landing page

  } catch (error) {
    console.error("Registration error:", error); // Log full error for debugging
    
    let errorMessage = "Registration failed. Please try again.";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Try logging in instead.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Use at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Check your internet connection.";
    } else if (error.message) {
      errorMessage = error.message; // Show actual Firebase error
    }
    
    showError("email", errorMessage);
  } finally {
    hideLoading(submitBtn);
  }
}

async function loginUser(formData, submitBtn) {
  const email = formData.get("email");
  const password = formData.get("password");

  showLoading(submitBtn);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("✅ Login successful! Welcome back.");
    window.location.href = "dashboard.html"; // Redirect to landing page

  } catch (error) {
    console.error("Login error:", error); // Log full error for debugging
    
    let errorMessage = "Login failed. Please try again.";
    
    if (error.code === "auth/invalid-credential") {
      errorMessage = "Invalid email or password. Please check your credentials.";
    } else if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password. Please try again.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "This account has been disabled.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Try again later.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Check your internet connection.";
    } else if (error.message) {
      errorMessage = error.message; // Show actual Firebase error
    }
    
    showError("email", errorMessage);
  } finally {
    hideLoading(submitBtn);
  }
}


// ================= EVENT LISTENERS =================

function initFormListeners() {

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const btn = document.getElementById("registerBtn");

      if (validateRegisterForm(formData)) {
        registerUser(formData, btn);
      }
    });
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const btn = document.getElementById("loginBtn");

      if (validateLoginForm(formData)) {
        loginUser(formData, btn);
      }
    });
  }
}


// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {
  console.log("officeFlow Firebase Authentication Ready");
  initPasswordToggle();
  initFormListeners();
});
