import { useState } from 'react';
import { Mail, Send, Plus, Trash2, UserCheck, Calendar, GraduationCap } from 'lucide-react';
import {
  useGetInvitationsQuery,
  useSendInvitationMutation,
  useDeleteInvitationMutation,
} from '../../features/invitations/invitationsApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/formatDate';
import { Badge, Button, Card, EmptyState, FormField, Input, Modal, PageShell, Skeleton, StatusPill, Table } from '../../components/ui';

const INV_STATUS = { pending: 'pending', accepted: 'success', expired: 'warning', cancelled: 'neutral' };

const Invitations = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'student' });

  const { data, isLoading } = useGetInvitationsQuery();
  const [sendInvitation, { isLoading: isSending }] = useSendInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();

  const statusLabel = (s) =>
    ({
      pending: t('invitations.statusPending'),
      accepted: t('invitations.statusAccepted'),
      expired: t('invitations.statusExpired'),
      cancelled: t('invitations.statusCancelled'),
    })[s] || s;

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendInvitation(formData).unwrap();
      toast.success(t('invitations.sendSuccess'));
      setIsModalOpen(false);
      setFormData({ email: '', role: 'student' });
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('invitations.deleteConfirm'))) {
      try {
        await deleteInvitation(id).unwrap();
        toast.success(t('invitations.deleteSuccess'));
      } catch {
        toast.error(t('students.error'));
      }
    }
  };

  const invitations = data?.data || [];
  const roleBadge = (inv) => <Badge tone="accent">{inv.role === 'teacher' ? t('common.teacher') : t('common.student')}</Badge>;
  const deleteBtn = (inv) =>
    inv.status === 'pending' && (
      <Button variant="ghost" iconOnly size="sm" icon={Trash2} aria-label={t('common.delete')} onClick={() => handleDelete(inv._id)} />
    );

  return (
    <PageShell
      title={t('invitations.title')}
      subtitle={t('invitations.subtitle')}
      actions={
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          {t('invitations.addNew')}
        </Button>
      }
    >
      <section>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <Card>
            <EmptyState
              sketch="notebook"
              title={t('invitations.noInvitations')}
              action={
                <Button variant="outline" icon={Plus} onClick={() => setIsModalOpen(true)}>
                  {t('invitations.addNew')}
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <div className="hidden sm:block">
              <Table caption={t('invitations.title')}>
                <thead>
                  <tr>
                    <th>{t('invitations.tableEmail')}</th>
                    <th>{t('invitations.tableRole')}</th>
                    <th>{t('invitations.tableStatus')}</th>
                    <th>{t('invitations.tableInvitedBy')}</th>
                    <th>{t('invitations.tableExpiresAt')}</th>
                    <th className="text-right">{t('invitations.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
                            <Mail size={15} strokeWidth={1.5} aria-hidden="true" />
                          </span>
                          <span className="font-semibold text-ink">{inv.email}</span>
                        </div>
                      </td>
                      <td>{roleBadge(inv)}</td>
                      <td>
                        <StatusPill status={INV_STATUS[inv.status] || 'neutral'}>{statusLabel(inv.status)}</StatusPill>
                      </td>
                      <td className="text-ink-muted">{inv.invitedBy?.name || t('common.admin')}</td>
                      <td>
                        <span className="num flex items-center gap-2 text-ink-muted">
                          <Calendar size={14} aria-hidden="true" />
                          {formatDate(inv.expiresAt, 'd MMMM yyyy')}
                        </span>
                      </td>
                      <td className="text-right">{deleteBtn(inv)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="space-y-3 sm:hidden">
              {invitations.map((inv) => (
                <li key={inv._id}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
                        <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-semibold text-ink">{inv.email}</p>
                        <p className="text-sm text-ink-muted">{inv.invitedBy?.name || t('common.admin')}</p>
                      </div>
                      {deleteBtn(inv)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {roleBadge(inv)}
                      <StatusPill status={INV_STATUS[inv.status] || 'neutral'}>{statusLabel(inv.status)}</StatusPill>
                    </div>
                    <p className="num mt-2 flex items-center gap-2 text-sm text-ink-muted">
                      <Calendar size={14} aria-hidden="true" />
                      {formatDate(inv.expiresAt, 'd MMMM yyyy')}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('invitations.modalTitle')}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="invite-form" icon={Send} loading={isSending}>
              {isSending ? t('invitations.sendingBtn') : t('invitations.sendBtn')}
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleSend} className="space-y-5">
          <FormField label={t('invitations.emailLabel')} required>
            {(id) => (
              <Input
                id={id}
                icon={Mail}
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('auth.emailPlaceholder')}
              />
            )}
          </FormField>

          <fieldset>
            <legend className="field-label">{t('invitations.roleLabel')}</legend>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={formData.role === 'teacher' ? 'primary' : 'outline'}
                motif={false}
                icon={UserCheck}
                aria-pressed={formData.role === 'teacher'}
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
              >
                {t('common.teacher')}
              </Button>
              <Button
                variant={formData.role === 'student' ? 'primary' : 'outline'}
                motif={false}
                icon={GraduationCap}
                aria-pressed={formData.role === 'student'}
                onClick={() => setFormData({ ...formData, role: 'student' })}
              >
                {t('common.student')}
              </Button>
            </div>
          </fieldset>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Invitations;
