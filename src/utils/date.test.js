import { describe, it, expect } from 'vitest';
import { 
  parseApiDate, 
  formatDisplayDate, 
  formatDisplayTime, 
  formatDisplayDateTime,
  formatHours 
} from './date';

describe('Date Utilities', () => {
  const apiDate = '2026-05-07 16:23:43'; // UTC-like format from Odoo

  describe('parseApiDate', () => {
    it('should parse Odoo date string correctly as UTC', () => {
      const date = parseApiDate(apiDate);
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe('2026-05-07T16:23:43.000Z');
    });

    it('should handle already ISO strings', () => {
      const date = parseApiDate('2026-05-07T16:23:43Z');
      expect(date.toISOString()).toBe('2026-05-07T16:23:43.000Z');
    });

    it('should return null for invalid dates', () => {
      expect(parseApiDate('')).toBeNull();
      expect(parseApiDate('invalid-date')).toBeNull();
    });
  });

  describe('formatDisplayDate', () => {
    it('should format date correctly', () => {
      const formatted = formatDisplayDate(apiDate);
      expect(formatted).toContain('May 7, 2026');
    });
  });

  describe('formatDisplayTime', () => {
    it('should format time correctly', () => {
      const formatted = formatDisplayTime(apiDate);
      // We check for minutes and AM/PM since hours depend on runner timezone
      expect(formatted).toMatch(/23\s*(AM|PM)/i);
    });
  });

  describe('formatHours', () => {
    it('should format integers without decimals', () => {
      expect(formatHours(8)).toBe('8');
    });

    it('should format floats with one decimal', () => {
      expect(formatHours(8.5)).toBe('8.5');
      expect(formatHours(8.3333)).toBe('8.3');
    });

    it('should handle zero and null', () => {
      expect(formatHours(0)).toBe('0');
      expect(formatHours(null)).toBe('0');
    });
  });
});
