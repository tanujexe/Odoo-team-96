import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { User, ROLES } from '../../models/User.js';
import { Employee } from '../../models/Employee.js';
import { Attendance } from '../../models/Attendance.js';
import { hashPassword, generateToken } from '../../services/authService.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/peoplepay360_test';

describe('PP-07 Attendance Workflow Tests', () => {
  let hrToken, empToken, employee, hrUser;

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
    await Attendance.deleteMany({});

    employee = await Employee.create({
      employeeCode: 'EMP300',
      name: 'Charlie Attendance',
      email: 'charlie@peoplepay.com',
    });

    const pass = await hashPassword('Pass123!');

    hrUser = await User.create({
      name: 'HR Manager',
      email: 'hr@peoplepay.com',
      passwordHash: pass,
      role: ROLES.HR_MANAGER,
    });

    const empUser = await User.create({
      name: 'Charlie Attendance',
      email: 'charlie@peoplepay.com',
      passwordHash: pass,
      role: ROLES.EMPLOYEE,
      employeeId: employee._id,
    });

    hrToken = generateToken(hrUser);
    empToken = generateToken(empUser);
  });

  it('POST /api/attendance/check-in should create check-in record', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${empToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('checkIn');
    expect(res.body.data.status).toBe('PRESENT');
  });

  it('POST /api/attendance/check-out should update check-out time and calculate workedHours', async () => {
    const checkInTime = new Date('2026-09-05T08:00:00.000Z');
    const checkOutTime = new Date('2026-09-05T17:00:00.000Z');

    const att = await Attendance.create({
      employeeId: employee._id,
      date: new Date('2026-09-05T00:00:00.000Z'),
      checkIn: checkInTime,
    });

    const res = await request(app)
      .post(`/api/attendance/${att._id}/check-out`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ checkOutTime: checkOutTime.toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.data.workedHours).toBe(9.0);
  });

  it('PATCH /api/attendance/:id/correction should allow authorized HR correction', async () => {
    const att = await Attendance.create({
      employeeId: employee._id,
      date: new Date('2026-09-05T00:00:00.000Z'),
      checkIn: new Date('2026-09-05T09:00:00.000Z'),
    });

    const res = await request(app)
      .patch(`/api/attendance/${att._id}/correction`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        checkIn: '2026-09-05T08:30:00.000Z',
        checkOut: '2026-09-05T17:30:00.000Z',
        reason: 'Authorized shift timing adjustment',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.workedHours).toBe(9.0);
    expect(res.body.data.correctionReason).toBe('Authorized shift timing adjustment');
  });

  it('Employee role should NOT be allowed to call attendance correction endpoint', async () => {
    const att = await Attendance.create({
      employeeId: employee._id,
      date: new Date('2026-09-05T00:00:00.000Z'),
      checkIn: new Date('2026-09-05T09:00:00.000Z'),
    });

    const res = await request(app)
      .patch(`/api/attendance/${att._id}/correction`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        reason: 'Unauthorized self correction attempt',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
