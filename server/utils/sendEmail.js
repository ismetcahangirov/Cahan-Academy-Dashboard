import nodemailer from 'nodemailer';

const DEFAULT_FROM_NAME = 'Cahan Academy';

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

// EMAIL_FROM may be a full "Name <addr>" or a bare address; FROM_NAME/FROM_EMAIL and EMAIL_USER are fallbacks.
export const buildFromAddress = (env = process.env) => {
  const emailFrom = clean(env.EMAIL_FROM).replace(/^(['"])(.*)\1$/, '$2').trim();
  if (emailFrom.includes('<')) return emailFrom;

  const address = emailFrom || clean(env.FROM_EMAIL) || clean(env.EMAIL_USER);
  if (!address) {
    throw new Error('Email sender is not configured (set EMAIL_FROM or EMAIL_USER)');
  }

  const name = clean(env.FROM_NAME) || DEFAULT_FROM_NAME;
  return `${name} <${address}>`;
};

export const buildTransportOptions = (env = process.env) => {
  const host = clean(env.EMAIL_HOST);
  if (!host) {
    throw new Error('Email transport is not configured (set EMAIL_HOST)');
  }

  const port = Number.parseInt(env.EMAIL_PORT, 10) || 587;
  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  };
};

// Absolute link into the client app, e.g. buildClientUrl('/reset-password/abc').
export const buildClientUrl = (path, env = process.env) => {
  const base = clean(env.CLIENT_URL).replace(/\/+$/, '');
  if (!base) {
    throw new Error('CLIENT_URL is not configured');
  }
  return `${base}${path}`;
};

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport(buildTransportOptions());

  const message = {
    from: buildFromAddress(),
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
