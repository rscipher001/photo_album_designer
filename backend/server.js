const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
  credentials: true
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Environment configuration
const config = {
  photosDir: process.env.PHOTOS_DIR || path.join(__dirname, '../sample-photos'),
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../storage/uploads'),
  thumbnailDir: process.env.THUMBNAIL_DIR || path.join(__dirname, '../storage/thumbnails'),
  projectDir: process.env.PROJECT_DIR || path.join(__dirname, '../storage/projects'),
  maxUploadSize: process.env.MAX_UPLOAD_SIZE || '50mb',
  thumbnailSizes: (process.env.THUMBNAIL_SIZES || '150,300,600').split(',').map(Number)
};

// Ensure directories exist
Object.values(config).forEach(dir => {
  if (typeof dir === 'string' && !fs.existsSync(dir)) {
    fs.ensureDirSync(dir);
  }
});

// Make config available to routes
app.locals.config = config;

// Import routes
const imageRoutes = require('./src/routes/images');
const uploadRoutes = require('./src/routes/upload');
const projectRoutes = require('./src/routes/projects');

// API routes
app.use('/api/images', imageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    config: {
      photosDir: config.photosDir,
      uploadDir: config.uploadDir
    }
  });
});

// Serve static files (frontend) in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Album Designer server running on port ${PORT}`);
  console.log(`Photos directory: ${config.photosDir}`);
  console.log(`Upload directory: ${config.uploadDir}`);
});

module.exports = app;