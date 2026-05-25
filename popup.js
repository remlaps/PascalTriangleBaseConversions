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
class Rat {
  constructor(n, d = 1n) {
    this.n = BigInt(n);
    this.d = BigInt(d);
    if (this.d < 0n) { this.n = -this.n; this.d = -this.d; }
  }
  toString() {
    if (this.d === 1n) return this.n.toString();
    return `${this.n}/${this.d}`;
  }
  mul(other) {
    return new Rat(this.n * other.n, this.d * other.d);
  }
  add(other) {
    let num = (this.n * other.d) + (other.n * this.d);
    let den = this.d * other.d;
    return new Rat(num, den);
  }
}

// Combinations
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

function getDiagonalMatrix(size, numBase, denBase) {
  let matrix = Array(size).fill().map(() => Array(size).fill(new Rat(0)));
  for (let i = 0; i < size; i++) {
    let power = BigInt(size - 1 - i);
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
        let valA = (matA[i][k] instanceof Rat) ? matA[i][k] : new Rat(matA[i][k]);
        let valB = matB[k][j]; 
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

    let sIsMult = (t !== 0) && (s % t === 0);
    let tIsMult = (s !== 0) && (t % s === 0);
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

  // Inject Visualize Button
  const convertBtn = document.getElementById('convertBtn');
  const vizBtn = document.createElement('button');
  vizBtn.id = 'vizBtn';
  vizBtn.innerText = '🎥 Step-by-Step Animation';
  vizBtn.style.marginTop = '8px';
  vizBtn.style.backgroundColor = '#8e44ad';
  vizBtn.style.color = 'white';
  vizBtn.style.border = 'none';
  vizBtn.style.padding = '8px';
  vizBtn.style.borderRadius = '4px';
  vizBtn.style.cursor = 'pointer';
  vizBtn.style.width = '100%';
  vizBtn.style.fontWeight = 'bold';
  convertBtn.parentNode.insertBefore(vizBtn, convertBtn.nextSibling);

  sourceIn.addEventListener('input', validateAndToggle);
  targetIn.addEventListener('input', validateAndToggle);
  validateAndToggle();

  // Inject Version Indicator
  const versionTag = document.createElement('div');
  versionTag.style.fontSize = '10px';
  versionTag.style.color = '#999';
  versionTag.style.textAlign = 'right';
  versionTag.innerText = 'v1.1.0';
  document.querySelector('.container').appendChild(versionTag);

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
        // Drop leading zeroes from input digits
        while (digits.length > 1 && digits[0] === 0n) digits.shift();
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

  vizBtn.addEventListener('click', async () => {
    const inputStr = document.getElementById('inputNumbers').value;
    if (!inputStr) return;

    const sBaseNum = parseInt(document.getElementById('sourceBase').value);
    const tBaseNum = parseInt(document.getElementById('targetBase').value);
    if (isNaN(sBaseNum) || isNaN(tBaseNum)) return;

    const sourceBase = BigInt(sBaseNum);
    const targetBase = BigInt(tBaseNum);
    const method = document.getElementById('methodSelect').value;

    // Prepare all numbers
    let rawLines = inputStr.split('\n');
    let numbers = [];
    for (let line of rawLines) {
      line = line.trim();
      if (!line) continue;
      let digits = [];
      try {
        for (let char of line) {
          let v = getVal(char);
          if (v === -1 || v >= Math.abs(sBaseNum)) throw new Error();
          digits.push(BigInt(v));
        }
        // Drop leading zeroes from input digits
        while (digits.length > 1 && digits[0] === 0n) digits.shift();
        numbers.push(digits);
      } catch (e) { /* skip invalid lines in viz */ }
    }
    if (numbers.length === 0) return;

    // Matrix Construction
    let maxLength = Math.max(...numbers.map(n => n.length));
    let matN = numbers.map(n => {
      let padding = Array(maxLength - n.length).fill(0n);
      return padding.concat(n);
    });

    let size = maxLength;
    let matTrans = (method === 'offset') 
      ? getPascalPower(size, sourceBase - targetBase)
      : getDiagonalMatrix(size, (targetBase > sourceBase ? 1n : sourceBase/targetBase), (targetBase > sourceBase ? targetBase/sourceBase : 1n));
    
    let matR = matrixMultiply(matN, matTrans);
    
    // Prepare state for animation
    // We store each row's values. Note: rows might grow due to unshifts.
    let matrixValues = matR.map(row => row.map(r => new Rat(r.n, r.d)));
    let rowLabels = rawLines.filter(l => l.trim()).slice(0, matrixValues.length);

    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'viz-overlay';
    overlay.innerHTML = `
      <div class="viz-stage">
        <h3>Step-by-Step Normalization</h3>
        <div class="viz-scroll-area">
          <div class="viz-meta">Bases: ${sBaseNum} &rarr; ${tBaseNum} | Method: ${method}</div>
          
          <div class="viz-equation">
            <div class="viz-column"><div class="viz-label">Source (N)</div><div id="viz-source" class="viz-matrix-display small"></div></div>
            <div class="viz-op">×</div>
            <div class="viz-column"><div class="viz-label">Transform (T)</div><div id="viz-trans" class="viz-matrix-display small"></div></div>
            <div class="viz-op">=</div>
            <div class="viz-column"><div class="viz-label">Intermediate (R)</div><div id="viz-result-static" class="viz-matrix-display small"></div></div>
            <div class="viz-op">&rarr;</div>
            <div class="viz-column"><div class="viz-label">Final (Digits)</div><div id="viz-final" class="viz-matrix-display small"></div></div>
          </div>

          <div class="viz-label">Digit Normalization (Propagating Carries)</div>
          <div id="viz-cells" class="viz-cells-container"></div>
          <div id="viz-status" class="viz-status">Starting transformation...</div>
        </div>
        <button id="closeViz" style="margin-top:15px; padding:10px 25px; flex-shrink:0;">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('closeViz').onclick = () => overlay.remove();

    // Fill Static Matrices
    const fillMatrix = (id, mat) => {
      const div = document.getElementById(id);
      mat.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'viz-row-static';
        rowEl.innerText = `[ ${row.map(cell => (cell instanceof Rat ? cell.toString() : cell.toString())).join(', ')} ]`;
        div.appendChild(rowEl);
      });
    };

    fillMatrix('viz-source', matN);
    fillMatrix('viz-trans', matTrans);
    fillMatrix('viz-result-static', matR);

    // Initialize Final Matrix with placeholders
    const finalDiv = document.getElementById('viz-final');
    matrixValues.forEach(() => {
      const rowEl = document.createElement('div');
      rowEl.className = 'viz-row-static';
      rowEl.innerText = '[ ... ]';
      finalDiv.appendChild(rowEl);
    });

    const container = document.getElementById('viz-cells');
    const status = document.getElementById('viz-status');
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const absVal = (n) => (n < 0n ? -n : n);

    const renderMatrix = (activeRow, activeCol) => {
      container.innerHTML = '';
      matrixValues.forEach((row, rIdx) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = `viz-row ${rIdx === activeRow ? 'row-active' : ''}`;
        
        row.forEach((v, cIdx) => {
          const valStr = v.toString();
          const cell = document.createElement('div');
          cell.className = `viz-cell ${rIdx === activeRow && cIdx === activeCol ? 'active' : ''}`;
          // Shrink text if the fraction string is long
          const fontSize = valStr.length > 5 ? '0.7em' : '1.1em';
          cell.innerHTML = `<div class="v-val" style="font-size:${fontSize}">${valStr}</div>`;
          rowDiv.appendChild(cell);
        });
        container.appendChild(rowDiv);
      });
    };

    // Animate every row
    for (let r = 0; r < matrixValues.length; r++) {
      let currentRow = matrixValues[r];
      status.innerHTML = `Row ${r + 1}: <strong>${rowLabels[r]}</strong> - Phase 1: Fraction Sweep`;

      // Phase 1: Left-to-Right Fraction Sweep (Clearing denominators)
      for (let i = 0; i < currentRow.length; i++) {
        renderMatrix(r, i);
        let cur = currentRow[i];
        if (cur.d !== 1n) {
          await sleep(450);
          let q = cur.n / cur.d;
          let remNum = cur.n % cur.d;

          if (i + 1 < currentRow.length) {
            status.innerHTML = `Pos ${i}: Fraction <strong>${cur.toString()}</strong>.<br>Keep <strong>${q}</strong>, push remainder right.`;
            
            let pushVal = new Rat(remNum * targetBase, cur.d);
            currentRow[i] = new Rat(q, 1n);
            currentRow[i+1] = currentRow[i+1].add(pushVal);
            
            renderMatrix(r, i);
            await sleep(600);
          } else {
            status.innerHTML = `Pos ${i}: Final fraction. Truncating to <strong>${q}</strong>.`;
            currentRow[i] = new Rat(q, 1n);
            renderMatrix(r, i);
            await sleep(450);
          }
        }
      }

      // Phase 2: Right-to-Left Carry Propagation
      status.innerHTML = `Row ${r + 1}: Phase 2: Carry/Borrow Propagation`;
      for (let i = currentRow.length - 1; i >= 0; i--) {
        renderMatrix(r, i);
        await sleep(450);

        let val = currentRow[i].n; // Denominators are all 1 now
        let rem = val % targetBase;
        if (rem < 0n) rem += abs(targetBase);
        let q = (val - rem) / targetBase;

        if (q !== 0n) {
          status.innerHTML = `Row ${r+1}, Pos ${i}: <strong>${val}</strong>. <br> Keep <strong>${rem}</strong>, Carry <strong>${q}</strong> left.`;
          currentRow[i] = new Rat(rem, 1n);
          renderMatrix(r, i);
          await sleep(450);

          if (i > 0) {
            currentRow[i - 1] = new Rat(currentRow[i - 1].n + q, 1n);
          } else {
            currentRow.unshift(new Rat(q, 1n));
            // When a row grows, we should ideally pad others for visual consistency
            // but for this animation we'll just allow the row to be longer.
            status.innerText = "New digit created at the front!";
            i++; 
          }
        } else {
          currentRow[i] = new Rat(rem, 1n); // Ensure normalized if it was negative
          status.innerText = `Row ${r+1}, Pos ${i}: ${val} is stable.`;
          await sleep(150);
        }
      }

      // Update Final Matrix row with mapped characters once normalized
      const finalRowEl = finalDiv.children[r];
      // Drop leading zeroes for the final display column in the visualization
      let displayRow = currentRow.map(rv => rv.n);
      while (displayRow.length > 1 && displayRow[0] === 0n) displayRow.shift();
      finalRowEl.innerText = `[ ${displayRow.map(v => getChar(v)).join(', ')} ]`;
      finalRowEl.classList.add('finished');
    }

    status.innerHTML = `<strong>All rows normalized!</strong>`;
    renderMatrix(-1, -1);
  });
});

function batchProcessOffset(numbers, matrixN, size, sBase, tBase, container) {
  let offset = sBase - tBase; 
  let pMatrix = getPascalPower(size, offset);
  let resultMatrixR = matrixMultiply(matrixN, pMatrix);

  renderBatchResult(
    "Offset Method (Taylor Shift)", 
    `Offset: ${offset.toString()}, Matrix: Pascal Triangle`,
    matrixN, pMatrix, resultMatrixR, numbers, tBase, container
  );
}

function batchProcessMultiples(numbers, matrixN, size, sBase, tBase, container) {
  let isFractional = (tBase > sBase);
  let num = 1n, den = 1n;
  if (isFractional) den = tBase / sBase;
  else num = sBase / tBase;

  let dMatrix = getDiagonalMatrix(size, num, den);
  let resultMatrixR = matrixMultiply(matrixN, dMatrix);

  renderBatchResult(
    "Multiples Method (Substitution)", 
    `Factor: ${num}/${den} (Diagonal Matrix)`,
    matrixN, dMatrix, resultMatrixR, numbers, tBase, container
  );
}

function renderBatchResult(title, subTitle, matN, matTrans, matR, numbers, tBase, container) {
  let html = `<div style="margin-bottom:10px;">
    <strong>${title}</strong><br>
    <span style="font-size:0.9em; color:#666;">${subTitle}</span>
  </div>`;

  const fmt = (n, pad) => n.toString().padStart(pad, ' ');

  // Collapsible Input Matrix
  let nStr = "";
  matN.forEach(row => nStr += `[ ${row.map(n => fmt(n, 4)).join(' ')} ]\n`);
  html += `<details><summary>Input Matrix N</summary><div class="step-box">${nStr}</div></details>`;

  // Collapsible Transform Matrix
  let tStr = "";
  matTrans.forEach(row => tStr += `[ ${row.map(n => fmt(n, 8)).join(' ')} ]\n`);
  html += `<details><summary>Transform Matrix</summary><div class="step-box">${tStr}</div></details>`;

  // Collapsible Result Matrix
  let rStr = "";
  matR.forEach(row => rStr += `[ ${row.map(n => fmt(n, 10)).join(' ')} ]\n`);
  html += `<details><summary>Result Matrix R (Pre-norm)</summary><div class="step-box">${rStr}</div></details>`;

  let batchBox = document.createElement('div');
  batchBox.className = 'result-card';
  batchBox.innerHTML = html;
  container.appendChild(batchBox);

  // Results List
  let finalOutputs = [];
  
  let resultsList = document.createElement('div');
  resultsList.className = 'result-card';
  resultsList.style.maxHeight = "300px";
  resultsList.style.overflowY = "auto";
  
  let listHtml = "<strong>Converted Results:</strong>";

  numbers.forEach((num, index) => {
    let rowResult = matR[index];
    let norm = normalizeRational(rowResult, tBase);
    
    finalOutputs.push(norm.resultString);
    
    // Create a detail block for EACH result to show its specific log
    listHtml += `
    <details style="margin-top:5px;">
      <summary style="font-weight:normal;">
        <span style="color:#666;">${num.original} &rarr;</span> 
        <span class="final-result">${norm.resultString}</span>
      </summary>
      <div class="step-box" style="font-size:10px; color:#444;">${norm.stepLog || "No normalization needed."}</div>
    </details>`;
  });
  
  resultsList.innerHTML = listHtml;
  container.appendChild(resultsList);

  document.getElementById('batchOutput').value = finalOutputs.join('\n');
}

// --- UNIVERSAL NORMALIZATION (With Logging) ---
function normalizeRational(coeffs, base) {
  let arr = coeffs.map(r => ({ n: r.n, d: r.d }));
  let len = arr.length;
  let logs = []; // Log steps

  // Phase 1: Left-to-Right Fraction Sweep
  for (let i = 0; i < len; i++) {
    let r = arr[i];
    
    // Check if we have a fraction part
    let remNum = r.n % r.d;
    
    if (remNum !== 0n) {
      let q = r.n / r.d; // Integer part
      
      // Push remainder to the right
      if (i + 1 < len) {
        let termNum = remNum * base;
        let termDen = r.d;
        
        let next = arr[i+1];
        let commonDen = next.d * termDen;
        let newNum = (next.n * termDen) + (termNum * next.d);
        
        arr[i+1] = { n: newNum, d: commonDen };
        arr[i] = { n: q, d: 1n };
        
        logs.push(`Pos ${i}: Fraction ${r.n}/${r.d}. Keep ${q}, push remainder right -> Pos ${i+1} now ${newNum}/${commonDen}`);
      } else {
        // Fraction at end (precision loss or non-integer result)
        logs.push(`Pos ${i}: Fraction ${r.n}/${r.d} at end. Truncating.`);
        arr[i] = { n: q, d: 1n };
      }
    } else {
       // Just simplify if it was 25/5 -> 5/1
       if(r.d !== 1n) {
         let val = r.n / r.d;
         arr[i] = { n: val, d: 1n };
       }
    }
  }

  // Phase 2: Right-to-Left Integer Carry
  let intArr = arr.map(r => r.n);
  
  // Log the state before carry
  // logs.push(`Integer State: [${intArr.join(', ')}]`);

  for (let i = intArr.length - 1; i >= 0; i--) {
    let val = intArr[i];
    let r = val % base;
    if (r < 0n) r += abs(base);
    let q = (val - r) / base;
    
    if (q !== 0n) {
       logs.push(`Pos ${i}: ${val} -> Keep ${r}, Carry ${q} left.`);
       intArr[i] = r;
       if (i > 0) {
         intArr[i-1] += q;
       } else {
         intArr.unshift(q);
         logs.push(`  (New Digit added at front: ${q})`);
         i++; 
       }
    } else if (val !== r) {
       // Case where val was negative but fit in mod base
       intArr[i] = r;
    }
  }

  let str = "";
  let start = 0;
  while(start < intArr.length - 1 && intArr[start] === 0n) start++;
  for(let k = start; k < intArr.length; k++) str += getChar(intArr[k]);
  
  return { result: intArr, resultString: str, stepLog: logs.join('\n') };
}