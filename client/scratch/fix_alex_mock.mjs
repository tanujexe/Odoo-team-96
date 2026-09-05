import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/lib/api/mockData.js';
let content = fs.readFileSync(filePath, 'utf8');

// Extract cnt-1 object text
const alexObj = `  {
    id: 'cnt-1',
    contractCode: 'CNT-2024-002',
    employeeId: 'emp-alex-1',
    employeeName: 'Alex Rivera',
    employeeCode: 'EMP-002',
    department: 'Engineering',
    jobPosition: 'Staff Software Engineer',
    wage: 8500,
    wageType: 'MONTHLY',
    workingSchedule: '40 Hours / Week',
    startDate: '2024-01-01',
    endDate: null,
    status: 'ACTIVE',
    salaryStructureName: 'Standard Executive Structure',
    notes: 'This running contract is the source for payroll calculation in the active period.',
  },`;

// Remove cnt-1 from its old place
content = content.replace(alexObj + '\n', '');

// Insert cnt-1 right after cnt-jane-1 (which is at index 0 of mockContracts)
content = content.replace(
  "export const mockContracts = [\n",
  "export const mockContracts = [\n" + alexObj + "\n"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully moved Alex Rivera contract mock to top of mockContracts');
