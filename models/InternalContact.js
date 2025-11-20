
// models/InternalContact.js (Your internal references in companies)
const mongoose = require('mongoose');

const internalContactSchema = new mongoose.Schema({
  // Contact Person Details
  name: {
    type: String,
    required: [true, 'Contact name is required'],
  },
  designation: {
    type: String,
  },
  department: {
    type: String,
  },
  
  // Company Details
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
  },
  companyLocation: {
    type: String,
  },
  
  // Contact Information
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  whatsapp: {
    type: String,
  },
  
  // Business Terms
  referralFeePerPlacement: {
    type: Number,
    default: 0,
  },
  paymentTerms: {
    type: String, // "After joining", "50% advance", etc.
  },
  
  // Job Roles They Can Help With
  jobRolesHandled: [{
    type: String,
  }],
  
  // Performance Tracking
  totalReferrals: {
    type: Number,
    default: 0,
  },
  successfulPlacements: {
    type: Number,
    default: 0,
  },
  totalFeesPaid: {
    type: Number,
    default: 0,
  },
  pendingFees: {
    type: Number,
    default: 0,
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  notes: {
    type: String,
  },
  
}, {
  timestamps: true,
});

// Indexes
internalContactSchema.index({ companyName: 1 });
internalContactSchema.index({ isActive: 1 });

module.exports = mongoose.model('InternalContact', internalContactSchema);
