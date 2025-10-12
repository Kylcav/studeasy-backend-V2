const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  resources: [{
    type: { type: String, enum: ["file", "link"], required: true },
    name: { type: String, required: true },
    url: { type: String, required: true }
  }],
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Class", 
    required: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Subject", subjectSchema);
