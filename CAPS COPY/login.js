// login.js

// Define the default account credentials
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123';

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', function(event) {
    // ?? CRITICAL FIX: Prevent the default form submission (stops the query string URL)
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous error message
    errorMessage.textContent = '';
    
    // Check credentials against the default account
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
        // --- Successful Login ---
        
        console.log('Login successful! Redirecting to /HTML/index.html...');
        
        // Display a success message
        errorMessage.style.color = '#22c55e'; // Success green
        errorMessage.textContent = `Login successful! Redirecting...`;
        
        setTimeout(() => {
             // ?? CRITICAL FIX: Use the absolute path from the server root
             window.location.href = 'HTML/index.html'; 
        }, 1000);

    } else {
        // --- Failed Login ---
        
        // Display an error message
        errorMessage.style.color = 'var(--red)';
        errorMessage.textContent = 'Invalid username or password. Please try again.';
        
        // Clear the password field for security
        passwordInput.value = '';
    }
});