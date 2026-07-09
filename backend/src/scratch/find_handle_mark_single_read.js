import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/app/dashboard/DashboardContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('handleMarkSingleRead') || line.includes('MarkSingleRead')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
