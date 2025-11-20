const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  addPayment,
  getPayments,
  getCandidatePayments,
} = require('../controllers/paymentController');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(addPayment);

module.exports = router;
