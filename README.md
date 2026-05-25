# Pascal's Triangle Base Converter

A Chrome Extension that visualizes alternative algorithms for integer base conversion using **Linear Algebra** and **Polynomial Taylor Shifts**.

Based on the paper *"Alternative Algorithms for Integer Base Conversion"* by **Steve Palmer (2007)**.

## 🧮 About the Project

Standard base conversion is typically taught using iterative division (Euclidean division). However, integer representation can also be viewed as a polynomial $P(x)$ evaluated at $x = \text{Base}$.

This extension implements two matrix-based algorithms to convert numbers between bases without division:

1.  **The Offset Method (Pascal Matrix):** Converts bases by "shifting" the polynomial using a **Pascal (Binomial) Matrix**. This is mathematically equivalent to a Taylor Shift (change of variable) on the polynomial representation.
2.  **The Multiples Method (Substitution):** Converts bases when one base is a multiple of the other (e.g., Base 10 to Base 2) using a **Diagonal Scaling Matrix**.

## ✨ Features

* **Arbitrary Precision:** Powered by `BigInt`, this tool can convert integers of arbitrary length (hundreds of digits) without loss of precision.
* **Step-by-Step Animation:** (New in v1.1.0) An interactive overlay that animates the digit normalization process, showing how fractional remainders are swept and carries are propagated.
* **Full Matrix Equation:** Display the exact matrix multiplication steps ($N \times T = R \rightarrow \text{Final}$) used to transform the digits.
* **Batch Processing:** Vectorized implementation converts multiple numbers simultaneously using a single matrix operation.
* **Round-Trip Testing:** Includes a **Batch Output** field to easily copy results and paste them back into the input for reverse conversion.
* **Advanced Base Support:** Supports bases from **-62 to 62** (including negative bases like Negabinary).
* **Dual Algorithms:** Automatically detects if the "Multiples Method" can be used (e.g., Base 8 to Base 2), or defaults to the general "Offset Method."

## 🚀 Installation

1.  Clone or download this repository.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer Mode** (toggle in the top right corner).
4.  Click **Load Unpacked**.
5.  Select the folder containing this repository.

## 📖 Usage

1.  **Input:** Enter integers (one per line) into the text box.
2.  **Config:** Select your **Source Base** and **Target Base**.
    * Use the **Swap (⇄)** button to quickly flip source and target.
    * *Note:* Bases **-1, 0, and 1** are restricted as they do not function as valid positional number systems.
3.  **Convert:** Click **Convert** to see the static results, transformation matrices, and normalization logs for all numbers.
4.  **Step-by-Step Animation:** Click **🎥 Step-by-Step Animation** to open an interactive overlay.
    * The visualizer shows the full matrix equation: $N \times T = R \rightarrow \text{Final}$.
    * Watch the **Phase 1: Fraction Sweep** (left-to-right) and **Phase 2: Carry Propagation** (right-to-left) in real-time.
5.  **Method:**
    * **Offset (Pascal Matrix):** Works for *any* pair of valid bases.
    * **Multiples:** Only available if `Source % Target == 0` (e.g., Base 16 to Base 4).
4.  **Visualize:** Click **Convert & Visualize**.
    * The extension will display the **Input Matrix (N)**.
    * It will show the **Transformation Matrix** ($T$ or $D$).
    * It will show the **Result Matrix (R)** before normalization.
    * Finally, it displays the normalized digits in the target base.
5.  **Copy Results:** Use the **Batch Output** text area at the bottom to copy all converted numbers at once.

## 📐 The Mathematics

### 1. The Offset Method (Pascal Matrix)
This method relies on the observation that converting from Base $B$ to Base $B+k$ is equivalent to expanding the polynomial $P(x)$ at $x+k$.

* **Theory:** The paper defines a base Pascal Matrix $P$ with entries $P_{r,c} = \binom{c}{r}$. The transformation for an offset $e$ is achieved by raising this matrix to the power of $e$ ($P^e$).
* **Implementation:** The code computes the final **Transformation Matrix ($T = P^e$)** directly using the combined formula:
    $$T_{r,c} = \binom{c}{r} \cdot e^{c-r}$$
* **Operation:** $R = N \times T$

### 2. The Multiples Method
When the source base is a multiple of the target (e.g., Base 10 to Base 5, factor $F=2$), we substitute the base $B$ with $F \cdot B_{new}$.

* **Transformation Matrix ($D$):** A diagonal matrix of powers of the base ratio $F$, used to rescale the digits.
* **Operation:** $R = N \times D$

### 3. Digit Normalization
The matrix operations produce a result vector $R$ where "digits" may be larger than the base (or negative). To handle cases where intermediate coefficients are fractional (common in the Multiples method), the extension uses a **Dual-Phase Normalization**:

1.  **Phase 1: Fraction Sweep (Left-to-Right):** Iterates through the vector to clear denominators by pushing fractional remainders to the right-hand neighboring digit.
2.  **Phase 2: Carry Propagation (Right-to-Left):** Performs standard positional carry and borrow operations to ensure every digit is within the valid range $[0, |\text{Base}| - 1]$.

## 📂 Project Structure

* `popup.html` - The user interface.
* `popup.js` - The core logic (BigInt Math, Matrix generation, Normalization).
* `style.css` - Styling for the visualization cards.
* `manifest.json` - Chrome extension configuration.

## 📜 License

This project is open-source.
Algorithm concepts based on *"[Alternative Algorithms for Integer Base Conversion](https://github.com/remlaps/PascalTriangleBaseConversions/blob/c50ae39eb488da2a52e06330076a20122966a50a/AlternateBaseConversionAlgorithms.pdf)"* (Steve Palmer, 2007).

## Announcement
- [Pascal's Triangle and Matrix Multiplication: Alternative Approaches to Integer Base Conversion](https://steemit.com/popular-stem/@remlaps/pascal-s-triangle-and-matrix-multiplication-alternative-approaches-to-integer-base-conversion)
