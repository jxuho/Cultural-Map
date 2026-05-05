// Backend/src/routes/user routes.js
const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

// All favorites-related operations are protected to only be done by logged in users.
router.use(authController.protect);

// Change role (admin only)
// PATCH /api/v1/users/updateRole/:userId
router.patch(
  '/updateRole/:userId',
  authController.restrictTo('admin'),
  authController.updateUserRole,
);

// Get my information
router.get('/me', userController.getMe);
// Update my information
router.patch('/updateMe', userController.updateMe);
// Delete Account
router.delete('/deleteMe', userController.deleteMe);
// Get user information
router.get('/:userId', userController.getUserById);
// Get all user information
router.get('/', authController.restrictTo('admin'), userController.getAllUsers);

// Look up favorites (when viewing the favorites list in your user profile)
// /api/v1/users/me/favorites
router.get('/me/favorites', userController.getFavoriteSites);

// Add to favorites: Receives a specific cultural heritage ID as a URL parameter
// /api/v1/users/me/favorites/:siteId
router.post('/me/favorites/:siteId', userController.addFavoriteSite);

// Remove favorite: Receives a specific cultural heritage ID as a URL parameter
// /api/v1/users/me/favorites/:siteId
router.delete('/me/favorites/:siteId', userController.removeFavoriteSite);

router.get('/me/reviews', userController.getMyReviews);

module.exports = router;
