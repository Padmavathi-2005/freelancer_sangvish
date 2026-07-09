import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (fullPath.includes('dashboard') && (fullPath.includes('layout.tsx') || fullPath.includes('Navbar') || fullPath.includes('Sidebar'))) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('z-') || line.includes('fixed') || line.includes('sticky')) {
            console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('g:/freelancer/frontend/src');
