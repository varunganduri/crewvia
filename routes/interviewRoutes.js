const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  scheduleInterview,
  getInterviews,
  updateInterview,
  getCandidateInterviews,
  deleteInterview
} = require('../controllers/interviewController');

router.use(protect);

router.route('/')
  .get(getInterviews)
  .post(scheduleInterview);

router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);


module.exports = router;
