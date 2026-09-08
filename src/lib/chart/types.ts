export const PLANET_NAMES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
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
export const RECALL_KEY = 'atlas-astro.readings-v1';
export const RECALL_CAP = 8;

export const ENGINE_NAME = 'astronomy-engine';
export const ENGINE_VERSION = '2.1.19';
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
