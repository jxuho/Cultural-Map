const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController'); // Authentication middleware

// mergeParams: true for the :culturalSiteId/reviews route
// Route parameter (culturalSiteId in this case) passed from the parent router (culturalSitesRoutes)
// Merge it into req.params of the child router (reviewsRoutes).
const router = express.Router({ mergeParams: true });

// View all reviews of a specific cultural property
router.get('/', reviewController.getAllReviews);

// Create a review for a specific cultural heritage site
router.post(
  '/',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.createReview,
);

// View specific reviews of specific cultural heritage sites
router.get('/:reviewId', reviewController.getReviewById);

// Edit review (user only)
router.patch(
  '/:reviewId',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.updateReviewById,
);

// Delete review
router.delete(
  '/:reviewId',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.deleteReviewById,
);

module.exports = router;
