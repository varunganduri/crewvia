// controllers/dashboardController.js (Updated)
const Candidate = require('../models/Candidate');
const Payment = require('../models/Payment');
const Interview = require('../models/Interview');
const Application = require('../models/Application');

exports.getDashboardSummary = async (req, res) => {
  try {
    // Candidate Statistics
    const totalCandidates = await Candidate.countDocuments();
    const activeCandidates = await Candidate.countDocuments({
      status: { $in: ['Profile Ready', 'Applications Sent', 'Interview Scheduled', 'Offer Received'] },
    });
    const placedCandidates = await Candidate.countDocuments({ status: 'Placed' });
    
    // Application Statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({
      status: { $in: ['Submitted', 'Under Review'] },
    });
    const shortlistedApplications = await Application.countDocuments({
      status: { $in: ['Shortlisted', 'Interview Scheduled'] },
    });
    
    // Interview Statistics
    const totalInterviews = await Interview.countDocuments();
    const upcomingInterviews = await Interview.countDocuments({
      status: 'Scheduled',
      interviewDate: { $gte: new Date() },
    });
    
    // Revenue Statistics
    const serviceFeesPending = await Candidate.aggregate([
      { $group: { _id: null, total: { $sum: '$pending' } } },
    ]);
    
    const successFeesPending = await Candidate.aggregate([
      { $match: { status: 'Placed' } },
      { $group: { _id: null, total: { $sum: '$successFeePending' } } },
    ]);
    
    // Monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    // Package Distribution
    const packageDistribution = await Candidate.aggregate([
      { $group: { _id: '$servicePackage', count: { $sum: 1 } } },
    ]);
    
    // Top Target Job Roles
    const topJobRoles = await Candidate.aggregate([
      { $group: { _id: '$targetJobRole', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    
    // Placement Rate
    const placementRate = totalCandidates > 0 
      ? ((placedCandidates / totalCandidates) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        candidates: {
          total: totalCandidates,
          active: activeCandidates,
          placed: placedCandidates,
          placementRate: `${placementRate}%`,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
        },
        interviews: {
          total: totalInterviews,
          upcoming: upcomingInterviews,
        },
        revenue: {
          monthly: monthlyRevenue[0]?.total || 0,
          serviceFeesPending: serviceFeesPending[0]?.total || 0,
          successFeesPending: successFeesPending[0]?.total || 0,
        },
        packageDistribution,
        topJobRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
