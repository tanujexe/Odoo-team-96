import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { TimeOffRequest } from '../models/TimeOffRequest.js';
import { TimeOffAllocation } from '../models/TimeOffAllocation.js';
import { Contract } from '../models/Contract.js';
import { Attendance } from '../models/Attendance.js';
import { Payslip } from '../models/Payslip.js';
import { Payrun } from '../models/Payrun.js';
import { config } from '../config/env.js';

async function deleteOnlyEMP070() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Find the exact employee with employeeCode 'EMP-070' or corrupt name
  const emp = await Employee.findOne({
    $or: [{ employeeCode: 'EMP-070' }, { name: /EMP-070/i }]
  });

  if (!emp) {
    console.log('No employee found with code EMP-070.');
  } else {
    console.log(`Found target employee: [${emp.employeeCode}] "${emp.name}" (ID: ${emp._id})`);
    const empId = emp._id;

    // Delete ONLY this employee and their associated records
    const uResult = await User.deleteMany({ $or: [{ employeeId: empId }, { email: emp.email }] });
    const toResult = await TimeOffRequest.deleteMany({ employeeId: empId });
    const taResult = await TimeOffAllocation.deleteMany({ employeeId: empId });
    const attResult = await Attendance.deleteMany({ employeeId: empId });
    const psResult = await Payslip.deleteMany({ employeeId: empId });
    const cResult = await Contract.deleteMany({ employeeId: empId });
    await Payrun.updateMany({ employeeIds: empId }, { $pull: { employeeIds: empId } });
    await Employee.findByIdAndDelete(empId);

    console.log(`Deleted ONLY target EMP-070 records:
  - Users deleted: ${uResult.deletedCount}
  - TimeOff requests deleted: ${toResult.deletedCount}
  - TimeOff allocations deleted: ${taResult.deletedCount}
  - Attendance deleted: ${attResult.deletedCount}
  - Payslips deleted: ${psResult.deletedCount}
  - Contracts deleted: ${cResult.deletedCount}
  - Employee profile deleted: 1
`);
  }

  // Also clean any orphan TimeOffRequest whose description or linked employee name has EMP-070
  const orphanRequests = await TimeOffRequest.find();
  for (const r of orphanRequests) {
    if (r.description && r.description.includes('EMP-070')) {
      console.log('Deleted corrupt orphan TimeOff request:', r._id);
      await TimeOffRequest.findByIdAndDelete(r._id);
    }
  }

  await mongoose.disconnect();
}

deleteOnlyEMP070().catch((err) => {
  console.error(err);
  process.exit(1);
});
