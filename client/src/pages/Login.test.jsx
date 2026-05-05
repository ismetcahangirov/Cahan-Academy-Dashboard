// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from './Login.jsx';

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../features/auth/authApi', () => ({
  useLoginMutation: () => [vi.fn(), { isLoading: false }],
}));

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(<Login />);
    
    // Test that the email and password fields are rendered
    expect(screen.getByPlaceholderText('nümunə@cahan.az')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    
    // Check if submit button is present
    expect(screen.getByRole('button', { name: /Giriş Et/i })).toBeTruthy();
  });
});
