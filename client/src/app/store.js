import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import authReducer, { logout } from '../features/auth/authSlice';
import { setupListeners } from '@reduxjs/toolkit/query';

// Cached API data belongs to the user who fetched it: drop it on logout so the next
// login in the same tab never sees the previous user's exams, counts or lists.
const sessionListener = createListenerMiddleware();
sessionListener.startListening({
  actionCreator: logout,
  effect: (_action, api) => {
    api.dispatch(apiSlice.util.resetApiState());
  },
});

export const makeStore = () =>
  configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(sessionListener.middleware).concat(apiSlice.middleware),
  });

export const store = makeStore();

setupListeners(store.dispatch);
