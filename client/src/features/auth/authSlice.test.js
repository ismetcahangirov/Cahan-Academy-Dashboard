// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { logout } from './authSlice.js';

describe('authSlice reducer', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  });

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: { id: 1, name: 'Test User' },
      token: 'fake-token',
      refreshToken: 'fake-refresh-token',
      isAuthenticated: true,
    };
    
    // Simüle edirik ki localStorage funksiyaları mock-lanıb və ya vitest jsdom environmentindədir
    const actual = authReducer(loggedInState, logout());
    
    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.refreshToken).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
