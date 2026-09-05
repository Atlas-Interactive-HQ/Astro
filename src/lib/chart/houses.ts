import { degNorm } from './format';
import type { HouseSet } from './types';

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function lonFromRamc(ramcDeg: number, epsDeg: number): number {
  const ramc = rad(ramcDeg);
  const eps = rad(epsDeg);
  return degNorm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
}

export function ascendant(ramcDeg: number, latDeg: number, epsDeg: number): number {
  const ramc = rad(ramcDeg);
  const lat = rad(latDeg);
  const eps = rad(epsDeg);
  return degNorm(
    deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)))),
  );
}

function equatorial(lonDeg: number, epsDeg: number): { ra: number; dec: number } {
  const l = rad(lonDeg);
  const e = rad(epsDeg);
  return {
    ra: degNorm(deg(Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)))),
    dec: deg(Math.asin(Math.sin(e) * Math.sin(l))),
  };
}

function semiDiurnalArc(decDeg: number, latDeg: number): number | null {
  const x = -Math.tan(rad(latDeg)) * Math.tan(rad(decDeg));
  if (x <= -1 || x >= 1) return null;
  return deg(Math.acos(x));
}

function iterateCusp(ramc: number, lat: number, eps: number, fractionOfSdaFromMc: number): number | null {
  let lon = lonFromRamc(ramc + 30 * Math.sign(fractionOfSdaFromMc || 1), eps);
  for (let i = 0; i < 24; i++) {
    const { dec } = equatorial(lon, eps);
    const sda = semiDiurnalArc(dec, lat);
    if (sda === null) return null;
    const raTarget = degNorm(ramc + fractionOfSdaFromMc * sda);
    const next = lonFromRamc(raTarget, eps);
    if (Math.abs(degNorm(next - lon + 180) - 180) < 1 / 3600) return next;
    lon = next;
  }
  return lon;
}

/**
 * Placidus cusps from Greenwich sidereal time (hours), geographic lat/lon (east +),
 * and true obliquity (degrees). Cusps[1..12]; index 0 unused.
 * Returns null when Placidus is undefined (circumpolar / high latitude).
 *
 * RA of a cusp = RAMC + (fraction of the semi-diurnal arc).
 * +1/3, +2/3 → 11th and 12th (east of the meridian); −1/3, −2/3 → 9th and 8th.
 */
export function placidusHouses(sidtimeHours: number, lat: number, lon: number, eps: number): HouseSet | null {
  const ramc = degNorm(sidtimeHours * 15 + lon);
  const mc = lonFromRamc(ramc, eps);
  const asc = ascendant(ramc, lat, eps);
  const c11 = iterateCusp(ramc, lat, eps, 1 / 3);
  const c12 = iterateCusp(ramc, lat, eps, 2 / 3);
  const c9 = iterateCusp(ramc, lat, eps, -1 / 3);
  const c8 = iterateCusp(ramc, lat, eps, -2 / 3);
  if (c11 === null || c12 === null || c9 === null || c8 === null) return null;
  const cusps = new Array<number>(13).fill(0);
  cusps[1] = asc;
  cusps[2] = degNorm(c8 + 180);
  cusps[3] = degNorm(c9 + 180);
  cusps[4] = degNorm(mc + 180);
  cusps[5] = degNorm(c11 + 180);
  cusps[6] = degNorm(c12 + 180);
  cusps[7] = degNorm(asc + 180);
  cusps[8] = c8;
  cusps[9] = c9;
  cusps[10] = mc;
  cusps[11] = c11;
  cusps[12] = c12;
  return { cusps, ascendant: asc, mc };
}
