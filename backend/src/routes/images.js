const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { generateThumbnail } = require('../services/thumbnailService');

// Get list of images in a directory
router.get('/browse', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const requestedPath = req.query.path || '';
    
    // Determine base directory (photos or uploads)
    let baseDir = config.photosDir;
    let safePath = path.resolve(baseDir, requestedPath);
    
    // Check if we're browsing uploads specifically
    if (requestedPath.startsWith('uploads/') || requestedPath === 'uploads') {
      baseDir = config.uploadDir;
      const uploadsPath = requestedPath === 'uploads' ? '' : requestedPath.replace('uploads/', '');
      safePath = path.resolve(baseDir, uploadsPath);
    }
    
    // Security: Ensure path is within allowed directories
    if (!safePath.startsWith(config.photosDir) && !safePath.startsWith(config.uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!await fs.pathExists(safePath)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const items = await fs.readdir(safePath, { withFileTypes: true });
    const directories = [];
    const images = [];

    // Add uploads directory at root level if we're in photos dir
    if (requestedPath === '' && baseDir === config.photosDir) {
      directories.push({
        name: 'uploads',
        path: 'uploads'
      });
    }

    for (const item of items) {
      const itemPath = path.join(safePath, item.name);
      let relativePath;
      
      // Calculate relative path based on which directory we're in
      if (baseDir === config.uploadDir) {
        relativePath = requestedPath === 'uploads' ? 
          `uploads/${item.name}` : 
          `uploads/${path.relative(config.uploadDir, itemPath)}`;
      } else {
        relativePath = path.relative(config.photosDir, itemPath);
      }

      if (item.isDirectory()) {
        directories.push({
          name: item.name,
          path: relativePath
        });
      } else if (isImageFile(item.name)) {
        const stats = await fs.stat(itemPath);
        images.push({
          name: item.name,
          path: relativePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          thumbnail: `/api/images/thumbnail?path=${encodeURIComponent(relativePath)}&size=300`
        });
      }
    }

    res.json({
      currentPath: requestedPath,
      directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
      images: images.sort((a, b) => b.modified.localeCompare(a.modified)) // Sort by newest first
    });

  } catch (error) {
    console.error('Browse error:', error);
    res.status(500).json({ error: 'Failed to browse directory' });
  }
});

// Serve original images
router.get('/serve', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const imagePath = req.query.path;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    // Determine the correct base directory for the image
    let fullPath;
    if (imagePath.startsWith('uploads/')) {
      // Remove 'uploads/' prefix and resolve from uploadDir
      const uploadPath = imagePath.replace('uploads/', '');
      fullPath = path.resolve(config.uploadDir, uploadPath);
    } else {
      fullPath = path.resolve(config.photosDir, imagePath);
    }
    
    // Security check
    if (!fullPath.startsWith(config.photosDir) && !fullPath.startsWith(config.uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (!isImageFile(fullPath)) {
      return res.status(400).json({ error: 'Not an image file' });
    }

    const mimeType = mime.lookup(fullPath);
    const stats = await fs.stat(fullPath);
    
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Last-Modified': stats.mtime.toUTCString(),
      'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
      'Cache-Control': 'public, max-age=86400' // 24 hours
    });

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);

  } catch (error) {
    console.error('Serve error:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Serve thumbnails
router.get('/thumbnail', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const imagePath = req.query.path;
    const size = parseInt(req.query.size) || 300;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Path parameter required' });
    }

    if (!config.thumbnailSizes.includes(size)) {
      return res.status(400).json({ error: 'Invalid thumbnail size' });
    }

    // Determine the correct base directory for the image
    let fullPath;
    if (imagePath.startsWith('uploads/')) {
      // Remove 'uploads/' prefix and resolve from uploadDir
      const uploadPath = imagePath.replace('uploads/', '');
      fullPath = path.resolve(config.uploadDir, uploadPath);
    } else {
      fullPath = path.resolve(config.photosDir, imagePath);
    }
    
    // Security check
    if (!fullPath.startsWith(config.photosDir) && !fullPath.startsWith(config.uploadDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const thumbnailPath = await generateThumbnail(fullPath, size, config.thumbnailDir);
    
    if (!await fs.pathExists(thumbnailPath)) {
      return res.status(500).json({ error: 'Failed to generate thumbnail' });
    }

    const stats = await fs.stat(thumbnailPath);
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': stats.size,
      'Last-Modified': stats.mtime.toUTCString(),
      'ETag': `"thumb-${size}-${stats.mtime.getTime()}-${stats.size}"`,
      'Cache-Control': 'public, max-age=604800' // 7 days
    });

    const stream = fs.createReadStream(thumbnailPath);
    stream.pipe(res);

  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

// Helper function to check if file is an image
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png'].includes(ext);
}

module.exports = router;