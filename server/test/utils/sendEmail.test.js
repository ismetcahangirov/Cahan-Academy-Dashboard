import { describe, it, expect } from 'vitest';
import { buildFromAddress, buildTransportOptions, buildClientUrl } from '../../utils/sendEmail.js';

describe('buildFromAddress', () => {
  it('uses a full EMAIL_FROM as-is', () => {
    expect(buildFromAddress({ EMAIL_FROM: 'Cahan Academy <noreply@cahan.az>' }))
      .toBe('Cahan Academy <noreply@cahan.az>');
  });

  it('strips surrounding quotes from EMAIL_FROM', () => {
    expect(buildFromAddress({ EMAIL_FROM: '"Cahan Academy <noreply@cahan.az>"' }))
      .toBe('Cahan Academy <noreply@cahan.az>');
  });

  it('adds a display name to a bare EMAIL_FROM address', () => {
    expect(buildFromAddress({ EMAIL_FROM: 'noreply@cahan.az' }))
      .toBe('Cahan Academy <noreply@cahan.az>');
    expect(buildFromAddress({ EMAIL_FROM: 'noreply@cahan.az', FROM_NAME: 'Academy' }))
      .toBe('Academy <noreply@cahan.az>');
  });

  it('falls back to FROM_NAME/FROM_EMAIL', () => {
    expect(buildFromAddress({ FROM_NAME: 'Academy', FROM_EMAIL: 'info@cahan.az' }))
      .toBe('Academy <info@cahan.az>');
  });

  it('falls back to EMAIL_USER', () => {
    expect(buildFromAddress({ EMAIL_USER: 'smtp@cahan.az' }))
      .toBe('Cahan Academy <smtp@cahan.az>');
  });

  it('never produces "undefined <undefined>"', () => {
    expect(() => buildFromAddress({})).toThrow(/not configured/);
    expect(() => buildFromAddress({ FROM_NAME: 'Academy', EMAIL_FROM: '  ' })).toThrow(/not configured/);
  });
});

describe('buildTransportOptions', () => {
  const base = { EMAIL_HOST: 'smtp.example.com', EMAIL_USER: 'u', EMAIL_PASS: 'p' };

  it('uses implicit TLS on port 465', () => {
    const options = buildTransportOptions({ ...base, EMAIL_PORT: '465' });
    expect(options.port).toBe(465);
    expect(options.secure).toBe(true);
  });

  it('uses STARTTLS on other ports and defaults to 587', () => {
    expect(buildTransportOptions({ ...base, EMAIL_PORT: '2525' }).secure).toBe(false);
    const fallback = buildTransportOptions(base);
    expect(fallback.port).toBe(587);
    expect(fallback.secure).toBe(false);
  });

  it('requires EMAIL_HOST', () => {
    expect(() => buildTransportOptions({ EMAIL_PORT: '465' })).toThrow(/EMAIL_HOST/);
  });
});

describe('buildClientUrl', () => {
  it('joins CLIENT_URL and the path without a double slash', () => {
    expect(buildClientUrl('/reset-password/abc', { CLIENT_URL: 'https://app.example.com/' }))
      .toBe('https://app.example.com/reset-password/abc');
  });

  it('requires CLIENT_URL', () => {
    expect(() => buildClientUrl('/x', {})).toThrow(/CLIENT_URL/);
  });
});
