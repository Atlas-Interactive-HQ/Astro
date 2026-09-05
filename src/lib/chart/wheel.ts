import { SIGN_ABBR } from './types';
import type { ChartResult } from './types';
import { degNorm } from './format';

const CX = 200;
const CY = 200;
const R_OUT = 188;
const R_SIGN = 158;
const R_HOUSE = 118;
const R_IN = 52;

function polar(r: number, deg: number): { x: number; y: number } {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function ray(a: number, r1: number, r2: number, cls: string): string {
  const p = polar(r1, a);
  const q = polar(r2, a);
  return `<line class="${cls}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" />`;
}

/**
 * Wheel oriented with 0° Aries at the left (eastern horizon),
 * increasing anti-clockwise — the conventional natal view when
 * the Ascendant is placed on the left.
 */
export function wheelSvg(chart: ChartResult): string {
  const rot = chart.houses ? degNorm(180 - chart.houses.ascendant) : 180;
  const map = (lon: number) => degNorm(lon + rot);

  const signRays = Array.from({ length: 12 }, (_, i) => ray(map(i * 30), R_SIGN, R_OUT, 'wheel-sign-ray')).join('');
  const signLabels = Array.from({ length: 12 }, (_, i) => {
    const p = polar((R_SIGN + R_OUT) / 2, map(i * 30 + 15));
    return `<text class="wheel-sign" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${SIGN_ABBR[i]}</text>`;
  }).join('');

  let houseRays = '';
  let houseLabels = '';
  if (chart.houses) {
    houseRays = chart.houses.cusps
      .slice(1)
      .map((c) => ray(map(c), R_IN, R_HOUSE, 'wheel-house-ray'))
      .join('');
    houseLabels = chart.houses.cusps
      .slice(1)
      .map((c, i) => {
        const next = chart.houses!.cusps[i === 11 ? 1 : i + 2];
        const mid = degNorm(c + degNorm(next - c) / 2);
        const p = polar((R_IN + R_HOUSE) / 2, map(mid));
        return `<text class="wheel-house" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${i + 1}</text>`;
      })
      .join('');
  }

  const planets = chart.planets
    .map((p, i) => {
      const a = map(p.longitude);
      const r = R_HOUSE - 10 - (i % 3) * 10;
      const pt = polar(r, a);
      const mark = polar(R_OUT + 2, a);
      return (
        `<circle class="wheel-planet" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.2" />` +
        `<text class="wheel-planet-name" x="${mark.x.toFixed(1)}" y="${mark.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${p.name.slice(0, 2)}</text>`
      );
    })
    .join('');

  return `<svg class="chart-wheel" viewBox="0 0 400 400" role="img" aria-label="Natal wheel of the ten planets">
    <circle class="wheel-fill" cx="${CX}" cy="${CY}" r="${R_OUT}" />
    <circle class="wheel-ring" cx="${CX}" cy="${CY}" r="${R_OUT}" />
    <circle class="wheel-ring" cx="${CX}" cy="${CY}" r="${R_SIGN}" />
    <circle class="wheel-ring" cx="${CX}" cy="${CY}" r="${R_HOUSE}" />
    <circle class="wheel-core" cx="${CX}" cy="${CY}" r="${R_IN}" />
    ${signRays}${houseRays}${signLabels}${houseLabels}${planets}
  </svg>`;
}
