import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Check, Banknote, ChevronDown, ChevronUp, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';
import { formatDate, toDateInputValue } from '../../utils/formatDate';
import {
  useGetStudentPaymentsQuery,
  useCreatePaymentPlanMutation,
  useUpdatePaymentPlanMutation,
  useDeletePaymentPlanMutation,
  useApprovePaymentMutation,
  useUnapprovePaymentMutation,
} from '../../features/payments/paymentsApi';
import {
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  NativeSelect,
  PageShell,
  Skeleton,
  StatusPill,
  Table,
} from '../../components/ui';

// ─── helpers ────────────────────────────────────────────────────────────────
// paid = filled + check, pending = outline + circle, overdue = heavy alert + octagon (no green/red)
const PAYMENT_STATUS = { paid: 'success', pending: 'pending', overdue: 'error' };

const TYPE_PERIODS = ['once', 'weekly', 'monthly', 'semi-annually', 'annually'];

const fmtDate = (date, lang) => formatDate(date, 'd MMMM yyyy', lang);

const initialForm = (existing) => ({
  amount: existing?.amount ?? '',
  type: existing?.type ?? 'monthly',
  startDate: existing?.startDate ? existing.startDate.slice(0, 10) : toDateInputValue(),
  endDate: existing?.endDate ? existing.endDate.slice(0, 10) : '',
  description: existing?.description ?? '',
});

// ─── Plan modal (create / edit) ──────────────────────────────────────────────
const PlanModal = ({ studentId, existing, onClose }) => {
  const { t } = useTranslation();
  const [createPlan, { isLoading: creating }] = useCreatePaymentPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdatePaymentPlanMutation();

  const [form, setForm] = useState(() => initialForm(existing));

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error(t('payments.invalidAmount'));
      return;
    }
    try {
      const payload = {
        studentId,
        amount: Number(form.amount),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        description: form.description,
      };
      if (existing) {
        // Send only what changed: a schedule change rebuilds the history on the server
        const original = initialForm(existing);
        const changes = {};
        if (Number(form.amount) !== Number(original.amount)) changes.amount = Number(form.amount);
        if (form.type !== original.type) changes.type = form.type;
        if (form.startDate !== original.startDate) changes.startDate = form.startDate;
        if (form.endDate !== original.endDate) changes.endDate = form.endDate || null;
        if (form.description !== original.description) changes.description = form.description;
        if (Object.keys(changes).length > 0) {
          await updatePlan({ id: existing._id, studentId, ...changes }).unwrap();
        }
        toast.success(t('payments.planUpdated'));
      } else {
        await createPlan(payload).unwrap();
        toast.success(t('payments.planCreated'));
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const busy = creating || updating;

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? t('common.edit') : t('payments.createPlan')}
      subtitle={t('payments.title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="plan-form" loading={busy}>
            {existing ? t('common.save') : t('payments.createPlan')}
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t('payments.amount')} required>
          {(id) => (
            <Input
              id={id}
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="100"
              required
            />
          )}
        </FormField>

        <FormField label={t('payments.paymentType')}>
          {(id) => (
            <NativeSelect id={id} value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPE_PERIODS.map((tp) => (
                <option key={tp} value={tp}>
                  {t(`payments.types.${tp}`)}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        <FormField label={t('payments.startDate')} required>
          {(id) => (
            <Input id={id} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          )}
        </FormField>

        {/* End date (only for recurring) */}
        {form.type !== 'once' && (
          <FormField label={t('payments.endDate')} hint={t('payments.endDateHint')}>
            {(id, describedBy) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            )}
          </FormField>
        )}

        <FormField label={t('payments.description')}>
          {(id) => (
            <Input
              id={id}
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('payments.descriptionPlaceholder')}
            />
          )}
        </FormField>
      </form>
    </Modal>
  );
};

// ─── History Entry Row ───────────────────────────────────────────────────────
const HistoryRow = ({ entry, planId, lang }) => {
  const { t } = useTranslation();
  const [approve, { isLoading: approving }] = useApprovePaymentMutation();
  const [unapprove, { isLoading: unapproving }] = useUnapprovePaymentMutation();

  const handleApprove = async () => {
    try {
      await approve({ planId, historyId: entry._id }).unwrap();
      toast.success(t('payments.approved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleUnapprove = async () => {
    try {
      await unapprove({ planId, historyId: entry._id }).unwrap();
      toast.success(t('payments.unapproved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <tr>
      <td>{fmtDate(entry.dueDate, lang)}</td>
      <td className="num font-semibold">{entry.amount} AZN</td>
      <td>
        <StatusPill status={PAYMENT_STATUS[entry.status] || 'neutral'}>{t(`payments.status.${entry.status}`)}</StatusPill>
      </td>
      <td className="text-ink-muted">
        {entry.status === 'paid' && entry.paidDate ? fmtDate(entry.paidDate, lang) : '—'}
      </td>
      <td className="text-right">
        {entry.status !== 'paid' ? (
          <Button variant="outline" size="sm" motif={false} icon={Check} onClick={handleApprove} loading={approving}>
            {t('payments.approve')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={handleUnapprove} loading={unapproving}>
            {t('payments.unapprove')}
          </Button>
        )}
      </td>
    </tr>
  );
};

// ─── Plan Card ───────────────────────────────────────────────────────────────
const PlanCard = ({ plan, studentId }) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deletePlan, { isLoading: deleting }] = useDeletePaymentPlanMutation();

  const handleDelete = async () => {
    if (!window.confirm(t('payments.deleteConfirm'))) return;
    try {
      await deletePlan(plan._id).unwrap();
      toast.success(t('payments.planDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const paid = plan.history.filter((h) => h.status === 'paid').length;
  const total = plan.history.length;
  const overdue = plan.history.filter((h) => h.status === 'overdue').length;

  return (
    <Card variant="ornate" className="overflow-hidden">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
            <Banknote size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="num text-[1.2rem] font-semibold text-ink">
              {plan.amount} AZN — {t(`payments.types.${plan.type}`)}
            </p>
            <p className="num text-sm text-ink-muted">
              {fmtDate(plan.startDate, i18n.language)}
              {plan.endDate && ` → ${fmtDate(plan.endDate, i18n.language)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="num text-sm text-ink-muted">
            {paid}/{total} {t('payments.paid')}
          </span>
          {overdue > 0 && (
            <StatusPill status="error">
              <span className="num">{overdue}</span> {t('payments.overdue')}
            </StatusPill>
          )}
          <Button variant="ghost" iconOnly size="sm" icon={Edit2} aria-label={t('common.edit')} title={t('common.edit')} onClick={() => setEditing(true)} />
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            icon={Trash2}
            aria-label={t('common.delete')}
            title={t('common.delete')}
            onClick={handleDelete}
            disabled={deleting}
          />
          <Button
            variant="ghost"
            iconOnly
            size="sm"
            icon={expanded ? ChevronUp : ChevronDown}
            aria-label={expanded ? t('common.close') : t('payments.dueDate')}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line-hair px-5 pb-5 pt-3">
          {plan.description && <p className="mb-3 italic text-ink-muted">{plan.description}</p>}
          <Table caption={t('payments.title')}>
            <thead>
              <tr>
                <th>{t('payments.dueDate')}</th>
                <th className="num">{t('payments.amount')}</th>
                <th>{t('payments.statusLabel')}</th>
                <th>{t('payments.paidDate')}</th>
                <th className="text-right">{t('students.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {plan.history.map((entry) => (
                <HistoryRow key={entry._id} entry={entry} planId={plan._id} lang={i18n.language} />
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {editing && <PlanModal studentId={studentId} existing={plan} onClose={() => setEditing(false)} />}
    </Card>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const StudentPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetStudentPaymentsQuery(id);

  const student = data?.data?.student;
  const payments = data?.data?.payments ?? [];

  return (
    <PageShell
      title={student?.name || t('common.loading')}
      subtitle={t('payments.title')}
      actions={
        <>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/students')}>
            {t('detail.back')}
          </Button>
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            {t('payments.newPlan')}
          </Button>
        </>
      }
    >
      {student && (
        <div className="flex items-center gap-3">
          <Avatar src={student.avatar} name={student.name} className="h-12 w-12" textSize="base" />
          {student.email && <p className="text-ink-muted">{student.email}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <EmptyState
            sketch="inkwell"
            title={t('payments.noPlans')}
            action={
              <Button variant="outline" icon={Plus} onClick={() => setShowForm(true)}>
                {t('payments.newPlan')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((plan) => (
            <PlanCard key={plan._id} plan={plan} studentId={id} />
          ))}
        </div>
      )}

      {showForm && <PlanModal studentId={id} onClose={() => setShowForm(false)} />}
    </PageShell>
  );
};

export default StudentPayments;
