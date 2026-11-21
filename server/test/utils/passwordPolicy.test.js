import { describe, it, expect } from 'vitest';
import { isValidPassword } from '../../utils/passwordPolicy.js';

describe('isValidPassword', () => {
  it.each([
    'abc123',
    'Password1',
    'my-pass_1.',
    'a1~`^(){}[]<>|\\/"\':;,+=-_.',
    'şifrə12',
    'ab@$!%*#?&1',
  ])('accepts %s', (password) => {
    expect(isValidPassword(password)).toBe(true);
  });

  it.each([
    ['too short', 'ab12'],
    ['no digit', 'abcdef-'],
    ['no letter', '123456-'],
    ['contains a space', 'abc 123'],
    ['contains a tab', 'abc\t123'],
    ['contains a newline', 'abc123\n'],
    ['contains a control character', 'abc123\u0007'],
    ['empty', ''],
  ])('rejects a password that is %s', (_, password) => {
    expect(isValidPassword(password)).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidPassword(undefined)).toBe(false);
    expect(isValidPassword(123456)).toBe(false);
    expect(isValidPassword(['abc123'])).toBe(false);
  });
});
