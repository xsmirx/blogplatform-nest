import { TransformFnParams } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { toPositiveIntOrDefault } from './to-positive-int-or-default.js';

const DEFAULT_VALUE = 10;
const MAX = 100;

const transform = (value: unknown, max?: number) =>
  toPositiveIntOrDefault(DEFAULT_VALUE, max)({ value } as TransformFnParams);

describe('toPositiveIntOrDefault', () => {
  describe('valid positive integer strings', () => {
    it.each([
      ['1', 1],
      ['5', 5],
      ['42', 42],
      ['007', 7],
    ])('converts %j to %j', (input, expected) => {
      expect(transform(input, MAX)).toBe(expected);
    });

    it('keeps value equal to max', () => {
      expect(transform('100', MAX)).toBe(100);
    });
  });

  describe('clamping to max', () => {
    it('clamps value greater than max', () => {
      expect(transform('500', MAX)).toBe(MAX);
    });

    it('clamps huge value to Number.MAX_SAFE_INTEGER when max is not passed', () => {
      expect(transform('99999999999999999999')).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('falls back to default', () => {
    it.each([
      ['zero', '0'],
      ['zeros', '000'],
      ['empty string', ''],
      ['whitespace', '   '],
      ['letters', 'abc'],
      ['digits with letters', '12abc'],
      ['negative number', '-3'],
      ['explicit plus sign', '+3'],
      ['float', '2.5'],
      ['exponent', '1e3'],
      ['hex', '0x10'],
    ])('for %s (%j)', (_, input) => {
      expect(transform(input, MAX)).toBe(DEFAULT_VALUE);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['number (not a string)', 5],
      ['array of strings', ['5']],
      ['array with several values', ['1', '2']],
      ['object', { a: '1' }],
    ])('for non-string input: %s', (_, input) => {
      expect(transform(input, MAX)).toBe(DEFAULT_VALUE);
    });
  });
});
