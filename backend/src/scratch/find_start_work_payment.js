import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/controllers/paymentController.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Work Started') || line.includes('work_started') || line.includes('UPDATE contracts SET')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
