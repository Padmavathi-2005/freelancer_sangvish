import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/InboxTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('message_text') || line.includes('last_message') || line.includes('substring') || line.includes('slice')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
