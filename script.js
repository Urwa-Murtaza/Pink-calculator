// ============================
// Element references
// ============================
const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const buttons = document.querySelectorAll('.btn');

// ============================
// Calculator state
// ============================
let currentValue = '0';      // number currently being entered / shown big
let previousValue = null;    // stored operand before an operator was pressed
let operator = null;         // current pending operator: + - * /
let waitingForNewValue = false; // true right after an operator or equals
let justEvaluated = false;   // true right after "=" was pressed
let hasError = false;

// ============================
// Rendering
// ============================
function updateDisplay() {
  resultEl.textContent = hasError ? 'Error' : currentValue;

  // build the small expression line
  if (hasError) {
    expressionEl.textContent = '';
  } else if (operator && previousValue !== null) {
    expressionEl.textContent = `${formatForExpression(previousValue)} ${operatorSymbol(operator)}`;
  } else {
    expressionEl.textContent = '';
  }

  // auto-shrink long numbers so they always fit
  resultEl.classList.remove('long', 'longer', 'error');
  const len = resultEl.textContent.length;
  if (hasError) {
    resultEl.classList.add('error');
  } else if (len > 12) {
    resultEl.classList.add('longer');
  } else if (len > 8) {
    resultEl.classList.add('long');
  }
}

function operatorSymbol(op) {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
    default: return '';
  }
}

function formatForExpression(numStr) {
  // trims trailing unnecessary characters for the small preview line
  return numStr;
}

// ============================
// Core actions
// ============================
function inputDigit(digit) {
  if (hasError) resetAfterError();

  if (waitingForNewValue) {
    currentValue = digit;
    waitingForNewValue = false;
  } else {
    currentValue = currentValue === '0' ? digit : currentValue + digit;
  }
  justEvaluated = false;
  updateDisplay();
}

function inputDecimal() {
  if (hasError) resetAfterError();

  if (waitingForNewValue) {
    currentValue = '0.';
    waitingForNewValue = false;
    justEvaluated = false;
    updateDisplay();
    return;
  }
  if (!currentValue.includes('.')) {
    currentValue += '.';
  }
  justEvaluated = false;
  updateDisplay();
}

function chooseOperator(nextOperator) {
  if (hasError) resetAfterError();

  if (operator && waitingForNewValue) {
    // user changed their mind about the operator
    operator = nextOperator;
    updateDisplay();
    return;
  }

  if (previousValue === null) {
    previousValue = currentValue;
  } else if (!waitingForNewValue) {
    const result = compute(previousValue, currentValue, operator);
    if (result === null) {
      showError();
      return;
    }
    previousValue = result;
    currentValue = result;
  }

  operator = nextOperator;
  waitingForNewValue = true;
  justEvaluated = false;
  updateDisplay();
}

function compute(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  let result;

  switch (op) {
    case '+':
      result = numA + numB;
      break;
    case '-':
      result = numA - numB;
      break;
    case '*':
      result = numA * numB;
      break;
    case '/':
      if (numB === 0) return null; // triggers error state
      result = numA / numB;
      break;
    default:
      return b;
  }

  if (!isFinite(result) || isNaN(result)) return null;

  // round to avoid floating point noise, then stringify cleanly
  result = Math.round((result + Number.EPSILON) * 1e10) / 1e10;
  return String(result);
}

function equals() {
  if (hasError) return;
  if (operator === null || previousValue === null) return;

  const result = compute(previousValue, currentValue, operator);
  if (result === null) {
    showError();
    return;
  }

  currentValue = result;
  previousValue = null;
  operator = null;
  waitingForNewValue = true;
  justEvaluated = true;
  updateDisplay();
}

function percent() {
  if (hasError) resetAfterError();
  const num = parseFloat(currentValue);
  if (isNaN(num)) return;
  currentValue = String(num / 100);
  updateDisplay();
}

function deleteLast() {
  if (hasError) {
    resetAfterError();
    return;
  }
  if (waitingForNewValue) return;

  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
  updateDisplay();
}

function clearAll() {
  currentValue = '0';
  previousValue = null;
  operator = null;
  waitingForNewValue = false;
  justEvaluated = false;
  hasError = false;
  updateDisplay();
}

function showError() {
  hasError = true;
  currentValue = '0';
  previousValue = null;
  operator = null;
  waitingForNewValue = false;
  updateDisplay();
}

function resetAfterError() {
  hasError = false;
  currentValue = '0';
}

// ============================
// Button press animation helper
// ============================
function flashButton(btn) {
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

// ============================
// Click handling
// ============================
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    flashButton(btn);

    const value = btn.dataset.value;
    const action = btn.dataset.action;

    if (value !== undefined) {
      if (value === '.') {
        inputDecimal();
      } else {
        inputDigit(value);
      }
      return;
    }

    switch (action) {
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteLast();
        break;
      case 'percent':
        percent();
        break;
      case 'add':
        chooseOperator('+');
        break;
      case 'subtract':
        chooseOperator('-');
        break;
      case 'multiply':
        chooseOperator('*');
        break;
      case 'divide':
        chooseOperator('/');
        break;
      case 'equals':
        equals();
        break;
    }
  });
});

// ============================
// Keyboard support
// ============================
window.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key >= '0' && key <= '9') {
    inputDigit(key);
    flashButton(findButton(`[data-value="${key}"]`));
    return;
  }

  switch (key) {
    case '.':
      inputDecimal();
      flashButton(findButton('[data-value="."]'));
      break;
    case '+':
      chooseOperator('+');
      flashButton(findButton('[data-action="add"]'));
      break;
    case '-':
      chooseOperator('-');
      flashButton(findButton('[data-action="subtract"]'));
      break;
    case '*':
      chooseOperator('*');
      flashButton(findButton('[data-action="multiply"]'));
      break;
    case '/':
      e.preventDefault();
      chooseOperator('/');
      flashButton(findButton('[data-action="divide"]'));
      break;
    case '%':
      percent();
      flashButton(findButton('[data-action="percent"]'));
      break;
    case 'Enter':
    case '=':
      e.preventDefault();
      equals();
      flashButton(findButton('[data-action="equals"]'));
      break;
    case 'Backspace':
      deleteLast();
      flashButton(findButton('[data-action="delete"]'));
      break;
    case 'Escape':
      clearAll();
      flashButton(findButton('[data-action="clear"]'));
      break;
  }
});

function findButton(selector) {
  return document.querySelector(selector);
}

// ============================
// Initial render
// ============================
updateDisplay();