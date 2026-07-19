// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getAcademyNow, joinWindowState } from './academyTime.js';

describe('academyTime (client)', () => {
  it('getAcademyNow maps to Asia/Baku (Monday=0)', () => {
    const p = getAcademyNow(new Date('2026-07-19T20:00:00Z')); // Baku 2026-07-20 00:00
    expect(p.dateStr).toBe('2026-07-20');
    expect(p.hour).toBe(0);
    expect(p.dayOfWeek).toBe(0);
  });

  const weekly = { type: 'online', repetitionType: 'weekly', dayOfWeek: 0, startTime: '10:00', endTime: '12:00' };

  it('shows join from 10 minutes before start until end', () => {
    // Baku Monday 09:55 -> inside (start-10 = 09:50)
    expect(joinWindowState(weekly, new Date('2026-07-20T05:55:00Z')).show).toBe(true);
    // Baku 09:40 -> before window
    expect(joinWindowState(weekly, new Date('2026-07-20T05:40:00Z')).show).toBe(false);
    // Baku 12:30 -> after window
    expect(joinWindowState(weekly, new Date('2026-07-20T08:30:00Z')).show).toBe(false);
  });

  it('returns the occurrence date when shown', () => {
    const s = joinWindowState(weekly, new Date('2026-07-20T06:00:00Z'));
    expect(s.show).toBe(true);
    expect(s.occurrenceDate).toBe('2026-07-20');
  });

  it('hides for offline classes', () => {
    const offline = { ...weekly, type: 'offline' };
    expect(joinWindowState(offline, new Date('2026-07-20T06:00:00Z')).show).toBe(false);
  });

  it('hides when the weekday does not match', () => {
    // 2026-07-21 is Tuesday (dayOfWeek 1) but entry is Monday (0)
    expect(joinWindowState(weekly, new Date('2026-07-21T06:00:00Z')).show).toBe(false);
  });
});
