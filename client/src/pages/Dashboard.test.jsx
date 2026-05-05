// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../features/dashboard/dashboardApi', () => ({
  useGetStatsQuery: () => ({ data: { data: { users: { total: 100 }, courses: { total: 5 }, groups: { total: 20 }, learningHours: { total: 50 } } }, isLoading: false }),
  useGetActivitiesQuery: () => ({ data: { data: [] }, isLoading: false }),
}));

describe('Dashboard Component', () => {
  it('renders dashboard correctly for admin', () => {
    render(<Dashboard />);
    
    // Test that the welcome text is rendered
    expect(screen.getByText(/Xoş gəldiniz/i)).toBeTruthy();
    expect(screen.getByText(/Test Admin/i)).toBeTruthy();
  });
});
