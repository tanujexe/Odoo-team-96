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
  });
});
