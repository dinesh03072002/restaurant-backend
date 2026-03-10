const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./models');

// Determine which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? 'production.env' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

console.log('=================================');
console.log(`📁 Loading environment from: ${envPath}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log('=================================');

// Load the environment file
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error(`❌ Failed to load ${envFile}:`, result.error);
    process.exit(1);
}

// Log loaded variables (without exposing full values)
console.log('🔧 Configuration loaded:');
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- FAST2SMS_API_KEY exists: ${!!process.env.FAST2SMS_API_KEY}`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log('=================================');

const app = express();

// CORS configuration
app.use(cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static('uploads'));

// Import routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Restaurant API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Connect to database
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    console.log('📊 Using database:', process.env.DB_NAME);
    return db.sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });