const Candidate = require('../models/Candidate');
const Payment = require('../models/Payment');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const { createNotification } = require('./notificationController');
// @desc Get all candidates
// @route GET /api/candidates
// @access Private
const getCandidates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search,
      status,
      targetJobRole,
      servicePackage,
      hasPending,
      sortBy = '-createdAt',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (targetJobRole) query.targetJobRole = { $regex: targetJobRole, $options: 'i' };
    if (servicePackage) query.servicePackage = servicePackage;
    if (hasPending === 'true') query.pending = { $gt: 0 };

    const candidates = await Candidate.find(query)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Candidate.countDocuments(query);

    res.status(200).json({
      success: true,
      count: candidates.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: candidates,
    });
  } catch (error) {
    console.error('GET Candidates Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get single candidate
// @route GET /api/candidates/:id
// @access Private
const getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const payments = await Payment.find({ candidateId: candidate._id })
      .sort('-paymentDate');
    
    const applications = await Application.find({ candidateId: candidate._id })
      .sort('-applicationDate');
    
    const interviews = await Interview.find({ candidateId: candidate._id })
      .sort('-interviewDate');

    res.status(200).json({
      success: true,
      data: {
        candidate,
        applications,
        interviews,
        payments,
        summary: {
          totalApplications: applications.length,
          totalInterviews: interviews.length,
          totalPayments: payments.length,
          serviceFeeBalance: candidate.pending,
          successFeeBalance: candidate.successFeePending,
        },
      },
    });
  } catch (error) {
    console.error('GET Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Create candidate
// @route POST /api/candidates
// @access Private
const createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);

    // Send welcome email (optional - comment out if email service not configured)
    try {
      if (candidate.email && emailTemplates && emailTemplates.welcomeEmail) {
        const emailContent = emailTemplates.welcomeEmail(
          candidate.name,
          candidate.targetJobRole
        );

        await sendEmail({
          email: candidate.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.log('Email sending failed (non-critical):', emailError.message);
    }

    // Log activity
    await ActivityLog.create({
      action: 'candidate_created',
      candidateName: candidate.name,
      details: `Created candidate: ${candidate.name} for ${candidate.targetJobRole}`,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully',
      data: candidate,
    });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Update candidate
// @route PUT /api/candidates/:id
// @access Private
const updateCandidate = async (req, res) => {
  try {
    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Check if status is being changed to "Placed"
    const statusChangedToPlaced = 
      req.body.status === 'Placed' && 
      candidate.status !== 'Placed';

    // Get total paid amount to recalculate pending
    const payments = await Payment.find({ candidateId: candidate._id });
    const totalPaid = payments.reduce((sum, payment) => {
      if (payment.paymentType === 'Service Fee') {
        return sum + payment.amount;
      }
      return sum;
    }, 0);

    // Store old values for email
    const oldStatus = candidate.status;

    // Update fields
    Object.keys(req.body).forEach(key => {
      candidate[key] = req.body[key];
    });

    // Recalculate pending if serviceFee changed
    if (req.body.serviceFee !== undefined) {
      candidate.paid = totalPaid;
      candidate.pending = candidate.serviceFee - totalPaid;
    }

    // If status changed to Placed, set placement date
    if (statusChangedToPlaced) {
      candidate.placementDate = new Date();
      
      // Set default values if not provided
      if (!candidate.placedCompany) {
        candidate.placedCompany = req.body.placedCompany || 'Company Name';
      }
      if (!candidate.placedJobRole) {
        candidate.placedJobRole = candidate.targetJobRole || 'Job Role';
      }
    }

    // Save candidate
    await candidate.save();

    // Send placement email if status changed to Placed
    if (statusChangedToPlaced && candidate.email) {
      try {
        const emailContent = emailTemplates.placementConfirmation(
          candidate.name,
          candidate.placedCompany || 'Your selected company',
          candidate.placedJobRole || candidate.targetJobRole,
          candidate.placedSalary || 'As per offer',
          candidate.joiningDate ? new Date(candidate.joiningDate).toLocaleDateString() : 'To be confirmed'
        );

        await sendEmail({
          email: candidate.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        console.log(`Placement email sent to ${candidate.email}`);
      } catch (emailError) {
        console.log('Email sending failed (non-critical):', emailError.message);
      }
    }

    await ActivityLog.create({
      action: statusChangedToPlaced ? 'candidate_placed' : 'candidate_updated',
      candidateName: candidate.name,
      details: statusChangedToPlaced 
        ? `${candidate.name} marked as placed` 
        : `Updated candidate: ${candidate.name}`,
    });

    // NOTIFICATION — ONLY WHEN CANDIDATE IS PLACED
    if (statusChangedToPlaced) {
      await createNotification(
        req.user._id,
        'placement',
        'Candidate Placed Successfully!',
        `${candidate.name} has been placed at ${candidate.placedCompany} as ${candidate.placedJobRole}`,
        `/candidates/${req.params.id}`,
        {
          candidateId: req.params.id,
          company: candidate.placedCompany,
          salary: candidate.placedSalary || 0
        }
      );
    }

    res.status(200).json({
      success: true,
      message: statusChangedToPlaced 
        ? 'Candidate marked as placed successfully! Placement email sent.' 
        : 'Candidate updated successfully',
      data: candidate,
    });
  } catch (error) {
    console.error('Update Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Delete candidate
// @route DELETE /api/candidates/:id
// @access Private
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    await Payment.deleteMany({ candidateId: candidate._id });
    await Interview.deleteMany({ candidateId: candidate._id });
    await Application.deleteMany({ candidateId: candidate._id });
    await candidate.deleteOne();

    await ActivityLog.create({
      action: 'candidate_deleted',
      candidateName: candidate.name,
      details: `Deleted candidate: ${candidate.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate and all related data deleted successfully',
    });
  } catch (error) {
    console.error('Delete Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Mark candidate as placed
// @route PUT /api/candidates/:id/placed
// @access Private
const markAsPlaced = async (req, res) => {
  try {
    const { placedCompany, placedJobRole, placedSalary, joiningDate, successFee } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Placed',
        placementDate: new Date(),
        placedCompany,
        placedJobRole,
        placedSalary,
        joiningDate,
        successFee,
        successFeePending: successFee,
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Send placement confirmation email (optional)
    try {
      if (candidate.email && emailTemplates && emailTemplates.placementConfirmation) {
        const emailContent = emailTemplates.placementConfirmation(
          candidate.name,
          placedCompany,
          placedJobRole,
          placedSalary,
          joiningDate
        );

        await sendEmail({
          email: candidate.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.log('Email sending failed (non-critical):', emailError.message);
    }

    await ActivityLog.create({
      action: 'candidate_placed',
      candidateName: candidate.name,
      details: `${candidate.name} placed at ${placedCompany} as ${placedJobRole}`,
    });

    res.status(200).json({
      success: true,
      message: 'Candidate marked as placed successfully',
      data: candidate,
    });
  } catch (error) {
    console.error('Mark as Placed Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  markAsPlaced,
};
