const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const ActivityLog = require('../models/ActivityLog');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// @desc    Schedule interview
// @route   POST /api/interviews
// @access  Private
exports.scheduleInterview = async (req, res) => {
  try {
    const { candidateId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const interview = await Interview.create(req.body);

    // Update candidate status
    if (candidate.status === 'Registered' || candidate.status === 'Active' || candidate.status === 'Applications Sent') {
      candidate.status = 'Interview Scheduled';
      await candidate.save();
    }

    // Send interview reminder email
    if (candidate.email) {
      const emailContent = emailTemplates.interviewReminder(
        candidate.name,
        interview.company,
        interview.jobRole,
        new Date(interview.interviewDate).toLocaleDateString(),
        interview.interviewTime,
        interview.location,
        interview.interviewMode,
        interview.roundType
      );
      await sendEmail({
        email: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    await ActivityLog.create({
      action: 'interview_scheduled',
      candidateName: candidate.name,
      details: `Scheduled interview for ${candidate.name} at ${interview.company}`,
    });

    // NOTIFICATION ADDED HERE
    const { createNotification } = require('./notificationController');
    await createNotification(
      req.user._id,
      'interview',
      'New Interview Scheduled',
      `${candidate.name} → ${interview.company} (${interview.jobRole})
${new Date(interview.interviewDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at ${interview.interviewTime}`,
      `/candidates/${candidateId}`,
      {
        candidateId,
        interviewId: interview._id,
        company: interview.company
      }
    );

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all interviews
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, candidateId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (candidateId) query.candidateId = candidateId;

    const interviews = await Interview.find(query)
      .populate('candidateId', 'name email phone targetJobRole')
      .sort('-interviewDate')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Interview.countDocuments(query);

    res.status(200).json({
      success: true,
      count: interviews.length,
      total: count,
      data: interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update interview
// @route   PUT /api/interviews/:id
// @access  Private
exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Update candidate status if selected
    if (req.body.status === 'Selected') {
      const candidate = await Candidate.findById(interview.candidateId);
      if (candidate && candidate.status !== 'Placed') {
        candidate.status = 'Offer Received';
        await candidate.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get candidate interviews
// @route   GET /api/candidates/:candidateId/interviews
// @access  Private
exports.getCandidateInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.params.candidateId })
      .sort('-interviewDate');

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc Delete interview
// @route DELETE /api/interviews/:id
// @access Private
exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    await interview.deleteOne();

    // Log activity - ✅ FIXED: Use 'interview_deleted' instead of 'DELETE'
    await ActivityLog.create({
      action: 'interview_deleted',  // ✅ Changed from 'DELETE'
      candidateName: interview.candidateId?.name || 'Unknown',
      details: `Deleted interview for ${interview.company} - ${interview.jobRole}`,
      metadata: {
        interviewId: req.params.id,
        company: interview.company,
        jobRole: interview.jobRole,
        interviewDate: interview.interviewDate,
      },
    });

    res.json({
      success: true,
      message: 'Interview deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
