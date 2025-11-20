const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  // ✅ Make sure this is imported

  markAsPlaced,
} = require('../controllers/candidateController');

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getCandidates)
  .post(createCandidate);

router.route('/:id')
  .get(getCandidate)
  .put(updateCandidate)
  .delete(deleteCandidate);

router.put('/:id/placed', markAsPlaced);

module.exports = router;
