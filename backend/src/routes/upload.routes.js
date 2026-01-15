const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { authenticate, studentOnly } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { query } = require('../config/database');

// Configure multer storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambot/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    public_id: (req, file) => `avatar-${req.user.id}-${Date.now()}`,
  },
});

// Configure multer storage for resumes
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambot/resumes',
    resource_type: 'raw',
    format: 'pdf',
    public_id: (req, file) => `resume-${req.user.id}-${Date.now()}`,
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter for resumes (PDF only)
const resumeFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed for resumes.'), false);
  }
};

// Configure multer uploads
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for resumes
});

// POST /api/upload/avatar - Upload profile picture
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  // Get the URL from Cloudinary response
  const avatarUrl = req.file.path;

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
  
  // TODO: Add Cloudinary image deletion logic here if needed
  // const currentAvatarUrl = result.rows[0]?.avatar_url;

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

// POST /api/upload/resume - Upload resume (students only)
router.post('/resume', authenticate, studentOnly, uploadResume.single('resume'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  // Get the URL from Cloudinary response
  const resumeUrl = req.file.path;

  res.json({
    success: true,
    message: 'Resume uploaded successfully',
    data: {
      resumeUrl,
      filename: req.file.originalname,
    },
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
