const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

// Ensure one active invitation per class-student pair
invitationSchema.index({ classId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Invitation", invitationSchema);
