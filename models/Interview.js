// models/Interview.js (Updated)
const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    // Link to the application this interview is for
  },
  
  company: {
    type: String,
    required: [true, 'Company name is required'],
  },
  jobRole: {
    type: String,
    required: [true, 'Job role is required'],
  },
  
  // Interview Schedule
  interviewDate: {
    type: Date,
    required: true,
  },
  interviewTime: {
    type: String,
  },
  interviewMode: {
    type: String,
    enum: ['Online', 'Offline', 'Telephonic', 'Video Call'],
    default: 'Offline',
  },
  location: {
    type: String,
  },
  
  // Interview Round
  round: {
    type: Number,
    default: 1,
  },
  roundType: {
    type: String,
    enum: ['HR', 'Technical', 'Managerial', 'Final', 'Group Discussion', 'Written Test'],
  },
  
  // Status & Result
  status: {
    type: String,
    enum: [
      'Scheduled',
      'Attended',
      'Not Attended',
      'Rescheduled',
      'Cancelled',
      'Selected',
      'Rejected',
      'On Hold'
    ],
    default: 'Scheduled',
  },
  
  // Interview Details
  interviewer: {
    name: String,
    designation: String,
    contact: String,
  },
  
  // Candidate Preparation
  prepNotes: {
    type: String, // Tips given to candidate
  },
  feedback: {
    type: String, // Post-interview feedback
  },
  
  // Offer Details (if selected)
  offerDetails: {
    salary: Number,
    joiningDate: Date,
    designation: String,
    location: String,
  },
  
  notes: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// Indexes
interviewSchema.index({ candidateId: 1, interviewDate: -1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ interviewDate: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
