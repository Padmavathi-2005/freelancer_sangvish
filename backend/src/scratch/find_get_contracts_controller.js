import fs from 'fs';

const filePath = 'g:/freelancer/backend/src/controllers/freelancerController.js';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let print = false;
let counter = 0;
lines.forEach((line, idx) => {
  if (line.includes('getFreelancerContracts')) {
    print = true;
    counter = 0;
  }
  if (print) {
    console.log(`${idx + 1}: ${line}`);
    counter++;
    if (counter > 40) {
      print = false;
    }
  }
});
