const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Payment = require('../models/Payment');
const moment = require('moment');

// Get comprehensive analytics
// Get comprehensive analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z') // better end-of-day
      };
    }

    // Candidate Analytics
    const totalCandidates = await Candidate.countDocuments(dateFilter);
    const activeCandidates = await Candidate.countDocuments({
      ...dateFilter,
      status: { $in: ['Registered', 'Profile Ready', 'Applications Sent', 'Interview Scheduled'] }
    });
    const placedCandidates = await Candidate.countDocuments({
      ...dateFilter,
      status: 'Placed'
    });

    // Monthly Placements (Last 6 months)
    const sixMonthsAgo = moment().subtract(6, 'months').toDate();
    const monthlyPlacements = await Candidate.aggregate([
      { $match: { status: 'Placed', placementDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$placementDate' }, month: { $month: '$placementDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Revenue Analytics - CORRECT
    const totalRevenue = await Payment.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const serviceFeeRevenue = await Payment.aggregate([
      { $match: { ...dateFilter, paymentType: 'Service Fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const successFeeRevenue = await Payment.aggregate([
      { $match: { ...dateFilter, paymentType: 'Success Fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // PENDING FEES - CORRECT
    const pendingResult = await Candidate.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, pendingFees: { $sum: '$pending' } } }
    ]);
    const pendingFees = pendingResult[0]?.pendingFees || 0;

    // Interview Stats
    const totalInterviews = await Interview.countDocuments(dateFilter);
    const selectedInterviews = await Interview.countDocuments({ ...dateFilter, result: 'Selected' });
    const interviewSuccessRate = totalInterviews > 0
      ? ((selectedInterviews / totalInterviews) * 100).toFixed(1)
      : 0;

    // Conversion Funnel
    const conversionFunnel = {
      registered: await Candidate.countDocuments({ ...dateFilter, status: 'Registered' }),
      profileReady: await Candidate.countDocuments({ ...dateFilter, status: 'Profile Ready' }),
      applicationsSent: await Candidate.countDocuments({ ...dateFilter, status: 'Applications Sent' }),
      interviewScheduled: await Candidate.countDocuments({ ...dateFilter, status: 'Interview Scheduled' }),
      offerReceived: await Candidate.countDocuments({ ...dateFilter, status: 'Offer Received' }),
      placed: placedCandidates
    };

    // Top Companies
    const topCompanies = await Candidate.aggregate([
      { $match: { status: 'Placed', placedCompany: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$placedCompany',
          count: { $sum: 1 },
          avgSalary: { $avg: '$placedSalary' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Status Distribution
    const statusDistribution = await Candidate.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // FINAL RESPONSE - USING revenue object
    res.json({
      success: true,
      data: {
        candidates: {
          total: totalCandidates,
          active: activeCandidates,
          placed: placedCandidates,
          dropped: await Candidate.countDocuments({ ...dateFilter, status: 'Dropped' }),
          conversionRate: totalCandidates > 0 ? ((placedCandidates / totalCandidates) * 100).toFixed(1) : 0
        },
        placements: {
          total: placedCandidates,
          monthly: monthlyPlacements
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          serviceFee: serviceFeeRevenue[0]?.total || 0,
          successFee: successFeeRevenue[0]?.total || 0,
          pending: pendingFees   // ← NOW CORRECT!
        },
        interviews: {
          total: totalInterviews,
          selected: selectedInterviews,
          successRate: interviewSuccessRate
        },
        conversionFunnel,
        topCompanies,
        statusDistribution
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

// Get Monthly Placement Report
exports.getMonthlyPlacementReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = moment({ year, month: month - 1, day: 1 }).startOf('month').toDate();
    const endDate = moment({ year, month: month - 1, day: 1 }).endOf('month').toDate();

    const placements = await Candidate.find({
      status: 'Placed',
      placementDate: { $gte: startDate, $lte: endDate }
    }).populate('applications').lean();

    const summary = {
      totalPlacements: placements.length,
      avgSalary: placements.reduce((sum, p) => sum + (p.placedSalary || 0), 0) / placements.length || 0,
      companies: [...new Set(placements.map(p => p.placedCompany))],
      placements
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Monthly Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report'
    });
  }
};

// Get Revenue Report
exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const payments = await Payment.find(dateFilter)
      .populate('candidate', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const summary = {
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      byType: {},
      byMonth: {}
    };

    payments.forEach(payment => {
      // By Type
      if (!summary.byType[payment.type]) {
        summary.byType[payment.type] = 0;
      }
      summary.byType[payment.type] += payment.amount;

      // By Month
      const monthKey = moment(payment.createdAt).format('YYYY-MM');
      if (!summary.byMonth[monthKey]) {
        summary.byMonth[monthKey] = 0;
      }
      summary.byMonth[monthKey] += payment.amount;
    });

    res.json({
      success: true,
      data: {
        summary,
        payments
      }
    });

  } catch (error) {
    console.error('Revenue Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue report'
    });
  }
};
