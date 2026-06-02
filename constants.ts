import { Materials, Support } from './types';

export const materials: Materials = {
  steel: {
    name: 'Acero Estructural A36',
    E: 200e9,
    G: 79.3e9,
    density: 7850,
    yieldStrength: 250e6,
    ultimateStrength: 400e6,
    poissonRatio: 0.3,
    thermalExpansion: 11.7e-6,
  },
  aluminum: {
    name: 'Aluminio 6061-T6',
    E: 69e9,
    G: 26e9,
    density: 2700,
    yieldStrength: 240e6,
    ultimateStrength: 290e6,
    poissonRatio: 0.33,
    thermalExpansion: 23.6e-6,
  },
  concrete: {
    name: "Concreto f'c=30 MPa",
    E: 30e9,
    G: 12.5e9,
    density: 2400,
    yieldStrength: 30e6,
    ultimateStrength: 30e6,
    poissonRatio: 0.2,
    thermalExpansion: 10e-6,
  },
  wood: {
    name: 'Madera (Pino estructural)',
    E: 12e9,
    G: 0.75e9,
    density: 500,
    yieldStrength: 40e6,
    ultimateStrength: 50e6,
    poissonRatio: 0.4,
    thermalExpansion: 5e-6,
  },
  stainlessSteel: {
    name: 'Acero Inoxidable 304',
    E: 193e9,
    G: 86e9,
    density: 8000,
    yieldStrength: 215e6,
    ultimateStrength: 505e6,
    poissonRatio: 0.29,
    thermalExpansion: 17.2e-6,
  },
};

export const supportTypes = [
  { type: 'fixed', name: 'Empotrado', symbol: 'fixed', description: 'Restriccion total de movimiento y rotacion' },
  { type: 'pinned', name: 'Articulado', symbol: 'pinned', description: 'Restriccion de movimiento, libre rotacion' },
  { type: 'roller', name: 'Rodillo', symbol: 'roller', description: 'Restriccion vertical, libre horizontal' },
];

export const loadTypes = [
  { type: 'point', name: 'Carga Puntual', unit: 'kN', description: 'Fuerza concentrada en un punto' },
  { type: 'distributed', name: 'Carga Distribuida', unit: 'kN/m', description: 'Carga uniforme a lo largo de una seccion' },
  { type: 'moment', name: 'Momento', unit: 'kN-m', description: 'Par de torsion aplicado' },
  { type: 'triangular', name: 'Carga Triangular', unit: 'kN/m', description: 'Carga variable linealmente' },
];

export const defaultSupports = [
  { id: 1, type: 'fixed', position: 0 },
  { id: 2, type: 'roller', position: 10 },
];
