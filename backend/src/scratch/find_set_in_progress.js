import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('in progress')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('status') && (line.includes('In Progress') || line.includes('in progress'))) {
            console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('g:/freelancer/backend/src');
