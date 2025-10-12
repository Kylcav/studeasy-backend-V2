const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "admin", "teacher", "student"],
    required: true,
  },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School" },
});



module.exports = mongoose.model("User", userSchema);
