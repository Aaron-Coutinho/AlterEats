// Login handling

// Form submission handler
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission
    console.log('Login form submitted');

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        group.querySelector('.error').textContent = '';
    });

    // Validate fields
    let isValid = validateForm();

    if (isValid) {
        console.log('Form validated, attempting login...');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Login failed');
                return data;
            })
            .then(data => {
                console.log('User logged in successfully:', data.uid);
                localStorage.setItem('authToken', data.token); // Store token for future authenticated requests
                showNotification('Login successful!', 'success');
                setTimeout(() => window.location.href = "profile-setup.html", 1000); // Redirect to profile setup
                document.getElementById('loginForm').reset();
            })
            .catch(error => {
                console.error('Login error:', error.message);
                showError(document.getElementById('email'), error.message);
            });
    } else {
        console.log('Form validation failed');
    }
});

// Validation function (called only on submit)
function validateForm() {
    let isValid = true;

    const email = document.getElementById('email');
    if (!email.value.includes('@') || !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showError(email, 'Please enter a valid email address');
        isValid = false;
    }

    const password = document.getElementById('password');
    if (password.value.length < 6) {
        showError(password, 'Password must be at least 6 characters');
        isValid = false;
    }

    return isValid;
}

// Error display function
function showError(input, message) {
    const group = input.parentElement;
    group.classList.add('error');
    group.querySelector('.error').textContent = message;
}

// Notification display function
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    setTimeout(() => notification.className = 'notification', 3000);
}