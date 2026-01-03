const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { query } = require('../config/database');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with user ID and timestamp
    const uniqueSuffix = `${req.user.id}-${Date.now()}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// POST /api/upload/avatar - Upload profile picture
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  // Generate the URL for the uploaded file
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  // Update user's avatar_url in database
  await query(
    'UPDATE users SET avatar_url = $1 WHERE id = $2',
    [avatarUrl, req.user.id]
  );

  res.json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: {
      avatarUrl,
    },
  });
}));

// DELETE /api/upload/avatar - Remove profile picture
router.delete('/avatar', authenticate, asyncHandler(async (req, res) => {
  // Get current avatar URL
  const result = await query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [req.user.id]
  );

  const currentAvatarUrl = result.rows[0]?.avatar_url;

  // Delete the file if it exists and is a local upload
  if (currentAvatarUrl && currentAvatarUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../..', currentAvatarUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Update user's avatar_url to null in database
  await query(
    'UPDATE users SET avatar_url = NULL WHERE id = $1',
    [req.user.id]
  );

  res.json({
    success: true,
    message: 'Profile picture removed successfully',
  });
}));

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  
  next(err);
});

module.exports = router;
