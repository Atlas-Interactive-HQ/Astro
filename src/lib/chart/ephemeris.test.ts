import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { calculateChart } from './ephemeris';
import { swe_calc_ut, swe_julday, swe_sidtime } from '../../../scripts/load-swe-node.mjs';
import type { SweApi } from './ephemeris';

const swe: SweApi = { swe_julday, swe_calc_ut, swe_sidtime };
const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/j2000-noon-ut.json'), 'utf8'),
);

test('J2000 noon UT Sun matches the SE-generated golden file', async () => {
  const chart = await calculateChart(
    {
      date: '2000-01-01',
      time: '12:00',
      timeUnknown: false,
      placeLabel: 'Greenwich',
      lat: 51.477,
      lon: 0,
    },
    swe,
  );
  assert.equal(chart.julianDay, fixture.julianDay);
  const sun = chart.planets.find((p) => p.name === 'Sun');
  assert.ok(sun);
  assert.ok(Math.abs(sun.longitude - fixture.planets.Sun.longitude) < 1e-8);
  assert.match(chart.methodLine, /Swiss Ephemeris 2\.10\.03/);
  assert.match(chart.methodLine, /calculated in browser/);
  assert.equal(chart.planets.length, 10);
});

test('unknown time omits houses and states local noon', async () => {
  const chart = await calculateChart(
    {
      date: '2000-01-01',
      time: '',
      timeUnknown: true,
      placeLabel: 'Greenwich',
      lat: 51.477,
      lon: 0,
    },
    swe,
  );
  assert.equal(chart.houses, null);
  assert.equal(chart.timeUnknown, true);
  assert.match(chart.methodLine, /no houses/);
  assert.match(chart.methodLine, /local noon/);
});
