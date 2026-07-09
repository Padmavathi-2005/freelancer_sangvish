import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/app/admin/layout.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('settings') || line.includes('Settings') || line.includes('site_management') || line.includes('payment_settings')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
