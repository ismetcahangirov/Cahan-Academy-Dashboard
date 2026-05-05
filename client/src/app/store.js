import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../features/auth/authApi';
import authReducer from '../features/auth/authSlice';
import { dashboardApi } from '../features/dashboard/dashboardApi';
import { userApi } from '../features/users/userApi';
import { teachersApi } from '../features/teachers/teachersApi';
import { studentsApi } from '../features/students/studentsApi';
import { invitationsApi } from '../features/invitations/invitationsApi';
import { groupsApi } from '../features/groups/groupsApi';
import { coursesApi } from '../features/courses/coursesApi';
import { attendanceApi } from '../features/attendance/attendanceApi';
import { homeworksApi } from '../features/homeworks/homeworksApi';
import { classworksApi } from '../features/classworks/classworksApi';
import { profileApi } from '../features/profile/profileApi';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [teachersApi.reducerPath]: teachersApi.reducer,
    [studentsApi.reducerPath]: studentsApi.reducer,
    [invitationsApi.reducerPath]: invitationsApi.reducer,
    [groupsApi.reducerPath]: groupsApi.reducer,
    [coursesApi.reducerPath]: coursesApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [homeworksApi.reducerPath]: homeworksApi.reducer,
    [classworksApi.reducerPath]: classworksApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      dashboardApi.middleware, 
      userApi.middleware,
      teachersApi.middleware,
      studentsApi.middleware,
      invitationsApi.middleware,
      groupsApi.middleware,
      coursesApi.middleware,
      attendanceApi.middleware,
      homeworksApi.middleware,
      classworksApi.middleware,
      profileApi.middleware
    ),
});

setupListeners(store.dispatch);
