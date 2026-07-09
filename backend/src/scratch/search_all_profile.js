import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('g:/freelancer/frontend/src');
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('selectedFreelancerProfile') && !content.includes('setSelectedFreelancerProfile')) {
    console.log(`FOUND in: ${file}`);
  }
});
