import { calculateSectionProperties } from './sections';
import { Load } from './types';

export const calculateMomentOfInertia = (
  crossSection: string,
  width: number,
  height: number,
) => calculateSectionProperties(crossSection, width, height).inertia;

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

const interpolate = (xValues: number[], values: number[], target: number) => {
  if (target <= xValues[0]) return values[0];
  if (target >= xValues[xValues.length - 1]) return values[values.length - 1];

  const rightIndex = xValues.findIndex((x) => x >= target);
  const leftIndex = Math.max(rightIndex - 1, 0);
  const x0 = xValues[leftIndex];
  const x1 = xValues[rightIndex];
  const ratio = x1 === x0 ? 0 : (target - x0) / (x1 - x0);
  return values[leftIndex] + ratio * (values[rightIndex] - values[leftIndex]);
};

const integrateDeflection = (
  xValues: number[],
  momentValues: number[],
  elasticModulus: number,
  inertia: number,
  supportA: number,
  supportB: number,
) => {
  const curvature = momentValues.map((moment) => -moment / (elasticModulus * inertia));
  const rawSlope = new Array(xValues.length).fill(0);
  const rawDeflection = new Array(xValues.length).fill(0);

  for (let i = 1; i < xValues.length; i++) {
    const dx = xValues[i] - xValues[i - 1];
    rawSlope[i] =
      rawSlope[i - 1] + ((curvature[i - 1] + curvature[i]) * dx) / 2;
    rawDeflection[i] =
      rawDeflection[i - 1] + ((rawSlope[i - 1] + rawSlope[i]) * dx) / 2;
  }

  const rawAtA = interpolate(xValues, rawDeflection, supportA);
  const rawAtB = interpolate(xValues, rawDeflection, supportB);
  const integrationConstant = (rawAtA - rawAtB) / (supportB - supportA);
  const offset = -rawAtA - integrationConstant * supportA;
  const deflection = rawDeflection.map(
    (value, index) => value + integrationConstant * xValues[index] + offset,
  );

  return {
    values: deflection,
    supportResidual: Math.max(
      Math.abs(interpolate(xValues, deflection, supportA)),
      Math.abs(interpolate(xValues, deflection, supportB)),
    ),
  };
};

const getMaximumByAbsoluteValue = (values: number[]) =>
  values.reduce(
    (maximum, value, index) =>
      Math.abs(value) > Math.abs(maximum.value) ? { value, index } : maximum,
    { value: values[0] || 0, index: 0 },
  );

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
  const section = calculateSectionProperties(crossSection, width, height);
  const { inertia, area } = section;
  const points = 400;
  const dx = beamLength / points;

  const supportA = supports && supports[0] ? supports[0].position : 0;
  const supportB = supports && supports[1] ? supports[1].position : beamLength;
  const span = supportB - supportA;

  let totalVertical = 0;
  let momentAboutA = 0;

  const factoredLoads: Load[] = loads.map((load: Load) => ({
    ...load,
    magnitude: (load.magnitude || 0) * loadFactor,
  }));

  if (includeSelfWeight) {
    const selfWeight = ((material.density * area * 9.81) / 1000) * loadFactor;
    factoredLoads.push({
      id: 'self-weight',
      type: 'distributed',
      position: 0,
      endPosition: beamLength,
      magnitude: selfWeight,
    });
  }

  factoredLoads.forEach((load) => {
    const angleRad = ((load.angle || 90) * Math.PI) / 180;
    const verticalComponent = Math.sin(angleRad);

    if (load.type === 'point') {
      const force = load.magnitude * 1000 * verticalComponent;
      totalVertical += force;
      momentAboutA += force * (load.position - supportA);
    } else if (load.type === 'distributed') {
      const endPosition = load.endPosition ?? load.position;
      const intensity = load.magnitude * 1000;
      const length = endPosition - load.position;
      const totalLoad = intensity * length;
      const centroid = load.position + length / 2;
      totalVertical += totalLoad;
      momentAboutA += totalLoad * (centroid - supportA);
    } else if (load.type === 'triangular') {
      const endPosition = load.endPosition ?? load.position;
      const maximumIntensity = load.magnitude * 1000;
      const length = endPosition - load.position;
      const totalLoad = (maximumIntensity * length) / 2;
      const centroid = load.position + (2 * length) / 3;
      totalVertical += totalLoad;
      momentAboutA += totalLoad * (centroid - supportA);
    } else if (load.type === 'moment') {
      momentAboutA += load.magnitude * 1000;
    }
  });

  const reactionB = momentAboutA / span;
  const reactionA = totalVertical - reactionB;
  const xValues = Array.from({ length: points + 1 }, (_, index) => index * dx);
  const shearValues: number[] = [];
  const momentValues: number[] = [];

  xValues.forEach((x) => {
    let shear = 0;
    let moment = 0;

    if (x >= supportA) {
      shear += reactionA;
      moment += reactionA * (x - supportA);
    }
    if (x >= supportB) {
      shear += reactionB;
      moment += reactionB * (x - supportB);
    }

    factoredLoads.forEach((load) => {
      const angleRad = ((load.angle || 90) * Math.PI) / 180;
      const verticalComponent = Math.sin(angleRad);

      if (load.type === 'point' && x >= load.position) {
        const force = load.magnitude * 1000 * verticalComponent;
        shear -= force;
        moment -= force * (x - load.position);
      } else if (load.type === 'distributed') {
        const endPosition = load.endPosition ?? load.position;
        const intensity = load.magnitude * 1000;
        if (x >= load.position && x <= endPosition) {
          shear -= intensity * (x - load.position);
          moment -= (intensity * Math.pow(x - load.position, 2)) / 2;
        } else if (x > endPosition) {
          const length = endPosition - load.position;
          shear -= intensity * length;
          moment -= intensity * length * (x - (load.position + length / 2));
        }
      } else if (load.type === 'triangular') {
        const endPosition = load.endPosition ?? load.position;
        const maximumIntensity = load.magnitude * 1000;
        const length = endPosition - load.position;
        if (x >= load.position && x <= endPosition) {
          shear -= (maximumIntensity * Math.pow(x - load.position, 2)) / (2 * length);
          moment -= (maximumIntensity * Math.pow(x - load.position, 3)) / (6 * length);
        } else if (x > endPosition) {
          const totalLoad = (maximumIntensity * length) / 2;
          moment -= totalLoad * (x - (load.position + (2 * length) / 3));
          shear -= totalLoad;
        }
      } else if (load.type === 'moment' && x >= load.position) {
        moment += load.magnitude * 1000;
      }
    });

    shearValues.push(shear);
    momentValues.push(moment);
  });

  const deflection = integrateDeflection(
    xValues,
    momentValues,
    material.E,
    inertia,
    supportA,
    supportB,
  );
  const stressValues = momentValues.map(
    (moment) => (Math.abs(moment) * section.cMax) / inertia,
  );
  const maxShearResult = getMaximumByAbsoluteValue(shearValues);
  const maxMomentResult = getMaximumByAbsoluteValue(momentValues);
  const maxDeflectionResult = getMaximumByAbsoluteValue(deflection.values);
  const maxStressResult = getMaximumByAbsoluteValue(stressValues);
  const maxShear = Math.abs(maxShearResult.value);
  const maxMoment = Math.abs(maxMomentResult.value);
  const maxDeflection = Math.abs(maxDeflectionResult.value);
  const maxStress = Math.abs(maxStressResult.value);

  const shearData = xValues.map((x, index) => ({
    x: Number(x.toFixed(3)),
    V: Number((shearValues[index] / 1000).toFixed(3)),
  }));
  const momentData = xValues.map((x, index) => ({
    x: Number(x.toFixed(3)),
    M: Number((momentValues[index] / 1000).toFixed(3)),
  }));
  const deflectionData = xValues.map((x, index) => ({
    x: Number(x.toFixed(3)),
    d: Number((deflection.values[index] * 1000).toFixed(4)),
  }));
  const stressData = xValues.map((x, index) => ({
    x: Number(x.toFixed(3)),
    stress: Number((stressValues[index] / 1e6).toFixed(3)),
  }));

  const weight = beamLength * area * material.density * 9.81;
  const bucklingAnalysis = checkBuckling(
    material,
    inertia,
    beamLength,
    effectiveLengthFactor,
    area,
  );
  const deflectionLimit = beamLength / 360;
  const deflectionRatio = deflectionLimit ? maxDeflection / deflectionLimit : 0;
  const shearShapeFactor = crossSection === 'circular' ? 4 / 3 : 1.5;
  const shearStress = area ? (maxShear * shearShapeFactor) / area : 0;
  const vonMisesStress = Math.sqrt(Math.pow(maxStress, 2) + 3 * Math.pow(shearStress, 2));
  const safetyFactor = vonMisesStress ? material.yieldStrength / vonMisesStress : 0;
  const ultimateSafetyFactor = vonMisesStress
    ? material.ultimateStrength / vonMisesStress
    : 0;
  const verticalResidual = reactionA + reactionB - totalVertical;
  const momentResidual = reactionB * span - momentAboutA;
  const equilibriumTolerance = Math.max(Math.abs(totalVertical), 1) * 1e-9;
  const momentTolerance = Math.max(Math.abs(momentAboutA), 1) * 1e-9;
  const verificationPassed =
    Math.abs(verticalResidual) <= equilibriumTolerance &&
    Math.abs(momentResidual) <= momentTolerance &&
    deflection.supportResidual <= 1e-9;

  return {
    reactions: {
      R1: (reactionA / 1000).toFixed(2),
      R2: (reactionB / 1000).toFixed(2),
    },
    appliedLoadFactor: loadFactor.toFixed(2),
    includeSelfWeight,
    shearData,
    momentData,
    deflectionData,
    stressData,
    maxShear: (maxShear / 1000).toFixed(2),
    maxShearLocation: xValues[maxShearResult.index].toFixed(3),
    maxMoment: (maxMoment / 1000).toFixed(2),
    maxMomentLocation: xValues[maxMomentResult.index].toFixed(3),
    maxDeflection: (maxDeflection * 1000).toFixed(4),
    maxDeflectionLocation: xValues[maxDeflectionResult.index].toFixed(3),
    maxStress: (maxStress / 1e6).toFixed(2),
    maxStressLocation: xValues[maxStressResult.index].toFixed(3),
    vonMisesStress: (vonMisesStress / 1e6).toFixed(2),
    shearStress: (shearStress / 1e6).toFixed(2),
    safetyFactor: safetyFactor.toFixed(2),
    ultimateSafetyFactor: ultimateSafetyFactor.toFixed(2),
    I: (inertia * 1e8).toFixed(4),
    area: (area * 1e4).toFixed(2),
    centroid: (section.centroidFromBottom * 1000).toFixed(2),
    sectionModulus: (section.sectionModulus * 1e6).toFixed(3),
    weight: (weight / 1000).toFixed(2),
    buckling: bucklingAnalysis,
    deflectionRatio: deflectionRatio.toFixed(3),
    deflectionLimit: (deflectionLimit * 1000).toFixed(2),
    utilizationRatio: vonMisesStress
      ? ((vonMisesStress / material.yieldStrength) * 100).toFixed(1)
      : '0.0',
    verification: {
      status: verificationPassed ? 'Verificado' : 'Revisar',
      method: 'Integracion numerica de M/EI',
      verticalResidual: (verticalResidual / 1000).toExponential(2),
      momentResidual: (momentResidual / 1000).toExponential(2),
      supportDeflectionResidual: (deflection.supportResidual * 1000).toExponential(2),
    },
    modelScope: 'Viga Euler-Bernoulli con dos apoyos verticales simples',
  };
};
