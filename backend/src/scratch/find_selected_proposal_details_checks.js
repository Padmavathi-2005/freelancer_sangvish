import fs from 'fs';

const filePath = 'g:/freelancer/frontend/src/components/dashboard/ProposalsTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('selectedProposalDetails') || line.includes('setSelectedProposalDetails')) {
    if (line.includes('if') || line.includes('&&') || line.includes('===')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
