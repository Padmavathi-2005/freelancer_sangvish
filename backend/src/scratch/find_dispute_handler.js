import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/controllers/paymentController.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let print = false;
let counter = 0;
lines.forEach((line, idx) => {
  if (line.includes('dispute') && line.includes('UPDATE contracts SET')) {
    print = true;
  }
  if (line.includes('export const raiseDispute') || line.includes('const raiseDispute')) {
    print = true;
    counter = 0;
  }
  if (print) {
    console.log(`${idx + 1}: ${line}`);
    counter++;
    if (counter > 60) {
      print = false;
    }
  }
});
