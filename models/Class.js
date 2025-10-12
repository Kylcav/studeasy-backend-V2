const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "School", 
    required: true 
  },
  subjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Subject" 
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Class", classSchema);
