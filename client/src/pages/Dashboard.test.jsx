// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Dashboard from './Dashboard.jsx';
import { lessonsForDay } from './dashboard/agenda.js';

// Mock dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(() => ({
    role: 'admin',
    name: 'Test Admin',
    stats: { students: 100, teachers: 20, courses: 5 }
  })),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'dashboard.greeting') return `Xoş gəldiniz, ${options?.name}`;
      if (key === 'dashboard.activityChart') return 'Aktivlik qrafiki';
      if (key === 'dashboard.hoursValue') return `${options?.value} h`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('../features/dashboard/dashboardApi', () => ({
  useGetStatsQuery: () => ({ data: { data: { users: { total: 100 }, courses: { total: 5 }, groups: { total: 20 }, learningHours: { total: 12.5, trend: 25 } } }, isLoading: false }),
  useGetActivitiesQuery: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock('../features/schedule/scheduleApi', () => ({
  useGetScheduleQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('../features/payments/paymentsApi', () => ({
  useGetMyPaymentsQuery: () => ({ data: { data: [] }, isLoading: false }),
}));

describe('Dashboard Component', () => {
  afterEach(cleanup);

  it('renders dashboard correctly for admin', () => {
    render(<Dashboard />);

    // Greeting uses the first name; the full name is shown next to the role
    expect(screen.getByText('Xoş gəldiniz, Test')).toBeTruthy();
    expect(screen.getByText('Test Admin')).toBeTruthy();
    expect(screen.getByText(/Aktivlik qrafiki/i)).toBeTruthy();
  });

  it('shows learning hours as formatted hours with an hours-based trend label', () => {
    render(<Dashboard />);

    expect(screen.getByText('12.5 h')).toBeTruthy();
    expect(screen.getByText('+25%')).toBeTruthy();
    expect(screen.getByText('dashboard.hoursVsLastMonth')).toBeTruthy();
  });

  it('shows the empty agenda when there are no lessons today', () => {
    render(<Dashboard />);

    expect(screen.getByText('dashboard.today')).toBeTruthy();
    expect(screen.getByText('schedule.noLessons')).toBeTruthy();
  });
});

describe('lessonsForDay', () => {
  // 2026-11-23 is a Monday (dayOfWeek 0 in the schedule model)
  const monday = new Date(2026, 10, 23, 12, 0);

  it('keeps weekly lessons of the weekday and one-off lessons of the date, sorted by start', () => {
    const schedule = [
      { _id: 'a', repetitionType: 'weekly', dayOfWeek: 0, startTime: '14:00' },
      { _id: 'b', repetitionType: 'weekly', dayOfWeek: 1, startTime: '09:00' },
      { _id: 'c', repetitionType: 'once', specificDate: new Date(2026, 10, 23, 0, 0).toISOString(), startTime: '09:30' },
      { _id: 'd', repetitionType: 'once', specificDate: new Date(2026, 10, 30, 0, 0).toISOString(), startTime: '08:00' },
    ];
    expect(lessonsForDay(schedule, monday).map((l) => l._id)).toEqual(['c', 'a']);
  });
});
