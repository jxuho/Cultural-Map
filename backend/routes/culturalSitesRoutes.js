const express = require('express');
const router = express.Router();

const culturalSitesController = require('../controllers/culturalSiteController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewsRoutes');

// review route
router.use('/:culturalSiteId/reviews', reviewRouter);

// Get cultural site around coordinates
router.get(
  '/nearby-osm',
  authController.protect,
  authController.restrictTo('admin', 'user'),
  culturalSitesController.getNearbyOsmCulturalSites,
);

// Save data matching schema to db
router.post(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  culturalSitesController.saveCulturalSiteToDb,
);

// District metadata for map LOD
router.get('/district-stats', culturalSitesController.getDistrictStats);
router.get('/district-boundaries', culturalSitesController.getDistrictBoundaries);

// Full query + filtering (query: category, name)
router.get('/', culturalSitesController.getAllCulturalSites);

// Single inquiry (keep after static routes)
router.get('/:id', culturalSitesController.getCulturalSiteById);

// Cultural heritage information update (for administrators, authentication required)
router.put(
  '/:id',
  authController.protect,
  authController.restrictTo('admin'),
  culturalSitesController.updateCulturalSiteById,
);

// DELETE /:id: Delete cultural sites (for administrators, authentication required)
router.delete(
  '/:id',
  authController.protect,
  authController.restrictTo('admin'),
  culturalSitesController.deleteCulturalSiteById,
);

module.exports = router;
