import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/routes/freelancerRoutes.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('/contracts')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
