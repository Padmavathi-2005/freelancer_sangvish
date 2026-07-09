import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/Hero.tsx';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('settings') || line.includes('api')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("Hero.tsx does not exist");
}
