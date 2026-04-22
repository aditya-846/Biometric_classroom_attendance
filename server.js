const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort, ReadlineParser } = require('serialport');

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve the static frontend
app.use(express.static(path.join(__dirname)));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'attendence.html'));
});

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/bioattend')
  .then(() => console.log('✅ Connected to MongoDB (bioattend database)'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- ARDUINO HARDWARE INTEGRATION ---
const ARDUINO_COM_PORT = 'COM10'; // USER: UPDATE THIS TO MATCH YOUR ARDUINO COM PORT
let arduinoPort;

try {
  arduinoPort = new SerialPort({ path: ARDUINO_COM_PORT, baudRate: 9600 });
  const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  arduinoPort.on('open', () => console.log(`✅ Connected to Arduino on ${ARDUINO_COM_PORT}`));
  arduinoPort.on('error', (err) => console.log('⚠️ Serial Port info:', err.message));

  let lastTriggerTime = 0;
  parser.on('data', (data) => {
    try {
      const sensorData = JSON.parse(data.trim());

      // Auto-scan trigger debounce (trigger max once every 4 seconds if hovering < 50cm)
      const now = Date.now();
      if (sensorData.dist > 0 && sensorData.dist < 50 && (now - lastTriggerTime > 4000)) {
        io.emit('auto_scan_trigger', { distance: sensorData.dist });
        lastTriggerTime = now;
      }

      // Broadcast live environment stats
      io.emit('environment_update', sensorData);
    } catch (e) {
      // Ignore if Arduino prints non-JSON debug strings
    }
  });
} catch (error) {
  console.log('⚠️ SerialPort setup failed.');
}

io.on('connection', (socket) => {
  // Frontend tells backend that attendance was successfully scanned
  socket.on('attendance_marked', (result) => {
    if (arduinoPort && arduinoPort.isOpen) {
      // Send '1' for success beep, '0' for error beep
      arduinoPort.write(result === 'SUCCESS' ? '1\n' : '0\n');
    }
  });
});

// --- API ROUTES ---

// 1. Register a new student
app.post('/api/students', async (req, res) => {
  try {
    const { studentId, name, photos, faceDescriptor } = req.body;

    if (!faceDescriptor || faceDescriptor.length === 0) {
      return res.status(400).json({ error: 'No face detected in the images' });
    }

    // Check if student exists
    const existing = await Student.findOne({ studentId });
    if (existing) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }

    const newStudent = new Student({
      studentId,
      name,
      photos,
      faceDescriptor
    });

    await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully', student: newStudent });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// 2. Get all registered students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({}, 'studentId name faceDescriptor');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 2.5. Remove a student
app.delete('/api/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const deleted = await Student.findOneAndDelete({ studentId });
    if (!deleted) return res.status(404).json({ error: 'Student not found' });

    // Also remove their attendance records
    await Attendance.deleteMany({ studentId });

    res.json({ message: 'Student and attendance records removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

// 3. Mark Attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { studentId, name } = req.body;

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      studentId,
      time: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      return res.status(200).json({ message: 'Attendance already marked today', status: 'ALREADY_PRESENT' });
    }

    const log = new Attendance({ studentId, name });
    await log.save();

    res.status(201).json({ message: 'Attendance marked successfully', status: 'ATTENDANCE_MARKED', log });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// 4. Get total attendance logs
app.get('/api/attendance', async (req, res) => {
  try {
    const logs = await Attendance.find().sort({ time: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
});

// 5. Reset all attendance logs
app.delete('/api/attendance/reset', async (req, res) => {
  try {
    await Attendance.deleteMany({});
    res.json({ message: 'Attendance reset successfully' });
  } catch (error) {
    console.error('Error resetting attendance:', error);
    res.status(500).json({ error: 'Failed to reset attendance' });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 BioAttend Server running on http://localhost:${PORT}`);
});
