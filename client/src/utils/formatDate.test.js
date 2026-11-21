// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate.js';

describe('formatDate', () => {
  const date = new Date(2026, 10, 13);

  it('uses real month names for every language', () => {
    expect(formatDate(date, 'd MMMM yyyy', 'az')).toBe('13 Noyabr 2026');
    expect(formatDate(date, 'd MMMM yyyy', 'en')).toBe('13 November 2026');
    expect(formatDate(date, 'd MMMM yyyy', 'ru')).toBe('13 ноября 2026');
  });

  it('accepts region codes and falls back to az', () => {
    expect(formatDate(date, 'd MMMM yyyy', 'en-US')).toBe('13 November 2026');
    expect(formatDate(date, 'd MMMM yyyy', 'xx')).toBe('13 Noyabr 2026');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('not a date')).toBe('');
  });
});
