const Payment = require('../models/Payment');
const Candidate = require('../models/Candidate');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Add payment
// @route   POST /api/payments
// @access  Private
exports.addPayment = async (req, res) => {
  try {
    const { candidateId, amount, paymentType } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const payment = await Payment.create({
      ...req.body,
      receivedBy: req.user.id,
    });

    // Update candidate's paid amount
    if (paymentType === 'Service Fee') {
      candidate.paid += amount;
      candidate.pending = candidate.serviceFee - candidate.paid;
    } else if (paymentType === 'Success Fee') {
      candidate.successFeePaid += amount;
      candidate.successFeePending = candidate.successFee - candidate.successFeePaid;
    }
    await candidate.save();

    // Send payment receipt email
    if (candidate.email) {
      const emailContent = emailTemplates.paymentReceipt(
        candidate.name,
        amount,
        new Date().toLocaleDateString(),
        payment.paymentMode,
        payment.transactionId,
        candidate.pending + candidate.successFeePending
      );
      await sendEmail({
        email: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    await ActivityLog.create({
      action: 'payment_received',
      candidateName: candidate.name,
      details: `Received ₹${amount} from ${candidate.name}`,
    });

    // NOTIFICATION ADDED HERE
    const { createNotification } = require('./notificationController');
    await createNotification(
      req.user._id,
      'payment',
      'Payment Received',
      `₹${amount.toLocaleString('en-IN')} received from ${candidate.name} 
(${paymentType === 'Service Fee' ? 'Service Fee' : 'Success Fee'})`,
      `/candidates/${candidateId}`,
      {
        candidateId,
        paymentId: payment._id,
        amount,
        type: paymentType
      }
    );

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, candidateId, paymentType } = req.query;

    const query = {};
    if (candidateId) query.candidateId = candidateId;
    if (paymentType) query.paymentType = paymentType;

    const payments = await Payment.find(query)
      .populate('candidateId', 'name email phone')
      .sort('-paymentDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total: count,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get candidate payments
// @route   GET /api/candidates/:candidateId/payments
// @access  Private
exports.getCandidatePayments = async (req, res) => {
  try {
    const payments = await Payment.find({ candidateId: req.params.candidateId })
      .sort('-paymentDate');

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalPaid,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
