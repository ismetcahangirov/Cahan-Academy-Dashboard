// New notifications carry an i18n key + params, so they follow the UI language.
// Older ones only have the Azerbaijani text the server stored.
export const notificationText = (notification, t, i18n) => {
  const base = notification?.key ? `notifications.messages.${notification.key}` : null;
  if (base && i18n.exists(`${base}.title`)) {
    const params = notification.params || {};
    return { title: t(`${base}.title`, params), message: t(`${base}.message`, params) };
  }
  return { title: notification?.title || '', message: notification?.message || '' };
};

export default notificationText;
