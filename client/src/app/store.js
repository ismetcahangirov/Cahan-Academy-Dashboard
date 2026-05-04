import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import authReducer from '../features/auth/authSlice';
import { dashboardApi } from '../features/dashboard/dashboardApi';
import { userApi } from '../features/users/userApi';
import { teachersApi } from '../features/teachers/teachersApi';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [teachersApi.reducerPath]: teachersApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      dashboardApi.middleware, 
      userApi.middleware,
      teachersApi.middleware
    ),
});

setupListeners(store.dispatch);
