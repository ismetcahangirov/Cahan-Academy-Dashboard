import { describe, it, expect } from 'vitest';
import { getAcademyNow, dayOfWeekForDateStr, academyDateStr, toMinutes } from '../../utils/academyTime.js';

describe('academyTime (server)', () => {
  it('dayOfWeekForDateStr: Monday=0, Sunday=6', () => {
    expect(dayOfWeekForDateStr('2026-07-20')).toBe(0); // Monday
    expect(dayOfWeekForDateStr('2026-07-19')).toBe(6); // Sunday
    expect(dayOfWeekForDateStr('2026-07-21')).toBe(1); // Tuesday
  });

  it('toMinutes converts HH:mm to minutes', () => {
    expect(toMinutes('10:30')).toBe(630);
    expect(toMinutes('00:00')).toBe(0);
  });

  it('getAcademyNow returns Asia/Baku local parts (UTC+4)', () => {
    // 2026-07-19T20:00Z → Baku 2026-07-20 00:00 (Monday)
    const p = getAcademyNow(new Date('2026-07-19T20:00:00Z'));
    expect(p.dateStr).toBe('2026-07-20');
    expect(p.hour).toBe(0);
    expect(p.minute).toBe(0);
    expect(p.dayOfWeek).toBe(0);
  });

  it('academyDateStr formats a Date in Asia/Baku', () => {
    expect(academyDateStr(new Date('2026-07-19T20:00:00Z'))).toBe('2026-07-20');
  });
});
