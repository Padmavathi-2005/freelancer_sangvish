import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/app/admin/AdminContext.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('interface') && line.includes('Props') || line.includes('ContextType') || line.includes('AdminContextProps')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
