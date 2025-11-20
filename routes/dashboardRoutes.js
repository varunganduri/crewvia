const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getDashboardSummary,
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/summary', getDashboardSummary);

module.exports = router;
