import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User as UserIcon, Mail, Shield, Calendar, Clock } from 'lucide-react';
import { useGetUserByIdQuery } from '../../features/users/userApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import { Button, EmptyState, PageShell, Section, StatusPill } from '../../components/ui';
import OrnateFrame from '../../components/ornament/OrnateFrame';
import { RoleBadge } from './PeopleBits';
import { USER_STATUS } from './peopleStatus';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 border-b border-line-hair py-3 last:border-0">
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="sc text-[0.8rem] text-ink-muted">{label}</p>
      <p className="break-words font-medium text-ink">{value || '—'}</p>
    </div>
  </div>
);

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetUserByIdQuery(id);
  const user = data?.user || data?.data || data;

  const fmt = (date) => formatDate(date, 'dd MMMM yyyy, HH:mm') || '—';
  const statusLabels = { active: t('students.active'), inactive: t('students.inactive'), pending: t('users.pending') };
  const roleLabels = { admin: t('common.admin'), teacher: t('common.teacher'), student: t('common.student') };

  const back = (
    <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
      {t('detail.back')}
    </Button>
  );

  if (isLoading) {
    return (
      <PageShell width="narrow">
        {back}
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (isError || !user) {
    return (
      <PageShell width="narrow">
        {back}
        <EmptyState sketch="notebook" title={t('detail.notFound')} />
      </PageShell>
    );
  }

  return (
    <PageShell
      width="narrow"
      title={user.name}
      subtitle={roleLabels[user.role] || user.role}
      actions={back}
    >
      <OrnateFrame className="p-6" corners="diagonal">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar src={user.avatar} name={user.name} className="h-24 w-24 shrink-0" textSize="2xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg text-ink-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RoleBadge role={user.role} />
              <StatusPill status={USER_STATUS[user.status] || 'neutral'}>
                {statusLabels[user.status] || user.status}
              </StatusPill>
            </div>
          </div>
        </div>
      </OrnateFrame>

      <Section title={t('detail.info')} variant="paper">
        <InfoRow icon={UserIcon} label={t('detail.name')} value={user.name} />
        <InfoRow icon={Mail} label={t('detail.email')} value={user.email} />
        <InfoRow icon={Shield} label={t('users.role')} value={roleLabels[user.role] || user.role} />
        <InfoRow icon={Calendar} label={t('detail.createdAt')} value={fmt(user.createdAt)} />
        <InfoRow icon={Clock} label={t('detail.updatedAt')} value={fmt(user.updatedAt)} />
      </Section>
    </PageShell>
  );
};

export default UserDetail;
