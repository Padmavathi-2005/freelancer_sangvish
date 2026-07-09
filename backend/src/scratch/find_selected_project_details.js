import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/ProposalsTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('selectedProjectDetails')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
