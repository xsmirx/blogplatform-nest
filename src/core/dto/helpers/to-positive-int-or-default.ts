import { TransformFnParams } from 'class-transformer';
import { isNumberString } from 'class-validator';

export const toPositiveIntOrDefault =
  (defaultValue: number, max: number = Number.MAX_SAFE_INTEGER) =>
  ({ value }: TransformFnParams): number => {
    if (!isNumberString(value, { no_symbols: true })) {
      return defaultValue;
    }
    const parsed = Number(value);
    return parsed < 1 ? defaultValue : Math.min(parsed, max);
  };
