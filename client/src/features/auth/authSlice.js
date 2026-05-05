import { createSlice } from '@reduxjs/toolkit';

// Persist helper — localStorage-dən oxu
const loadAuthState = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    return { user: user || null, token: token || null, isAuthenticated: !!user && !!token };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
};

const persistedState = loadAuthState();

const initialState = {
  user: persistedState.user,
  token: persistedState.token,
  isAuthenticated: persistedState.isAuthenticated,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, ...userData } = action.payload;
      state.user = userData;
      state.token = token || state.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(userData));
      if (token) localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
