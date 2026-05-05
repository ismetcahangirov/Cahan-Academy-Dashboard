// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar.jsx';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to }) => <a href={to}>{typeof children === 'function' ? children({ isActive: false }) : children}</a>,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('react-redux', () => ({
  useSelector: vi.fn((selector) => {
    // Return admin role for default test
    return { role: 'admin', name: 'Test Admin' };
  }),
  useDispatch: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1200,
});

describe('Sidebar Component', () => {
  it('renders correctly with admin role', () => {
    render(<Sidebar isMobileOpen={false} setIsMobileOpen={vi.fn()} />);
    
    // Test that the sidebar logo is rendered
    expect(screen.getByText('Cahan Academy')).toBeTruthy();
    
    // Admin has 13 links (Dashboard + 12 others)
    expect(screen.getByText('Müəllimlər')).toBeTruthy();
    expect(screen.getByText('Tələbələr')).toBeTruthy();
    expect(screen.getByText('Kurslar')).toBeTruthy();
  });
});
