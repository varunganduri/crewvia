const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

// Analytics
router.get('/analytics', reportController.getAnalytics);

// Monthly Placement Report
router.get('/placements/monthly', reportController.getMonthlyPlacementReport);

// Revenue Report
router.get('/revenue', reportController.getRevenueReport);

module.exports = router;
