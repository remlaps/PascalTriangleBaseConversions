// Base 62 character map
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function getVal(char) {
  return CHARS.indexOf(char);
}

function getChar(val) {
  let v = Number(val);
  if (v < 0 || v >= 62) return '?';
  return CHARS[v];
}

function abs(n) {
  return n < 0n ? -n : n;
}

// --- RATIONAL NUMBER HELPER ---
// Allows us to store "1/25" as {n:1n, d:25n} to avoid decimal precision loss
class Rat {
  constructor(n, d = 1n) {
    this.n = BigInt(n);
    this.d = BigInt(d);
    // Standardize signs
    if (this.d < 0n) { this.n = -this.n; this.d = -this.d; }
  }

  toString() {
    if (this.d === 1n) return this.n.toString();
    return `${this.n}/${this.d}`;
  }

  // Multiply Rational * Rational
  mul(other) {
    return new Rat(this.n * other.n, this.d * other.d);
  }

  // Add Rational + Rational
  add(other) {
    // a/b + c/d = (ad + bc) / bd
    let num = (this.n * other.d) + (other.n * this.d);
    let den = this.d * other.d;
    return new Rat(num, den);
  }
}

// Combinations for Pascal
function combinations(n, k) {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  if (k > n / 2) k = n - k;
  let res = 1n;
  let bn = BigInt(n);
  for (let i = 1; i <= k; i++) {
    let bi = BigInt(i);
    res = (res * (bn - bi + 1n)) / bi;
  }
  return res;
}

// --- MATRIX GENERATORS ---

// Pascal Matrix (Offset) - Returns Rationals for consistency
function getPascalPower(size, exponent) {
  let matrix = Array(size).fill().map(() => Array(size).fill(null));
  for (let r = 0; r < size; r++) {
    let power = size - 1 - r; 
    for (let c = 0; c < size; c++) {
      if (c < r) {
        matrix[r][c] = new Rat(0);
        continue;
      }
      let k = c - r;
      let binom = combinations(power, k); 
      let offsetPow = exponent ** BigInt(k);
      matrix[r][c] = new Rat(binom * offsetPow);
    }
  }
  return matrix;
}

// Diagonal Matrix (Multiples) - Handles Integer (5) AND Fraction (1/5)
function getDiagonalMatrix(size, numBase, denBase) {
  let matrix = Array(size).fill().map(() => Array(size).fill(new Rat(0)));
  
  for (let i = 0; i < size; i++) {
    // Powers decrease from Left to Right: (N-1)...0
    let power = BigInt(size - 1 - i);
    
    // Calculate (num/den) ^ power
    let nP = numBase ** power;
    let dP = denBase ** power;
    
    matrix[i][i] = new Rat(nP, dP);
  }
  return matrix;
}

// --- LINEAR ALGEBRA CORE ---

function matrixMultiply(matA, matB) {
  let rA = matA.length;
  let cA = matA[0].length;
  let rB = matB.length;
  let cB = matB[0].length;
  
  if (cA !== rB) throw new Error("Matrix dimension mismatch");

  let result = Array(rA).fill().map(() => Array(cB).fill(null));

  for (let i = 0; i < rA; i++) { 
    for (let j = 0; j < cB; j++) { 
      let sum = new Rat(0);
      for (let k = 0; k < cA; k++) {
        // Inputs in MatA might be BigInts, convert to Rat on fly if needed
        let valA = (matA[i][k] instanceof Rat) ? matA[i][k] : new Rat(matA[i][k]);
        let valB = matB[k][j]; // MatB is always Rats
        
        sum = sum.add(valA.mul(valB));
      }
      result[i][j] = sum;
    }
  }
  return result;
}

// --- UI LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
  const methodSelect = document.getElementById('methodSelect');
  const sourceIn = document.getElementById('sourceBase');
  const targetIn = document.getElementById('targetBase');
  const hint = document.getElementById('methodHint');
  const batchOutput = document.getElementById('batchOutput');

  function validateAndToggle() {
    let s = parseInt(sourceIn.value) || 0;
    let t = parseInt(targetIn.value) || 0;
    
    // Bounds Check
    if (Math.abs(s) > 62 || Math.abs(t) > 62) {
      hint.innerText = "Error: Bases must be between -62 and 62.";
      hint.style.color = "red";
      document.getElementById('convertBtn').disabled = true;
      return;
    }
    if (Math.abs(s) < 2 || Math.abs(t) < 2) {
      hint.innerText = "Error: Base must be >= 2 or <= -2.";
      hint.style.color = "red";
      document.getElementById('convertBtn').disabled = true;
      return;
    }
    
    document.getElementById('convertBtn').disabled = false;

    // Multiples Check: Either S % T == 0  OR  T % S == 0
    let sIsMult = (t !== 0) && (s % t === 0); // e.g. 10 -> 2
    let tIsMult = (s !== 0) && (t % s === 0); // e.g. 2 -> 10
    let isCompatible = sIsMult || tIsMult;
    
    let multipleOption = methodSelect.querySelector('option[value="multiple"]');

    if(isCompatible) {
      if(sIsMult) hint.innerText = `Source (${s}) is multiple of Target (${t}). Factor ${s/t}.`;
      else        hint.innerText = `Target (${t}) is multiple of Source (${s}). Factor 1/${t/s}.`;
      
      hint.style.color = "#666";
      multipleOption.disabled = false;
    } else {
      hint.innerText = "Multiples method requires one base to be a multiple of the other.";
      hint.style.color = "#666";
      multipleOption.disabled = true;
      if(methodSelect.value === "multiple") methodSelect.value = "offset";
    }
  }

  document.getElementById('swapBtn').addEventListener('click', () => {
    let temp = sourceIn.value;
    sourceIn.value = targetIn.value;
    targetIn.value = temp;
    validateAndToggle();
  });

  sourceIn.addEventListener('input', validateAndToggle);
  targetIn.addEventListener('input', validateAndToggle);
  validateAndToggle();

  document.getElementById('convertBtn').addEventListener('click', () => {
    const inputStr = document.getElementById('inputNumbers').value;
    const sBaseNum = parseInt(document.getElementById('sourceBase').value);
    const tBaseNum = parseInt(document.getElementById('targetBase').value);
    const method = document.getElementById('methodSelect').value;
    const resultsArea = document.getElementById('resultsArea');
    
    resultsArea.innerHTML = ''; 
    batchOutput.value = '';

    if(isNaN(sBaseNum) || isNaN(tBaseNum)) return;

    const sourceBase = BigInt(sBaseNum);
    const targetBase = BigInt(tBaseNum);

    let rawLines = inputStr.split('\n');
    let numbers = [];
    
    for(let line of rawLines) {
      line = line.trim();
      if(!line) continue;
      try {
        let digits = [];
        let absSource = Math.abs(sBaseNum); 
        for (let char of line) {
          let val = getVal(char);
          if (val === -1) throw new Error(`Character '${char}' not found.`);
          if (val >= absSource) throw new Error(`Digit '${char}' too large.`);
          digits.push(BigInt(val));
        }
        numbers.push({ original: line, digits: digits });
      } catch(e) {
        resultsArea.innerHTML += `<div class="result-card error">Error "${line}": ${e.message}</div>`;
      }
    }

    if(numbers.length === 0) return;

    let maxLength = 0;
    numbers.forEach(n => { if(n.digits.length > maxLength) maxLength = n.digits.length; });

    let matrixN = numbers.map(n => {
      let padding = Array(maxLength - n.digits.length).fill(0n);
      return padding.concat(n.digits);
    });

    if (method === 'offset') {
      batchProcessOffset(numbers, matrixN, maxLength, sourceBase, targetBase, resultsArea);
    } else {
      batchProcessMultiples(numbers, matrixN, maxLength, sourceBase, targetBase, resultsArea);
    }
  });
});

function batchProcessOffset(numbers, matrixN, size, sBase, tBase, container) {
  let offset = sBase - tBase; 
  let pMatrix = getPascalPower(size, offset); // Returns Rationals
  let resultMatrixR = matrixMultiply(matrixN, pMatrix);

  renderBatchResult(
    "Offset Method (Taylor Shift)", 
    `Offset: ${offset.toString()}, Matrix: Pascal Triangle`,
    matrixN, pMatrix, resultMatrixR, numbers, tBase, container
  );
}

function batchProcessMultiples(numbers, matrixN, size, sBase, tBase, container) {
  let isFractional = (tBase > sBase); // e.g. 2 -> 10
  let num = 1n, den = 1n;
  
  if (isFractional) {
    den = tBase / sBase; // Factor in denominator: 1/5
  } else {
    num = sBase / tBase; // Factor in numerator: 5/1
  }

  // Generate Diagonal Matrix with Fractions or Integers
  let dMatrix = getDiagonalMatrix(size, num, den);
  
  let resultMatrixR = matrixMultiply(matrixN, dMatrix);

  renderBatchResult(
    "Multiples Method (Substitution)", 
    `Factor: ${num}/${den} (Diagonal Matrix)`,
    matrixN, dMatrix, resultMatrixR, numbers, tBase, container
  );
}

function renderBatchResult(title, subTitle, matN, matTrans, matR, numbers, tBase, container) {
  let steps = `<strong>${title}</strong>\n${subTitle}\n\n`;
  const fmt = (n, pad) => n.toString().padStart(pad, ' ');

  steps += `<strong>Input Matrix N:</strong>\n`;
  matN.forEach(row => steps += `[ ${row.map(n => fmt(n, 4)).join(' ')} ]\n`);

  steps += `\n<strong>Transform Matrix (Size ${matTrans.length}x${matTrans.length}):</strong>\n`;
  matTrans.forEach(row => steps += `[ ${row.map(n => fmt(n, 8)).join(' ')} ]\n`);

  steps += `\n<strong>Result Matrix R (Rational):</strong>\n`;
  matR.forEach(row => steps += `[ ${row.map(n => fmt(n, 10)).join(' ')} ]\n`);

  let batchBox = document.createElement('div');
  batchBox.className = 'result-card step-box';
  batchBox.innerHTML = steps;
  container.appendChild(batchBox);

  let finalOutputs = [];

  numbers.forEach((num, index) => {
    let card = document.createElement('div');
    card.className = 'result-card';
    
    let rowResult = matR[index];
    
    // NORMALIZE: Handles both standard (Right-to-Left) and fractional (Left-to-Right)
    let norm = normalizeRational(rowResult, tBase);
    
    finalOutputs.push(norm.resultString);

    let html = `<strong>${num.original} -> Base ${tBase.toString()}</strong>\n`;
    html += `Row ${index}: [${rowResult.map(n => n.toString()).join(', ')}]\n`;
    html += `Normalized: <span class="final-result">${norm.resultString}</span>`;
    
    card.innerHTML = `<div class="step-box">${html}</div>`;
    container.appendChild(card);
  });

  document.getElementById('batchOutput').value = finalOutputs.join('\n');
}

// --- UNIVERSAL NORMALIZATION (Integers & Fractions) ---
function normalizeRational(coeffs, base) {
  // Input is array of Rationals
  let arr = coeffs.map(r => ({ n: r.n, d: r.d })); // Clone simple objects
  let len = arr.length;
  let log = "";

  // 1. Detect if we have fractions to clear (Left-to-Right sweep)
  // We scan from Most Significant (Index 0) to Least Significant (Index len-1)
  // pushing remainders to the right.
  for (let i = 0; i < len; i++) {
    let r = arr[i];
    
    // Value = n / d. 
    // Integer part = n / d
    // Remainder part = n % d
    // Because BigInt division is integer division, q = n/d is correct floor (for pos).
    
    let q = r.n / r.d; // The "Digit"
    let remNum = r.n % r.d; // The remainder fraction numerator
    
    if (remNum !== 0n) {
      // We have a fraction remaining.
      // Push it to the right: Value * Base
      if (i + 1 < len) {
        // Add (rem/d) * base to next position
        // next = next + (rem * base) / d
        let next = arr[i+1];
        
        // Operation: next + (rem * base)/d
        // Common denominator will be (next.d * d)
        // newNum = next.n * d + (rem * base) * next.d
        
        let termNum = remNum * base;
        let termDen = r.d;
        
        // Add to next
        let commonDen = next.d * termDen;
        let newNum = (next.n * termDen) + (termNum * next.d);
        
        arr[i+1] = { n: newNum, d: commonDen };
        
        // Keep only integer part here
        arr[i] = { n: q, d: 1n };
      } else {
        // If we are at the last digit and still have a fraction, 
        // it means the number isn't an integer in this base (or precision loss).
        // For this app, we assume integer inputs/outputs.
        // We'll just keep the int part.
        arr[i] = { n: q, d: 1n };
      }
    } else {
      // Clean integer, just simplify
      arr[i] = { n: q, d: 1n };
    }
  }

  // 2. Now perform standard Right-to-Left Carry (for overflows)
  // This handles the integer parts we just consolidated.
  // Coeffs are now technically integers (stored as n/1).
  
  let intArr = arr.map(r => r.n); // Extract BigInts

  for (let i = intArr.length - 1; i >= 0; i--) {
    let val = intArr[i];
    let r = val % base;
    if (r < 0n) r += abs(base);
    let q = (val - r) / base;
    
    if (q !== 0n) {
       intArr[i] = r;
       if (i > 0) intArr[i-1] += q;
       else { intArr.unshift(q); i++; }
    } else {
      intArr[i] = r; 
    }
  }

  let str = "";
  let start = 0;
  while(start < intArr.length - 1 && intArr[start] === 0n) start++;
  for(let k = start; k < intArr.length; k++) str += getChar(intArr[k]);
  
  return { result: intArr, resultString: str };
}