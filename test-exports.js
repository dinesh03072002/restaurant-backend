const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test controller
const testHandler = (req, res) => {
    res.json({ message: 'Test route working!' });
};

// Test routes
app.get('/api/test', testHandler);
app.get('/api/menu/test', testHandler);

// Try to load your actual routes
try {
    console.log('Attempting to load routes...');
    const menuRoutes = require('./routes/menuRoutes');
    console.log('✅ menuRoutes loaded successfully');
    app.use('/api/menu', menuRoutes);
} catch (error) {
    console.error('❌ Error loading menuRoutes:', error.message);
    console.error(error.stack);
}

const PORT = 5001; // Use different port for testing
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}/api/test`);
});