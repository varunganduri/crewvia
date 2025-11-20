// models/Application.js (Track resume submissions to companies)
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  
  // Application Details
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  
  // How was resume submitted
  submissionMethod: {
    type: String,
    enum: [
      'Internal Reference',   // Through internal contact
      'Direct Application',   // Applied directly on portal
      'Consultancy Portal',   // Through consultancy account
      'Walk-in',             // Walk-in interview
      'Email'                // Emailed to HR
    ],
    required: true,
  },
  
  // Internal Reference Details (if applicable)
  referredBy: {
    contactName: String,
    designation: String,
    department: String,
  },
  referralFee: {
    type: Number,
    default: 0,
  },
  referralFeePaid: {
    type: Boolean,
    default: false,
  },
  
  // Application Status
  status: {
    type: String,
    enum: [
      'Submitted',           // Resume submitted
      'Under Review',        // HR reviewing
      'Shortlisted',         // Shortlisted for interview
      'Interview Scheduled', // Interview date confirmed
      'Rejected',            // Application rejected
      'On Hold',             // Company on hold
      'Offer Extended',      // Offer given
      'Offer Accepted',      // Candidate accepted
      'Offer Rejected',      // Candidate rejected offer
      'Joined'               // Successfully joined
    ],
    default: 'Submitted',
  },
  
  // Job Details
  jobPortal: {
    type: String, // Naukri, LinkedIn, Company Website, etc.
  },
  applicationId: {
    type: String, // Application reference number if any
  },
  
  // Timeline
  statusHistory: [{
    status: String,
    date: Date,
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  }],
  
  // Additional Info
  expectedSalary: {
    type: Number,
  },
  notes: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// Indexes
applicationSchema.index({ candidateId: 1, applicationDate: -1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ companyName: 1 });

module.exports = mongoose.model('Application', applicationSchema);
