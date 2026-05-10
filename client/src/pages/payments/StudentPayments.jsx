import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Check,
  X,
  Banknote,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import Avatar from '../../components/common/Avatar';
import {
  useGetStudentPaymentsQuery,
  useCreatePaymentPlanMutation,
  useUpdatePaymentPlanMutation,
  useDeletePaymentPlanMutation,
  useApprovePaymentMutation,
  useUnapprovePaymentMutation,
} from '../../features/payments/paymentsApi';

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  paid: 'bg-[var(--muted)] text-[color:var(--foreground)] border-[var(--border)]',
  pending: 'bg-bordo/10 text-bordo border-bordo/30',
  overdue: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/30',
};

const STATUS_ICON = {
  paid: <CheckCircle2 size={13} />,
  pending: <Clock size={13} />,
  overdue: <AlertCircle size={13} />,
};

const TYPE_PERIODS = ['once', 'weekly', 'monthly', 'semi-annually', 'annually'];

const formatDate = (date, lang) =>
  new Date(date).toLocaleDateString(
    lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-US'
  );

// ─── Plan Form ───────────────────────────────────────────────────────────────
const PlanForm = ({ studentId, existing, onClose }) => {
  const { t, i18n } = useTranslation();
  const [createPlan, { isLoading: creating }] = useCreatePaymentPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdatePaymentPlanMutation();

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    amount: existing?.amount ?? '',
    type: existing?.type ?? 'monthly',
    startDate: existing?.startDate ? existing.startDate.slice(0, 10) : today,
    endDate: existing?.endDate ? existing.endDate.slice(0, 10) : '',
    description: existing?.description ?? '',
  });

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
        await updatePlan({ id: existing._id, ...payload }).unwrap();
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

  const labelCls = 'block text-xs font-medium text-[var(--muted-foreground)] mb-1';
  const inputCls =
    'w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className={labelCls}>{t('payments.amount')}</label>
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder="100"
          className={inputCls}
          required
        />
      </div>

      {/* Type */}
      <div>
        <label className={labelCls}>{t('payments.paymentType')}</label>
        <select
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          className={inputCls}
        >
          {TYPE_PERIODS.map((tp) => (
            <option key={tp} value={tp}>
              {t(`payments.types.${tp}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Start date */}
      <div>
        <label className={labelCls}>{t('payments.startDate')}</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => set('startDate', e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* End date (only for recurring) */}
      {form.type !== 'once' && (
        <div>
          <label className={labelCls}>{t('payments.endDate')}</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            className={inputCls}
          />
          <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">
            {t('payments.endDateHint')}
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className={labelCls}>{t('payments.description')}</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={t('payments.descriptionPlaceholder')}
          className={inputCls}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={creating || updating}
          className="flex-1 bg-bordo hover:bg-bordo/90 text-white py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {creating || updating ? t('common.loading') : existing ? t('common.save') : t('payments.createPlan')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
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
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/20 transition-colors">
      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
        {formatDate(entry.dueDate, lang)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
        {entry.amount} AZN
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
            STATUS_STYLE[entry.status]
          )}
        >
          {STATUS_ICON[entry.status]}
          {t(`payments.status.${entry.status}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]/60">
        {entry.status === 'paid' && entry.paidDate
          ? formatDate(entry.paidDate, lang)
          : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {entry.status !== 'paid' ? (
          <button
            onClick={handleApprove}
            disabled={approving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bordo/10 text-bordo border border-bordo/20 text-xs font-medium hover:bg-bordo hover:text-white transition-all disabled:opacity-50"
          >
            <Check size={12} />
            {t('payments.approve')}
          </button>
        ) : (
          <button
            onClick={handleUnapprove}
            disabled={unapproving}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--border)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} />
            {t('payments.unapprove')}
          </button>
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-bordo/10">
            <Banknote size={18} className="text-bordo" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {plan.amount} AZN — {t(`payments.types.${plan.type}`)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5">
              {formatDate(plan.startDate, i18n.language)}
              {plan.endDate && ` → ${formatDate(plan.endDate, i18n.language)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]/60">
            {paid}/{total} {t('payments.paid')}
            {overdue > 0 && (
              <span className="ml-2 text-[var(--destructive)]">
                · {overdue} {t('payments.overdue')}
              </span>
            )}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)]/50 hover:text-bordo hover:bg-bordo/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Edit form inline */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-4 border-b border-[var(--border)] bg-[var(--muted)]/5"
          >
            <PlanForm studentId={studentId} existing={plan} onClose={() => setEditing(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {plan.description && (
              <p className="px-5 pt-3 text-xs text-[var(--muted-foreground)]/60 italic">
                {plan.description}
              </p>
            )}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                    <th className="px-4 py-2.5 text-xs font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-wider">
                      {t('payments.dueDate')}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-wider">
                      {t('payments.amount')}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-wider">
                      {t('payments.statusLabel')}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-wider">
                      {t('payments.paidDate')}
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[var(--muted-foreground)]/50 uppercase tracking-wider text-right">
                      {t('students.tableActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plan.history.map((entry) => (
                    <HistoryRow
                      key={entry._id}
                      entry={entry}
                      planId={plan._id}
                      lang={i18n.language}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    <div className="space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          {student && (
            <Avatar
              src={student.avatar}
              name={student.name}
              className="w-9 h-9 rounded-full border border-[var(--border)]"
              textSize="sm"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {student?.name || t('common.loading')}
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]/60">{t('payments.title')}</p>
          </div>
        </div>
      </div>

      {/* Add plan button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-bordo/20"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? t('common.cancel') : t('payments.newPlan')}
        </button>
      </div>

      {/* New plan form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5"
          >
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-bordo" />
              {t('payments.createPlan')}
            </h2>
            <PlanForm studentId={id} onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-[var(--muted)] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <Banknote size={40} className="mx-auto mb-3 text-[var(--muted-foreground)]/20" />
          <p className="text-[var(--muted-foreground)]/50 text-sm">{t('payments.noPlans')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((plan) => (
            <PlanCard key={plan._id} plan={plan} studentId={id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentPayments;
