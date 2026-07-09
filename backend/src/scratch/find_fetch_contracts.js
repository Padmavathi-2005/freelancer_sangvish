import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/ProjectMilestoneTracker.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let print = false;
let counter = 0;
lines.forEach((line, idx) => {
  if (line.includes('fetchContracts') || line.includes('api/payments/contracts')) {
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
