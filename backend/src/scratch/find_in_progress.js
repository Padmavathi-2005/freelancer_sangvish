import fs from 'fs';

const files = [
  'g:/freelancer/frontend/src/components/dashboard/FreelancerProjectsTab.tsx',
  'g:/freelancer/frontend/src/components/dashboard/WorkspaceTab.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('in progress') || line.toLowerCase().includes('in_progress')) {
        console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
