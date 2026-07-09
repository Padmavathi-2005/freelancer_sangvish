import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/app/admin/page.tsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('Tab') || line.includes('settings') || line.includes('Settings')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("admin/page.tsx does not exist");
}
