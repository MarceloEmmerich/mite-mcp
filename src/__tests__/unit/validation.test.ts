import { describe, expect, it } from 'vitest';
import {
  optionalBoolean,
  optionalNumber,
  requiredBoolean,
  requiredNumber,
} from '../../utils/validation.js';

describe('Validation Utils', () => {
  describe('optionalNumber', () => {
    it('should accept numbers', () => {
      expect(optionalNumber.parse(123)).toBe(123);
      expect(optionalNumber.parse(0)).toBe(0);
      expect(optionalNumber.parse(-45.67)).toBe(-45.67);
    });

    it('should convert valid string numbers', () => {
      expect(optionalNumber.parse('123')).toBe(123);
      expect(optionalNumber.parse('0')).toBe(0);
      expect(optionalNumber.parse('-45.67')).toBe(-45.67);
    });

    it('should return undefined for empty string', () => {
      expect(optionalNumber.parse('')).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(optionalNumber.parse(undefined)).toBeUndefined();
    });

    it('should throw for invalid string numbers', () => {
      expect(() => optionalNumber.parse('not-a-number')).toThrow('Invalid number: "not-a-number"');
      expect(() => optionalNumber.parse('123abc')).toThrow();
    });
  });

  describe('requiredNumber', () => {
    it('should accept numbers', () => {
      expect(requiredNumber.parse(123)).toBe(123);
      expect(requiredNumber.parse(0)).toBe(0);
      expect(requiredNumber.parse(-45.67)).toBe(-45.67);
    });

    it('should convert valid string numbers', () => {
      expect(requiredNumber.parse('123')).toBe(123);
      expect(requiredNumber.parse('0')).toBe(0);
      expect(requiredNumber.parse('-45.67')).toBe(-45.67);
    });

    it('should throw for invalid string numbers', () => {
      expect(() => requiredNumber.parse('not-a-number')).toThrow('Invalid number: "not-a-number"');
    });

    it('should convert empty string to 0', () => {
      expect(requiredNumber.parse('')).toBe(0);
    });
  });

  describe('optionalBoolean', () => {
    it('should accept booleans', () => {
      expect(optionalBoolean.parse(true)).toBe(true);
      expect(optionalBoolean.parse(false)).toBe(false);
    });

    it('should convert string "true" and "1" to true', () => {
      expect(optionalBoolean.parse('true')).toBe(true);
      expect(optionalBoolean.parse('1')).toBe(true);
    });

    it('should convert string "false" and "0" to false', () => {
      expect(optionalBoolean.parse('false')).toBe(false);
      expect(optionalBoolean.parse('0')).toBe(false);
    });

    it('should return undefined for empty string', () => {
      expect(optionalBoolean.parse('')).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(optionalBoolean.parse(undefined)).toBeUndefined();
    });

    it('should throw for invalid string booleans', () => {
      expect(() => optionalBoolean.parse('yes')).toThrow('Invalid boolean: "yes"');
      expect(() => optionalBoolean.parse('no')).toThrow('Invalid boolean: "no"');
      expect(() => optionalBoolean.parse('maybe')).toThrow();
    });
  });

  describe('requiredBoolean', () => {
    it('should accept booleans', () => {
      expect(requiredBoolean.parse(true)).toBe(true);
      expect(requiredBoolean.parse(false)).toBe(false);
    });

    it('should convert string "true" and "1" to true', () => {
      expect(requiredBoolean.parse('true')).toBe(true);
      expect(requiredBoolean.parse('1')).toBe(true);
    });

    it('should convert string "false" and "0" to false', () => {
      expect(requiredBoolean.parse('false')).toBe(false);
      expect(requiredBoolean.parse('0')).toBe(false);
    });

    it('should throw for invalid string booleans', () => {
      expect(() => requiredBoolean.parse('yes')).toThrow('Invalid boolean: "yes"');
      expect(() => requiredBoolean.parse('no')).toThrow('Invalid boolean: "no"');
      expect(() => requiredBoolean.parse('')).toThrow();
    });
  });
});
