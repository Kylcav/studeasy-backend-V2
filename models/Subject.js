const mongoose = require("mongoose");

// Embedded MCQ question schema
const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: {
    type: [{ type: String, trim: true }],
    validate: {
      validator: function(arr) { return Array.isArray(arr) && arr.length >= 2; },
      message: "A question must have at least two options"
    },
    required: true
  },
  answers: {
    type: [{ type: String, trim: true }],
    default: [],
    validate: {
      validator: function(ans) {
        // All answers must be among options
        if (!Array.isArray(ans)) return false;
        const optionSet = new Set(this.options || []);
        return ans.every(a => optionSet.has(a));
      },
      message: "All answers must be included in options"
    }
  }
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  quizQuestions: { type: [quizQuestionSchema], default: [] },
  quizQuestionCount: { type: Number, default: 0, min: 0 },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Class", 
    required: true 
  }
}, {
  timestamps: true
});

// Keep quizQuestionCount in sync on save


module.exports = mongoose.model("Subject", subjectSchema);
