# QuickFood Analyzer

A web-based food recognition and nutritional analysis tool, inspired by the Cal AI - Food Calorie Tracker app.

## Overview

QuickFood Analyzer is a web application that demonstrates how AI-powered food recognition could work in a web interface. Users can upload photos of food, and the application analyzes them to provide detailed nutritional information with an option to manually correct misidentified foods.

## Features

- **Food Image Upload**: Upload photos of your meals
- **AI-Powered Food Recognition**: Simulation of AI analysis of food images
- **Manual Correction**: Ability to correct misidentified foods with a text input
- **Nutritional Analysis**: Get estimated calories, protein, carbs, and fat content
- **Visual Representation**: View macronutrient breakdown with an interactive pie chart
- **Progress Bars**: Visual indicators of nutrient content relative to daily values
- **Additional Information**: View detailed breakdown of food components and nutritional benefits
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## How It Works

1. **Upload a Food Image**: Click the "Upload Food Image" button and select an image from your device
2. **AI Analysis**: The system processes the image to identify the food (simulated in this demo)
3. **View Results**: See the nutritional breakdown with calories, macronutrients, and a visual chart
4. **Manual Correction**: If the food is misidentified, type the correct name and click "Correct"
5. **Updated Analysis**: The system fetches nutritional data for the corrected food item

**Note**: This demo version simulates AI food recognition and database lookups. In a production implementation, it would connect to real food recognition and nutrition database APIs.

## Implementation Notes

### Technologies Used
- HTML5
- CSS3 (with custom properties, flexbox/grid layouts)
- Vanilla JavaScript
- Chart.js for data visualization
- Font Awesome for icons

### AI Implementation Explanation

The application simulates two key AI/ML components:

1. **Food Recognition AI**: 
   - In a real implementation, this would use a trained convolutional neural network (CNN) to identify foods in images
   - Popular options include using Google Cloud Vision API, Azure Computer Vision, or a custom-trained model with TensorFlow or PyTorch
   - The model would be trained on thousands of food images to identify various dishes and ingredients
   - This is simulated in our code with the `analyzeFood()` function, which would be replaced with actual API calls

2. **Nutrition Database API**:
   - After identifying the food or when the user makes a manual correction, the system needs to fetch nutritional information
   - Real implementations would use APIs like USDA FoodData Central, Nutritionix, or Edamam
   - Our simulation is in the `handleFoodCorrection()` function, which would be replaced with actual database API calls

### API Integration Code

To implement real AI food recognition, you would:

1. Register for API keys with a food recognition service and nutrition database
2. Replace the simulation code with actual API calls:

```javascript
// Example of real food recognition API call
async function analyzeFood(file) {
    // Convert image to base64 or appropriate format
    const imageData = await convertImageToBase64(file);
    
    // Call the food recognition API
    const recognizedFood = await callFoodRecognitionAPI(imageData);
    
    // Display the results
    if (recognizedFood) {
        displayResults(recognizedFood);
    }
}

// Example of real nutrition database API call
async function handleFoodCorrection() {
    const foodName = detectedFoodInput.value.trim();
    
    // Call nutrition database API
    const nutritionData = await lookupFoodInDatabase(foodName);
    
    // Display the results
    if (nutritionData) {
        displayResults(nutritionData);
    }
}
```

## Running the Project

1. Clone this repository
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see API Configuration below):
   ```bash
   cp .env.example .env
   ```
4. Start the server (which serves both the API and the frontend):
   ```bash
   npm run dev
   ```
5. Open your browser and go to `http://localhost:3000`

For production deployment:
```bash
npm run prod
```

## API Configuration

This project requires two sets of credentials to function properly:

### 1. Firebase (Auth & Database)
We use a standard Node.js custom backend running **Firebase Admin SDK** for the database and **Firebase REST APIs** for authentication. This ensures no Firebase credentials are leaked to the frontend.
1. Create a Firebase Project and enable **Email/Password** Authentication and **Firestore Database**.
2. Go to Project Settings -> Service Accounts -> Generate new private key. Download `serviceAccountKey.json` and place it in the **root** folder of this project.
3. In your Firebase Project Settings -> General, locate your **Web API Key**. Add it to the `.env` file at the root of this project:
   ```
   FIREBASE_API_KEY=your_web_api_key_here
   ```

### 2. LogMeal (Food Recognition)
The backend requires a valid LogMeal API key. You can get one by signing up at [LogMeal](https://logmeal.es/).
1. Add your API key to the `.env` file:
   ```
   LOGMEAL_API_KEY=your_logmeal_api_key_here
   ```
2. For production, update the CORS settings in `server.js` with your domain.

## Future Enhancements

- User accounts to save food history
- Daily/weekly nutrition tracking
- Barcode scanning for packaged foods
- Custom meal planning based on nutritional goals
- Multi-item detection in a single image
- Export nutrition data to health apps
- Meal recommendations based on dietary goals 