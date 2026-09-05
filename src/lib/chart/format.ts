import { SIGN_ABBR, SIGNS, type Dms } from './types';

export function degNorm(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

export function toDms(longitude: number): Dms {
  const lon = degNorm(longitude);
  const signIndex = Math.min(11, Math.floor(lon / 30));
  const inSign = lon - signIndex * 30;
  const deg = Math.floor(inSign);
  const min = Math.round((inSign - deg) * 60);
  const carry = min === 60;
  const degOut = carry ? deg + 1 : deg;
  const minOut = carry ? 0 : min;
  const signAdj = degOut === 30 ? (signIndex + 1) % 12 : signIndex;
  const degFinal = degOut === 30 ? 0 : degOut;
  const sign = SIGNS[signAdj];
  return {
    sign,
    signIndex: signAdj,
    deg: degFinal,
    min: minOut,
    text: `${degFinal}° ${String(minOut).padStart(2, '0')}′ ${SIGN_ABBR[signAdj]}`,
  };
}

export function houseOf(longitude: number, cusps: number[]): number | null {
  if (cusps.length < 13) return null;
  const lon = degNorm(longitude);
  for (let h = 1; h <= 12; h++) {
    const a = degNorm(cusps[h]);
    const b = degNorm(cusps[h === 12 ? 1 : h + 1]);
    const span = degNorm(b - a);
    const d = degNorm(lon - a);
    if (d < span || span === 0) return h;
  }
  return 12;
}
