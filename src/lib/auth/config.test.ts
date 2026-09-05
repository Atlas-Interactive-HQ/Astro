import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStudioEmail } from './config';

test('accepts atlas-interactive.com mail, any case', () => {
  assert.equal(isStudioEmail('kaje@atlas-interactive.com'), true);
  assert.equal(isStudioEmail('Kaje@Atlas-Interactive.COM'), true);
});

test('refuses every other domain', () => {
  assert.equal(isStudioEmail('kaje@gmail.com'), false);
  assert.equal(isStudioEmail('kaje@atlas-interactive.com.evil.test'), false);
  assert.equal(isStudioEmail('not-an-email'), false);
  assert.equal(isStudioEmail('atlas-interactive.com'), false);
});
