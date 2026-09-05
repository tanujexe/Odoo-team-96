/**
 * Safe, deterministic expression parser and evaluator for salary rule formulas.
 * Does NOT use eval() or Function constructor.
 */

/**
 * Tokenizes a formula string into numbers, operators, identifiers, and parentheses
 * @param {string} formula - e.g. "BASIC * 0.4 + WAGE / 2"
 * @returns {Array<{ type: string, value: string|number }>}
 */
export function tokenize(formula) {
  const tokens = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number literal
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        numStr += formula[i];
        i++;
      }
      const numVal = parseFloat(numStr);
      if (isNaN(numVal)) {
        throw new Error(`Invalid number literal '${numStr}' in formula`);
      }
      tokens.push({ type: 'NUMBER', value: numVal });
      continue;
    }

    // Identifiers (e.g. BASIC, WAGE, HRA, WORKED_DAYS)
    if (/[a-zA-Z_]/.test(char)) {
      let idStr = '';
      while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
        idStr += formula[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr.toUpperCase() });
      continue;
    }

    // Operators and Parentheses
    if (['+', '-', '*', '/', '(', ')'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${char}' in formula '${formula}'`);
  }

  return tokens;
}

/**
 * Evaluates a formula string given a calculation context map
 * @param {string} formula
 * @param {Record<string, number>} context - e.g. { WAGE: 5000, BASIC: 3000, WORKED_DAYS: 22 }
 * @returns {number} evaluated result rounded to 2 decimal places
 */
export function evaluateFormula(formula, context = {}) {
  if (!formula || typeof formula !== 'string' || formula.trim() === '') {
    return 0;
  }

  const tokens = tokenize(formula);
  if (tokens.length === 0) return 0;

  let index = 0;

  function parseExpression() {
    let left = parseTerm();

    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
        index++;
        const right = parseTerm();
        if (token.value === '+') left += right;
        else left -= right;
      } else {
        break;
      }
    }

    return left;
  }

  function parseTerm() {
    let left = parseFactor();

    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type === 'OPERATOR' && (token.value === '*' || token.value === '/')) {
        index++;
        const right = parseFactor();
        if (token.value === '*') {
          left *= right;
        } else if (token.value === '/') {
          if (right === 0) {
            throw new Error('Division by zero in formula calculation');
          }
          left /= right;
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseFactor() {
    const token = tokens[index];

    if (!token) {
      throw new Error('Unexpected end of formula expression');
    }

    // Unary minus/plus
    if (token.type === 'OPERATOR' && (token.value === '-' || token.value === '+')) {
      index++;
      const val = parseFactor();
      return token.value === '-' ? -val : val;
    }

    if (token.type === 'NUMBER') {
      index++;
      return token.value;
    }

    if (token.type === 'IDENTIFIER') {
      index++;
      const varName = token.value;
      if (!(varName in context)) {
        throw new Error(`Unknown variable or uncomputed rule reference '${varName}' in formula`);
      }
      return context[varName] || 0;
    }

    if (token.type === 'OPERATOR' && token.value === '(') {
      index++;
      const expr = parseExpression();
      const closeToken = tokens[index];
      if (!closeToken || closeToken.value !== ')') {
        throw new Error("Missing closing parenthesis ')' in formula");
      }
      index++;
      return expr;
    }

    throw new Error(`Unexpected token '${token.value}' in formula`);
  }

  const result = parseExpression();

  if (!isFinite(result) || isNaN(result)) {
    throw new Error('Non-finite result from formula evaluation');
  }

  return Number(result.toFixed(2));
}

/**
 * Evaluates a single salary rule against context
 * @param {Object} rule
 * @param {Record<string, number>} context
 * @returns {number} computed amount
 */
export function evaluateRule(rule, context = {}) {
  if (rule.computationType === 'FIXED') {
    return Number((rule.fixedAmount || 0).toFixed(2));
  }

  if (rule.computationType === 'PERCENTAGE') {
    // Default percentage base is WAGE unless specified
    const base = context.BASIC !== undefined ? context.BASIC : context.WAGE || 0;
    const amount = (base * (rule.percentage || 0)) / 100;
    return Number(amount.toFixed(2));
  }

  if (rule.computationType === 'FORMULA') {
    return evaluateFormula(rule.formula, context);
  }

  return 0;
}
