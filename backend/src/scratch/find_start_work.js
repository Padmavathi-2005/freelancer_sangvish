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
      if (content.includes('Work Started')) {
        console.log(`${fullPath}`);
      }
    }
  });
}

searchDir('g:/freelancer/backend/src');
