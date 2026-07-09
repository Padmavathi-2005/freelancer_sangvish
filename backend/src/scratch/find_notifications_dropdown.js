import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/app/dashboard/layout.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('NotificationsDropdown') || line.includes('function NotificationsDropdown')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
