import { z } from 'zod';

/**
 * Schema for optional numbers that handles string conversion and empty values
 */
export const optionalNumber = z
  .union([
    z.number(),
    z.string().transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      if (Number.isNaN(num)) throw new Error(`Invalid number: "${val}"`);
      return num;
    }),
  ])
  .optional();

/**
 * Schema for required numbers that handles string conversion
 */
export const requiredNumber = z.union([
  z.number(),
  z.string().transform(val => {
    const num = Number(val);
    if (Number.isNaN(num)) throw new Error(`Invalid number: "${val}"`);
    return num;
  }),
]);

/**
 * Schema for optional booleans that handles string conversion and empty values
 */
export const optionalBoolean = z
  .union([
    z.boolean(),
    z.string().transform(val => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (val === 'true' || val === '1') return true;
      if (val === 'false' || val === '0') return false;
      throw new Error(`Invalid boolean: "${val}"`);
    }),
  ])
  .optional();

/**
 * Schema for required booleans that handles string conversion
 */
export const requiredBoolean = z.union([
  z.boolean(),
  z.string().transform(val => {
    if (val === 'true' || val === '1') return true;
    if (val === 'false' || val === '0') return false;
    throw new Error(`Invalid boolean: "${val}"`);
  }),
]);
