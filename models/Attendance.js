const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  name: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
