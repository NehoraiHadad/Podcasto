/**
 * Tests for server-side date utilities
 * Run with: npm test src/lib/utils/date/__tests__/server.test.ts
 */

import {
  nowUTC,
  toISOUTC,
  parseISOUTC,
  startOfDayInTimezone,
  endOfDayInTimezone,
  createDateRangeUTC,
  daysBetween,
} from '../server';

describe('Server Date Utilities', () => {
  describe('nowUTC', () => {
    it('should return current UTC date', () => {
      const now = nowUTC();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('toISOUTC', () => {
    it('should convert date to ISO UTC string', () => {
      const date = new Date('2024-01-15T14:30:00.000Z');
      const iso = toISOUTC(date);
      expect(iso).toBe('2024-01-15T14:30:00.000Z');
    });

    it('should handle string input', () => {
      const iso = toISOUTC('2024-01-15T14:30:00.000Z');
      expect(iso).toBe('2024-01-15T14:30:00.000Z');
    });
  });

  describe('parseISOUTC', () => {
    it('should parse ISO string to date', () => {
      const iso = '2024-01-15T14:30:00.000Z';
      const date = parseISOUTC(iso);
      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe(iso);
    });
  });

  describe('startOfDayInTimezone', () => {
    it('should convert start of day in Israel to UTC', () => {
      // Jan 15, 2024 in Israel
      const date = new Date('2024-01-15');
      const startUTC = startOfDayInTimezone(date, 'Asia/Jerusalem');

      // 00:00 in Israel (UTC+2 in winter) = 22:00 previous day UTC
      expect(startUTC.getUTCHours()).toBe(22);
      expect(startUTC.getUTCDate()).toBe(14);
    });

    it('should handle UTC timezone', () => {
      const date = new Date('2024-01-15');
      const startUTC = startOfDayInTimezone(date, 'UTC');

      expect(startUTC.getUTCHours()).toBe(0);
      expect(startUTC.getUTCDate()).toBe(15);
    });
  });

  describe('endOfDayInTimezone', () => {
    it('should convert end of day in Israel to UTC', () => {
      // Jan 15, 2024 in Israel
      const date = new Date('2024-01-15');
      const endUTC = endOfDayInTimezone(date, 'Asia/Jerusalem');

      // 23:59:59 in Israel (UTC+2 in winter) = 21:59:59 same day UTC
      expect(endUTC.getUTCHours()).toBe(21);
      expect(endUTC.getUTCDate()).toBe(15);
    });
  });

  describe('createDateRangeUTC', () => {
    it('should create correct UTC range for Israeli timezone', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-20');

      const { startUTC, endUTC } = createDateRangeUTC(start, end, 'Asia/Jerusalem');

      // Start: 2024-01-15 00:00 Israel = 2024-01-14 22:00 UTC
      expect(startUTC.getUTCDate()).toBe(14);
      expect(startUTC.getUTCHours()).toBe(22);

      // End: 2024-01-20 23:59:59 Israel = 2024-01-20 21:59:59 UTC
      expect(endUTC.getUTCDate()).toBe(20);
      expect(endUTC.getUTCHours()).toBe(21);
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-10');

      expect(daysBetween(start, end)).toBe(9);
    });

    it('should handle negative days', () => {
      const start = new Date('2024-01-10');
      const end = new Date('2024-01-01');

      expect(daysBetween(start, end)).toBe(-9);
    });
  });
});
