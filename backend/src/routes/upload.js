const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { generateThumbnail } = require('../services/thumbnailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = req.app.locals.config.uploadDir;
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only JPG and PNG files
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files at once
  }
});

// Upload single file
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { config } = req.app.locals;
    const relativePath = path.relative(config.photosDir, req.file.path);

    // Generate thumbnails in background
    const thumbnailPromises = config.thumbnailSizes.map(size => 
      generateThumbnail(req.file.path, size, config.thumbnailDir)
        .catch(err => console.error(`Failed to generate ${size}px thumbnail:`, err))
    );

    // Don't wait for thumbnails, generate them in background
    Promise.all(thumbnailPromises);

    res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        path: relativePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
        thumbnail: `/api/images/thumbnail?path=${encodeURIComponent(relativePath)}&size=300`
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple files
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { config } = req.app.locals;
    const uploadedFiles = [];

    for (const file of req.files) {
      const relativePath = path.relative(config.photosDir, file.path);
      
      uploadedFiles.push({
        name: file.originalname,
        filename: file.filename,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype,
        thumbnail: `/api/images/thumbnail?path=${encodeURIComponent(relativePath)}&size=300`
      });

      // Generate thumbnails in background
      config.thumbnailSizes.forEach(size => {
        generateThumbnail(file.path, size, config.thumbnailDir)
          .catch(err => console.error(`Failed to generate ${size}px thumbnail:`, err));
      });
    }

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete uploaded file
router.delete('/:filename', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const filename = req.params.filename;
    const filePath = path.join(config.uploadDir, filename);

    // Security check - ensure file is in upload directory
    if (!filePath.startsWith(config.uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    await fs.remove(filePath);

    // Delete associated thumbnails
    const crypto = require('crypto');
    const imageHash = crypto.createHash('md5').update(filePath).digest('hex');
    
    for (const size of config.thumbnailSizes) {
      const thumbnailPath = path.join(config.thumbnailDir, `${imageHash}_${size}.jpg`);
      if (await fs.pathExists(thumbnailPath)) {
        await fs.remove(thumbnailPath);
      }
    }

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get upload status/info
router.get('/info', (req, res) => {
  const { config } = req.app.locals;
  
  res.json({
    maxFileSize: '50MB',
    allowedTypes: ['image/jpeg', 'image/png'],
    maxFiles: 10,
    uploadDir: config.uploadDir,
    thumbnailSizes: config.thumbnailSizes
  });
});

module.exports = router;