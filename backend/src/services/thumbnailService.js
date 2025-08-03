const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

/**
 * Generate thumbnail for an image
 * @param {string} imagePath - Full path to the original image
 * @param {number} size - Thumbnail size (width/height)
 * @param {string} thumbnailDir - Directory to store thumbnails
 * @returns {Promise<string>} Path to the generated thumbnail
 */
async function generateThumbnail(imagePath, size, thumbnailDir) {
  try {
    // Create a unique filename for the thumbnail
    const imageHash = crypto.createHash('md5')
      .update(imagePath)
      .digest('hex');
    
    const thumbnailFilename = `${imageHash}_${size}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Check if thumbnail already exists and is newer than original
    if (await fs.pathExists(thumbnailPath)) {
      const [thumbnailStats, originalStats] = await Promise.all([
        fs.stat(thumbnailPath),
        fs.stat(imagePath)
      ]);

      if (thumbnailStats.mtime >= originalStats.mtime) {
        return thumbnailPath;
      }
    }

    // Generate thumbnail using Sharp
    await sharp(imagePath)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(thumbnailPath);

    return thumbnailPath;

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Clean up old thumbnails
 * @param {string} thumbnailDir - Directory containing thumbnails
 * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
 */
async function cleanupThumbnails(thumbnailDir, maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const files = await fs.readdir(thumbnailDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(thumbnailDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old thumbnail: ${file}`);
      }
    }
  } catch (error) {
    console.error('Thumbnail cleanup error:', error);
  }
}

/**
 * Get image metadata
 * @param {string} imagePath - Full path to the image
 * @returns {Promise<object>} Image metadata
 */
async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    throw new Error('Failed to extract image metadata');
  }
}

module.exports = {
  generateThumbnail,
  cleanupThumbnails,
  getImageMetadata
};