import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/NotificationsTab.tsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('handleMarkSingleRead')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("NotificationsTab.tsx does not exist");
}
