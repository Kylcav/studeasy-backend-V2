const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  uid: { type: String, required: false, unique: true },
});

// Auto-generate UID before saving
schoolSchema.pre('save', async function(next) {
  if (!this.uid) {
    // Generate a unique UID with prefix 'SCH' and timestamp
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.uid = `SCH${timestamp}${randomSuffix}`;
    
    // Ensure uniqueness by checking if this UID already exists
    let isUnique = false;
    while (!isUnique) {
      const existingSchool = await this.constructor.findOne({ uid: this.uid });
      if (!existingSchool) {
        isUnique = true;
      } else {
        // If UID exists, generate a new one
        const newTimestamp = Date.now().toString();
        const newRandomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.uid = `SCH${newTimestamp}${newRandomSuffix}`;
      }
    }
  }
  next();
});

module.exports = mongoose.model("School", schoolSchema);
