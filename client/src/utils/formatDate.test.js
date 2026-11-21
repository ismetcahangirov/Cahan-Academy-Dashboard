// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  toDateInputValue,
  toDateTimeInputValue,
  fromDateTimeInputValue,
} from './formatDate.js';

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

describe('date input helpers', () => {
  it('fills inputs with the local day and time, not the UTC one', () => {
    const justAfterMidnight = new Date(2026, 10, 22, 0, 30);
    expect(toDateInputValue(justAfterMidnight)).toBe('2026-11-22');
    expect(toDateTimeInputValue(justAfterMidnight)).toBe('2026-11-22T00:30');
  });

  it('round-trips a datetime-local value through the ISO instant', () => {
    const iso = fromDateTimeInputValue('2026-12-01T18:00');
    expect(iso).toBe(new Date(2026, 11, 1, 18, 0).toISOString());
    expect(toDateTimeInputValue(iso)).toBe('2026-12-01T18:00');
  });

  it('leaves empty and unparsable values alone', () => {
    expect(fromDateTimeInputValue('')).toBe('');
    expect(fromDateTimeInputValue('nope')).toBe('nope');
    expect(toDateTimeInputValue('')).toBe('');
  });
});
