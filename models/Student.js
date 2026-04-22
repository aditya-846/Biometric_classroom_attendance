const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photos: { type: [String], required: true }, // Base64 image data
  faceDescriptor: { type: [Number], required: true }, // Array of features
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
