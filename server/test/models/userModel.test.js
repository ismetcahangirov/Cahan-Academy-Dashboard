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
});
