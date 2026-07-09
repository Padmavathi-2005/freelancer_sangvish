import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/ProjectMilestoneTracker.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('proposal') || line.includes('proposals')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
