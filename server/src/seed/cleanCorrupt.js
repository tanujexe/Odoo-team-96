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

async function cleanup() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB:', config.mongoUri);

  const regex = /EMP-070|Auto-Generate|house|Job Position|Section 2/i;

  const employees = await Employee.find({
    $or: [{ name: regex }, { employeeCode: regex }]
  });
  console.log('Matching employees found:', employees.length);
  for (const emp of employees) {
    console.log(`- Deleting employee [${emp.employeeCode}] ${emp.name} (${emp._id})`);
    const empId = emp._id;
    await User.deleteMany({ employeeId: empId });
    await TimeOffRequest.deleteMany({ employeeId: empId });
    await TimeOffAllocation.deleteMany({ employeeId: empId });
    await Attendance.deleteMany({ employeeId: empId });
    await Payslip.deleteMany({ employeeId: empId });
    await Contract.deleteMany({ employeeId: empId });
    await Payrun.updateMany({ employeeIds: empId }, { $pull: { employeeIds: empId } });
    await Employee.findByIdAndDelete(empId);
  }

  // Also check for matching users
  const users = await User.find({
    $or: [{ name: regex }, { email: regex }]
  });
  console.log('Matching users found:', users.length);
  for (const u of users) {
    console.log(`- Deleting user ${u.name} (${u.email})`);
    await User.findByIdAndDelete(u._id);
  }

  // Also check for time off requests with corrupt employee or description
  const requests = await TimeOffRequest.find().populate('employeeId');
  for (const req of requests) {
    if (!req.employeeId || regex.test(req.employeeId?.name || '') || regex.test(req.description || '')) {
      console.log(`- Deleting corrupt timeoff request ${req._id}`);
      await TimeOffRequest.findByIdAndDelete(req._id);
    }
  }

  console.log('CLEANUP_SUCCESS');
  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
