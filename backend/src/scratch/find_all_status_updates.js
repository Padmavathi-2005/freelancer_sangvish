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
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('UPDATE') && line.includes('contracts') && line.includes('status')) {
          console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  });
}

searchDir('g:/freelancer/backend/src');
