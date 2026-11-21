// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Sidebar from './Sidebar.jsx';
import { ThemeProvider } from '../../context/ThemeContext.jsx';
import az from '../../i18n/locales/az.json';

let currentUser = { role: 'admin', name: 'Test Admin' };

// Mock dependencies
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to }) => <a href={to}>{typeof children === 'function' ? children({ isActive: false }) : children}</a>,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn(() => currentUser),
  useDispatch: () => vi.fn(),
}));

// Render the real Azerbaijani strings
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key.split('.').reduce((o, k) => o?.[k], az) ?? key }),
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200,
});

const renderAs = (role) => {
  currentUser = { role, name: `Test ${role}` };
  render(
    <ThemeProvider>
      <Sidebar isMobileOpen={false} setIsMobileOpen={vi.fn()} />
    </ThemeProvider>
  );
  return screen.getAllByRole('link').map((a) => a.getAttribute('href'));
};

describe('Sidebar Component', () => {
  afterEach(cleanup);

  it('renders correctly with admin role', () => {
    const paths = renderAs('admin');

    // Test that the sidebar logo is rendered
    expect(screen.getByText('Cahan Academy')).toBeTruthy();

    expect(screen.getByText('Müəllimlər')).toBeTruthy();
    expect(screen.getByText('Tələbələr')).toBeTruthy();
    expect(screen.getByText('Kurslar')).toBeTruthy();
    expect(paths).toEqual(expect.arrayContaining(['/users', '/invitations', '/groups', '/attendance']));
  });

  it('gives teachers their daily pages and nothing admin only', () => {
    const paths = renderAs('teacher');

    expect(paths).toEqual(expect.arrayContaining(['/students', '/groups', '/attendance', '/homeworks', '/schedule']));
    expect(paths).not.toEqual(expect.arrayContaining(['/teachers']));
    expect(paths).not.toContain('/users');
    expect(paths).not.toContain('/invitations');
  });

  it('hides staff pages from students', () => {
    const paths = renderAs('student');

    expect(paths).toEqual(expect.arrayContaining(['/groups', '/courses', '/homeworks', '/exams']));
    for (const p of ['/students', '/teachers', '/attendance', '/users', '/invitations']) {
      expect(paths).not.toContain(p);
    }
  });
});
