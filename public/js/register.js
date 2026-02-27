// Sign-up handling

// Form submission handler
document.getElementById('signinForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission
    console.log('Sign-up form submitted');

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
        group.querySelector('.error').textContent = '';
    });

    // Validate fields
    let isValid = validateForm();

    if (isValid) {
        console.log('Form validated, creating user...');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;

        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, phone })
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Sign-up failed');
                return data;
            })
            .then(data => {
                console.log('User registered successfully:', data.uid);
                localStorage.setItem('authToken', data.token); // Store token
                showNotification('Sign-up successful!', 'success');
                setTimeout(() => window.location.href = "profile-setup.html", 1000); // Redirect to profile setup
                document.getElementById('signinForm').reset();
            })
            .catch(error => {
                console.error('Sign-up error:', error.message);
                showError(document.getElementById('email'), error.message);
            });
    } else {
        console.log('Form validation failed');
    }
});

// Validation function (called only on submit)
function validateForm() {
    let isValid = true;

    const name = document.getElementById('name');
    if (name.value.length < 2) {
        showError(name, 'Please enter your full name');
        isValid = false;
    }

    const email = document.getElementById('email');
    if (!email.value.includes('@') || !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showError(email, 'Please enter a valid email address');
        isValid = false;
    }

    const phone = document.getElementById('phone');
    if (phone.value.match(/[a-zA-Z]/) || !phone.value.match(/^[0-9]{10}$/)) {
        showError(phone, 'Please enter a valid 10-digit phone number');
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