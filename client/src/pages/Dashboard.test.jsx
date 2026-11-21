// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Dashboard from './Dashboard.jsx';

// Mock dependencies
vi.mock('react-redux', () => ({
  useSelector: vi.fn(() => ({ 
    role: 'admin', 
    name: 'Test Admin',
    stats: { students: 100, teachers: 20, courses: 5 } 
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'dashboard.welcome') return `Xoş gəldiniz, ${options?.name}!`;
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

describe('Dashboard Component', () => {
  afterEach(cleanup);

  it('renders dashboard correctly for admin', () => {
    render(<Dashboard />);
    
    // Test that the welcome text is rendered
    expect(screen.getByText(/Xoş gəldiniz/i)).toBeTruthy();
    expect(screen.getByText(/Test Admin/i)).toBeTruthy();
    expect(screen.getByText(/Aktivlik qrafiki/i)).toBeTruthy();
  });

  it('shows learning hours as formatted hours with an hours-based trend label', () => {
    render(<Dashboard />);

    expect(screen.getByText('12.5 h')).toBeTruthy();
    expect(screen.getByText('dashboard.hoursVsLastMonth')).toBeTruthy();
  });
});
