/**
 * QuickFood Analyzer - Advanced Food Recognition Application
 * 
 * This application uses computer vision and nutritional analysis APIs
 * to identify food from uploaded images and provide detailed nutritional information.
 * 
 * Technologies used:
 * - LogMeal API for food recognition and nutritional analysis
 * - Chart.js and ApexCharts for data visualization
 * - Modern JavaScript for responsive UI
 */

// API Configuration
const BACKEND_SERVER = 'http://localhost:3000';
const BACKEND_RECOGNITION_ENDPOINT = `${BACKEND_SERVER}/api/recognize-food`;
const BACKEND_NUTRITION_ENDPOINT = `${BACKEND_SERVER}/api/nutrition`;
const BACKEND_INGREDIENTS_ENDPOINT = `${BACKEND_SERVER}/api/ingredients`;
const BACKEND_SAMPLE_FOOD_ENDPOINT = `${BACKEND_SERVER}/api/sample-food`;

// State variables for application
let isServerOnline = true;

/**
 * Check if the document has fully loaded before initializing charts
 */
function checkDocumentReady(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(callback, 1);
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Initialize application when DOM is fully loaded
checkDocumentReady(function () {
    // UI Elements
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('food-image-input');
    const analysisResults = document.getElementById('analysis-results');
    const foodImagePreview = document.getElementById('food-image-preview');
    const loader = document.querySelector('.loader');
    const resultsData = document.querySelector('.results-data');
    const detectedFoodInput = document.getElementById('detected-food');
    const calories = document.getElementById('calories');
    const protein = document.getElementById('protein');
    const proteinPercent = document.getElementById('protein-percent');
    const carbs = document.getElementById('carbs');
    const carbsPercent = document.getElementById('carbs-percent');
    const fat = document.getElementById('fat');
    const fatPercent = document.getElementById('fat-percent');
    const servingSize = document.getElementById('serving-size');
    const suggestionChips = document.getElementById('suggestion-chips');
    const additionalDetails = document.getElementById('additional-details');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');

    // Make sure chart elements exist before trying to access them
    function safeGetElement(id) {
        return document.getElementById(id);
    }

    // Safely initialize charts and UI
    let nutrientChart = null;
    let nutrientBreakdownChart = null;
    const chartCenterText = document.getElementById('chart-center-text');

    // Initialize tooltips only if tippy is available
    if (typeof tippy === 'function') {
        initTooltips();
    }

    // Update UI for enhanced experience
    enhanceUI();

    // Check backend server health
    checkServerHealth();

    // Event Listeners
    uploadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log("Upload button clicked");

        try {
            // Create a new file input element each time to avoid browser caching issues
            const tempFileInput = document.createElement('input');
            tempFileInput.type = 'file';
            tempFileInput.accept = 'image/*';
            tempFileInput.style.display = 'block';
            tempFileInput.style.position = 'fixed';
            tempFileInput.style.top = '0';
            tempFileInput.style.left = '0';
            tempFileInput.style.opacity = '0';
            tempFileInput.style.zIndex = '-1';

            // Add the event listener before adding to DOM
            tempFileInput.addEventListener('change', function (event) {
                console.log("File input changed:", event.target.files);
                if (event.target.files && event.target.files.length > 0) {
                    console.log("File selected:", event.target.files[0].name);
                    handleImageUpload(event);
                    // Remove the temporary input after use
                    document.body.removeChild(tempFileInput);
                }
            });

            // Add to DOM and trigger click
            document.body.appendChild(tempFileInput);
            tempFileInput.click();
        } catch (error) {
            console.error("Error opening file dialog:", error);
            alert("There was a problem opening the file dialog. Please try again.");
        }
    });

    fileInput.addEventListener('change', function (e) {
        console.log("Original file input changed:", e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            console.log("File selected from original input:", e.target.files[0].name);
            handleImageUpload(e);
        }
    });

    // Keep the sample food buttons functionality
    document.querySelectorAll('.sample-food-btn').forEach(button => {
        button.addEventListener('click', () => {
            const foodName = button.getAttribute('data-food');
            console.log(`Sample food button clicked: ${foodName}`);
            uploadPlaceholderImage(foodName);
        });
    });

    newAnalysisBtn.addEventListener('click', resetAnalysis);

    /**
     * Enhances the UI with premium styling and animations
     */
    function enhanceUI() {
        // Change loader text to remove AI reference
        if (loader) {
            loader.innerHTML = `
                <div class="spinner"></div>
                <p>Analyzing your food image...</p>
            `;
        }

        // Update food suggestions heading
        const suggestionHeading = document.querySelector('.food-suggestions h4');
        if (suggestionHeading) {
            suggestionHeading.textContent = 'Other Names:';
            suggestionHeading.innerHTML = '<i class="fas fa-tags"></i> Other Names:';
        }

        // Remove correction functionality from the UI
        const foodCorrection = document.querySelector('.food-correction');
        if (foodCorrection) {
            // Make the food name input larger and more prominent
            const nameInput = foodCorrection.querySelector('#detected-food');
            if (nameInput) {
                nameInput.className = 'enhanced-food-name';
                nameInput.readOnly = true;

                // Replace the correction section with just the enhanced input
                foodCorrection.innerHTML = '';
                foodCorrection.appendChild(nameInput);
            }
        }

        // Remove confidence indicator
        const confidenceIndicator = document.querySelector('.confidence-indicator');
        if (confidenceIndicator) {
            confidenceIndicator.remove();
        }

        // Add premium animations and transitions
        document.querySelectorAll('.nutrition-item, .nutrient-detail').forEach(item => {
            item.classList.add('premium-card-animation');
        });

        // Reorder sections
        moveChartSection();
    }

    /**
     * Reorders sections by moving sections in the desired order
     */
    function moveChartSection() {
        // Wait for DOM to be fully ready before reordering
        setTimeout(() => {
            // Get all the sections that need to be reordered
            const foodNameSection = document.querySelector('.food-name-section');
            if (!foodNameSection) return; // Exit if sections don't exist yet

            const calorieSection = document.querySelector('.calorie-summary');
            const detailedNutrients = document.querySelector('.detailed-nutrients');
            const nutritionGrid = document.querySelector('.nutrition-grid');
            const additionalInfo = document.querySelector('.additional-info');
            const actionButtons = document.querySelector('.action-buttons');
            const detectedFoodDescription = document.querySelector('.detected-food-description');

            // Get the parent element
            const parent = foodNameSection.parentNode;
            if (!parent) return;

            // First, ensure the food name section appears first (right after the image)
            if (parent.firstChild) {
                parent.insertBefore(foodNameSection, parent.firstChild);
            }

            // Then arrange other sections in the desired order
            if (nutritionGrid) parent.appendChild(nutritionGrid);
            if (detailedNutrients) parent.appendChild(detailedNutrients);
            if (calorieSection) parent.appendChild(calorieSection);
            if (detectedFoodDescription) parent.appendChild(detectedFoodDescription);
            if (additionalInfo) parent.appendChild(additionalInfo);
            if (actionButtons) parent.appendChild(actionButtons);

            console.log("Sections reordered with food name section first");
        }, 100);
    }

    /**
     * Handles the image upload process
     */
    function handleImageUpload(event) {
        console.log("handleImageUpload function called");

        const file = event.target.files[0];
        if (!file) {
            console.error("No file found in event");
            return;
        }

        console.log("Processing file:", file.name, "Size:", file.size, "Type:", file.type);

        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file');
            return;
        }

        try {
            // Show the analysis results section
            analysisResults.classList.remove('hidden');
            console.log("Analysis results section shown");

            // Display image preview
            const reader = new FileReader();

            reader.onload = function (e) {
                console.log("FileReader loaded successfully");
                foodImagePreview.src = e.target.result;
                console.log("Image preview source set");

                // Add a subtle zoom animation to the image
                foodImagePreview.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    foodImagePreview.style.transition = 'transform 0.5s ease-out';
                    foodImagePreview.style.transform = 'scale(1)';
                }, 50);
            };

            reader.onerror = function (e) {
                console.error("FileReader error:", e);
                displayError("Error reading the image file. Please try again with a different image.");
            };

            console.log("Starting to read file as Data URL");
            reader.readAsDataURL(file);

            // Show loader, hide results
            loader.classList.remove('hidden');
            resultsData.classList.add('hidden');
            console.log("Loader shown, results hidden");

            // If server is offline, use simulated data
            if (!isServerOnline) {
                console.log('Server is offline, using simulated data');
                setTimeout(() => {
                    const foodTypes = ['pizza', 'salad', 'pasta', 'burger', 'sushi', 'sandwich', 'soup'];
                    const randomFoodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
                    displaySimulatedResults(randomFoodType);
                }, 1500); // Simulate API delay
            } else {
                // Process the image with LogMeal API
                console.log("Server is online, processing with API");
                convertToBase64(file)
                    .then(base64Image => {
                        console.log("Image converted to base64 successfully, length:", base64Image.length);
                        analyzeWithLogMeal(base64Image);
                    })
                    .catch(error => {
                        console.error("Error processing image:", error);
                        displayError("We encountered an error processing your image. Please try again.");
                    });
            }

            // Scroll to analysis section
            analysisResults.scrollIntoView({ behavior: 'smooth' });
            console.log("Scrolled to analysis section");
        } catch (error) {
            console.error("Error in handleImageUpload:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    }

    /**
     * Converts an image file to base64 encoding for API submission
     */
    function convertToBase64(file) {
        console.log("convertToBase64 function called with file:", file.name);
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();

                reader.onload = () => {
                    try {
                        console.log("FileReader loaded successfully in convertToBase64");
                        // Check if result is available
                        if (!reader.result) {
                            console.error("FileReader result is null or undefined");
                            reject(new Error("Failed to read file data"));
                            return;
                        }

                        // Get the base64 string without metadata
                        const parts = reader.result.split(',');
                        if (parts.length < 2) {
                            console.error("Invalid FileReader result format");
                            reject(new Error("Invalid file data format"));
                            return;
                        }

                        const base64String = parts[1];
                        console.log("Base64 conversion successful, length:", base64String.length);
                        resolve(base64String);
                    } catch (error) {
                        console.error("Error processing FileReader result:", error);
                        reject(error);
                    }
                };

                reader.onerror = (error) => {
                    console.error("FileReader error in convertToBase64:", error);
                    reject(new Error("Error reading the file: " + (error.message || "Unknown error")));
                };

                reader.onabort = () => {
                    console.error("FileReader aborted");
                    reject(new Error("File reading was aborted"));
                };

                console.log("Starting to read file as Data URL in convertToBase64");
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Exception in convertToBase64:", error);
                reject(error);
            }
        });
    }

    /**
     * Resets the analysis and returns to upload state
     */
    function resetAnalysis() {
        // Reset UI
        analysisResults.classList.add('hidden');
        document.querySelector('.hero').classList.remove('hidden');

        // Clear file input
        fileInput.value = '';

        // Reset charts
        if (nutrientChart) {
            nutrientChart.destroy();
            nutrientChart = null;
        }
        if (nutrientBreakdownChart) {
            nutrientBreakdownChart.destroy();
            nutrientBreakdownChart = null;
        }

        // Clean up any D3.js visualizations if present
        cleanupD3Visualizations();

        // Scroll back to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Clean up any D3.js visualizations to prevent memory leaks
     */
    function cleanupD3Visualizations() {
        // Check if d3 is available and being used
        if (window.d3) {
            // Clear any existing d3 SVG visualizations
            d3.selectAll('.d3-visualization svg').remove();
        }
    }

    /**
     * Handle sample food button clicks
     */
    async function uploadPlaceholderImage(foodName) {
        console.log(`Processing sample food: ${foodName}`);

        // Reset UI and show loading state
        resetAnalysis();
        analysisResults.classList.remove('hidden');
        document.querySelector('.hero').classList.add('hidden');
        loader.classList.remove('hidden');

        // Set placeholder image based on food type
        const placeholderImages = {
            'Pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
            'Salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
            'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
            'Sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
            'Pasta': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8'
        };

        const imageUrl = placeholderImages[foodName] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
        foodImagePreview.src = `${imageUrl}?auto=format&fit=crop&w=800&q=80`;
        foodImagePreview.alt = `${foodName} sample image`;

        try {
            if (isServerOnline) {
                // Fetch sample food data from backend
                const response = await fetch(`${BACKEND_SAMPLE_FOOD_ENDPOINT}/${foodName}`);

                if (!response.ok) {
                    throw new Error(`Error fetching sample data: ${response.status}`);
                }

                const sampleData = await response.json();

                // Display the sample data
                displayResults(sampleData.food);
            } else {
                // Use fallback data if server is offline
                const fallbackData = getSampleFoodData(foodName);
                displayResults(fallbackData);
            }
        } catch (error) {
            console.error('Error processing sample food:', error);
            const fallbackData = getSampleFoodData(foodName);
            displayResults(fallbackData);
        }
    }

    /**
     * Analyzes the food image using the LogMeal API
     */
    async function analyzeWithLogMeal(base64Image, searchTerm = null) {
        try {
            console.log("Attempting to use LogMeal API through our backend...");

            // For sample foods, use simulated results
            if (searchTerm) {
                console.log("Using simulated results for sample food:", searchTerm);
                displaySimulatedResults(searchTerm);
                return;
            }

            if (!base64Image) {
                throw new Error("No image data provided");
            }

            // Convert base64 back to a file for our backend
            const blob = await fetch(`data:image/jpeg;base64,${base64Image}`).then(res => res.blob());
            const file = new File([blob], "food-image.jpg", { type: "image/jpeg" });

            // Create FormData to send to our backend
            const formData = new FormData();
            formData.append('image', file);

            // Create a timeout promise for the API request
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), 15000);
            });

            // Step 1: Send to our backend which will call the LogMeal API for food recognition
            let recognitionResponse;
            try {
                recognitionResponse = await Promise.race([
                    fetch(BACKEND_RECOGNITION_ENDPOINT, {
                        method: 'POST',
                        body: formData
                    }),
                    timeoutPromise
                ]);
            } catch (fetchError) {
                console.error("Network error connecting to backend:", fetchError);
                // Server is likely offline, use simulated data as fallback
                isServerOnline = false;
                const foodTypes = ['pizza', 'salad', 'pasta', 'burger', 'sushi', 'sandwich', 'soup'];
                const randomFoodType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
                displaySimulatedResults(randomFoodType);
                return;
            }

            if (!recognitionResponse.ok) {
                const errorData = await recognitionResponse.json().catch(() => ({}));
                console.error("Backend API error:", errorData);
                let errorMessage = 'Unknown error processing the image.';

                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.details) {
                    errorMessage = errorData.details;
                }

                throw new Error(errorMessage);
            }

            const recognitionData = await recognitionResponse.json();
            console.log("API Response:", recognitionData);

            // Check if we have segmentation results
            if (!recognitionData || !recognitionData.segmentation_results || recognitionData.segmentation_results.length === 0) {
                console.log("No food detected in the API response");
                displayNonFoodMessage();
                return;
            }

            // Get the imageId for nutrition API call
            const imageId = recognitionData.imageId;
            if (!imageId) {
                console.log("No imageId in the response");
                displayError("Invalid API response. Please try again.");
                return;
            }

            // Get the top result from segmentation_results
            const segmentationResults = recognitionData.segmentation_results;
            // Find the result with highest confidence
            const topResult = segmentationResults.reduce((highest, current) => {
                return (current.recognition_results[0].prob > highest.recognition_results[0].prob) ? current : highest;
            }, segmentationResults[0]);

            const foodResult = topResult.recognition_results[0];
            const foodName = foodResult.name;

            // Log successful recognition
            console.log(`Food recognized: ${foodName}`);

            let nutritionData = null;
            let ingredientsData = null;

            // Step 2: Get nutritional information using imageId
            try {
                const nutritionResponse = await Promise.race([
                    fetch(BACKEND_NUTRITION_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            imageId: imageId
                        })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Nutrition data timeout')), 10000))
                ]);

                if (nutritionResponse.ok) {
                    nutritionData = await nutritionResponse.json();
                    console.log("Nutrition data:", nutritionData);
                } else {
                    console.warn("Failed to get nutrition data, will display limited results");
                }
            } catch (nutritionError) {
                console.error("Error fetching nutrition data:", nutritionError);
            }

            // Step 3: Get ingredients information using imageId
            try {
                const ingredientsResponse = await Promise.race([
                    fetch(BACKEND_INGREDIENTS_ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            imageId: imageId
                        })
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Ingredients data timeout')), 10000))
                ]);

                if (ingredientsResponse.ok) {
                    ingredientsData = await ingredientsResponse.json();
                    console.log("Ingredients data:", ingredientsData);
                } else {
                    console.warn("Failed to get ingredients data, will display limited results");
                }
            } catch (ingredientsError) {
                console.error("Error fetching ingredients data:", ingredientsError);
            }

            // Format the data for display
            const foodData = formatLogMealData(foodName, nutritionData, ingredientsData, recognitionData);

            // Display the results
            displayResults(foodData);

        } catch (error) {
            console.error("Error analyzing with LogMeal:", error);
            displayError(error.message || "We encountered an error analyzing your food. Please try again.");
        }
    }

    /**
     * Formats the API response data for UI display
     */
    function formatLogMealData(foodName, nutritionData, ingredientsData, recognitionData) {
        // Create a basic structure with enhanced naming
        const foodData = {
            originalName: foodName,
            name: enhanceFoodName(foodName),
            servingSize: "Standard serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugars: 0,
            sodium: 0,
            cholesterol: 0,
            potassium: 0,
            vitaminA: 0,
            vitaminC: 0,
            calcium: 0,
            iron: 0,
            details: [],
            similarFoods: [],
            ingredients: [],
            foodGroup: "",
            description: ""
        };

        // Add nutrition data if available
        if (nutritionData && nutritionData.nutritional_info) {
            const nutrients = nutritionData.nutritional_info.totalNutrients;

            if (nutritionData.serving_size) {
                foodData.servingSize = `${nutritionData.serving_size}g`;
            }

            if (nutrients.ENERC_KCAL) foodData.calories = Math.round(nutrients.ENERC_KCAL.quantity);
            if (nutrients.PROCNT) foodData.protein = Math.round(nutrients.PROCNT.quantity);
            if (nutrients.CHOCDF) foodData.carbs = Math.round(nutrients.CHOCDF.quantity);
            if (nutrients.FAT) foodData.fat = Math.round(nutrients.FAT.quantity);
            if (nutrients.FIBTG) foodData.fiber = Math.round(nutrients.FIBTG.quantity * 10) / 10;
            if (nutrients.SUGAR) foodData.sugars = Math.round(nutrients.SUGAR.quantity * 10) / 10;
            if (nutrients.NA) foodData.sodium = Math.round(nutrients.NA.quantity);
            if (nutrients.CHOLE) foodData.cholesterol = Math.round(nutrients.CHOLE.quantity);
            if (nutrients.K) foodData.potassium = Math.round(nutrients.K.quantity);
            if (nutrients.VITA_RAE) foodData.vitaminA = Math.round(nutrients.VITA_RAE.quantity / 9);
            if (nutrients.VITC) foodData.vitaminC = Math.round(nutrients.VITC.quantity / 0.9);
            if (nutrients.CA) foodData.calcium = Math.round(nutrients.CA.quantity / 13);
            if (nutrients.FE) foodData.iron = Math.round(nutrients.FE.quantity / 0.18);

            // Add specialized nutrition information for macro cards
            if (nutrients.FASAT) {
                foodData.saturatedFat = Math.round(nutrients.FASAT.quantity);
                foodData.details.push(`Saturated Fat: ${foodData.saturatedFat}g`);
            }

            if (nutrients.VITB12) {
                foodData.vitaminB12 = Math.round(nutrients.VITB12.quantity * 100) / 100;
                foodData.details.push(`Vitamin B12: ${foodData.vitaminB12}µg`);
            }

            // Add calories info to details
            foodData.details.push(`Calories: ${foodData.calories} kcal per serving`);
        }

        // Add ingredients data if available
        if (ingredientsData && ingredientsData.recipe) {
            const ingredients = ingredientsData.recipe;

            if (ingredients.length > 0) {
                ingredients.forEach(ingredient => {
                    const quantity = ingredient.measure.preferred.quantity;
                    const unit = ingredient.measure.preferred.short || ingredient.measure.preferred.name;
                    foodData.ingredients.push(`${ingredient.name}: ${quantity}${unit}`);
                });
            }

            // Add food group if available
            if (ingredientsData.recipe_per_item && ingredientsData.recipe_per_item[0].foodGroups) {
                foodData.foodGroup = ingredientsData.recipe_per_item[0].foodGroups[0].name;
            }

            // Add food description from the API if available
            if (ingredientsData.foodName && ingredientsData.foodName.length > 0) {
                const apiDescription = `${ingredientsData.foodName[0]} is a dish that typically contains ${ingredients.map(i => i.name).join(', ')}.`;
                foodData.description = apiDescription;
            }
        }

        // Add similar foods if available from the recognition data
        if (recognitionData && recognitionData.segmentation_results) {
            const segmentResults = recognitionData.segmentation_results || [];
            segmentResults.forEach(segment => {
                segment.recognition_results.forEach(result => {
                    if (result.subclasses && result.subclasses.length > 0) {
                        result.subclasses.forEach(subclass => {
                            foodData.similarFoods.push(enhanceFoodName(subclass.name));
                        });
                    }
                });
            });
        }

        return foodData;
    }

    /**
     * Displays the food analysis results in the UI
     */
    function displayResults(foodData) {
        // Make sure we validate and normalize data
        foodData = normalizeNutrientData(foodData);

        // Hide loader
        loader.classList.add('hidden');

        // Show results data
        resultsData.classList.remove('hidden');

        // Update UI with food data
        detectedFoodInput.value = foodData.name;
        calories.textContent = Math.round(foodData.calories);
        protein.textContent = foodData.protein + 'g';
        carbs.textContent = foodData.carbs + 'g';
        fat.textContent = foodData.fat + 'g';

        // Calculate percentages (based on 2000 calorie diet)
        const proteinPct = Math.round((foodData.protein * 4 / 2000) * 100);
        const carbsPct = Math.round((foodData.carbs * 4 / 2000) * 100);
        const fatPct = Math.round((foodData.fat * 9 / 2000) * 100);

        proteinPercent.textContent = proteinPct + '%';
        carbsPercent.textContent = carbsPct + '%';
        fatPercent.textContent = fatPct + '%';

        // Set progress bar widths
        document.querySelector('.protein-fill').style.width = `${Math.min(100, proteinPct * 1.2)}%`;
        document.querySelector('.carbs-fill').style.width = `${Math.min(100, carbsPct * 1.2)}%`;
        document.querySelector('.fat-fill').style.width = `${Math.min(100, fatPct * 1.2)}%`;

        servingSize.textContent = foodData.servingSize || 'Standard serving';

        // Update food description
        if (foodData.description) {
            document.getElementById('food-description').textContent = foodData.description;
        } else {
            document.getElementById('food-description').textContent =
                `${foodData.name} is a popular food choice with nutritional benefits that include protein, carbohydrates, and various micronutrients essential for a balanced diet.`;
        }

        // Show "Other Names" suggestions with enhanced styling
        suggestionChips.innerHTML = '';
        if (foodData.similarFoods && foodData.similarFoods.length > 0) {
            foodData.similarFoods.forEach(food => {
                const chip = document.createElement('span');
                chip.className = 'suggestion-chip';
                chip.innerHTML = `<i class="fas fa-utensils"></i> ${food}`;
                suggestionChips.appendChild(chip);
            });
        } else {
            // Add default similar foods based on category
            const defaultSimilarFoods = {
                'Pizza': ['Flatbread', 'Calzone', 'Stromboli'],
                'Burger': ['Sandwich', 'Slider', 'Patty Melt'],
                'Salad': ['Garden Mix', 'Caesar', 'Coleslaw'],
                'Pasta': ['Spaghetti', 'Fettuccine', 'Macaroni'],
                'Sushi': ['Maki', 'Nigiri', 'Sashimi']
            };

            const similarities = defaultSimilarFoods[foodData.name] ||
                ['Similar dish', 'Local variant', 'Alternate recipe'];

            similarities.forEach(food => {
                const chip = document.createElement('span');
                chip.className = 'suggestion-chip';
                chip.innerHTML = `<i class="fas fa-utensils"></i> ${food}`;
                suggestionChips.appendChild(chip);
            });
        }

        // Add nutrition cards dynamically based on API data
        updateMacroCards(foodData);

        // Update ingredients section with enhanced styling
        if (foodData.ingredients && foodData.ingredients.length > 0) {
            updateIngredientsSection(foodData);
        } else {
            // Create default ingredients section if none provided
            const defaultIngredients = {
                'Pizza': ['Flour', 'Tomato Sauce', 'Cheese', 'Olive Oil'],
                'Burger': ['Beef Patty', 'Bun', 'Lettuce', 'Tomato', 'Cheese'],
                'Salad': ['Lettuce', 'Tomato', 'Cucumber', 'Dressing'],
                'Pasta': ['Pasta', 'Tomato Sauce', 'Herbs', 'Cheese'],
                'Sushi': ['Rice', 'Fish', 'Seaweed', 'Vegetables']
            };

            const ingredients = defaultIngredients[foodData.name] ||
                ['Main ingredient', 'Secondary ingredients', 'Flavorings'];

            foodData.ingredients = ingredients;
            updateIngredientsSection(foodData);
        }

        // Create or update the charts
        createNutrientChart(foodData);

        // Wait a brief moment before initializing the detailed chart
        // This helps with layout calculations and chart rendering
        setTimeout(() => {
            createNutrientBreakdownChart(foodData);
        }, 100);

        // Re-initialize tooltips for dynamic elements
        initTooltips();

        // Ensure proper section ordering
        moveChartSection();
    }

    /**
     * Normalize and validate nutrient data to avoid errors in charts
     */
    function normalizeNutrientData(foodData) {
        // Create a copy to avoid modifying the original
        const normalizedData = { ...foodData };

        // Ensure all critical nutrient properties exist and are numbers
        const requiredNutrients = [
            'calories', 'protein', 'carbs', 'fat', 'fiber',
            'sugars', 'sodium', 'cholesterol', 'potassium', 'saturatedFat'
        ];

        requiredNutrients.forEach(nutrient => {
            // If property doesn't exist or isn't a number, set a default
            if (typeof normalizedData[nutrient] !== 'number' || isNaN(normalizedData[nutrient])) {
                // Convert from string if possible
                if (typeof normalizedData[nutrient] === 'string' && !isNaN(normalizedData[nutrient])) {
                    normalizedData[nutrient] = parseFloat(normalizedData[nutrient]);
                } else {
                    // Otherwise use a default value
                    normalizedData[nutrient] = nutrient === 'calories' ? 200 : 5;
                }
            }
        });

        // Ensure strings are properly initialized
        if (!normalizedData.name || typeof normalizedData.name !== 'string') {
            normalizedData.name = "Unknown Food";
        }

        if (!normalizedData.description || typeof normalizedData.description !== 'string') {
            normalizedData.description = `${normalizedData.name} is a nutritious food item containing various essential nutrients.`;
        }

        // Ensure arrays are properly initialized
        if (!Array.isArray(normalizedData.ingredients)) {
            normalizedData.ingredients = ["Various ingredients"];
        }

        if (!Array.isArray(normalizedData.similarFoods)) {
            normalizedData.similarFoods = ["Similar foods"];
        }

        return normalizedData;
    }

    /**
     * Updates the ingredients section with enhanced styling
     */
    function updateIngredientsSection(foodData) {
        const additionalInfo = document.querySelector('.additional-info');

        // Create the ingredients section
        let ingredientsHTML = `
            <h4><i class="fas fa-mortar-pestle"></i> Ingredients</h4>
            <div class="ingredients-list">
        `;

        // Add each ingredient with icon and animation
        foodData.ingredients.forEach(ingredient => {
            ingredientsHTML += `
                <div class="ingredient-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${ingredient}</span>
                </div>
            `;
        });

        // Close the ingredients list
        ingredientsHTML += `</div>`;

        // Add food group if available
        if (foodData.foodGroup) {
            ingredientsHTML += `
                <div class="food-group-tag">
                    <i class="fas fa-layer-group"></i> Food group: ${foodData.foodGroup}
                </div>
            `;
        }

        // Update the section
        additionalInfo.innerHTML = ingredientsHTML;

        // Apply animation delays to ingredients
        document.querySelectorAll('.ingredient-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }

    /**
     * Updates the macro cards to display nutrition components provided by the API
     */
    function updateMacroCards(foodData) {
        const nutritionGrid = document.querySelector('.nutrition-grid');

        // Remove any previously added cards 
        nutritionGrid.innerHTML = '';

        // Array of potential nutrients with their icons, colors, and daily values where applicable
        const nutrientConfig = [
            {
                name: 'Protein',
                key: 'protein',
                unit: 'g',
                icon: 'fas fa-drumstick-bite',
                colorClass: 'protein-color',
                dailyValue: 50 // 50g recommended daily
            },
            {
                name: 'Carbs',
                key: 'carbs',
                unit: 'g',
                icon: 'fas fa-bread-slice',
                colorClass: 'carbs-color',
                dailyValue: 275 // 275g recommended daily
            },
            {
                name: 'Fat',
                key: 'fat',
                unit: 'g',
                icon: 'fas fa-oil-can',
                colorClass: 'fat-color',
                dailyValue: 78 // 78g recommended daily
            },
            {
                name: 'Calories',
                key: 'calories',
                unit: 'kcal',
                icon: 'fas fa-fire',
                colorClass: 'calories-color',
                dailyValue: 2000 // 2000 kcal average daily
            },
            {
                name: 'Saturated Fat',
                key: 'saturatedFat',
                unit: 'g',
                icon: 'fas fa-bacon',
                colorClass: 'sat-fat-color',
                dailyValue: 20 // 20g recommended limit
            },
            {
                name: 'Vitamin B12',
                key: 'vitaminB12',
                unit: 'µg',
                icon: 'fas fa-capsules',
                colorClass: 'vitamin-color',
                dailyValue: 2.4 // 2.4µg recommended daily
            },
            {
                name: 'Fiber',
                key: 'fiber',
                unit: 'g',
                icon: 'fas fa-seedling',
                colorClass: 'fiber-color',
                dailyValue: 28 // 28g recommended daily
            },
            {
                name: 'Sugars',
                key: 'sugars',
                unit: 'g',
                icon: 'fas fa-candy-cane',
                colorClass: 'sugar-color',
                dailyValue: 50 // 50g recommended limit
            },
            {
                name: 'Sodium',
                key: 'sodium',
                unit: 'mg',
                icon: 'fas fa-cube', // using cube instead of salt-shaker which may not be available
                colorClass: 'sodium-color',
                dailyValue: 2300 // 2300mg recommended limit
            },
            {
                name: 'Potassium',
                key: 'potassium',
                unit: 'mg',
                icon: 'fas fa-leaf',
                colorClass: 'potassium-color',
                dailyValue: 4700 // 4700mg recommended daily
            },
            {
                name: 'Cholesterol',
                key: 'cholesterol',
                unit: 'mg',
                icon: 'fas fa-egg',
                colorClass: 'cholesterol-color',
                dailyValue: 300 // 300mg recommended limit
            },
            {
                name: 'Vitamin A',
                key: 'vitaminA',
                unit: '%',
                icon: 'fas fa-eye',
                colorClass: 'vitamin-a-color'
            },
            {
                name: 'Vitamin C',
                key: 'vitaminC',
                unit: '%',
                icon: 'fas fa-lemon',
                colorClass: 'vitamin-c-color'
            },
            {
                name: 'Calcium',
                key: 'calcium',
                unit: '%',
                icon: 'fas fa-bone',
                colorClass: 'calcium-color'
            },
            {
                name: 'Iron',
                key: 'iron',
                unit: '%',
                icon: 'fas fa-dumbbell',
                colorClass: 'iron-color'
            }
        ];

        // Filter nutrients that actually have values in the food data
        const availableNutrients = nutrientConfig.filter(nutrient =>
            foodData[nutrient.key] !== undefined &&
            foodData[nutrient.key] !== null &&
            foodData[nutrient.key] !== 0
        );

        // Create cards for available nutrients (up to 8 cards max for UI clarity)
        availableNutrients.slice(0, 8).forEach(nutrient => {
            const card = document.createElement('div');
            card.className = 'nutrition-item';

            // Calculate percentage of daily value if applicable
            let percentageHTML = '';
            let percentBar = '';

            if (nutrient.dailyValue) {
                const percentValue = Math.min(Math.round((foodData[nutrient.key] / nutrient.dailyValue) * 100), 100);

                percentageHTML = `<span class="percentage">${percentValue}% DV</span>`;
                percentBar = `
                    <div class="nutrient-bar">
                        <div class="nutrient-fill" style="width: ${percentValue}%; background-color: var(--${nutrient.colorClass})"></div>
                    </div>
                `;
            }

            card.innerHTML = `
                <i class="${nutrient.icon}" style="color: var(--${nutrient.colorClass})"></i>
                <h4>${nutrient.name}</h4>
                <p>${foodData[nutrient.key]}${nutrient.unit}</p>
                ${percentBar}
                ${percentageHTML}
            `;
            nutritionGrid.appendChild(card);
        });

        // Apply premium animation to all cards
        document.querySelectorAll('.nutrition-item').forEach(card => {
            card.classList.add('premium-card-animation');
        });
    }

    /**
     * Creates an enhanced pie chart showing the macronutrient breakdown
     */
    function createNutrientChart(foodData) {
        // Check if the chart container exists
        const chartContainer = document.getElementById('nutrient-chart');

        if (!chartContainer || !chartCenterText) {
            console.warn('Chart container or center text element not found');
            return;
        }

        // Calculate calorie contribution of each macronutrient
        // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g, Fiber: 2 cal/g (estimated)
        const proteinCals = foodData.protein * 4;
        const carbsCals = foodData.carbs * 4;
        const fatCals = foodData.fat * 9;
        const fiberCals = (foodData.fiber || 0) * 2;
        const sugarCals = (foodData.sugars || 0) * 4; // Sugars are a subset of carbs

        // Set chart center text to only show calories with kcal unit
        chartCenterText.innerHTML = `
            <div class="calories-value">${foodData.calories} kcal</div>
        `;

        // If a chart already exists, destroy it to prevent duplicates
        if (nutrientChart) {
            try {
                nutrientChart.destroy();
            } catch (e) {
                console.warn('Error destroying existing chart:', e);
            }
        }

        try {
            // Create a new chart with enhanced styling
            const ctx = chartContainer.getContext('2d');

            // Get colors from CSS variables
            const proteinColor = getComputedStyle(document.documentElement).getPropertyValue('--protein-color').trim();
            const carbsColor = getComputedStyle(document.documentElement).getPropertyValue('--carbs-color').trim();
            const fatColor = getComputedStyle(document.documentElement).getPropertyValue('--fat-color').trim();
            const sugarColor = getComputedStyle(document.documentElement).getPropertyValue('--sugar-color').trim();
            const fiberColor = getComputedStyle(document.documentElement).getPropertyValue('--fiber-color').trim();

            nutrientChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fat', 'Fiber', 'Sugars'],
                    datasets: [{
                        data: [proteinCals, carbsCals - sugarCals - fiberCals, fatCals, fiberCals, sugarCals],
                        backgroundColor: [
                            proteinColor,
                            carbsColor,
                            fatColor,
                            fiberColor,
                            sugarColor
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    layout: {
                        padding: 20
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} kcal (${percentage}%)`;
                                }
                            },
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: '#333',
                            bodyColor: '#666',
                            titleFont: {
                                size: 16,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 14
                            },
                            padding: 12,
                            boxPadding: 10,
                            displayColors: true
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 2000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating nutrient chart:', error);
        }
    }

    /**
     * Create a horizontal bar chart for nutrient breakdown
     */
    function createNutrientBreakdownChart(foodData) {
        // First check for chart container
        const chartContainer = document.getElementById('nutrientBreakdownChart');
        if (!chartContainer) {
            console.warn('Chart container not found');
            return;
        }

        // Force clear any previous chart to avoid conflicts
        chartContainer.innerHTML = '';

        // Log food data for debugging
        console.log('Creating nutrient breakdown chart with data:', foodData);

        // Ensure ApexCharts is loaded
        if (typeof ApexCharts === 'undefined') {
            console.warn('ApexCharts library not loaded');
            chartContainer.innerHTML = '<div class="chart-fallback">Detailed nutrient chart unavailable. Please ensure all libraries are loaded.</div>';
            return;
        }

        // Ensure all nutrients are properly normalized
        foodData = normalizeNutrientData(foodData);

        // Define nutrients to display with default values if missing
        const nutrients = [
            { name: 'Protein', key: 'protein', color: '#4CAF50', unit: 'g', dailyValue: 50 },
            { name: 'Carbs', key: 'carbs', color: '#FF9800', unit: 'g', dailyValue: 300 },
            { name: 'Fat', key: 'fat', color: '#F44336', unit: 'g', dailyValue: 65 },
            { name: 'Fiber', key: 'fiber', color: '#795548', unit: 'g', dailyValue: 25 },
            { name: 'Sugars', key: 'sugars', color: '#E91E63', unit: 'g', dailyValue: 50 },
            { name: 'Sodium', key: 'sodium', color: '#9C27B0', unit: 'mg', dailyValue: 2300 },
            { name: 'Potassium', key: 'potassium', color: '#009688', unit: 'mg', dailyValue: 3500 },
            { name: 'Vitamin A', key: 'vitaminA', color: '#FF5722', unit: 'μg', dailyValue: 900 },
            { name: 'Vitamin C', key: 'vitaminC', color: '#8BC34A', unit: 'mg', dailyValue: 90 },
            { name: 'Calcium', key: 'calcium', color: '#2196F3', unit: 'mg', dailyValue: 1300 },
            { name: 'Iron', key: 'iron', color: '#607D8B', unit: 'mg', dailyValue: 18 }
        ];

        // Filter to include only nutrients that are present in the API response
        const availableNutrients = nutrients.filter(nutrient => {
            const value = parseFloat(foodData[nutrient.key]);
            return !isNaN(value) && value > 0;
        });

        // If no nutrients available, show message
        if (availableNutrients.length === 0) {
            chartContainer.innerHTML = '<div class="no-data-message">No detailed nutrient data available for this food.</div>';
            return;
        }

        // Prepare data arrays for available nutrients
        const nutrientNames = availableNutrients.map(n => n.name);
        const nutrientValues = availableNutrients.map(n => parseFloat(foodData[n.key]));
        const nutrientColors = availableNutrients.map(n => n.color);
        const nutrientUnits = availableNutrients.map(n => n.unit);
        const nutrientDailyValues = availableNutrients.map(n => n.dailyValue);

        // Try to destroy any existing chart
        try {
            if (window.nutrientBreakdownChart) {
                window.nutrientBreakdownChart.destroy();
            }
        } catch (e) {
            console.warn('Error destroying existing chart', e);
        }

        // Generate fallback HTML in case chart rendering fails
        let fallbackHTML = '<div class="nutrient-fallback-container">';
        fallbackHTML += '<div class="fallback-title">Nutrient Breakdown</div>';

        for (let i = 0; i < availableNutrients.length; i++) {
            const value = nutrientValues[i];
            const percent = Math.min((value / nutrientDailyValues[i]) * 100, 100); // Cap at 100% for display

            // Format value for display
            let displayValue;
            if (value >= 1000) {
                displayValue = (value / 1000).toFixed(1) + ' ' + nutrientUnits[i].replace('mg', 'g');
            } else if (value >= 10) {
                displayValue = Math.round(value) + ' ' + nutrientUnits[i];
            } else {
                displayValue = value.toFixed(1) + ' ' + nutrientUnits[i];
            }

            fallbackHTML += `
                <div class="nutrient-fallback-item">
                    <div class="nutrient-fallback-name">${nutrientNames[i]}</div>
                    <div class="nutrient-fallback-bar-container">
                        <div class="nutrient-fallback-bar" style="width: ${percent}%; background-color: ${nutrientColors[i]}"></div>
                    </div>
                    <div class="nutrient-fallback-value">${displayValue}</div>
                </div>
            `;
        }
        fallbackHTML += '</div>';

        // Value formatter for data labels and tooltips
        const valueFormatter = function (value, opts) {
            const index = opts?.dataPointIndex || 0;
            if (index >= nutrientUnits.length) return value;

            // Format large values appropriately
            if (value >= 1000 && nutrientUnits[index] === 'mg') {
                return (value / 1000).toFixed(1) + 'g';
            } else if (value >= 10) {
                return Math.round(value) + nutrientUnits[index];
            } else {
                return value.toFixed(1) + nutrientUnits[index];
            }
        };

        // Create chart options
        const chartOptions = {
            series: [{
                name: 'Amount',
                data: nutrientValues
            }],
            chart: {
                type: 'bar',
                height: 600,
                fontFamily: 'Arial, Helvetica, sans-serif',
                toolbar: {
                    show: false
                },
                background: '#ffffff',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                }
            },
            legend: {
                show: false
            },
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    distributed: true,
                    dataLabels: {
                        position: 'top'
                    },
                    barHeight: '70%',
                    columnWidth: '70%'
                }
            },
            colors: nutrientColors,
            dataLabels: {
                enabled: true,
                formatter: valueFormatter,
                style: {
                    fontSize: '18px',
                    fontWeight: '800',
                    colors: ['#000000'],
                    fontFamily: 'Montserrat, Arial, sans-serif'
                },
                offsetY: -30,
                background: {
                    enabled: false
                }
            },
            xaxis: {
                categories: nutrientNames,
                labels: {
                    style: {
                        fontSize: '14px',
                        fontWeight: 500,
                        colors: '#333333'
                    },
                    rotate: -45,
                    rotateAlways: false
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    formatter: function (val) {
                        if (val >= 1000) {
                            return (val / 1000).toFixed(1) + 'k';
                        }
                        return val.toFixed(0);
                    },
                    style: {
                        fontSize: '15px',
                        fontWeight: 500,
                        colors: '#333333'
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function (val, opts) {
                        const index = opts.dataPointIndex;
                        const unit = nutrientUnits[index];
                        const dailyValue = nutrientDailyValues[index];

                        // Calculate percentage of daily value
                        const percentOfDaily = ((val / dailyValue) * 100).toFixed(1);

                        // Format display value
                        let displayValue;
                        if (val >= 1000 && unit === 'mg') {
                            displayValue = (val / 1000).toFixed(1) + ' g';
                        } else if (val >= 10) {
                            displayValue = Math.round(val) + ' ' + unit;
                        } else {
                            displayValue = val.toFixed(1) + ' ' + unit;
                        }

                        return `
                            <div class="custom-tooltip">
                                <div class="tooltip-title">${nutrientNames[index]}</div>
                                <div class="tooltip-value">${displayValue}</div>
                                <div class="tooltip-daily">${percentOfDaily}% of daily value</div>
                            </div>
                        `;
                    }
                },
                theme: 'light',
                marker: {
                    show: true,
                },
                fixed: {
                    enabled: false,
                    position: 'topRight',
                    offsetX: 0,
                    offsetY: 0,
                },
            },
            grid: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.9
                    }
                },
                active: {
                    filter: {
                        type: 'darken',
                        value: 0.85
                    }
                }
            }
        };

        // After the chart rendering is complete, add a custom legend
        try {
            window.nutrientBreakdownChart = new ApexCharts(chartContainer, chartOptions);
            window.nutrientBreakdownChart.render();

            // Add a better custom legend with animation effects
            setTimeout(() => {
                addEnhancedLegend(chartContainer, nutrientNames, nutrientColors);
            }, 300);
        } catch (error) {
            console.error('Error rendering nutrient breakdown chart', error);
            chartContainer.innerHTML = fallbackHTML;
        }
    }

    /**
     * Helper function to shade a color lighter or darker
     * @param {string} color - Hex color code
     * @param {number} percent - Positive for lighter, negative for darker
     * @returns {string} - New hex color
     */
    function shadeColor(color, percent) {
        // Ensure color is valid hex code
        if (!color || typeof color !== 'string' || !color.startsWith('#') || color.length < 7) {
            return '#4361EE'; // Return a default color if input is invalid
        }

        try {
            let R = parseInt(color.substring(1, 3), 16);
            let G = parseInt(color.substring(3, 5), 16);
            let B = parseInt(color.substring(5, 7), 16);

            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);

            R = (R < 255) ? R : 255;
            G = (G < 255) ? G : 255;
            B = (B < 255) ? B : 255;

            // Ensure values are at least 0
            R = (R >= 0) ? R : 0;
            G = (G >= 0) ? G : 0;
            B = (B >= 0) ? B : 0;

            const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
            const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
            const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

            return "#" + RR + GG + BB;
        } catch (e) {
            console.error("Error in shadeColor function:", e);
            return color; // Return original color if there's an error
        }
    }

    /**
     * Initialize tooltips for enhanced UI elements
     */
    function initTooltips() {
        tippy('[data-tippy-content]', {
            theme: 'light',
            animation: 'scale',
            arrow: true,
            placement: 'top',
            maxWidth: 300,
            duration: 200
        });
    }

    /**
     * Displays a message when no food is detected
     */
    function displayNonFoodMessage() {
        loader.classList.add('hidden');

        const nonFoodMessage = document.createElement('div');
        nonFoodMessage.className = 'non-food-message';
        nonFoodMessage.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <h3>No Food Detected</h3>
            <p>We couldn't detect any food in this image. Please try uploading a different image with clearer food content.</p>
            <button id="try-again-btn" class="primary-btn">
                <i class="fas fa-redo"></i> Try Another Image
            </button>
        `;

        resultsData.innerHTML = '';
        resultsData.appendChild(nonFoodMessage);
        resultsData.classList.remove('hidden');

        document.getElementById('try-again-btn').addEventListener('click', resetAnalysis);
    }

    /**
     * Displays error message when API fails
     */
    function displayError(message) {
        // Hide the loader
        loader.classList.add('hidden');

        // Create error message element if it doesn't exist
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            analysisResults.querySelector('.results-container').appendChild(errorElement);
        }

        // Add error content
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="primary-btn" id="try-again-btn">
                <i class="fas fa-redo"></i> Try Again
            </button>
        `;

        // Show the error message
        errorElement.classList.remove('hidden');

        // Add event listener to the try again button
        document.getElementById('try-again-btn').addEventListener('click', function () {
            resetAnalysis();
        });
    }

    /**
     * Helper function to capitalize and enhance food name display
     */
    function enhanceFoodName(name) {
        return name.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Display simulated results for sample foods when API is unavailable
     */
    function displaySimulatedResults(foodType) {
        // Create sample food data for demo purposes
        let foodData = {
            originalName: foodType,
            name: foodType,
            servingSize: "1 serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugars: 0,
            sodium: 0,
            cholesterol: 0,
            potassium: 0,
            saturatedFat: 0,
            description: "",
            foodGroup: "",
            ingredients: [],
            similarFoods: []
        };

        // Set specific nutritional values based on food type
        switch (foodType) {
            case "Pizza":
                foodData.calories = 285;
                foodData.protein = 12;
                foodData.carbs = 36;
                foodData.fat = 10;
                foodData.fiber = 2.5;
                foodData.sugars = 3.8;
                foodData.sodium = 640;
                foodData.cholesterol = 18;
                foodData.potassium = 184;
                foodData.saturatedFat = 4.5;
                foodData.description = "Classic cheese pizza with tomato sauce on a thin crust.";
                foodData.foodGroup = "Mixed Dishes";
                foodData.ingredients = ["Wheat Flour", "Tomato Sauce", "Cheese", "Olive Oil", "Yeast", "Salt", "Herbs"];
                foodData.similarFoods = ["Calzone", "Flatbread", "Focaccia"];
                break;
            case "Salad":
                foodData.calories = 120;
                foodData.protein = 3.5;
                foodData.carbs = 12;
                foodData.fat = 7;
                foodData.fiber = 3.5;
                foodData.sugars = 4;
                foodData.sodium = 120;
                foodData.cholesterol = 0;
                foodData.potassium = 350;
                foodData.saturatedFat = 1;
                foodData.description = "Fresh garden salad with mixed greens, vegetables and light dressing.";
                foodData.foodGroup = "Vegetables";
                foodData.ingredients = ["Lettuce", "Tomatoes", "Cucumbers", "Carrots", "Olive Oil", "Vinegar", "Salt"];
                foodData.similarFoods = ["Coleslaw", "Greek Salad", "Caesar Salad"];
                break;
            case "Burger":
                foodData.calories = 540;
                foodData.protein = 25;
                foodData.carbs = 40;
                foodData.fat = 29;
                foodData.fiber = 2;
                foodData.sugars = 8;
                foodData.sodium = 950;
                foodData.cholesterol = 85;
                foodData.potassium = 420;
                foodData.saturatedFat = 12;
                foodData.description = "Classic beef burger with cheese, lettuce, tomato, and special sauce.";
                foodData.foodGroup = "Protein Foods";
                foodData.ingredients = ["Beef Patty", "Cheese", "Lettuce", "Tomato", "Onion", "Burger Bun", "Special Sauce"];
                foodData.similarFoods = ["Cheeseburger", "Veggie Burger", "Chicken Sandwich"];
                break;
            case "Sushi":
                foodData.calories = 350;
                foodData.protein = 15;
                foodData.carbs = 65;
                foodData.fat = 3;
                foodData.fiber = 1.5;
                foodData.sugars = 2;
                foodData.sodium = 480;
                foodData.cholesterol = 40;
                foodData.potassium = 280;
                foodData.saturatedFat = 0.5;
                foodData.description = "Assorted sushi rolls with fresh fish, rice, and vegetables.";
                foodData.foodGroup = "Mixed Dishes";
                foodData.ingredients = ["Rice", "Fish", "Seaweed", "Cucumber", "Avocado", "Soy Sauce"];
                foodData.similarFoods = ["Sashimi", "Nigiri", "Maki Rolls"];
                break;
            case "Pasta":
                foodData.calories = 420;
                foodData.protein = 14;
                foodData.carbs = 72;
                foodData.fat = 10;
                foodData.fiber = 4;
                foodData.sugars = 6;
                foodData.sodium = 580;
                foodData.cholesterol = 25;
                foodData.potassium = 320;
                foodData.saturatedFat = 3;
                foodData.description = "Spaghetti with tomato sauce and parmesan cheese.";
                foodData.foodGroup = "Grains";
                foodData.ingredients = ["Pasta", "Tomato Sauce", "Parmesan Cheese", "Olive Oil", "Garlic", "Herbs"];
                foodData.similarFoods = ["Fettuccine", "Lasagna", "Macaroni"];
                break;
            default:
                foodData.calories = 250;
                foodData.protein = 10;
                foodData.carbs = 30;
                foodData.fat = 12;
                foodData.fiber = 2;
                foodData.sugars = 5;
                foodData.sodium = 350;
                foodData.cholesterol = 30;
                foodData.potassium = 250;
                foodData.saturatedFat = 4;
                foodData.description = "A delicious food item with balanced nutrition.";
                foodData.foodGroup = "Mixed Dishes";
                foodData.ingredients = ["Various Ingredients"];
                foodData.similarFoods = ["Various Similar Foods"];
        }

        // Additional micronutrients for the breakdown chart
        // Include all nutrients that might be referenced in the nutrient breakdown chart
        foodData.vitaminA = Math.floor(Math.random() * 50) + 10;
        foodData.vitaminC = Math.floor(Math.random() * 60) + 5;
        foodData.calcium = Math.floor(Math.random() * 200) + 50;
        foodData.iron = Math.floor(Math.random() * 8) + 1;
        foodData.vitaminB12 = (Math.random() * 2 + 0.5).toFixed(1);

        console.log("Created simulated food data:", foodData);

        // Display the results using the same function as real results
        displayResults(foodData);
    }

    /**
     * Checks if the backend server is reachable
     */
    async function checkServerHealth() {
        try {
            console.log('Checking backend server health...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout

            const response = await fetch(`${BACKEND_SERVER}/api`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                console.log('Backend server is online');
                isServerOnline = true;
                // Hide any offline notifications if present
                const offlineNotification = document.querySelector('.offline-notification');
                if (offlineNotification) {
                    offlineNotification.remove();
                }
            } else {
                throw new Error('Server returned non-ok status');
            }
        } catch (error) {
            console.error('Backend server appears to be offline:', error);
            isServerOnline = false;
            showOfflineNotification();
        }
    }

    /**
     * Shows a warning banner if the server is offline
     */
    function showServerWarning() {
        // Check if warning already exists
        if (document.querySelector('.server-warning')) {
            return;
        }

        // Create warning banner
        const warning = document.createElement('div');
        warning.className = 'server-warning';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Server is offline. Using demo mode with simulated data.</span>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        `;

        // Add to document
        if (document.body) {
            document.body.prepend(warning);

            // Add close button functionality
            const closeBtn = warning.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    warning.remove();
                });
            }
        }
    }

    /**
     * Shows a warning banner if the server is offline
     */
    function showOfflineNotification() {
        // Check if warning already exists
        if (document.querySelector('.offline-notification')) {
            return;
        }

        // Create warning banner
        const warning = document.createElement('div');
        warning.className = 'offline-notification';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Server is offline. Using demo mode with simulated data.</span>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        `;

        // Add to document
        if (document.body) {
            document.body.prepend(warning);

            // Add close button functionality
            const closeBtn = warning.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    warning.remove();
                });
            }
        }
    }

    /**
     * Get sample food data for fallback when server is offline
     */
    function getSampleFoodData(foodName) {
        // Create default data structure
        const fallbackData = {
            name: foodName,
            servingSize: "1 serving",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugars: 0,
            sodium: 0,
            cholesterol: 0,
            potassium: 0,
            saturatedFat: 0,
            description: "",
            foodGroup: "",
            ingredients: [],
            similarFoods: []
        };

        // Set specific values based on food type
        switch (foodName) {
            case "Pizza":
                fallbackData.calories = 285;
                fallbackData.protein = 12;
                fallbackData.carbs = 36;
                fallbackData.fat = 10;
                fallbackData.fiber = 2.5;
                fallbackData.sugars = 3.8;
                fallbackData.sodium = 640;
                fallbackData.cholesterol = 18;
                fallbackData.potassium = 184;
                fallbackData.saturatedFat = 4.5;
                fallbackData.description = "Classic cheese pizza with tomato sauce on a thin crust.";
                fallbackData.foodGroup = "Mixed Dishes";
                fallbackData.ingredients = ["Wheat Flour", "Tomato Sauce", "Cheese", "Olive Oil", "Yeast", "Salt", "Herbs"];
                fallbackData.similarFoods = ["Calzone", "Flatbread", "Focaccia"];
                break;
            case "Salad":
                fallbackData.calories = 120;
                fallbackData.protein = 3.5;
                fallbackData.carbs = 12;
                fallbackData.fat = 7;
                fallbackData.fiber = 3.5;
                fallbackData.sugars = 4;
                fallbackData.sodium = 120;
                fallbackData.cholesterol = 0;
                fallbackData.potassium = 350;
                fallbackData.saturatedFat = 1;
                fallbackData.description = "Fresh garden salad with mixed greens, vegetables and light dressing.";
                fallbackData.foodGroup = "Vegetables";
                fallbackData.ingredients = ["Lettuce", "Tomatoes", "Cucumbers", "Carrots", "Olive Oil", "Vinegar", "Salt"];
                fallbackData.similarFoods = ["Coleslaw", "Greek Salad", "Caesar Salad"];
                break;
            case "Burger":
                fallbackData.calories = 540;
                fallbackData.protein = 25;
                fallbackData.carbs = 40;
                fallbackData.fat = 29;
                fallbackData.fiber = 2;
                fallbackData.sugars = 8;
                fallbackData.sodium = 950;
                fallbackData.cholesterol = 85;
                fallbackData.potassium = 420;
                fallbackData.saturatedFat = 12;
                fallbackData.description = "Classic beef burger with cheese, lettuce, tomato, and special sauce.";
                fallbackData.foodGroup = "Protein Foods";
                fallbackData.ingredients = ["Beef Patty", "Cheese", "Lettuce", "Tomato", "Onion", "Burger Bun", "Special Sauce"];
                fallbackData.similarFoods = ["Cheeseburger", "Veggie Burger", "Chicken Sandwich"];
                break;
            case "Sushi":
                fallbackData.calories = 350;
                fallbackData.protein = 15;
                fallbackData.carbs = 65;
                fallbackData.fat = 3;
                fallbackData.fiber = 1.5;
                fallbackData.sugars = 2;
                fallbackData.sodium = 480;
                fallbackData.cholesterol = 40;
                fallbackData.potassium = 280;
                fallbackData.saturatedFat = 0.5;
                fallbackData.description = "Assorted sushi rolls with fresh fish, rice, and vegetables.";
                fallbackData.foodGroup = "Mixed Dishes";
                fallbackData.ingredients = ["Rice", "Fish", "Seaweed", "Cucumber", "Avocado", "Soy Sauce"];
                fallbackData.similarFoods = ["Sashimi", "Nigiri", "Maki Rolls"];
                break;
            case "Pasta":
                fallbackData.calories = 420;
                fallbackData.protein = 14;
                fallbackData.carbs = 72;
                fallbackData.fat = 10;
                fallbackData.fiber = 4;
                fallbackData.sugars = 6;
                fallbackData.sodium = 580;
                fallbackData.cholesterol = 25;
                fallbackData.potassium = 320;
                fallbackData.saturatedFat = 3;
                fallbackData.description = "Spaghetti with tomato sauce and parmesan cheese.";
                fallbackData.foodGroup = "Grains";
                fallbackData.ingredients = ["Pasta", "Tomato Sauce", "Parmesan Cheese", "Olive Oil", "Garlic", "Herbs"];
                fallbackData.similarFoods = ["Fettuccine", "Lasagna", "Macaroni"];
                break;
            default:
                fallbackData.calories = 250;
                fallbackData.protein = 10;
                fallbackData.carbs = 30;
                fallbackData.fat = 12;
                fallbackData.fiber = 2;
                fallbackData.sugars = 5;
                fallbackData.sodium = 350;
                fallbackData.cholesterol = 30;
                fallbackData.potassium = 250;
                fallbackData.saturatedFat = 4;
                fallbackData.description = "A delicious food item with balanced nutrition.";
                fallbackData.foodGroup = "Mixed Dishes";
                fallbackData.ingredients = ["Various Ingredients"];
                fallbackData.similarFoods = ["Various Similar Foods"];
        }

        // Add micronutrients
        fallbackData.vitaminA = Math.floor(Math.random() * 50) + 10;
        fallbackData.vitaminC = Math.floor(Math.random() * 60) + 5;
        fallbackData.calcium = Math.floor(Math.random() * 200) + 50;
        fallbackData.iron = Math.floor(Math.random() * 8) + 1;
        fallbackData.vitaminB12 = (Math.random() * 2 + 0.5).toFixed(1);

        // Ensure all nutrient values are numeric
        Object.keys(fallbackData).forEach(key => {
            if (typeof fallbackData[key] === 'string' && !isNaN(fallbackData[key])) {
                fallbackData[key] = parseFloat(fallbackData[key]);
            }
        });

        return fallbackData;
    }

    /**
     * Adds a visually enhanced legend with animations below the chart
     */
    function addEnhancedLegend(chartContainer, nutrientNames, nutrientColors) {
        // Check if a legend already exists and remove it
        const existingLegend = document.querySelector('.enhanced-nutrient-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        // Create the container for the legend
        const legendDiv = document.createElement('div');
        legendDiv.className = 'enhanced-nutrient-legend';
        legendDiv.style.display = 'flex';
        legendDiv.style.flexWrap = 'wrap';
        legendDiv.style.justifyContent = 'center';
        legendDiv.style.alignItems = 'center';
        legendDiv.style.gap = '12px';
        legendDiv.style.marginTop = '10px';
        legendDiv.style.marginBottom = '20px';
        legendDiv.style.padding = '8px 10px';

        // Add each nutrient to the legend in a flat layout similar to the image
        nutrientNames.forEach((name, index) => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'inline-flex';
            legendItem.style.alignItems = 'center';
            legendItem.style.gap = '8px';
            legendItem.style.padding = '5px 10px';
            legendItem.style.margin = '3px';
            legendItem.style.transition = 'all 0.3s ease';
            legendItem.style.cursor = 'pointer';

            // Color indicator
            const colorIndicator = document.createElement('span');
            colorIndicator.style.width = '16px';
            colorIndicator.style.height = '16px';
            colorIndicator.style.borderRadius = '3px';
            colorIndicator.style.backgroundColor = nutrientColors[index];
            colorIndicator.style.display = 'inline-block';

            // Nutrient name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;
            nameSpan.style.fontWeight = '500';
            nameSpan.style.fontSize = '14px';
            nameSpan.style.color = '#333';
            nameSpan.style.fontFamily = 'Arial, sans-serif';

            // Add hover effect
            legendItem.addEventListener('mouseover', () => {
                colorIndicator.style.transform = 'scale(1.2)';
                nameSpan.style.fontWeight = '700';
            });

            legendItem.addEventListener('mouseout', () => {
                colorIndicator.style.transform = '';
                nameSpan.style.fontWeight = '500';
            });

            // Add elements to the item
            legendItem.appendChild(colorIndicator);
            legendItem.appendChild(nameSpan);

            // Add the item to the legend
            legendDiv.appendChild(legendItem);
        });

        // Add the legend after the chart
        chartContainer.parentNode.insertBefore(legendDiv, chartContainer.nextSibling);
    }
}); 