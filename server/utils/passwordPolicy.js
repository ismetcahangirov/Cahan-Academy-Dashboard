// Same rule everywhere a password is set: registration, reset, invitation, admin create/update.
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

export const PASSWORD_RULE_MESSAGE = 'Şifrə ən azı 6 simvol, 1 hərf və 1 rəqəmdən ibarət olmalıdır';

export const isValidPassword = (password) =>
  typeof password === 'string' && PASSWORD_REGEX.test(password);
