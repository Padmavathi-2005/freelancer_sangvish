import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/WorkspaceTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('contracts') || line.includes('contract') || line.includes('status')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
