import { describe, expect, it } from 'vitest';
import { analyzeBeam } from '../calculations';
import { materials } from '../constants';
import { calculateSectionProperties } from '../sections';

const baseModel = {
  beamLength: 10,
  beamMaterial: 'steel',
  crossSection: 'rectangular',
  width: 0.1,
  height: 0.2,
  materials,
  supports: [
    { id: 1, type: 'pinned', position: 0 },
    { id: 2, type: 'roller', position: 10 },
  ],
  loadFactor: 1,
  includeSelfWeight: false,
  effectiveLengthFactor: 1,
};

describe('section properties', () => {
  it('uses the true neutral axis for an asymmetric T section', () => {
    const section = calculateSectionProperties('T-beam', 0.3, 0.5);

    expect(section.area).toBeCloseTo(0.066, 8);
    expect(section.centroidFromBottom).toBeCloseTo(0.313636, 5);
    expect(section.cBottom).toBeGreaterThan(section.cTop);
    expect(section.cMax).toBe(section.cBottom);
  });
});

describe('two-support beam solver', () => {
  it('matches the closed-form center point-load solution', () => {
    const result = analyzeBeam({
      ...baseModel,
      loads: [{ id: 1, type: 'point', position: 5, magnitude: 10, angle: 90 }],
    });

    expect(Number(result.reactions.R1)).toBeCloseTo(5, 2);
    expect(Number(result.reactions.R2)).toBeCloseTo(5, 2);
    expect(Number(result.maxMoment)).toBeCloseTo(25, 2);
    expect(Number(result.maxDeflection)).toBeCloseTo(15.625, 2);
    expect(Number(result.maxDeflectionLocation)).toBeCloseTo(5, 2);
    expect(typeof result.momentData[0].M).toBe('number');
    expect(result.verification.status).toBe('Verificado');
  });

  it('matches the closed-form full-span uniform-load solution', () => {
    const result = analyzeBeam({
      ...baseModel,
      loads: [
        { id: 1, type: 'distributed', position: 0, endPosition: 10, magnitude: 5 },
      ],
    });

    expect(Number(result.reactions.R1)).toBeCloseTo(25, 2);
    expect(Number(result.reactions.R2)).toBeCloseTo(25, 2);
    expect(Number(result.maxMoment)).toBeCloseTo(62.5, 2);
    expect(Number(result.maxDeflection)).toBeCloseTo(48.8281, 1);
    expect(result.verification.status).toBe('Verificado');
  });

  it('includes a concentrated moment in equilibrium and in the moment diagram', () => {
    const result = analyzeBeam({
      ...baseModel,
      loads: [{ id: 1, type: 'moment', position: 5, magnitude: 10 }],
    });

    expect(Number(result.reactions.R1)).toBeCloseTo(-1, 2);
    expect(Number(result.reactions.R2)).toBeCloseTo(1, 2);
    expect(Number(result.maxMoment)).toBeCloseTo(5, 2);
    expect(Number(result.verification.momentResidual)).toBeCloseTo(0, 8);
  });

  it('keeps signed lever arms for loads on an exterior overhang', () => {
    const result = analyzeBeam({
      ...baseModel,
      supports: [
        { id: 1, type: 'pinned', position: 2 },
        { id: 2, type: 'roller', position: 8 },
      ],
      loads: [{ id: 1, type: 'point', position: 1, magnitude: 10, angle: 90 }],
    });

    expect(Number(result.reactions.R1)).toBeCloseTo(11.67, 2);
    expect(Number(result.reactions.R2)).toBeCloseTo(-1.67, 2);
    expect(result.verification.status).toBe('Verificado');
  });
});
