export const PLANET_IDS = [
  { id: 0, name: 'Sun' },
  { id: 1, name: 'Moon' },
  { id: 2, name: 'Mercury' },
  { id: 3, name: 'Venus' },
  { id: 4, name: 'Mars' },
  { id: 5, name: 'Jupiter' },
  { id: 6, name: 'Saturn' },
  { id: 7, name: 'Uranus' },
  { id: 8, name: 'Neptune' },
  { id: 9, name: 'Pluto' },
] as const;

export const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'] as const;

export const STORAGE_KEY = 'atlas-astro.chart-v1';

export const SE_VERSION = '2.10.03';
export const SE_BINDING = '@fusionstrings/swisseph-wasm';
export const HOUSE_SYSTEM = 'Placidus';
export const ZODIAC = 'tropical';

export interface ChartDraft {
  date: string;
  time: string;
  timeUnknown: boolean;
  placeLabel: string;
  lat: number;
  lon: number;
}

export interface GeoHit {
  label: string;
  lat: number;
  lon: number;
}

export interface TimeZoneInfo {
  tzid: string;
  offsetLabel: string;
  utcOffsetMinutes: number;
}

export interface Dms {
  sign: (typeof SIGNS)[number];
  signIndex: number;
  deg: number;
  min: number;
  text: string;
}

export interface PlanetRow {
  name: string;
  longitude: number;
  dms: Dms;
  house: number | null;
}

export interface HouseSet {
  cusps: number[];
  ascendant: number;
  mc: number;
}

export interface ChartResult {
  planets: PlanetRow[];
  houses: HouseSet | null;
  timeUnknown: boolean;
  noonUsed: boolean;
  methodLine: string;
  zone: TimeZoneInfo;
  julianDay: number;
  ephemeris: string;
}

export type ReadingState =
  | { kind: 'no-input' }
  | { kind: 'no-js' }
  | { kind: 'unconfigured' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; draft: ChartDraft; chart: ChartResult };
