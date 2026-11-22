import { Bell, BellDot, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '../../features/notifications/notificationsApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { notificationText } from '../../features/notifications/notificationText';
import { formatDate } from '../../utils/formatDate';
import { Badge, Button, Card, EmptyState, PageShell, Skeleton } from '../../components/ui';
import { cn } from '../../lib/utils';

const Notifications = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 50 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data || [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      toast.error(t('notifications.markAsReadError'));
    }
  };

  // Opening a notification marks it read and goes to the page it is about
  const handleOpen = (notification) => {
    if (!notification.isRead) handleMarkAsRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success(t('notifications.markAllAsReadSuccess'));
    } catch {
      toast.error(t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success(t('notifications.deleteSuccess'));
    } catch {
      toast.error(t('notifications.deleteError'));
    }
  };

  return (
    <PageShell
      width="narrow"
      title={t('notifications.title')}
      subtitle={!isLoading && notifications.length > 0 ? t('notifications.unreadCount', { count: unread }) : undefined}
      actions={
        unread > 0 && (
          <Button variant="outline" icon={CheckCheck} onClick={handleMarkAllAsRead}>
            {t('notifications.markAllAsRead')}
          </Button>
        )
      }
    >
      <Card className="overflow-hidden">
        {isLoading ? (
          <ul className="divide-y divide-line-hair" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex gap-4 px-4 py-5 sm:px-6">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : notifications.length === 0 ? (
          <EmptyState sketch="notebook" title={t('notifications.emptyTitle')} description={t('notifications.noNotifications')} />
        ) : (
          <ul className="orn-stagger divide-y divide-line-hair">
            {notifications.map((notification) => {
              const { title, message } = notificationText(notification, t, i18n);
              const isUnread = !notification.isRead;
              return (
                <li
                  key={notification._id}
                  className={cn(
                    'group relative flex items-start gap-3 px-4 py-4 transition-colors duration-[var(--dur-1)] sm:gap-4 sm:px-6',
                    isUnread ? 'bg-accent-soft' : 'hover:bg-surface-2'
                  )}
                >
                  {/* unread = filled seal-like disc + "new" badge; read = outline disc (never colour alone) */}
                  {isUnread && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-accent-text" />}
                  <span
                    className={cn(
                      'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                      isUnread ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong text-ink-muted'
                    )}
                  >
                    {isUnread ? (
                      <BellDot size={18} strokeWidth={1.6} aria-hidden="true" />
                    ) : (
                      <Bell size={18} strokeWidth={1.6} aria-hidden="true" />
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpen(notification)}
                    className="min-w-0 flex-1 rounded-[var(--radius-sm)] text-left"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn('text-[1.05rem] leading-snug', isUnread ? 'font-semibold text-ink' : 'text-ink')}>
                        {title}
                      </span>
                      {isUnread && <Badge tone="accent">{t('dashboard.new')}</Badge>}
                    </span>
                    {message && <span className="mt-1 block text-[0.98rem] text-ink-muted">{message}</span>}
                    <span className="time-italic mt-1.5 flex items-center gap-1.5 text-[0.9rem] text-ink-subtle">
                      <Clock size={13} strokeWidth={1.6} aria-hidden="true" />
                      {formatDate(notification.createdAt, 'd MMM yyyy, HH:mm', i18n.language)}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-1 transition-opacity duration-[var(--dur-1)] pointer-fine:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={Check}
                        onClick={() => handleMarkAsRead(notification._id)}
                        aria-label={t('notifications.markAsReadBtn')}
                        title={t('notifications.markAsReadBtn')}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      icon={Trash2}
                      onClick={() => handleDelete(notification._id)}
                      aria-label={t('notifications.deleteBtn')}
                      title={t('notifications.deleteBtn')}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </PageShell>
  );
};

export default Notifications;
