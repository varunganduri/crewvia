// models/Candidate.js (renamed from Student)
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
  },
  whatsapp: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
    education: {
    highestDegree: {
      type: String,
      enum: ['10th Standard', '12th Standard/Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD/Doctorate', 'Other', ''],
    },
    specialization: String,
    collegeName: String,
    yearOfPassing: Number,
  },
  
  // Job Target Information
  targetJobRole: {
    type: String,
    required: [true, 'Target job role is required'],
    // e.g., "Content Moderator", "Customer Support", "Data Entry"
  },
  targetCompanies: [{
    type: String,
    trim: true,
  }],
  preferredLocation: {
    type: String,
  },
  currentEmploymentStatus: {
    type: String,
    enum: ['Unemployed', 'Employed', 'Fresher', 'Notice Period'],
    default: 'Unemployed',
  },
  experience: {
    type: Number, // in years
    default: 0,
  },
  
  // Service Package
  servicePackage: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium', 'VIP'],
    required: true,
    // Basic: Resume submission only
    // Standard: Resume + 1 internal reference
    // Premium: Resume + multiple references + interview prep
    // VIP: Guaranteed placement with full support
  },
  
  // Registration & Status
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  placementDate: {
    type: Date,
  },
  exitDate: {
    type: Date,
  },
  
  status: {
    type: String,
    enum: [
      'Registered',           // Just registered
      'Profile Ready',        // Documents & profile complete
      'Applications Sent',    // Resume submitted to companies
      'Interview Scheduled',  // Got interview calls
      'Offer Received',       // Got job offer
      'Placed',              // Successfully placed
      'On Hold',             // Candidate not responding/waiting
      'Dropped'              // Service terminated
    ],
    default: 'Registered',
  },
  
  // Fee Structure
  serviceFee: {
    type: Number,
    required: [true, 'Service fee is required'],
  },
  paid: {
    type: Number,
    default: 0,
  },
  pending: {
    type: Number,
    default: function() {
      return this.serviceFee - this.paid;
    },
  },
  paymentDueDate: {
    type: Date,
  },
  
  // Success Fee (after placement)
  successFee: {
    type: Number,
    default: 0,
  },
  successFeePaid: {
    type: Number,
    default: 0,
  },
  successFeePending: {
    type: Number,
    default: 0,
  },
  
  // Documents
  resume: {
    url: String,
    uploadedAt: Date,
  },
  documents: [{
    name: String,
    type: String, // "Aadhar", "PAN", "Certificate", etc.
    url: String,
    uploadedAt: Date,
  }],
  
  // Placement Details
  placedCompany: {
    type: String,
  },
  placedJobRole: {
    type: String,
  },
  placedSalary: {
    type: Number,
  },
  joiningDate: {
    type: Date,
  },
  
  // Internal Notes
  notes: {
    type: String,
  },
  internalContacts: [{
    companyName: String,
    contactPerson: String,
    designation: String,
    phone: String,
    email: String,
    referralFee: Number,
    notes: String,
  }],
  
}, {
  timestamps: true,
});

// Auto-calculate pending amounts
candidateSchema.pre('save', function(next) {
  this.pending = this.serviceFee - this.paid;
  this.successFeePending = this.successFee - this.successFeePaid;
  next();
});

// Indexes for search
candidateSchema.index({ name: 'text', email: 'text', phone: 'text' });
candidateSchema.index({ status: 1 });
candidateSchema.index({ targetJobRole: 1 });
candidateSchema.index({ pending: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
