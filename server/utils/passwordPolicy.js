// Same rule everywhere a password is set: registration, reset, invitation, admin create/update.
// At least 6 characters, one letter and one digit; any printable character except whitespace.
export const PASSWORD_REGEX = /^(?=.*\p{L})(?=.*\d)[^\s\p{C}]{6,}$/u;

export const PASSWORD_RULE_MESSAGE =
  'Şifrə ən azı 6 simvol olmalı, ən azı 1 hərf və 1 rəqəm içərməlidir. Boşluq istifadə etmək olmaz.';

export const isValidPassword = (password) =>
  typeof password === 'string' && PASSWORD_REGEX.test(password);
