// Utility function to add a timeout to a promise
function withTimeout(promise, timeoutMs) {
    const timeout = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    return Promise.race([promise, timeout]);
}

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('No user logged in, redirecting to login.html');
        window.location.href = "login.html";
    } else {
        console.log('User is authenticated.');
    }

    // DOM Elements
    const nutritionForm = document.getElementById('nutrition-form');
    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotPopup = document.getElementById('chatbot-popup');
    const closeChatbot = document.getElementById('close-chatbot');

    // Event Listeners
    nutritionForm.addEventListener('submit', handleFormSubmit);
    chatbotBtn.addEventListener('click', toggleChatbot);
    closeChatbot.addEventListener('click', toggleChatbot);

    // Add input focus effects with null check
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('focus', function () {
            const formGroup = this.closest('.form-group');
            const label = formGroup ? formGroup.querySelector('label') : null;
            if (label) {
                label.style.color = 'var(--primary)';
            }
        });
        el.addEventListener('blur', function () {
            const formGroup = this.closest('.form-group');
            const label = formGroup ? formGroup.querySelector('label') : null;
            if (label) {
                label.style.color = 'var(--dark)';
            }
        });
    });

    // Toggle Chatbot Visibility with animation
    function toggleChatbot() {
        const isVisible = chatbotPopup.style.display === 'flex';
        if (isVisible) {
            chatbotPopup.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                chatbotPopup.style.display = 'none';
                chatbotPopup.style.animation = '';
            }, 300);
        } else {
            chatbotPopup.style.display = 'flex';
            chatbotPopup.style.animation = 'fadeIn 0.3s ease';
        }
    }

    // Validate form inputs
    function validateForm() {
        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
            el.classList.remove('error');
        });

        const age = document.getElementById('age');
        if (!age.value || age.value < 13 || age.value > 120) {
            showError(age, 'Please enter a valid age between 13 and 120');
            isValid = false;
        }

        const height = document.getElementById('height');
        if (!height.value || height.value < 100 || height.value > 250) {
            showError(height, 'Please enter a valid height between 100cm and 250cm');
            isValid = false;
        }

        const weight = document.getElementById('weight');
        if (!weight.value || weight.value < 30 || weight.value > 300) {
            showError(weight, 'Please enter a valid weight between 30kg and 300kg');
            isValid = false;
        }

        const activity = document.getElementById('activity');
        if (!activity.value) {
            showError(activity, 'Please select your activity level');
            isValid = false;
        }

        return isValid;
    }

    // Show error with animation
    function showError(element, message) {
        const errorElement = document.getElementById(`${element.id}-error`);
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        element.classList.add('error');
        element.style.animation = 'shake 0.5s';
        setTimeout(() => element.style.animation = '', 500);
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submission started');

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        // Get form data before showing loading
        const formData = getFormData();
        console.log('Form data to save:', formData);

        // Show loading
        showLoading();

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authenticated user found');
            }

            // Save data with a 10-second timeout
            const saveReq = fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            }).then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to save profile');
                return data;
            });

            await withTimeout(saveReq, 10000);
            console.log('Data saved successfully');
            showSuccessMessage('Details saved successfully!');
            setTimeout(() => window.location.href = "index.html", 2000);

        } catch (error) {
            console.error('Error saving data:', error.message);
            showErrorMessage(`Failed to save your details: ${error.message}`);
        }
    }

    // Get form data with null checks
    function getFormData() {
        const genderInput = document.querySelector('input[name="gender"]:checked');
        const ageInput = document.getElementById('age');
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const activityInput = document.getElementById('activity');
        const allergiesInput = document.getElementById('allergies');
        const conditionsInput = document.getElementById('conditions');

        // Defensive checks
        if (!genderInput || !ageInput || !heightInput || !weightInput || !activityInput || !allergiesInput || !conditionsInput) {
            throw new Error('One or more form fields are missing in the DOM');
        }

        return {
            age: parseInt(ageInput.value),
            height: parseInt(heightInput.value),
            weight: parseInt(weightInput.value),
            gender: genderInput.value,
            activityLevel: parseFloat(activityInput.value),
            allergies: allergiesInput.value || '',
            healthConditions: conditionsInput.value || ''
        };
    }

    // Show loading state
    function showLoading() {
        const loadingHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Saving your details...</p>
            </div>
        `;
        document.querySelector('.main-content').innerHTML = loadingHTML;
    }

    // Show success message
    function showSuccessMessage(message) {
        const successHTML = `
            <div class="success-container animate__animated animate__fadeIn">
                <i class="fas fa-check-circle"></i>
                <p>${message}</p>
            </div>
        `;
        document.querySelector('.main-content').innerHTML = successHTML;
    }

    // Show error message
    function showErrorMessage(message) {
        const errorHTML = `
            <div class="error-container animate__animated animate__shakeX">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="submit-btn" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
        document.querySelector('.main-content').innerHTML = errorHTML;
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(10px); }
    }
`;
document.head.appendChild(style);