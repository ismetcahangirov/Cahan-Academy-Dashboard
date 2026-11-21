import { describe, it, expect } from 'vitest';
import { normalizeDay, toDayName, formatDays } from './days.js';

const t = (key) => `t:${key}`;

describe('days utils', () => {
  it('maps every stored spelling to Monday=0 .. Sunday=6', () => {
    expect(normalizeDay('Monday')).toBe(0);
    expect(normalizeDay('Bazar ertəsi')).toBe(0);
    expect(normalizeDay('Понедельник')).toBe(0);
    expect(normalizeDay('B.ertəsi')).toBe(0);
    expect(normalizeDay('Çərşənbə axşamı')).toBe(1);
    expect(normalizeDay('Çərşənbə')).toBe(2);
    expect(normalizeDay('FRIDAY')).toBe(4);
    expect(normalizeDay('Bazar')).toBe(6);
    expect(normalizeDay('Sunday')).toBe(6);
    expect(normalizeDay('3')).toBe(3);
    expect(normalizeDay(6)).toBe(6);
    expect(normalizeDay('7')).toBe(-1);
    expect(normalizeDay('someday')).toBe(-1);
  });

  it('converts to the canonical English name', () => {
    expect(toDayName('Cümə axşamı')).toBe('Thursday');
    expect(toDayName('nope')).toBeNull();
  });

  it('formats days in week order, translated, without duplicates', () => {
    expect(formatDays(['Sunday', 'Bazar ertəsi', 'Monday'], t)).toBe('t:schedule.days.monday, t:schedule.days.sunday');
    expect(formatDays(['Holiday'], t)).toBe('Holiday');
    expect(formatDays(undefined, t)).toBe('');
  });
});
