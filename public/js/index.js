// Load user details on page load
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    const initialsSpan = document.querySelector('.user-initials');
    if (user && user.email) {
        // Extract initials from email (e.g., "john.doe@example.com" -> "JD")
        const emailParts = user.email.split('@')[0].split('.');
        const initials = emailParts.map(part => part.charAt(0).toUpperCase()).join('');
        initialsSpan.textContent = initials;
        // If name exists in user data, use it instead: initialsSpan.textContent = user.name || initials;
    } else {
        initialsSpan.textContent = ''; // Default to empty if no user
    }
});

// Toggle mobile menu
document.querySelector('.menu-toggle').addEventListener('click', function () {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
    this.querySelector('i').classList.toggle('fa-bars');
    this.querySelector('i').classList.toggle('fa-times');
});

// Toggle dropdown menu
document.querySelector('.profile-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    const dropdown = this.parentElement;
    dropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
window.addEventListener('click', function () {
    const dropdowns = document.querySelectorAll('.profile-dropdown');
    dropdowns.forEach(dropdown => {
        if (dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    });
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('authToken'); // Clear auth token
    localStorage.removeItem('user'); // Clear legacy user data if any
    showNotification('You have been logged out.', 'success');
    setTimeout(() => window.location.href = "login.html", 1000);
    document.querySelector('.user-initials').textContent = ''; // Reset initials
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        if (window.innerWidth <= 768) {
            document.querySelector('.nav-links').classList.remove('active');
            document.querySelector('.menu-toggle i').classList.replace('fa-times', 'fa-bars');
        }
    });
});

// Notification function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem',
        borderRadius: '10px',
        background: type === 'success' ? '#00c853' : '#e53e3e',
        color: 'white',
        zIndex: '2000',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
        animation: 'fadeIn 0.5s ease'
    });
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Add animation keyframes
document.styleSheets[0].insertRule(`
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`, 0);

document.styleSheets[0].insertRule(`
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`, 0);