import { describe, it, expect, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { isJitsiJwtEnabled, generateJitsiToken } from '../../utils/jitsiToken.js';

describe('jitsiToken', () => {
  const OLD = { ...process.env };
  afterEach(() => {
    process.env = { ...OLD };
  });

  it('is disabled when env vars are not set', () => {
    delete process.env.JITSI_JWT_APP_ID;
    delete process.env.JITSI_JWT_SECRET;
    expect(isJitsiJwtEnabled()).toBe(false);
    expect(
      generateJitsiToken({ roomName: 'r', user: { _id: '1', name: 'A' }, moderator: true })
    ).toBeNull();
  });

  it('generates a signed moderator token when enabled', () => {
    process.env.JITSI_JWT_APP_ID = 'myapp';
    process.env.JITSI_JWT_SECRET = 'shhh';
    process.env.JITSI_DOMAIN = 'meet.example.com';
    expect(isJitsiJwtEnabled()).toBe(true);

    const token = generateJitsiToken({
      roomName: 'room1',
      user: { _id: 'u1', name: 'Teacher', email: 't@x.com' },
      moderator: true,
    });
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, 'shhh');
    expect(decoded.aud).toBe('myapp');
    expect(decoded.iss).toBe('myapp');
    expect(decoded.room).toBe('room1');
    expect(decoded.context.user.name).toBe('Teacher');
    expect(decoded.context.user.moderator).toBe(true);
    expect(decoded.moderator).toBe(true);
  });

  it('sets moderator=false for students', () => {
    process.env.JITSI_JWT_APP_ID = 'myapp';
    process.env.JITSI_JWT_SECRET = 'shhh';
    const token = generateJitsiToken({
      roomName: 'room1',
      user: { _id: 'u2', name: 'Student' },
      moderator: false,
    });
    const decoded = jwt.verify(token, 'shhh');
    expect(decoded.context.user.moderator).toBe(false);
    expect(decoded.moderator).toBe(false);
  });
});
