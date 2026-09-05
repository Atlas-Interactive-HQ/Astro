import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { calculateChart, tropicalLongitude } from './engine';
import { Body } from 'astronomy-engine';

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/j2000-noon-ut.json'), 'utf8'),
) as {
  julianDay: number;
  planets: Record<string, { longitude: number }>;
};

const draft = {
  date: '2000-01-01',
  time: '12:00',
  timeUnknown: false,
  placeLabel: 'Greenwich',
  lat: 51.477,
  lon: 0,
};

test('J2000 noon UT Sun matches the astronomy-engine golden file', () => {
  const sun = tropicalLongitude(Body.Sun, new Date('2000-01-01T12:00:00Z'));
  assert.ok(Math.abs(sun - fixture.planets.Sun.longitude) < 1e-10);
});

test('J2000 noon UT chart matches golden longitudes and names the engine', () => {
  const chart = calculateChart(draft);
  assert.ok(Math.abs(chart.julianDay - fixture.julianDay) < 1e-8);
  assert.equal(chart.planets.length, 10);
  for (const row of chart.planets) {
    assert.ok(Math.abs(row.longitude - fixture.planets[row.name].longitude) < 1e-8);
  }
  assert.match(chart.methodLine, /astronomy-engine 2\.1\.19/);
  assert.match(chart.methodLine, /tropical/);
  assert.match(chart.methodLine, /Placidus/);
  assert.match(chart.methodLine, /calculated in browser/);
});

test('unknown time omits houses and states local noon', () => {
  const chart = calculateChart({ ...draft, time: '', timeUnknown: true });
  assert.equal(chart.houses, null);
  assert.equal(chart.timeUnknown, true);
  assert.match(chart.methodLine, /no houses/);
  assert.match(chart.methodLine, /local noon/);
});
