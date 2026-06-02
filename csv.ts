import { downloadCsv } from './reporting';

export const exportDiagramsCsv = (results, filename = 'diagramas.csv') => {
  if (!results) return;
  const rows = [['x (m)', 'V (kN)', 'M (kN-m)', 'delta (mm)', 'sigma (MPa)']];
  const len = Math.max(results.shearData.length, results.momentData.length, results.deflectionData.length, results.stressData.length);
  for (let i = 0; i < len; i++) {
    const x = results.shearData[i]?.x || results.momentData[i]?.x || results.deflectionData[i]?.x || results.stressData[i]?.x || '';
    rows.push([
      x,
      results.shearData[i]?.V ?? '',
      results.momentData[i]?.M ?? '',
      results.deflectionData[i]?.d ?? '',
      results.stressData[i]?.stress ?? '',
    ]);
  }
  downloadCsv(rows, filename);
};
