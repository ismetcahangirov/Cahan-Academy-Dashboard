import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save,
  BookOpen
} from 'lucide-react';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { 
  useGetAttendanceQuery, 
  useMarkAttendanceMutation 
} from '../../features/attendance/attendanceApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const Attendance = () => {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [topic, setTopic] = useState('');

  const { data: groupsData } = useGetGroupsQuery();
  const { data: attendanceData, isLoading: isFetching } = useGetAttendanceQuery(
    { group: selectedGroup, date },
    { skip: !selectedGroup }
  );
  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  const currentGroup = groupsData?.data?.find(g => g._id === selectedGroup);

  useEffect(() => {
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
  }, [attendanceData, currentGroup]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('attendance.title')}</h1>
          <p className="text-white/60 text-sm mt-1">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl">
          <Calendar size={16} className="text-white/40" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-none outline-none text-sm font-medium text-white bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Group Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Users size={16} className="text-bordo" />
              {t('attendance.selectGroup')}
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {groupsData?.data?.map(group => (
                <button
                  key={group._id}
                  onClick={() => setSelectedGroup(group._id)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all border',
                    selectedGroup === group._id
                      ? 'bg-bordo/10 border-bordo/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="font-bold text-sm">{group.name}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mt-1">{group.course}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedGroup && (
            <div className="bg-bordo/10 border border-bordo/20 p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen size={14} className="text-bordo" />
                {t('attendance.lessonTopic')}
              </h4>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('attendance.topicPlaceholder')}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-bordo/50 transition-all resize-none h-24"
              />
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div className="lg:col-span-3">
          {!selectedGroup ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                <Users size={40} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t('attendance.selectGroupDesc')}</h3>
              <p className="text-white/40 max-w-xs text-sm">{t('attendance.selectGroupHint')}</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="font-bold text-white text-sm">{currentGroup?.name} — {t('attendance.studentList')}</h3>
                  <p className="text-xs text-white/40 mt-1">{currentGroup?.students?.length} {t('common.user').toLowerCase()}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-all shadow-lg shadow-bordo/20 text-sm font-medium disabled:opacity-50"
                >
                  <Save size={16} />
                  {t('users.saveBtn')}
                </button>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10 bg-white/[0.01]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('sidebar.students')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('attendance.status')}</th>
                      <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('groups.note')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((rec) => {
                      const student = currentGroup?.students?.find(s => (s._id || s) === (rec.student._id || rec.student));
                      if (!student) return null;
                      return (
                        <tr key={student._id || student} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-bordo/20 flex items-center justify-center text-bordo font-bold border border-bordo/20 text-sm">
                                {student.name?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-white text-sm">{student.name}</div>
                                <div className="text-[11px] text-white/40">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'present')}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                  rec.status === 'present' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-white/40 hover:bg-white/5'
                                )}
                              >
                                <CheckCircle2 size={13} /><span>{t('attendance.present')}</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'absent')}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                  rec.status === 'absent' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'text-white/40 hover:bg-white/5'
                                )}
                              >
                                <XCircle size={13} /><span>{t('attendance.absent')}</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'late')}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                                  rec.status === 'late' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-white/40 hover:bg-white/5'
                                )}
                              >
                                <Clock size={13} /><span>{t('attendance.late')}</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder={`${t('groups.note')}...`}
                              value={rec.note}
                              onChange={(e) => {
                                const newRecords = records.map(r =>
                                  (r.student._id || r.student) === (student._id || student) ? { ...r, note: e.target.value } : r
                                );
                                setRecords(newRecords);
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-bordo/50 transition-all placeholder:text-white/20"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
