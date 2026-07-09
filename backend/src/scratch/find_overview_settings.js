import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/admin/OverviewTab.tsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('settings') || line.includes('Settings') || line.includes('activeTab ===') || line.includes('setActiveTab')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("OverviewTab.tsx does not exist");
}
