import jwt from 'jsonwebtoken';

// JWT-based moderator control only works on self-hosted Jitsi or JaaS,
// where you control the token secret. On the free public meet.jit.si these
// env vars are absent, so no token is issued (moderator is decided by the
// "host joins first" gate instead).
export function isJitsiJwtEnabled() {
  return Boolean(process.env.JITSI_JWT_APP_ID && process.env.JITSI_JWT_SECRET);
}

// Returns a signed Jitsi JWT granting (or withholding) moderator rights,
// or null when JWT auth is not configured.
export function generateJitsiToken({ roomName, user, moderator }) {
  if (!isJitsiJwtEnabled()) return null;

  const appId = process.env.JITSI_JWT_APP_ID;
  const secret = process.env.JITSI_JWT_SECRET;
  const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const isModerator = !!moderator;

  const payload = {
    aud: appId,
    iss: appId,
    sub: domain,
    room: roomName,
    moderator: isModerator,
    nbf: Math.floor(Date.now() / 1000) - 10, // tolerate small clock skew
    context: {
      user: {
        id: String(user?._id ?? ''),
        name: user?.name ?? 'User',
        email: user?.email,
        moderator: isModerator,
      },
    },
  };

  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '3h' });
}
