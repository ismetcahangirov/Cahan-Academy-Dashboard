import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../models/userModel.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  it('should hash the password before saving', async () => {
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    await user.save();

    expect(user.password).not.toBe('password123');
    const isMatch = await bcrypt.compare('password123', user.password);
    expect(isMatch).toBe(true);
  });

  it('should match user entered password', async () => {
    const user = new User({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'password123',
    });

    await user.save();

    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);

    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isNotMatch).toBe(false);
  });

  it('accepts long TLDs and plus aliases but rejects malformed emails', () => {
    for (const email of ['teacher@cahan.academy', 'a.b@mail.info', 'ali+test@gmail.com', 'x@sub.domain.az']) {
      const err = new User({ name: 'E', email, password: 'password123' }).validateSync();
      expect(err?.errors?.email, email).toBeUndefined();
    }
    for (const email of ['no-at-sign.com', 'a@b', 'a@b.c', 'a@@b.com', 'a b@c.com']) {
      const err = new User({ name: 'E', email, password: 'password123' }).validateSync();
      expect(err?.errors?.email, email).toBeDefined();
    }
  });
});
