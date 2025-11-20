const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
          'candidate_created',
      'candidate_added',
      'candidate_updated',
      'candidate_deleted',
      'application_submitted',
      'application_updated',          // ✅ ADD THIS
      'application_deleted',          // ✅ ADD THIS
      'application_status_updated',   // ✅ ADD THIS
      'interview_scheduled',
      'interview_updated',            // ✅ ADD THIS
      'interview_deleted',            // ✅ ADD THIS
      'payment_received',
      'payment_updated',              // ✅ ADD THIS
      'candidate_placed',
    ],
  },
  candidateName: String,
  details: String,
  metadata: {
    type: Object,
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
