// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Cleaned up unused Firebase globals
    // Elements
    const junkFoodSelect = document.getElementById('junkFoodSelect');
    const generateBtn = document.getElementById('generateBtn');
    const alternativesSection = document.getElementById('alternatives');
    const calorieOutput = document.getElementById('calorieOutput');
    const errorMessage = document.getElementById('errorMessage');
    let bmiChart;

    // Fetch Junk Food Data
    fetch('junkFood.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch JSON');
            return response.json();
        })
        .then(data => {
            const junkFoods = data.filter(item => item["JunkFood "]?.trim());

            junkFoods.forEach(food => {
                const name = food["JunkFood "].trim();
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                junkFoodSelect.appendChild(option);
            });

            generateBtn.addEventListener('click', () => {
                const selectedFood = junkFoodSelect.value.trim();
                if (!selectedFood) {
                    errorMessage.textContent = 'Please select a junk food!';
                    return;
                }

                const foodData = junkFoods.find(f => f["JunkFood "].trim() === selectedFood);
                if (!foodData) {
                    errorMessage.textContent = 'Selected junk food not found in data!';
                    return;
                }

                errorMessage.textContent = '';
                displayAlternative(foodData);
                displayCalories(foodData);
                loadUserDataAndDisplayBMI();
            });
        })
        .catch(error => {
            console.error('Fetch error:', error);
            errorMessage.textContent = 'Error loading junk food data.';
        });

    function displayAlternative(foodData) {
        alternativesSection.innerHTML = `
            <h3>${foodData[" Alternatives "] || 'N/A'}</h3>
            <p><strong>Description:</strong> ${foodData[" Description "] || 'N/A'}</p>
            <p><strong>Calories:</strong> ${foodData[" Calories "] || 'N/A'} kcal</p>
            <p><strong>Prep Time:</strong> ${foodData[" PrepTime "] || 'N/A'}</p>
            <p><strong>Cook Time:</strong> ${foodData[" CookTime "] || 'N/A'}</p>
            <p><strong>Total Time:</strong> ${foodData[" TotalTime "] || 'N/A'}</p>
            <p><strong>Ingredients:</strong> ${foodData[" RecipeIngredientQuantities "] || 'N/A'}</p>
            <p><strong>Instructions:</strong> ${foodData[" RecipeInstructions"] || 'N/A'}</p>
            <p><a href="${foodData["Order Links"] || '#'}" target="_blank">Order Now</a></p>
        `;
        alternativesSection.classList.add('active');
    }

    function displayCalories(foodData) {
        calorieOutput.textContent = `Alternative: ${foodData[" Alternatives "] || 'N/A'} - ${foodData[" Calories "] || 'N/A'} calories`;
    }

    function loadUserDataAndDisplayBMI() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            errorMessage.textContent = 'User not logged in.';
            window.location.href = 'login.html';
            return;
        }

        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch profile data');
                return response.json();
            })
            .then(profile => {
                const heightCm = parseFloat(profile?.height);
                const weightKg = parseFloat(profile?.weight);

                if (!isNaN(heightCm) && !isNaN(weightKg) && heightCm > 0 && weightKg > 0) {
                    const heightM = heightCm / 100;
                    const bmi = calculateBMI(weightKg, heightM);
                    displayBMIChart(bmi);
                } else {
                    errorMessage.textContent = 'Please update your profile with valid height and weight.';
                }
            })
            .catch(err => {
                console.error('Profile fetch error:', err);
                errorMessage.textContent = 'Failed to read profile data.';
            });
    }

    function calculateBMI(weight, height) {
        return (weight / (height * height)).toFixed(1);
    }

    function displayBMIChart(bmi) {
        const ctx = document.getElementById('bmiChart').getContext('2d');
        if (bmiChart) bmiChart.destroy();
        bmiChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Your BMI'],
                datasets: [{
                    label: 'BMI',
                    data: [bmi],
                    backgroundColor: '#00c853',
                    borderColor: '#087f5b',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 40
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: `Your BMI: ${bmi}` }
                }
            }
        });
        document.getElementById('bmi-value').textContent = `Your BMI is: ${bmi}`;
    }
});
