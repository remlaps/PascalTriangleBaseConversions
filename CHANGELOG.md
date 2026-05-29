# Changelog

## [1.1.2] - 2026-05-28
### Added
- **Reset Button**: Clears the form for new data entry
- **Round Trip Button**: Reverses the last conversion by swapping source base and target base, input and output.
- **Audit Button**: Basic arithmetic to confirm the results.
- **Random Button**: Adds random numbers to the source matrix.

### Fixed
- **Multiples Animation Boundary**: Fixed a bug in the Step-by-Step animation where carries propagating into leading "padding" cells were terminating the loop prematurely. 
- **Dynamic Row Expansion**: Carry propagation now correctly resets visibility boundaries and handles row unshifting (new leading digits) with immediate rendering updates.

## [1.1.1] - 2026-05-26
### Fixed
- **Negative Base Factors**: Fixed a critical bug in the Multiples method where BigInt division truncated scaling factors to zero when converting between positive and negative bases.
### Improved
- **Honest Boundary Detection**: Replaced "cheating" lookahead scans with a metadata-driven approach. Phase 2 now respects boundaries established by input padding and dynamic "draining" during Phase 1.
- **Visual Clutter Reduction**: Leading padding cells in the visualizer are now hidden (`visibility: hidden`) to focus on active digits, and static matrix displays are sliced to show only significant columns.

## [1.1.0] - 2026-05-25
### Added
- **Visualizer Engine**: Dynamic overlay to animate the conversion process step-by-step.
- **Full Matrix Equation**: Displaying $N \times T = R$ to show how linear algebra transforms digit blocks.
- **Dual-Phase Normalization** (for animation):
    - Phase 1: Left-to-Right Fraction Sweep (clearing denominators).
    - Phase 2: Right-to-Left Carry/Borrow propagation.
- **Leading Zero Handling**: Automatic stripping of leading zeros from inputs and results.

### Improved
- **Animation Performance**: Optimized step-by-step speed by 25% for better UX.
- **UI Robustness**: Added scrollable visualization area and sticky close button to prevent overflow issues in the Chrome extension popup.
- **Type Alignment**: Ensured the new visualizer correctly handles `Rat` objects from the matrix engine, matching the core conversion logic.
- **Phase 2 Optimization**: Refined significant boundary detection after the Fraction Sweep to skip redundant leading zero checks during Carry Propagation.

## [1.0.0] - 2026-01-18
- Initial release with Offset and Multiples methods.