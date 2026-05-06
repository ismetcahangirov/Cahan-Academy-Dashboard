import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { az, enUS, ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const dateLocales = {
  az: az,
  en: enUS,
  ru: ru
};
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../../features/notifications/notificationsApi';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 50 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data || [];

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      toast.error(t('notifications.markAsReadError'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success(t('notifications.markAllAsReadSuccess'));
    } catch (error) {
      toast.error(t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success(t('notifications.deleteSuccess'));
    } catch (error) {
      toast.error(t('notifications.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bordo"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <Bell className="text-bordo" />
          {t('notifications.title')}
        </h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-lg transition-colors text-sm border border-[var(--border)]"
          >
            <Check size={16} />
            {t('notifications.markAllAsRead')}
          </button>
        )}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]/50">
            <Bell className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  notification.isRead
                    ? 'bg-[var(--muted)]/30 border-[var(--border)]'
                    : 'bg-bordo/10 border-bordo/30'
                } transition-colors group`}
              >
                <div className={`p-2 rounded-lg ${notification.isRead ? 'bg-[var(--muted)] text-[var(--muted-foreground)]/60' : 'bg-bordo text-white'}`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${notification.isRead ? 'text-[var(--foreground)]/70' : 'text-[var(--foreground)]'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-[var(--muted-foreground)]/60 text-sm mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]/40">
                    <Clock size={12} />
                    {format(new Date(notification.createdAt), 'd MMM yyyy HH:mm', { locale: dateLocales[i18n.language] || az })}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors tooltip"
                      title={t('notifications.markAsReadBtn')}
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-2 text-[var(--muted-foreground)]/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors tooltip"
                    title={t('notifications.deleteBtn')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
