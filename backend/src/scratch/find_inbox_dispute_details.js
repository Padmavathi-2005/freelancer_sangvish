import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/InboxTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('isDispute') || line.includes('CONTEST DISPUTE') || line.includes('ACCEPT REFUND') || line.includes('dispute') || line.includes('Dispute')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
