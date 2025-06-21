const express = require('express');
const proposalController = require('../controllers/proposalController');
const authController = require('../controllers/authController'); // 인증 및 역할 제한을 위한 컨트롤러 가정

const router = express.Router();

// --- 사용자 역할 (인증 필요) ---
// 모든 사용자는 제안을 생성하기 위해 로그인해야 합니다.
router.use(authController.protect);


router.get('/my-proposals', proposalController.getProposalsByUserId)

// create, update, delete 제안 등록
// POST /api/v1/proposals
router.route('/')
  .post(authController.protect, proposalController.createProposal);


// --- 관리자 역할 (인증 및 제한 필요) ---
// 모든 관리자 작업은 'admin' 역할이 필요합니다.
router.use(authController.restrictTo('admin'));

// 1. 모든 제안 조회 (필터링 선택 사항)
// GET /api/v1/proposals
router.get('/', proposalController.getAllProposals);

// 2. 특정 제안 ID로 상세 조회
// GET /api/v1/proposals/:id
router.get('/:id', proposalController.getProposalById);

// 3. 제안 수락
// PATCH /api/v1/proposals/:id/accept
router.patch('/:id/accept', proposalController.acceptProposal);

// 4. 제안 거절
// PATCH /api/v1/proposals/:id/reject
router.patch('/:id/reject', proposalController.rejectProposal);


module.exports = router;