// Base 62 character map
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function getVal(char) {
  return CHARS.indexOf(char);
}

function getChar(val) {
  // val is BigInt, convert to Number for indexing char map
  let v = Number(val);
  if (v < 0 || v >= 62) return '?';
  return CHARS[v];
}

// BigInt Absolute Value helper
function abs(n) {
  return n < 0n ? -n : n;
}

// Combinations (n choose k) - Returns BigInt
function combinations(n, k) {
  // Inputs n, k are Numbers (indices), output is BigInt
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

// --- MATRIX GENERATORS (BigInt) ---

function getPascalPower(size, exponent) {
  // size is Number, exponent is BigInt
  let matrix = Array(size).fill().map(() => Array(size).fill(0n));
  for (let r = 0; r < size; r++) {
    let power = size - 1 - r; 
    for (let c = r; c < size; c++) {
      let k = c - r;
      let binom = combinations(power, k); // Returns BigInt
      
      // exponent ** BigInt(k)
      let offsetPow = exponent ** BigInt(k);
      
      matrix[r][c] = binom * offsetPow;
    }
  }
  return matrix;
}

function getDiagonalMatrix(size, factor) {
  // size is Number, factor is BigInt
  let matrix = Array(size).fill().map(() => Array(size).fill(0n));
  for (let i = 0; i < size; i++) {
    let power = BigInt(size - 1 - i);
    matrix[i][i] = factor ** power;
  }
  return matrix;
}

// --- LINEAR ALGEBRA CORE (BigInt) ---

function matrixMultiply(matA, matB) {
  let rA = matA.length;
  let cA = matA[0].length;
  let rB = matB.length;
  let cB = matB[0].length;
  
  if (cA !== rB) throw new Error("Matrix dimension mismatch");

  let result = Array(rA).fill().map(() => Array(cB).fill(0n));

  for (let i = 0; i < rA; i++) { 
    for (let j = 0; j < cB; j++) { 
      let sum = 0n;
      for (let k = 0; k < cA; k++) {
        sum += matA[i][k] * matB[k][j];
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

  // Enforce method restrictions and VALIDITY
  function validateAndToggle() {
    // Parse as Number for validation checks (bounds are small enough)
    let s = parseInt(sourceIn.value) || 0;
    let t = parseInt(targetIn.value) || 0;
    
    // ERROR CHECK 1: Bounds (-62 to 62)
    if (Math.abs(s) > 62 || Math.abs(t) > 62) {
      hint.innerText = "Error: Bases must be between -62 and 62.";
      hint.style.color = "red";
      document.getElementById('convertBtn').disabled = true;
      return;
    }

    // ERROR CHECK 2: Invalid Bases (-1, 0, 1)
    if (Math.abs(s) < 2 || Math.abs(t) < 2) {
      hint.innerText = "Error: Base must be >= 2 or <= -2.";
      hint.style.color = "red";
      document.getElementById('convertBtn').disabled = true;
      return;
    }
    
    document.getElementById('convertBtn').disabled = false;

    // Check Multiples validity
    let isMultiple = (t !== 0) && (s % t === 0);
    
    let multipleOption = methodSelect.querySelector('option[value="multiple"]');

    if(isMultiple) {
      hint.innerText = `Source (${s}) is a multiple of Target (${t}). Multiples method available.`;
      hint.style.color = "#666";
      multipleOption.disabled = false;
    } else {
      hint.innerText = "Multiples method requires Source to be a multiple of Target.";
      hint.style.color = "#666";
      multipleOption.disabled = true;
      
      if(methodSelect.value === "multiple") {
        methodSelect.value = "offset";
      }
    }
  }

  // Swap Button Logic
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

    if(isNaN(sBaseNum) || isNaN(tBaseNum)) return;

    // Use BigInt for calculation
    const sourceBase = BigInt(sBaseNum);
    const targetBase = BigInt(tBaseNum);

    // Parse Input Numbers
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
          if (val === -1) throw new Error(`Character '${char}' not found in map.`);
          if (val >= absSource) throw new Error(`Digit '${char}' too large for Base ${absSource}`);
          // Store digits as BigInt
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

    // Pad inputs to create Matrix N (BigInts)
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
  let offset = sBase - tBase; // BigInt subtraction
  let pMatrix = getPascalPower(size, offset);
  let resultMatrixR = matrixMultiply(matrixN, pMatrix);

  renderBatchResult(
    "Offset Method (Taylor Shift)", 
    `Offset: ${offset.toString()}, Matrix: Pascal Triangle`,
    matrixN, pMatrix, resultMatrixR, numbers, tBase, container
  );
}

function batchProcessMultiples(numbers, matrixN, size, sBase, tBase, container) {
  let factor = sBase / tBase; // BigInt division
  let dMatrix = getDiagonalMatrix(size, factor);
  let resultMatrixR = matrixMultiply(matrixN, dMatrix);

  renderBatchResult(
    "Multiples Method (Substitution)", 
    `Factor: ${factor.toString()}, Matrix: Diagonal Powers`,
    matrixN, dMatrix, resultMatrixR, numbers, tBase, container
  );
}

function renderBatchResult(title, subTitle, matN, matTrans, matR, numbers, tBase, container) {
  let steps = `<strong>${title}</strong>\n${subTitle}\n\n`;

  // Helper to format BigInts with padding
  const fmt = (n, pad) => n.toString().padStart(pad, ' ');

  steps += `<strong>Input Matrix N:</strong>\n`;
  matN.forEach(row => steps += `[ ${row.map(n => fmt(n, 4)).join(' ')} ]\n`);

  steps += `\n<strong>Transform Matrix (Size ${matTrans.length}x${matTrans.length}):</strong>\n`;
  matTrans.forEach(row => steps += `[ ${row.map(n => fmt(n, 8)).join(' ')} ]\n`);

  steps += `\n<strong>Result Matrix R = N * M:</strong>\n`;
  matR.forEach(row => steps += `[ ${row.map(n => fmt(n, 10)).join(' ')} ]\n`);

  let batchBox = document.createElement('div');
  batchBox.className = 'result-card step-box';
  batchBox.innerHTML = steps;
  container.appendChild(batchBox);

  numbers.forEach((num, index) => {
    let card = document.createElement('div');
    card.className = 'result-card';
    
    let rowResult = matR[index];
    let norm = normalize(rowResult, tBase);
    
    let html = `<strong>${num.original} -> Base ${tBase.toString()}</strong>\n`;
    html += `Row ${index}: [${rowResult.map(n => n.toString()).join(', ')}]\n`;
    html += `Normalized: <span class="final-result">${norm.resultString}</span>`;
    
    card.innerHTML = `<div class="step-box">${html}</div>`;
    container.appendChild(card);
  });
}

// --- BIGINT NORMALIZATION ---
function normalize(coeffs, base) {
  // Coeffs are BigInts
  let arr = [...coeffs]; 
  
  for (let i = arr.length - 1; i >= 0; i--) {
    let val = arr[i];
    
    // r = val % base
    let r = val % base;
    
    // Force positive remainder
    if (r < 0n) {
      r += abs(base);
    }
    
    // q = (val - r) / base
    let q = (val - r) / base;
    
    if (q !== 0n) {
       arr[i] = r;
       
       if (i > 0) {
         arr[i-1] += q;
       } else {
         // New MSD
         arr.unshift(q);
         i++; 
       }
    } else {
      arr[i] = r; 
    }
  }

  let str = "";
  // Trim leading zeros
  let start = 0;
  while(start < arr.length - 1 && arr[start] === 0n) start++;
  
  for(let k = start; k < arr.length; k++) {
    str += getChar(arr[k]);
  }

  return { result: arr, resultString: str };
}