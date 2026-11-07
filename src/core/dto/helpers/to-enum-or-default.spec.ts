import { TransformFnParams } from 'class-transformer';
import { describe, expect, it } from 'vitest';
import { toEnumOrDefault } from './to-enum-or-default.js';

enum TestSort {
  CreatedAt = 'createdAt',
  Login = 'login',
  Email = 'email',
}

const DEFAULT_VALUE = TestSort.CreatedAt;

const transform = (value: unknown) =>
  toEnumOrDefault(TestSort, DEFAULT_VALUE)({ value } as TransformFnParams);

describe('toEnumOrDefault', () => {
  it.each(Object.values(TestSort))('keeps valid enum value %j', (input) => {
    expect(transform(input)).toBe(input);
  });

  describe('falls back to default', () => {
    it.each([
      ['unknown value', 'password'],
      ['enum key instead of value', 'Login'],
      ['different case', 'LOGIN'],
      ['empty string', ''],
      ['undefined', undefined],
      ['null', null],
      ['number', 1],
      ['array with valid value', ['login']],
      ['object', { login: 'login' }],
    ])('for %s', (_, input) => {
      expect(transform(input)).toBe(DEFAULT_VALUE);
    });
  });
});
