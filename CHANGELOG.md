# Changelog

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

## [1.0.0] - 2026-01-18
- Initial release with Offset and Multiples methods.