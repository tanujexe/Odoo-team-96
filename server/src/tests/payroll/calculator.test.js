import { describe, it, expect } from 'vitest';
import { tokenize, evaluateFormula, evaluateRule } from '../../payroll/ruleEngine.js';
import { calculatePayslipLines } from '../../payroll/calculator.js';

describe('PP-09 Safe Formula Evaluator & Payroll Calculator', () => {
  describe('Rule Engine Expression Tokenizer & Evaluator', () => {
    it('tokenize should correctly tokenize arithmetic expressions', () => {
      const tokens = tokenize('BASIC * 0.4 + WAGE / 2');
      expect(tokens).toEqual([
        { type: 'IDENTIFIER', value: 'BASIC' },
        { type: 'OPERATOR', value: '*' },
        { type: 'NUMBER', value: 0.4 },
        { type: 'OPERATOR', value: '+' },
        { type: 'IDENTIFIER', value: 'WAGE' },
        { type: 'OPERATOR', value: '/' },
        { type: 'NUMBER', value: 2 },
      ]);
    });

    it('evaluateFormula should calculate values using arithmetic precedence and context variables', () => {
      const context = { WAGE: 10000, BASIC: 5000, HRA: 2000 };
      const val = evaluateFormula('BASIC + HRA + (WAGE * 0.1)', context);
      expect(val).toBe(8000); // 5000 + 2000 + 1000 = 8000
    });

    it('evaluateFormula should throw error on division by zero', () => {
      expect(() => evaluateFormula('100 / 0', {})).toThrow('Division by zero');
    });

    it('evaluateFormula should throw error on unknown variable name', () => {
      expect(() => evaluateFormula('UNKNOWN_VAR * 2', {})).toThrow('Unknown variable');
    });
  });

  describe('Calculator Payslip Execution & Totals', () => {
    it('calculatePayslipLines should execute rules in sequence and derive Gross, Deductions, and Net', () => {
      const contract = { wage: 10000 };

      const rules = [
        {
          _id: 'rule1',
          code: 'BASIC',
          name: 'Basic Salary',
          category: 'BASIC',
          sequence: 1,
          computationType: 'PERCENTAGE',
          percentage: 60, // 60% of 10000 = 6000
        },
        {
          _id: 'rule2',
          code: 'HRA',
          name: 'House Rent Allowance',
          category: 'ALW',
          sequence: 2,
          computationType: 'FORMULA',
          formula: 'BASIC * 0.4', // 40% of 6000 = 2400
        },
        {
          _id: 'rule3',
          code: 'TAX',
          name: 'Income Tax',
          category: 'DED',
          sequence: 3,
          computationType: 'PERCENTAGE',
          percentage: 10, // 10% of BASIC (6000) = 600
        },
      ];

      const result = calculatePayslipLines({ contract, rules, workedDays: 22 });

      expect(result.warnings).toHaveLength(0);
      expect(result.ruleLines).toHaveLength(3);

      expect(result.ruleLines[0].code).toBe('BASIC');
      expect(result.ruleLines[0].amount).toBe(6000);

      expect(result.ruleLines[1].code).toBe('HRA');
      expect(result.ruleLines[1].amount).toBe(2400);

      expect(result.ruleLines[2].code).toBe('TAX');
      expect(result.ruleLines[2].amount).toBe(600);

      expect(result.gross).toBe(8400); // 6000 + 2400
      expect(result.deductions).toBe(600);
      expect(result.net).toBe(7800); // 8400 - 600
    });

    it('evaluateRule should scale by quantity multiplier', () => {

      const fixedRule = {
        code: 'DAILY_ALW',
        category: 'ALW',
        computationType: 'FIXED',
        fixedAmount: 100,
        quantity: 5,
      };
      expect(evaluateRule(fixedRule, {})).toBe(500);

      const percentRule = {
        code: 'BASIC',
        category: 'BASIC',
        computationType: 'PERCENTAGE',
        percentage: 50,
        quantity: 1,
      };
      expect(evaluateRule(percentRule, { WAGE: 8000 })).toBe(4000);
    });

    it('calculatePayslipLines should correctly compute the full 12-rule Regular Salary structure', () => {
      const contract = { wage: 10000 };
      const rules = [
        { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 1, computationType: 'PERCENTAGE', percentage: 50, quantity: 1 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'ALW', sequence: 10, computationType: 'PERCENTAGE', percentage: 20, quantity: 1 },
        { code: 'STI', name: 'Standard Allowance', category: 'ALW', sequence: 20, computationType: 'FIXED', fixedAmount: 200, quantity: 1 },
        { code: 'BONUS', name: 'Performance Bonus', category: 'ALW', sequence: 30, computationType: 'FIXED', fixedAmount: 500, quantity: 1 },
        { code: 'LTA', name: 'Leave Travel Allowance', category: 'ALW', sequence: 40, computationType: 'FIXED', fixedAmount: 150, quantity: 1 },
        { code: 'FIX', name: 'Fixed Allowance', category: 'ALW', sequence: 50, computationType: 'FIXED', fixedAmount: 100, quantity: 1 },
        { code: 'LWF', name: 'LWF fund', category: 'DED', sequence: 70, computationType: 'FIXED', fixedAmount: 10, quantity: 1 },
        { code: 'PF', name: 'Provident Fund', category: 'DED', sequence: 80, computationType: 'PERCENTAGE', percentage: 12, quantity: 1 },
        { code: 'PT', name: 'Professional Tax', category: 'DED', sequence: 100, computationType: 'FIXED', fixedAmount: 200, quantity: 1 },
      ];

      const result = calculatePayslipLines({ contract, rules, workedDays: 22 });
      expect(result.ruleLines).toHaveLength(9);
      // BASIC = 50% of 10000 = 5000
      expect(result.ruleLines.find((r) => r.code === 'BASIC').amount).toBe(5000);
      // HRA = 20% of 5000 = 1000
      expect(result.ruleLines.find((r) => r.code === 'HRA').amount).toBe(1000);
      // PF = 12% of 5000 = 600
      expect(result.ruleLines.find((r) => r.code === 'PF').amount).toBe(600);
      // Gross = 5000 + 1000 + 200 + 500 + 150 + 100 = 6950
      expect(result.gross).toBe(6950);
      // Deductions = 10 (LWF) + 600 (PF) + 200 (PT) = 810
      expect(result.deductions).toBe(810);
      // Net = 6950 - 810 = 6140
      expect(result.net).toBe(6140);
    });
  });
});

