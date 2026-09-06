import { describe, it, expect } from 'vitest';
import { createSalaryRuleSchema } from '../../validators/salaryRuleValidator.js';

describe('Salary Rule Validator & Normalizer', () => {
  it('validates and normalizes FIXED salary rule with aliases', () => {
    const input = {
      name: 'Sales Incentive',
      code: 'sales_inc',
      salaryStructureId: 'str-123',
      category: 'ALLOWANCE',
      calculationType: 'FIXED',
      amount: 450,
      sequence: 3,
    };

    const parsed = createSalaryRuleSchema.parse(input);

    expect(parsed.name).toBe('Sales Incentive');
    expect(parsed.code).toBe('SALES_INC');
    expect(parsed.salaryStructureId).toBe('str-123');
    expect(parsed.category).toBe('ALW');
    expect(parsed.computationType).toBe('FIXED');
    expect(parsed.fixedAmount).toBe(450);
    expect(parsed.sequence).toBe(3);
    expect(parsed.active).toBe(true);
  });

  it('validates and normalizes PERCENTAGE salary rule', () => {
    const input = {
      name: 'Provident Fund',
      code: 'PF',
      salaryStructureId: 'str-123',
      category: 'DEDUCTION',
      computationType: 'PERCENTAGE',
      percentage: 12,
      sequence: 4,
    };

    const parsed = createSalaryRuleSchema.parse(input);

    expect(parsed.code).toBe('PF');
    expect(parsed.category).toBe('DED');
    expect(parsed.computationType).toBe('PERCENTAGE');
    expect(parsed.percentage).toBe(12);
  });

  it('validates and normalizes FORMULA salary rule', () => {
    const input = {
      name: 'Withholding Tax',
      code: 'tax_wht',
      salaryStructureId: 'str-123',
      category: 'DED',
      computationType: 'FORMULA',
      formula: '(BASIC + HRA) * 0.1',
      sequence: 5,
    };

    const parsed = createSalaryRuleSchema.parse(input);

    expect(parsed.code).toBe('TAX_WHT');
    expect(parsed.category).toBe('DED');
    expect(parsed.computationType).toBe('FORMULA');
    expect(parsed.formula).toBe('(BASIC + HRA) * 0.1');
  });

  it('rejects missing rule name or code', () => {
    expect(() =>
      createSalaryRuleSchema.parse({
        name: '',
        code: 'TEST',
        salaryStructureId: 'str-123',
        category: 'ALW',
      })
    ).toThrow();
  });
});
