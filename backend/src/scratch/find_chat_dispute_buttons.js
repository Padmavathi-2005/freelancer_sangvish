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
      if (content.includes('CONTEST DISPUTE') || content.includes('ACCEPT REFUND') || content.includes('isDispute') || content.includes('is_dispute')) {
        console.log(`${fullPath}`);
      }
    }
  });
}

searchDir('g:/freelancer/frontend/src');
