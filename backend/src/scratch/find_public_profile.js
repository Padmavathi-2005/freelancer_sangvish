import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/controllers/freelancerController.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('getPublicFreelancerProfile')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
