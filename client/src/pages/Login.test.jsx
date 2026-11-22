// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from './Login.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '' }),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: vi.fn(() => false),
}));

// Render the real Azerbaijani strings the assertions below look for
vi.mock('react-i18next', async () => {
  const az = (await import('../i18n/locales/az.json')).default;
  return {
    useTranslation: () => ({
      t: (key) => key.split('.').reduce((o, k) => o?.[k], az) ?? key,
      i18n: { language: 'az', changeLanguage: vi.fn() },
    }),
  };
});

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div data-testid="google-login" />,
}));

vi.mock('../features/auth/authApi', () => ({
  useLoginMutation: () => [vi.fn(), { isLoading: false }],
  useGoogleLoginMutation: () => [vi.fn(), { isLoading: false }],
}));

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(<ThemeProvider><Login /></ThemeProvider>);
    
    // Test that the email and password fields are rendered
    expect(screen.getByPlaceholderText('nümunə@cahan.az')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    
    // Check if submit button is present
    expect(screen.getByRole('button', { name: /Giriş Et/i })).toBeTruthy();
  });
});
