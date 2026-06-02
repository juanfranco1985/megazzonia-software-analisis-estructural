export const buildExportData = ({
  beamLength,
  beamMaterial,
  materials,
  crossSection,
  width,
  height,
  supports,
  loads,
  results,
  analysisNotes,
  includeSelfWeight,
  loadFactor,
  effectiveLengthFactor,
}) => ({
  projectInfo: {
    date: new Date().toISOString(),
    analyst: 'Usuario',
    notes: analysisNotes,
  },
  beam: {
    length: beamLength,
    material: materials[beamMaterial].name,
    crossSection,
    dimensions: { width, height },
    properties: {
      momentOfInertia: results?.I,
      area: results?.area,
      weight: results?.weight,
    },
  },
  supports,
  loads,
  meta: {
    includeSelfWeight,
    loadFactor,
    effectiveLengthFactor,
  },
  results,
});

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadJson = (payload, filename) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
};

export const downloadText = (text, filename) => {
  const blob = new Blob([text], { type: 'text/plain' });
  triggerDownload(blob, filename);
};

export const downloadCsv = (rows, filename) => {
  const csv = rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  triggerDownload(blob, filename);
};

export const buildReportText = ({
  beamLength,
  beamMaterial,
  materials,
  crossSection,
  width,
  height,
  loads,
  loadTypes,
  supports,
  includeSelfWeight,
  loadFactor,
  effectiveLengthFactor,
  results,
  analysisNotes,
}) => {
  const loadLines = loads.length
    ? loads
        .map((load, index) => {
          const loadType = loadTypes.find((lt) => lt.type === load.type);
          const unit = loadType ? loadType.unit : 'kN';
          const label = loadType ? loadType.name : load.type;
          const span =
            load.type === 'distributed' || load.type === 'triangular'
              ? ` (de ${load.position} a ${load.endPosition} m)`
              : '';
          return `${index + 1}. ${label}: ${load.magnitude} ${unit} en x=${load.position} m${span}`;
        })
        .join('\n')
    : 'Sin cargas definidas';

  const supportLines = supports
    .map((s, idx) => `${idx + 1}. ${s.type} en x=${s.position} m`)
    .join('\n');

  return `
REPORTE DE ANALISIS ESTRUCTURAL
===============================
Fecha: ${new Date().toLocaleString('es-AR')}

PROPIEDADES DE LA VIGA
----------------------
Longitud: ${beamLength} m
Material: ${materials[beamMaterial].name}
Seccion Transversal: ${crossSection}
Dimensiones: ${width} m x ${height} m
Area: ${results.area} cm2
Momento de Inercia: ${results.I} cm4
Peso propio: ${results.weight} kN
Peso propio incluido: ${includeSelfWeight ? 'SI' : 'NO'}
Factor de carga aplicado: ${loadFactor}
Factor de longitud efectiva (K): ${effectiveLengthFactor}

CARGAS APLICADAS
----------------
${loadLines}

APOYOS
------
${supportLines}

REACCIONES EN APOYOS
--------------------
${Array.isArray(results.reactions)
    ? results.reactions.map((r, i) => `R${i + 1} @ x=${r.position}m = ${r.value} kN`).join('\n')
    : `R1 = ${results.reactions.R1} kN\nR2 = ${results.reactions.R2} kN`}

RESULTADOS DEL ANALISIS
-----------------------
Cortante Maximo: ${results.maxShear} kN
Momento Flector Maximo: ${results.maxMoment} kN-m
Deflexion Maxima: ${results.maxDeflection} mm
Esfuerzo Normal Maximo: ${results.maxStress} MPa
Esfuerzo de Von Mises: ${results.vonMisesStress} MPa
Esfuerzo Cortante: ${results.shearStress} MPa
Mcr (LTB): ${results.ltbCriticalMoment} kN-m | FS LTB: ${results.ltbSafetyFactor}

FACTORES DE SEGURIDAD
---------------------
Factor de Seguridad (Fluencia): ${results.safetyFactor}
Factor de Seguridad (Ultimo): ${results.ultimateSafetyFactor}
Ratio de Utilizacion: ${results.utilizationRatio}%

ANALISIS DE PANDEO
------------------
Carga Critica de Euler: ${results.buckling.criticalLoad} kN
Relacion de Esbeltez: ${results.buckling.slendernessRatio}
Riesgo de Pandeo: ${results.buckling.bucklingRisk}

VERIFICACION DE DEFLEXION
-------------------------
Deflexion Maxima: ${results.maxDeflection} mm
Limite Recomendado (L/360): ${results.deflectionLimit} mm
Ratio: ${results.deflectionRatio}
Estado: ${parseFloat(results.deflectionRatio) <= 1 ? 'CUMPLE' : 'NO CUMPLE'}

NOTAS ADICIONALES
-----------------
${analysisNotes || 'Sin notas adicionales'}

SUPUESTOS
---------
- Analisis elasto-lineal, pequena deformacion
- Factores: carga=${loadFactor}, K=${effectiveLengthFactor}, peso propio=${includeSelfWeight ? 'SI' : 'NO'}
- Reacciones y esfuerzos basados en modelo de viga

================================
Reporte generado por Simulador de Analisis Estructural
  `.trim();
};

export const buildPdfText = (params) => {
  // For now, reuse text report; consumers can download with .pdf extension for convenience.
  return buildReportText(params);
};
