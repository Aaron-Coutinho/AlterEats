require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let db = null;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
    console.warn('⚠️ Firebase Admin initialization bypassed: serviceAccountKey.json not found or invalid. Please add it to root directory if using Firebase backend features.');
}

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// Initialize Express app and set port
const app = express();
const PORT = process.env.PORT || 3000;

// Get the environment
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS for cross-origin requests and JSON body parsing
app.use(cors({
    origin: isProduction ?
        ['https://yourdomain.com', 'https://www.yourdomain.com'] : // Allowed origins in production
        '*', // Allow all origins in development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configure multer for handling file uploads (stored in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// LogMeal API endpoints for food recognition and nutritional analysis
const LOGMEAL_RECOGNITION_ENDPOINT = 'https://api.logmeal.com/v2/image/segmentation/complete';
const LOGMEAL_NUTRITION_ENDPOINT = 'https://api.logmeal.com/v2/recipe/nutritionalInfo';
const LOGMEAL_INGREDIENTS_ENDPOINT = 'https://api.logmeal.com/v2/recipe/ingredients';

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check route to verify server is running
app.get('/api', (req, res) => {
    res.send('QuickFood Analyzer API is running');
});

// Sample food data endpoint for when API is not available
app.get('/api/sample-food/:foodName', (req, res) => {
    const foodName = req.params.foodName;
    console.log(`Providing sample data for ${foodName}`);

    // Sample nutritional data for common foods
    const sampleFoods = {
        'Pizza': {
            name: 'Pizza (1 slice)',
            calories: 285,
            protein: 12,
            carbs: 39,
            fat: 10,
            fiber: 2.5,
            sugar: 3.8,
            description: 'Classic pizza with cheese, tomato sauce on a wheat crust. A good source of protein and carbohydrates.'
        },
        'Salad': {
            name: 'Garden Salad',
            calories: 120,
            protein: 3,
            carbs: 12,
            fat: 7,
            fiber: 4,
            sugar: 4,
            description: 'Fresh mixed greens with vegetables and light dressing. High in fiber and vitamins, low in calories.'
        },
        'Burger': {
            name: 'Beef Burger',
            calories: 350,
            protein: 20,
            carbs: 33,
            fat: 17,
            fiber: 1.5,
            sugar: 6,
            description: 'Beef patty with lettuce, tomato and condiments on a bun. High in protein but also contains significant fat.'
        },
        'Sushi': {
            name: 'Sushi Roll',
            calories: 255,
            protein: 9,
            carbs: 38,
            fat: 7,
            fiber: 3.5,
            sugar: 4,
            description: 'Rice and fish wrapped in seaweed. Good source of omega-3 fatty acids and moderate protein.'
        },
        'Pasta': {
            name: 'Pasta with Tomato Sauce',
            calories: 320,
            protein: 12,
            carbs: 65,
            fat: 2,
            fiber: 4,
            sugar: 8,
            description: 'Wheat pasta with tomato-based sauce. High in carbohydrates and provides moderate protein.'
        }
    };

    if (sampleFoods[foodName]) {
        res.json({
            success: true,
            food: sampleFoods[foodName]
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Sample food not found'
        });
    }
});

// API route: Recognize food from uploaded image
app.post('/api/recognize-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided',
                message: 'Please upload a valid food image'
            });
        }

        console.log('Received file:', req.file.originalname, 'Size:', req.file.size);

        // Validate API key is configured
        if (!process.env.LOGMEAL_API_KEY) {
            return res.status(500).json({
                error: 'API key not configured',
                message: 'The LogMeal API key is missing. Please check server configuration.',
                details: 'LogMeal API key is missing in server configuration.'
            });
        }

        // Check if file size is too large (over 10 MB)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                error: 'File too large',
                message: 'The image file is too large. Please use an image smaller than 10 MB.'
            });
        }

        // Validate file type
        const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: 'Please upload a JPEG or PNG image.'
            });
        }

        // Prepare image data for LogMeal API
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
            filename: req.file.originalname || 'image.jpg',
            contentType: req.file.mimetype || 'image/jpeg',
        });

        console.log('Making request to LogMeal recognition API...');

        // Send image to LogMeal API for food recognition
        const recognitionResponse = await axios.post(LOGMEAL_RECOGNITION_ENDPOINT, formData, {
            headers: {
                'Authorization': `Bearer ${process.env.LOGMEAL_API_KEY}`,
                ...formData.getHeaders()
            },
            maxContentLength: 100000000,
            maxBodyLength: 100000000,
            timeout: 10000 // 10 second timeout
        });

        console.log('API Response received with imageId:', recognitionResponse.data.imageId);
        res.json(recognitionResponse.data);
    } catch (error) {
        console.error('Error recognizing food:', error.message);

        // Provide detailed error information for debugging
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);

            return res.status(error.response.status).json({
                error: 'LogMeal API error',
                status: error.response.status,
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from LogMeal API');
            return res.status(500).json({
                error: 'LogMeal API connection error',
                details: 'No response received from the API service. Check your network connection or try again later.'
            });
        }

        res.status(500).json({
            error: 'Failed to recognize food',
            details: error.message
        });
    }
});

// API route: Get nutritional information for recognized food
app.post('/api/nutrition', async (req, res) => {
    try {
        const { imageId } = req.body;

        if (!imageId) {
            return res.status(400).json({ error: 'No imageId provided' });
        }

        // Validate API key is configured
        if (!process.env.LOGMEAL_API_KEY) {
            return res.status(500).json({
                error: 'API key not configured',
                details: 'LogMeal API key is missing in server configuration.'
            });
        }

        console.log('Getting nutrition for imageId:', imageId);

        // Request nutritional information from LogMeal API
        const nutritionResponse = await axios.post(LOGMEAL_NUTRITION_ENDPOINT, {
            imageId: imageId
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.LOGMEAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('Nutrition data received');
        res.json(nutritionResponse.data);
    } catch (error) {
        console.error('Error getting nutrition data:', error.message);

        // Provide detailed error information
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);

            return res.status(error.response.status).json({
                error: 'LogMeal API error',
                status: error.response.status,
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from LogMeal API');
            return res.status(500).json({
                error: 'LogMeal API connection error',
                details: 'No response received from the API service. Check your network connection or try again later.'
            });
        }

        res.status(500).json({
            error: 'Failed to get nutrition data',
            details: error.message
        });
    }
});

// API route: Get ingredients information for recognized food
app.post('/api/ingredients', async (req, res) => {
    try {
        const { imageId } = req.body;

        if (!imageId) {
            return res.status(400).json({ error: 'No imageId provided' });
        }

        // Validate API key is configured
        if (!process.env.LOGMEAL_API_KEY) {
            return res.status(500).json({
                error: 'API key not configured',
                details: 'LogMeal API key is missing in server configuration.'
            });
        }

        console.log('Getting ingredients for imageId:', imageId);

        // Request ingredients information from LogMeal API
        const ingredientsResponse = await axios.post(LOGMEAL_INGREDIENTS_ENDPOINT, {
            imageId: imageId
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.LOGMEAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('Ingredients data received');
        res.json(ingredientsResponse.data);
    } catch (error) {
        console.error('Error getting ingredients data:', error.message);

        // Provide detailed error information
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);

            return res.status(error.response.status).json({
                error: 'LogMeal API error',
                status: error.response.status,
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from LogMeal API');
            return res.status(500).json({
                error: 'LogMeal API connection error',
                details: 'No response received from the API service. Check your network connection or try again later.'
            });
        }

        res.status(500).json({
            error: 'Failed to get ingredients data',
            details: error.message
        });
    }
});

// ==========================================
// AUTH & PROFILE ENDPOINTS
// ==========================================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        if (!FIREBASE_API_KEY) return res.status(500).json({ error: 'FIREBASE_API_KEY not configured in .env' });

        const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
            email, password, returnSecureToken: true
        });

        const uid = response.data.localId;
        const token = response.data.idToken;

        if (db) {
            await db.collection('users').doc(uid).set({
                name, email, phone,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        res.json({ success: true, token, uid });
    } catch (error) {
        const msg = error.response?.data?.error?.message || error.message;
        res.status(400).json({ error: msg });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!FIREBASE_API_KEY) return res.status(500).json({ error: 'FIREBASE_API_KEY not configured in .env' });

        const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
            email, password, returnSecureToken: true
        });

        res.json({ success: true, token: response.data.idToken, uid: response.data.localId });
    } catch (error) {
        const msg = error.response?.data?.error?.message || error.message;
        res.status(401).json({ error: msg });
    }
});

// Middleware to verify Firebase token
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const idToken = authHeader.split('Bearer ')[1];
    try {
        if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Save profile
app.post('/api/profile', requireAuth, async (req, res) => {
    try {
        const uid = req.user.uid;
        if (!db) throw new Error('Database not initialized');

        await db.collection('profiles').doc(uid).set({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get profile
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const uid = req.user.uid;
        if (!db) throw new Error('Database not initialized');

        const doc = await db.collection('profiles').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });

        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Catch-all route to handle SPA routing
app.get('*', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading the application');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ QuickFood Analyzer API server running on port ${PORT}`);

    // Check for API key and log appropriate message
    if (!process.env.LOGMEAL_API_KEY) {
        console.error('⚠️ WARNING: LogMeal API key not configured in .env file');
        console.error('The API will not function correctly without a valid API key.');
        console.error('Please add LOGMEAL_API_KEY=your_api_key to the .env file');
    } else {
        console.log('✅ LogMeal API key configured successfully');
    }

    console.log('📝 Available endpoints:');
    console.log('  - POST /api/recognize-food - Upload a food image for recognition');
    console.log('  - POST /api/nutrition - Get nutrition data for recognized food');
    console.log('  - POST /api/ingredients - Get ingredients data for recognized food');
    console.log('  - Static files served from parent directory');
    console.log('  - Access the app at http://localhost:3000');
});