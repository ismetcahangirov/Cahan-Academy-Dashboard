import { createSlice } from '@reduxjs/toolkit';

// Persist helper — localStorage-dən oxu
const loadAuthState = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    return {
      user: user || null,
      token: token || null,
      refreshToken: refreshToken || null,
      isAuthenticated: !!user && !!token,
    };
  } catch {
    return { user: null, token: null, refreshToken: null, isAuthenticated: false };
  }
};

const persistedState = loadAuthState();

const initialState = {
  user: persistedState.user,
  token: persistedState.token,
  refreshToken: persistedState.refreshToken,
  isAuthenticated: persistedState.isAuthenticated,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, refreshToken, user, ...userData } = action.payload;
      const normalizedUser = user || userData;
      state.user = normalizedUser;
      state.token = token || state.token;
      state.refreshToken = refreshToken || state.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setCredentials, logout, setError, clearError } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectRefreshToken = (state) => state.auth.refreshToken;
