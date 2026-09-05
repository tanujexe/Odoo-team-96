import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { TimeOffType } from '../../models/TimeOffType.js';
import { TimeOffAllocation } from '../../models/TimeOffAllocation.js';
import { TimeOffRequest } from '../../models/TimeOffRequest.js';
import { AllocationConsumption } from '../../models/AllocationConsumption.js';
import { hashPassword, generateToken } from '../../services/authService.js';
import { approveRequest, refuseRequest, cancelRequest } from '../../services/timeOffService.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-07 Time Off & Leave Balance Idempotency Tests', () => {
  let hrToken, empToken, employee, hrUser, paidType, allocation;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await TimeOffType.deleteMany({});
    await TimeOffAllocation.deleteMany({});
    await TimeOffRequest.deleteMany({});
    await AllocationConsumption.deleteMany({});

    employee = await Employee.create({
      employeeCode: 'EMP400',
      name: 'David Leave',
      email: 'david@peoplepay.com',
    });

    const pass = await hashPassword('Pass123!');

    hrUser = await User.create({
      name: 'HR Manager',
      email: 'hr@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_MANAGER,
    });

    const empUser = await User.create({
      name: 'David Leave',
      email: 'david@peoplepay.com',
      passwordHash: pass,
      role: ROLES.EMPLOYEE,
      employeeId: employee._id,
    });

    hrToken = generateToken(hrUser);
    empToken = generateToken(empUser);

    paidType = await TimeOffType.create({
      name: 'Paid Time Off',
      code: 'PTO',
      unit: 'DAYS',
      allocationRequired: true,
      approvalWorkflow: true,
    });

    allocation = await TimeOffAllocation.create({
      employeeId: employee._id,
      typeId: paidType._id,
      allocatedAmount: 10,
      takenAmount: 0,
      remainingAmount: 10,
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      status: 'APPROVED',
    });
  });

  it('Approved leave request should reduce remaining balance correctly', async () => {
    const reqRes = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        typeId: paidType._id.toString(),
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        duration: 3,
      });

    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.data._id;

    // Approve
    const appRes = await request(app)
      .post(`/api/time-off/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(appRes.status).toBe(200);
    expect(appRes.body.data.status).toBe('APPROVED');

    // Check updated allocation
    const updatedAlloc = await TimeOffAllocation.findById(allocation._id);
    expect(updatedAlloc.takenAmount).toBe(3);
    expect(updatedAlloc.remainingAmount).toBe(7);
  });

  it('Retrying approval on an already approved request should NOT double-deduct balance (Idempotency)', async () => {
    const reqObj = await TimeOffRequest.create({
      employeeId: employee._id,
      typeId: paidType._id,
      startDate: new Date('2026-09-10'),
      endDate: new Date('2026-09-11'),
      duration: 2,
      status: 'PENDING',
    });

    // First approval
    await approveRequest({ requestId: reqObj._id, actorId: hrUser._id });
    let alloc = await TimeOffAllocation.findById(allocation._id);
    expect(alloc.remainingAmount).toBe(8);

    // Second (retried) approval
    await approveRequest({ requestId: reqObj._id, actorId: hrUser._id });
    alloc = await TimeOffAllocation.findById(allocation._id);
    expect(alloc.remainingAmount).toBe(8); // Must remain 8, not 6!
  });

  it('Refused leave request should NOT consume leave balance', async () => {
    const reqObj = await TimeOffRequest.create({
      employeeId: employee._id,
      typeId: paidType._id,
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-16'),
      duration: 2,
      status: 'PENDING',
    });

    await refuseRequest({ requestId: reqObj._id, reason: 'Staff shortage', actorId: hrUser._id });

    const alloc = await TimeOffAllocation.findById(allocation._id);
    expect(alloc.takenAmount).toBe(0);
    expect(alloc.remainingAmount).toBe(10);
  });

  it('Cancelling an approved request should reverse consumed balance exactly once', async () => {
    const reqObj = await TimeOffRequest.create({
      employeeId: employee._id,
      typeId: paidType._id,
      startDate: new Date('2026-09-20'),
      endDate: new Date('2026-09-22'),
      duration: 3,
      status: 'PENDING',
    });

    // Approve
    await approveRequest({ requestId: reqObj._id, actorId: hrUser._id });
    let alloc = await TimeOffAllocation.findById(allocation._id);
    expect(alloc.remainingAmount).toBe(7);

    // Cancel
    await cancelRequest({ requestId: reqObj._id, actorId: hrUser._id });
    alloc = await TimeOffAllocation.findById(allocation._id);
    expect(alloc.takenAmount).toBe(0);
    expect(alloc.remainingAmount).toBe(10);
  });

  it('Request exceeding remaining balance should be rejected with INSUFFICIENT_BALANCE error', async () => {
    const res = await request(app)
      .post('/api/time-off/requests')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        typeId: paidType._id.toString(),
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        duration: 15, // Exceeds 10 days remaining
      });

    expect(res.status).toBe(201);
    const requestId = res.body.data._id;

    const approveRes = await request(app)
      .post(`/api/time-off/requests/${requestId}/approve`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(approveRes.status).toBe(400);
    expect(approveRes.body.error.code).toBe('INSUFFICIENT_BALANCE');
  });
});
