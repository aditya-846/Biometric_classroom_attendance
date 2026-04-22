# BioAttend 🚀

**BioAttend** is an automated biometric classroom attendance system. It integrates live facial recognition with hardware sensors (Arduino) and a Node.js backend to provide a seamless, touchless attendance experience. 

## ✨ Features

- **Live Facial Recognition:** Uses `face-api.js` directly in the browser to detect and match faces in real-time.
- **Automated Triggering:** An Ultrasonic Sensor detects when a student steps in front of the camera, automatically triggering the face scan.
- **Hardware Feedback:** A Piezo Buzzer connected to the Arduino provides instant audio feedback (success or error tones) when attendance is marked.
- **Environmental Monitoring:** Real-time classroom temperature, humidity (DHT11), and lighting (LDR) metrics fall-streamed to the dashboard.
- **Student Management:** Full UI interface to register new students (capturing their facial descriptors), search for students, and remove records.
- **Complete Dashboard:** View real-time attendance logs, export the logs to CSV, and reset the attendance table for a new session.

## 🛠️ Technology Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript, WebSockets (`socket.io-client`), `face-api.js`
- **Backend:** Node.js, Express, WebSockets (`socket.io`)
- **Database:** MongoDB (via `mongoose`)
- **Hardware Comm:** `serialport` library to communicate with the Arduino

## 🔌 Hardware Required

- Arduino Nano (or Uno)
- Ultrasonic Sensor (e.g., HC-SR04)
- DHT11 Temperature and Humidity Sensor
- LDR (Light Dependent Resistor)
- Piezo Buzzer
- A Webcam for the face recognition

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`
- Arduino connected to the machine running the server

### 1. Installation

Clone this repository and install dependencies in the root directory:

```bash
npm install
```

### 2. Configuration

Before starting, ensure you update the Arduino COM port in the backend. 
Open `server.js` and update `ARDUINO_COM_PORT` to match where your Arduino is connected (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux):

```javascript
const ARDUINO_COM_PORT = 'COM10'; // UPDATE THIS
```

*Note: The MongoDB URL defaults to `mongodb://127.0.0.1:27017/bioattend`. If you are using a specific MongoDB configuration or Atlas, update it in `server.js`.*

### 3. Running the Server

Start the Node.js server:

```bash
# For standard execution
npm start

# For development with nodemon
npm run dev
```

### 4. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser. 
Ensure you grant camera permissions when prompted so the facial recognition models can work properly.

## 📂 Project Structure

- `server.js` - Main backend Server setup, MongoDB models, Arduino Serial Port reading, and Socket.IO real-time emission.
- `attendence.html` - The unified frontend dashboard.
- `package.json` - Server dependencies and startup scripts.
- `/models/` - Mongoose database schemas (`Student.js`, `Attendance.js`).
- `/weights/` - Pre-trained model weights utilized by `face-api.js` for facial recognition landmarks.
- `/arduino/` - C++ sketches for the Arduino Nano hardware components.
