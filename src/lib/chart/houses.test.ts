import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ascendant, lonFromRamc, placidusHouses } from './houses';
import { degNorm } from './format';

test('MC at RAMC 0° and zero obliquity is 0° Aries', () => {
  assert.equal(lonFromRamc(0, 0), 0);
});

test('ASC at the equator with RAMC 0° and eps 23.44° is near 90°', () => {
  const asc = ascendant(0, 0, 23.4377);
  assert.ok(Math.abs(degNorm(asc - 90) ) < 2 || Math.abs(degNorm(asc - 270)) < 2);
});

test('Placidus at Greenwich noon returns twelve cusps and ASC/MC', () => {
  const houses = placidusHouses(18.697138162535065, 51.477, 0, 23.43767671605485);
  assert.ok(houses);
  assert.equal(houses.cusps.length, 13);
  for (let h = 1; h <= 12; h++) {
    assert.equal(typeof houses.cusps[h], 'number');
    assert.ok(houses.cusps[h] >= 0 && houses.cusps[h] < 360);
  }
  assert.equal(houses.mc, houses.cusps[10]);
  assert.equal(houses.ascendant, houses.cusps[1]);
  assert.ok(Math.abs(degNorm(houses.cusps[7] - houses.cusps[1] - 180)) < 1e-6);
});
