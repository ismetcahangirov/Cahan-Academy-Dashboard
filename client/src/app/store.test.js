// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { makeStore } from './store';
import { logout } from '../features/auth/authSlice';
import { notificationsApi } from '../features/notifications/notificationsApi';

describe('store', () => {
  it('drops cached API data on logout', async () => {
    const store = makeStore();
    await store.dispatch(notificationsApi.util.upsertQueryData('getUnreadCount', undefined, { count: 7 }));
    expect(Object.keys(store.getState().api.queries)).toHaveLength(1);

    store.dispatch(logout());

    expect(store.getState().api.queries).toEqual({});
  });
});
