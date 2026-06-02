import { calculateArea } from './sections';
import { Load, Support } from './types';

export const calculateMomentOfInertia = (crossSection: string, width: number, height: number) => {
  if (crossSection === 'rectangular') {
    return (width * Math.pow(height, 3)) / 12;
  }
  if (crossSection === 'circular') {
    const radius = width / 2;
    return (Math.PI * Math.pow(radius, 4)) / 4;
  }
  if (crossSection === 'I-beam') {
    const tw = width * 0.4;
    const tf = height * 0.15;
    const h = height;
    const b = width;
    return (b * Math.pow(h, 3)) / 12 - ((b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
  }
  if (crossSection === 'T-beam') {
    const flangeWidth = width;
    const flangeThick = height * 0.2;
    const webWidth = width * 0.3;
    const webHeight = height * 0.8;
    const area1 = flangeWidth * flangeThick;
    const area2 = webWidth * webHeight;
    const y1 = height - flangeThick / 2;
    const y2 = webHeight / 2;
    const yc = (area1 * y1 + area2 * y2) / (area1 + area2);
    const I1 = (flangeWidth * Math.pow(flangeThick, 3)) / 12 + area1 * Math.pow(y1 - yc, 2);
    const I2 = (webWidth * Math.pow(webHeight, 3)) / 12 + area2 * Math.pow(y2 - yc, 2);
    return I1 + I2;
  }
  return (width * Math.pow(height, 3)) / 12;
};

export const checkBuckling = (material, I, L, effectiveLength = 1.0, area) => {
  const Le = L * effectiveLength;
  const radiusGyration = Math.sqrt(I / area);
  const slendernessRatio = radiusGyration ? Le / radiusGyration : 0;
  const Pcr = Le ? (Math.pow(Math.PI, 2) * material.E * I) / Math.pow(Le, 2) : 0;

  return {
    criticalLoad: (Pcr / 1000).toFixed(2),
    slendernessRatio: slendernessRatio.toFixed(2),
    bucklingRisk: slendernessRatio > 200 ? 'Alto' : slendernessRatio > 100 ? 'Medio' : 'Bajo',
  };
};

export const analyzeBeam = ({
  beamLength,
  beamMaterial,
  crossSection,
  width,
  height,
  loads,
  materials,
  supports,
  loadFactor = 1.0,
  includeSelfWeight = false,
  effectiveLengthFactor = 1.0,
}) => {
  const material = materials[beamMaterial];
  const inertia = calculateMomentOfInertia(crossSection, width, height);
  const area = calculateArea(crossSection, width, height);
  const points = 200;
  const dx = beamLength / points;

  const supportA = supports && supports[0] ? supports[0].position : 0;
  const supportB = supports && supports[1] ? supports[1].position : beamLength;
  const span = Math.max(supportB - supportA, 0.0001);

  let totalVertical = 0;
  let momentAboutA = 0;

  const factoredLoads = loads.map((l) => ({ ...l, magnitude: (l.magnitude || 0) * loadFactor }));

  if (includeSelfWeight) {
    const w = (material.density * area * 9.81) / 1000; // kN/m
    factoredLoads.push({
      id: 'self-weight',
      type: 'distributed',
      position: supportA,
      endPosition: supportB,
      magnitude: w,
    });
  }

  factoredLoads.forEach((load) => {
    const angleRad = ((load.angle || 90) * Math.PI) / 180;
    const verticalComponent = Math.sin(angleRad);

    if (load.type === 'point') {
      const force = load.magnitude * 1000 * verticalComponent;
      totalVertical += force;
      momentAboutA += force * Math.max(load.position - supportA, 0);
    } else if (load.type === 'distributed') {
      const w = load.magnitude * 1000;
      const length = load.endPosition - load.position;
      const totalLoad = w * length;
      const centroid = load.position + length / 2;
      totalVertical += totalLoad;
      momentAboutA += totalLoad * Math.max(centroid - supportA, 0);
    } else if (load.type === 'triangular') {
      const wMax = load.magnitude * 1000;
      const length = load.endPosition - load.position;
      const totalLoad = (wMax * length) / 2;
      const centroid = load.position + (2 * length) / 3;
      totalVertical += totalLoad;
      momentAboutA += totalLoad * Math.max(centroid - supportA, 0);
    } else if (load.type === 'moment') {
      momentAboutA += load.magnitude * 1000;
    }
  });

  const R2 = momentAboutA / span;
  const R1 = totalVertical - R2;

  const shearData = [];
  const momentData = [];
  const deflectionData = [];
  const stressData = [];

  let maxShear = 0;
  let maxMoment = 0;
  let maxDeflection = 0;
  let maxStress = 0;

  for (let i = 0; i <= points; i++) {
    const x = i * dx;
    let V = 0;
    let M = 0;

    if (x >= supportA) {
      V += R1;
      M += R1 * (x - supportA);
    }
    if (x >= supportB) {
      V += R2;
      M += R2 * (x - supportB);
    }

    factoredLoads.forEach((load) => {
      const angleRad = ((load.angle || 90) * Math.PI) / 180;
      const verticalComponent = Math.sin(angleRad);

      if (load.type === 'point' && x >= load.position) {
        const force = load.magnitude * 1000 * verticalComponent;
        V -= force;
        M -= force * (x - load.position);
      } else if (load.type === 'distributed') {
        if (x >= load.position && x <= load.endPosition) {
          const w = load.magnitude * 1000;
          V -= w * (x - load.position);
          M -= (w * Math.pow(x - load.position, 2)) / 2;
        } else if (x > load.endPosition) {
          const w = load.magnitude * 1000;
          const length = load.endPosition - load.position;
          V -= w * length;
          M -= w * length * (x - (load.position + length / 2));
        }
      } else if (load.type === 'triangular') {
        if (x >= load.position && x <= load.endPosition) {
          const wMax = load.magnitude * 1000;
          const length = load.endPosition - load.position;
          V -= (wMax * Math.pow(x - load.position, 2)) / (2 * length);
          M -= (wMax * Math.pow(x - load.position, 3)) / (6 * length);
        } else if (x > load.endPosition) {
          const wMax = load.magnitude * 1000;
          const length = load.endPosition - load.position;
          const totalLoad = (wMax * length) / 2;
          V -= totalLoad;
          M -= totalLoad * (x - (load.position + (2 * length) / 3));
        }
      }
    });

    const EI = material.E * inertia;
    const deflection = -((M * Math.pow(x, 2)) / (2 * EI)) * (1 - Math.pow(x / beamLength, 2));
    const c = height / 2;
    const stress = Math.abs((M * c) / inertia);

    shearData.push({ x: x.toFixed(3), V: (V / 1000).toFixed(3) });
    momentData.push({ x: x.toFixed(3), M: (M / 1000).toFixed(3) });
    deflectionData.push({ x: x.toFixed(3), d: (deflection * 1000).toFixed(4) });
    stressData.push({ x: x.toFixed(3), stress: (stress / 1e6).toFixed(3) });

    maxShear = Math.max(maxShear, Math.abs(V));
    maxMoment = Math.max(maxMoment, Math.abs(M));
    maxDeflection = Math.max(maxDeflection, Math.abs(deflection));
    maxStress = Math.max(maxStress, stress);
  }

  const c = height / 2;
  const safetyFactor = maxStress ? material.yieldStrength / maxStress : 0;
  const ultimateSafetyFactor = maxStress ? material.ultimateStrength / maxStress : 0;
  const weight = beamLength * area * material.density * 9.81;
  const bucklingAnalysis = checkBuckling(material, inertia, beamLength, effectiveLengthFactor, area);
  const deflectionLimit = beamLength / 360;
  const deflectionRatio = deflectionLimit ? maxDeflection / deflectionLimit : 0;
  const shearStress = area ? (maxShear * 1.5) / area : 0;
  const vonMisesStress = Math.sqrt(Math.pow(maxStress, 2) + 3 * Math.pow(shearStress, 2));
  const ltbCriticalMoment = material && material.E
    ? (Math.pow(Math.PI, 2) * material.E * inertia) / Math.pow(effectiveLengthFactor * span, 2)
    : 0;
  const ltbSafetyFactor = maxMoment ? ltbCriticalMoment / maxMoment : 0;

  return {
    reactions: {
      R1: (R1 / 1000).toFixed(2),
      R2: (R2 / 1000).toFixed(2),
    },
    appliedLoadFactor: loadFactor.toFixed(2),
    includeSelfWeight,
    shearData,
    momentData,
    deflectionData,
    stressData,
    maxShear: (maxShear / 1000).toFixed(2),
    maxMoment: (maxMoment / 1000).toFixed(2),
    maxDeflection: (maxDeflection * 1000).toFixed(4),
    maxStress: (maxStress / 1e6).toFixed(2),
    vonMisesStress: (vonMisesStress / 1e6).toFixed(2),
    shearStress: (shearStress / 1e6).toFixed(2),
    safetyFactor: safetyFactor.toFixed(2),
    ultimateSafetyFactor: ultimateSafetyFactor.toFixed(2),
    I: (inertia * 1e8).toFixed(4),
    area: (area * 1e4).toFixed(2),
    weight: (weight / 1000).toFixed(2),
    buckling: bucklingAnalysis,
    deflectionRatio: deflectionRatio.toFixed(3),
    deflectionLimit: (deflectionLimit * 1000).toFixed(2),
    utilizationRatio: maxStress ? ((maxStress / material.yieldStrength) * 100).toFixed(1) : '0.0',
    ltbCriticalMoment: (ltbCriticalMoment / 1000).toFixed(2),
    ltbSafetyFactor: ltbSafetyFactor.toFixed(2),
  };
};
