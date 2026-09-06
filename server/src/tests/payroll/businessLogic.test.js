import { describe, it, expect } from 'vitest';
import { calculateDayHours, calculateWeeklyHours } from '../../services/scheduleService.js';
import { getWarningLabel, checkEmployeeBankDetails } from '../../payroll/warningService.js';

describe('PeoplePay360 Core Business Logic & Workflow Tests', () => {
  describe('Automated Time & Schedule Math', () => {
    it('calculateDayHours should correctly calculate net daily hours after subtracting lunch break', () => {
      // 08:30 (510 min) to 17:00 (1020 min) = 510 gross min. Break = 60 min. Net = 450 min = 7.5 hours
      const hours = calculateDayHours('08:30', '17:00', 60);
      expect(hours).toBe(7.5);
    });

    it('calculateWeeklyHours should calculate standard 37.5 hours for 5-day schedule pattern', () => {
      const days = [
        { day: 'MONDAY', startTime: '08:30', endTime: '17:00', breakMinutes: 60 },
        { day: 'TUESDAY', startTime: '08:30', endTime: '17:00', breakMinutes: 60 },
        { day: 'WEDNESDAY', startTime: '08:30', endTime: '17:00', breakMinutes: 60 },
        { day: 'THURSDAY', startTime: '08:30', endTime: '17:00', breakMinutes: 60 },
        { day: 'FRIDAY', startTime: '08:30', endTime: '17:00', breakMinutes: 60 },
      ];
      const weeklyHours = calculateWeeklyHours(days);
      expect(weeklyHours).toBe(37.5);
    });
  });

  describe('Pre-Finalization Validation & Warning Labels', () => {
    it('getWarningLabel should map internal warning codes to exact UI labels', () => {
      expect(getWarningLabel('MISSING_BANK_DETAILS')).toBe('A/C missing');
      expect(getWarningLabel('DUPLICATE_PAYSLIP')).toBe('Duplicate');
      expect(getWarningLabel('MISSING_CONTRACT')).toBe('No contract');
      expect(getWarningLabel('MISSING_WAGE')).toBe('Missing wage');
      expect(getWarningLabel('AMBIGUOUS_CONTRACT')).toBe('Ambiguous contract');
      expect(getWarningLabel('RULE_CALCULATION_ERROR')).toBe('Calc error');
    });

    it('checkEmployeeBankDetails should return warning when bank account is missing', () => {
      const empNoBank = { _id: 'emp1', name: 'Sara Khan', employeeCode: 'EMP-002', bankDetails: {} };
      const warning = checkEmployeeBankDetails(empNoBank);
      expect(warning).not.toBeNull();
      expect(warning.code).toBe('MISSING_BANK_DETAILS');
      expect(warning.severity).toBe('WARNING');
    });

    it('checkEmployeeBankDetails should return null when bank account is present', () => {
      const empWithBank = {
        _id: 'emp1',
        name: 'Aarav Mehta',
        employeeCode: 'EMP-001',
        bankDetails: { accountNumber: '9876543210', bankName: 'HDFC', ifscCode: 'HDFC0001234' },
      };
      const warning = checkEmployeeBankDetails(empWithBank);
      expect(warning).toBeNull();
    });
  });
});
