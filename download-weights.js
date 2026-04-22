const https = require('https');
const fs = require('fs');
const path = require('path');

const weightsDir = path.join(__dirname, 'weights');
if (!fs.existsSync(weightsDir)) {
  fs.mkdirSync(weightsDir);
  console.log('Created /weights folder.');
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

async function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const dest = path.join(weightsDir, file);
    const fileStream = fs.createWriteStream(dest);
    console.log(`Downloading ${file}...`);
    https.get(baseUrl + file, (response) => {
      // Handle redirects if any
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
           res.pipe(fileStream);
           fileStream.on('finish', () => { fileStream.close(); resolve(); });
        });
      } else {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  console.log('Starting download of AI Model weights from GitHub...');
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    console.log('\n✅ All weights downloaded successfully to the /weights directory!');
    console.log('You can now restart your server (node server.js) and the face scan will work locally!');
  } catch(e) {
    console.error('Error downloading files:', e);
  }
})();
