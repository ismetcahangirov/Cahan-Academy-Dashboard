import { useState } from 'react';
import { Calendar, Users, Save, BookOpen } from 'lucide-react';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { 
  useGetAttendanceQuery, 
  useMarkAttendanceMutation 
} from '../../features/attendance/attendanceApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { PageShell, Card, Button, EmptyState, Textarea, Input, NativeSelect, STATUS } from '../../components/ui';
import Avatar from '../../components/common/Avatar';
import { cn } from '../../lib/utils';
import { toDateInputValue } from '../../utils/formatDate';

const Attendance = () => {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(() => toDateInputValue());
  const [records, setRecords] = useState([]);
  const [topic, setTopic] = useState('');

  const { data: groupsData } = useGetGroupsQuery();
  const { data: attendanceData } = useGetAttendanceQuery(
    { group: selectedGroup, date },
    { skip: !selectedGroup }
  );
  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  const currentGroup = groupsData?.data?.find(g => g._id === selectedGroup);

  // Load the saved record (or a fresh one) when the data changes; adjusting state during render, no effect
  const [syncedFrom, setSyncedFrom] = useState({});
  if (syncedFrom.attendanceData !== attendanceData || syncedFrom.currentGroup !== currentGroup) {
    setSyncedFrom({ attendanceData, currentGroup });
    if (attendanceData?.data) {
      setRecords(attendanceData.data.records);
      setTopic(attendanceData.data.topic || '');
    } else if (currentGroup) {
      setRecords(currentGroup.students.map(student => ({
        student: student._id || student,
        status: 'present',
        note: ''
      })));
      setTopic('');
    }
  }

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => prev.map(rec =>
      rec.student === studentId || rec.student._id === studentId
        ? { ...rec, status }
        : rec
    ));
  };

  const handleSave = async () => {
    if (!selectedGroup) return toast.error(t('attendance.errorGroup'));
    try {
      await markAttendance({
        group: selectedGroup,
        date,
        records: records.map(r => ({
          student: r.student._id || r.student,
          status: r.status,
          note: r.note
        })),
        topic
      }).unwrap();
      toast.success(t('attendance.saveSuccess'));
    } catch {
      toast.error(t('students.error'));
    }
  };

  const STATUS_OPTIONS = [
    { value: 'present', label: t('attendance.present') },
    { value: 'absent', label: t('attendance.absent') },
    { value: 'late', label: t('attendance.late') },
  ];

  return (
    <PageShell
      title={t('attendance.title')}
      subtitle={t('attendance.subtitle')}
      actions={
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-ink-muted" aria-hidden="true" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t('attendance.title')}
            className="field w-auto"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Group selector */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="space-y-3 p-4">
            <h3 className="sc flex items-center gap-2 text-[0.9rem] text-accent-text">
              <Users size={16} aria-hidden="true" />
              {t('attendance.selectGroup')}
            </h3>
            <NativeSelect
              className="lg:hidden"
              aria-label={t('attendance.selectGroup')}
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">{t('attendance.selectGroup')}</option>
              {groupsData?.data?.map((group) => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </NativeSelect>
            <div className="custom-scrollbar hidden max-h-[400px] space-y-2 overflow-y-auto pr-1 lg:block">
              {groupsData?.data?.map((group) => {
                const isActive = selectedGroup === group._id;
                return (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroup(group._id)}
                    aria-pressed={isActive}
                    className={cn(
                      'w-full rounded-[var(--radius-md)] border p-3 text-left transition-colors',
                      isActive
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-line bg-surface text-ink hover:bg-surface-2'
                    )}
                  >
                    <div className="font-semibold">{group.name}</div>
                    <div className={cn('sc mt-0.5 text-[0.8rem]', isActive ? 'text-accent-fg' : 'text-ink-muted')}>
                      {group.course}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedGroup && (
            <Card variant="paper" className="space-y-3 p-4">
              <h4 className="sc flex items-center gap-2 text-[0.9rem] text-accent-text">
                <BookOpen size={14} aria-hidden="true" />
                {t('attendance.lessonTopic')}
              </h4>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('attendance.topicPlaceholder')}
                aria-label={t('attendance.lessonTopic')}
                rows={3}
              />
            </Card>
          )}
        </div>

        {/* Attendance list */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <Card>
              <EmptyState
                sketch="globe"
                title={t('attendance.selectGroup')}
                description={t('attendance.selectGroupHint')}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line-hair p-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{currentGroup?.name} — {t('attendance.studentList')}</h3>
                  <p className="text-sm text-ink-muted">
                    {currentGroup?.students?.length} {t('common.user').toLowerCase()}
                  </p>
                </div>
                <Button onClick={handleSave} loading={isSaving} icon={Save} className="max-sm:hidden">
                  {t('users.saveBtn')}
                </Button>
              </div>

              <ul className="divide-y divide-line-hair">
                {records.map((rec) => {
                  const student = currentGroup?.students?.find(s => (s._id || s) === (rec.student._id || rec.student));
                  if (!student) return null;
                  const sid = student._id || student;
                  return (
                    <li key={sid} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,14rem)] md:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={student.name} className="h-9 w-9 shrink-0 rounded-full" textSize="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">{student.name}</div>
                          <div className="truncate text-sm text-ink-muted">{student.email}</div>
                        </div>
                      </div>
                      <div role="group" aria-label={student.name} className="grid grid-cols-3 gap-1.5 md:flex">
                        {STATUS_OPTIONS.map((opt) => {
                          const active = rec.status === opt.value;
                          const def = STATUS[opt.value];
                          const Icon = def.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => handleStatusChange(sid, opt.value)}
                              className={cn(
                                'status min-h-10 justify-center px-3 transition-colors',
                                active
                                  ? `status-${def.look} ring-2 ring-accent-text ring-offset-1 ring-offset-surface`
                                  : 'border-line text-ink-muted hover:bg-surface-2'
                              )}
                            >
                              <Icon aria-hidden="true" strokeWidth={2} />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <Input
                        type="text"
                        aria-label={t('groups.note')}
                        placeholder={`${t('groups.note')}...`}
                        value={rec.note}
                        onChange={(e) => {
                          const newRecords = records.map(r =>
                            (r.student._id || r.student) === sid ? { ...r, note: e.target.value } : r
                          );
                          setRecords(newRecords);
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-line-hair p-4 sm:hidden">
                <Button block onClick={handleSave} loading={isSaving} icon={Save}>
                  {t('users.saveBtn')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Attendance;
