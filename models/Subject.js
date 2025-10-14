const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
 quizQuestions: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "QuizQuestion"
 }],
  quizQuestionCount: { type: Number, default: 0, min: 0 },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Class", 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Subject", subjectSchema);
