import { TransformFnParams } from 'class-transformer';
import { isEnum } from 'class-validator';

export const toEnumOrDefault =
  <E extends Record<string, string>>(enumObject: E, defaultValue: E[keyof E]) =>
  ({ value }: TransformFnParams): E[keyof E] =>
    isEnum(value, enumObject) ? (value as E[keyof E]) : defaultValue;
