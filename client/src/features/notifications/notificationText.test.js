import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../../i18n';
import { notificationText } from './notificationText';

describe('notificationText', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  const t = (...args) => i18n.t(...args);

  it('translates keyed notifications into the current language', async () => {
    const n = {
      key: 'homeworkGraded',
      params: { title: 'Landing page', grade: 90 },
      title: 'Tapşırığınız qiymətləndirildi',
      message: '"Landing page" tapşırığınız qiymətləndirildi: 90',
    };

    expect(notificationText(n, t, i18n)).toEqual({
      title: 'Your homework was graded',
      message: '"Landing page" was graded: 90',
    });

    await i18n.changeLanguage('ru');
    expect(notificationText(n, t, i18n).title).toBe('Ваше задание оценено');
    await i18n.changeLanguage('en');
  });

  it('falls back to the stored text for old or unknown notifications', () => {
    expect(notificationText({ title: 'Köhnə', message: 'Mətn' }, t, i18n)).toEqual({ title: 'Köhnə', message: 'Mətn' });
    expect(notificationText({ key: 'nope', title: 'A', message: 'B' }, t, i18n)).toEqual({ title: 'A', message: 'B' });
  });
});
