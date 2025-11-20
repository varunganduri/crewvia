const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  submitApplication,
  getApplications,
  updateApplication,
  getCandidateApplications,
    deleteApplication,
    getApplication // ✅ ADD THIS

} = require('../controllers/applicationController');

router.use(protect);

router.route('/')
  .get(getApplications)
  .post(submitApplication);


router.route('/:id')
  .put(updateApplication)
  .delete(deleteApplication)
  .get(getApplication) ;

module.exports = router;
