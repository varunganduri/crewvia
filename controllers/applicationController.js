const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc Submit application
// @route POST /api/applications
// @access Private
exports.submitApplication = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const application = await Application.create(req.body);

    // Update candidate status
    if (candidate.status === 'Registered' || candidate.status === 'Profile Ready') {
      candidate.status = 'Applications Sent';
      await candidate.save();
    }

    // Send email
    if (candidate.email) {
      const emailContent = emailTemplates.applicationSubmitted(
        candidate.name,
        application.companyName,
        application.jobRole,
        new Date().toLocaleDateString()
      );

      await sendEmail({
        email: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    await ActivityLog.create({
      action: 'application_submitted',
      candidateName: candidate.name,
      details: `Submitted application for ${candidate.name} to ${application.companyName}`,
    });

    // NOTIFICATION ADDED HERE
    const { createNotification } = require('./notificationController');
    await createNotification(
      req.user._id,
      'application',
      'New Application Submitted',
      `${candidate.name} → ${application.companyName} 
Position: ${application.jobRole}`,
      `/candidates/${candidateId}`,
      {
        candidateId,
        applicationId: application._id,
        company: application.companyName,
        jobRole: application.jobRole
      }
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get all applications
// @route GET /api/applications
// @access Private
exports.getApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, candidateId, companyName } = req.query;

    const query = {};
    if (status) query.status = status;
    if (candidateId) query.candidateId = candidateId;
    if (companyName) query.companyName = { $regex: companyName, $options: 'i' };

    const applications = await Application.find(query)
      .populate('candidateId', 'name email phone targetJobRole')
      .sort('-applicationDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total: count,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Update application
// @route PUT /api/applications/:id
// @access Private
exports.updateApplication = async (req, res) => {
  try {
    // ✅ GET OLD APPLICATION TO COMPARE STATUS
    const oldApplication = await Application.findById(req.params.id).populate('candidateId', 'name email');

    if (!oldApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const oldStatus = oldApplication.status;
    const newStatus = req.body.status;

    // ✅ UPDATE APPLICATION
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('candidateId', 'name email');

    // ✅ SEND EMAIL IF STATUS CHANGED
    if (oldStatus !== newStatus && application.candidateId && application.candidateId.email) {
      const emailContent = emailTemplates.applicationStatusUpdate(
        application.candidateId.name,
        application.companyName,
        application.jobRole,
        oldStatus,
        newStatus
      );

      await sendEmail({
        email: application.candidateId.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      // ✅ LOG ACTIVITY
      await ActivityLog.create({
        action: 'application_status_updated',
        candidateName: application.candidateId.name,
        details: `Application status changed from ${oldStatus} to ${newStatus} for ${application.companyName}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Delete application
// @route DELETE /api/applications/:id
// @access Private
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get candidate applications
// @route GET /api/candidates/:candidateId/applications
// @access Private
exports.getCandidateApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.params.candidateId })
      .sort('-applicationDate');

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc Delete application
// @route DELETE /api/applications/:id
// @access Private
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    await application.deleteOne();

    // Log activity
    await ActivityLog.create({
      action: 'application_deleted',
      candidateName: application.candidateId?.name || 'Unknown',
      details: `Deleted application for ${application.companyName} - ${application.jobRole}`,
    });

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc Get single application
// @route GET /api/applications/:id
// @access Private
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email phone targetJobRole');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

