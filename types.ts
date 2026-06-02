export type MaterialKey = 'steel' | 'aluminum' | 'concrete' | 'wood' | 'stainlessSteel';

export type SupportType = 'fixed' | 'pinned' | 'roller';

export type LoadType = 'point' | 'distributed' | 'moment' | 'triangular';

export type Support = {
  id: number | string;
  type: SupportType;
  position: number;
};

export type Load = {
  id: number | string;
  type: LoadType;
  position: number;
  endPosition?: number;
  magnitude: number;
  angle?: number;
};

export type Material = {
  name: string;
  E: number;
  G: number;
  density: number;
  yieldStrength: number;
  ultimateStrength: number;
  poissonRatio: number;
  thermalExpansion: number;
};

export type Materials = Record<MaterialKey, Material>;
