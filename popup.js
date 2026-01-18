// Base 62 character map
const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function getVal(char) {
  return CHARS.indexOf(char);
}

function getChar(val) {
  if (val < 0 || val >= 62) return '?';
  return CHARS[val];
}

function combinations(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return Math.round(res);
}

// --- MATRIX GENERATORS ---

function getPascalPower(size, exponent) {
  let matrix = Array(size).fill().map(() => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    let power = size - 1 - r; 
    for (let c = r; c < size; c++) {
      let k = c - r;
      let binom = combinations(power, k);
      let offsetPow = Math.pow(exponent, k);
      matrix[r][c] = binom * offsetPow;
    }
  }
  return matrix;
}

function getDiagonalMatrix(size, factor) {
  let matrix = Array(size).fill().map(() => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    let power = size - 1 - i;
    matrix[i][i] = Math.pow(factor, power);
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

  let result = Array(rA).fill().map(() => Array(cB).fill(0));

  for (let i = 0; i < rA; i++) { 
    for (let j = 0; j < cB; j++) { 
      let sum = 0;
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
    // Absolute value of base must be >= 2
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
  
  sourceIn.addEventListener('input', validateAndToggle);
  targetIn.addEventListener('input', validateAndToggle);
  validateAndToggle();

  document.getElementById('convertBtn').addEventListener('click', () => {
    const inputStr = document.getElementById('inputNumbers').value;
    const sourceBase = parseInt(document.getElementById('sourceBase').value);
    const targetBase = parseInt(document.getElementById('targetBase').value);
    const method = document.getElementById('methodSelect').value;
    const resultsArea = document.getElementById('resultsArea');
    
    resultsArea.innerHTML = ''; 

    // Validate Bases
    if(isNaN(sourceBase) || isNaN(targetBase) || sourceBase === 0 || targetBase === 0) {
      resultsArea.innerHTML = '<div class="result-card error">Invalid Base (Cannot be 0 or empty)</div>';
      return;
    }

    // Parse Input Numbers
    let rawLines = inputStr.split('\n');
    let numbers = [];
    
    for(let line of rawLines) {
      line = line.trim();
      if(!line) continue;
      try {
        let digits = [];
        let absSource = Math.abs(sourceBase); // Use abs for digit validation
        for (let char of line) {
          let val = getVal(char);
          if (val === -1) throw new Error(`Character '${char}' not found in map.`);
          if (val >= absSource) throw new Error(`Digit '${char}' too large for Base ${absSource}`);
          digits.push(val);
        }
        numbers.push({ original: line, digits: digits });
      } catch(e) {
        resultsArea.innerHTML += `<div class="result-card error">Error "${line}": ${e.message}</div>`;
      }
    }

    if(numbers.length === 0) return;

    let maxLength = 0;
    numbers.forEach(n => { if(n.digits.length > maxLength) maxLength = n.digits.length; });

    // Pad inputs to create Matrix N
    let matrixN = numbers.map(n => {
      let padding = Array(maxLength - n.digits.length).fill(0);
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
  let pMatrix = getPascalPower(size, offset);
  let resultMatrixR = matrixMultiply(matrixN, pMatrix);

  renderBatchResult(
    "Offset Method (Taylor Shift)", 
    `Offset: ${offset}, Matrix: Pascal Triangle`,
    matrixN, pMatrix, resultMatrixR, numbers, tBase, container
  );
}

function batchProcessMultiples(numbers, matrixN, size, sBase, tBase, container) {
  let factor = sBase / tBase;
  let dMatrix = getDiagonalMatrix(size, factor);
  let resultMatrixR = matrixMultiply(matrixN, dMatrix);

  renderBatchResult(
    "Multiples Method (Substitution)", 
    `Factor: ${factor}, Matrix: Diagonal Powers`,
    matrixN, dMatrix, resultMatrixR, numbers, tBase, container
  );
}

function renderBatchResult(title, subTitle, matN, matTrans, matR, numbers, tBase, container) {
  let steps = `<strong>${title}</strong>\n${subTitle}\n\n`;

  steps += `<strong>Input Matrix N:</strong>\n`;
  matN.forEach(row => steps += `[ ${row.map(n => n.toString().padStart(4, ' ')).join(' ')} ]\n`);

  steps += `\n<strong>Transform Matrix (Size ${matTrans.length}x${matTrans.length}):</strong>\n`;
  matTrans.forEach(row => steps += `[ ${row.map(n => n.toString().padStart(6, ' ')).join(' ')} ]\n`);

  steps += `\n<strong>Result Matrix R = N * M:</strong>\n`;
  matR.forEach(row => steps += `[ ${row.map(n => n.toString().padStart(8, ' ')).join(' ')} ]\n`);

  let batchBox = document.createElement('div');
  batchBox.className = 'result-card step-box';
  batchBox.innerHTML = steps;
  container.appendChild(batchBox);

  numbers.forEach((num, index) => {
    let card = document.createElement('div');
    card.className = 'result-card';
    
    let rowResult = matR[index];
    let norm = normalize(rowResult, tBase);
    
    let html = `<strong>${num.original} -> Base ${tBase}</strong>\n`;
    html += `Row ${index}: [${rowResult.join(', ')}]\n`;
    html += `Normalized: <span class="final-result">${norm.resultString}</span>`;
    
    card.innerHTML = `<div class="step-box">${html}</div>`;
    container.appendChild(card);
  });
}

// --- GENERALIZED NORMALIZATION (Positive & Negative Base Support) ---
// This handles carry logic for negative bases (e.g. Base -10)
// The rule: Remainder (digit) must be 0 <= r < |base|

function normalize(coeffs, base) {
  let arr = [...coeffs];
  let log = "";
  
  // Iterate Right to Left
  for (let i = arr.length - 1; i >= 0; i--) {
    let val = arr[i];
    
    // We want: val = q * base + r, where 0 <= r < |base|
    // This is the Euclidean Division definition.
    
    let r = val % base;
    
    // In JS, -5 % -10 is -5. We need r to be positive.
    if (r < 0) {
      r += Math.abs(base);
    }
    
    // Calculate quotient q = (val - r) / base
    let q = (val - r) / base;
    
    // If there is a quotient (carry), move it left
    if (q !== 0) {
       arr[i] = r;
       
       if (i > 0) {
         arr[i-1] += q;
         // log += `Pos ${i}: keep ${r}, carry ${q} left.\n`;
       } else {
         // New MSD
         arr.unshift(q);
         i++; // adjust index
         // log += `New MSD created: ${q}\n`;
       }
    } else {
      // Just update array with clean remainder (if it changed)
      arr[i] = r; 
    }
  }

  // Convert to string
  let str = "";
  // Check for leading zeros if array grew? 
  // Standard integer display usually trims leading zeros unless value is 0.
  let start = 0;
  while(start < arr.length - 1 && arr[start] === 0) start++;
  
  for(let k = start; k < arr.length; k++) {
    str += getChar(arr[k]);
  }

  return { result: arr, resultString: str, log: log };
}