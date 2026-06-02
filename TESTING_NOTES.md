Planned tests (not implemented yet):
- Unit tests for `analyzeBeam`, `calculateMomentOfInertia`, and area helpers (Vitest).
- Validation tests: beam length > 0, supports at 0 and L, load spans inside beam, magnitudes > 0.
- UI smoke test: render main app with default supports and a sample load, assert results cards display.

Run plan (once tests exist):
1) Install deps: `npm install`
2) Run dev: `npm run dev`
3) Run tests (when added): `npm test` (to be wired with Vitest)
