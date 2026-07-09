import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/config/setupDb.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('CREATE TABLE contracts') || line.includes('CREATE TABLE IF NOT EXISTS contracts')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
