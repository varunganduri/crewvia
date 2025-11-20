// models/Payment.js (Updated for Service Fees + Success Fees)
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  
  // Payment Type
  paymentType: {
    type: String,
    enum: ['Service Fee', 'Success Fee', 'Referral Fee', 'Other'],
    required: true,
  },
  
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 1,
  },
  
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
    default: 'Cash',
  },
  
  transactionId: {
    type: String,
  },
  
  // For Success Fee payments
  relatedToPlacement: {
    company: String,
    joiningDate: Date,
  },
  
  remark: {
    type: String,
  },
  
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  
}, {
  timestamps: true,
});

// Indexes
paymentSchema.index({ candidateId: 1, paymentDate: -1 });
paymentSchema.index({ paymentType: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
