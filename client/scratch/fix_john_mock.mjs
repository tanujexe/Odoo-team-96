import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/lib/api/mockData.js';
let content = fs.readFileSync(filePath, 'utf8');

const johnObj = `  {
    id: 'cnt-john-1',
    contractCode: 'CNT-2024-001',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    employeeCode: 'emp-john-1',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    wage: 8500,
    wageType: 'MONTHLY',
    workingSchedule: '40 Hours / Week',
    startDate: '2024-01-01',
    endDate: null,
    status: 'ACTIVE',
    salaryStructureName: 'Standard Executive Structure',
    notes: 'This running contract is the source for payroll calculation in the active period.',
  },`;

// Remove cnt-john-1 from its current location
content = content.replace(johnObj + '\n', '');

// Insert cnt-john-1 at top of mockContracts
content = content.replace(
  "export const mockContracts = [\n",
  "export const mockContracts = [\n" + johnObj + "\n"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully moved CNT-2024-001 to top of mockContracts');
