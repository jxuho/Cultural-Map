const express = require('express');
const proposalController = require('../controllers/proposalController');
const authController = require('../controllers/authController');

const router = express.Router();

// ---User role (authentication required) ---
// All users must log in to create an offer.
router.use(authController.protect);

router.get('/my-proposals', proposalController.getProposalsByUserId);

// Register create, update, delete suggestions
// POST /api/v1/proposals
router
  .route('/')
  .post(authController.protect, proposalController.createProposal);

// ---Administrator role (requires authentication and restrictions) ---
// All administrator tasks require the 'admin' role.
router.use(authController.restrictTo('admin'));

// 1. View all suggestions (optional filtering)
// GET /api/v1/proposals
router.get('/', proposalController.getAllProposals);

// 2. Detailed inquiry with specific proposal ID
// GET /api/v1/proposals/:id
router.get('/:id', proposalController.getProposalById);

// 3. Accept the offer
// PATCH /api/v1/proposals/:id/accept
router.patch('/:id/accept', proposalController.acceptProposal);

// 4. Reject the offer
// PATCH /api/v1/proposals/:id/reject
router.patch('/:id/reject', proposalController.rejectProposal);

module.exports = router;
