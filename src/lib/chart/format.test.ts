import assert from 'node:assert/strict';
import { test } from 'node:test';
import { houseOf, toDms } from './format';

test('toDms splits 0° as 0° Aries', () => {
  const d = toDms(0);
  assert.equal(d.sign, 'Aries');
  assert.equal(d.deg, 0);
  assert.equal(d.min, 0);
});

test('toDms splits 280.3689° as Capricorn', () => {
  const d = toDms(280.36891967534336);
  assert.equal(d.sign, 'Capricorn');
  assert.equal(d.deg, 10);
  assert.ok(d.min >= 22 && d.min <= 23);
});

test('houseOf finds the cusp interval wrapping 0°', () => {
  const cusps = [0, 350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320];
  assert.equal(houseOf(355, cusps), 1);
  assert.equal(houseOf(10, cusps), 1);
  assert.equal(houseOf(25, cusps), 2);
});
