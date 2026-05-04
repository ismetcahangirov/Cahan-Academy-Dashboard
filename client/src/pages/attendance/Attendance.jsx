import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen
} from 'lucide-react';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { 
  useGetAttendanceQuery, 
  useMarkAttendanceMutation 
} from '../../features/attendance/attendanceApi';
import { toast } from 'react-hot-toast';

const Attendance = () => {
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

  // Selected group object to get students
  const currentGroup = groupsData?.data?.find(g => g._id === selectedGroup);

  useEffect(() => {
    if (attendanceData?.data) {
      setRecords(attendanceData.data.records);
      setTopic(attendanceData.data.topic || '');
    } else if (currentGroup) {
      // Initialize with default values for each student in the group
      setRecords(currentGroup.students.map(student => ({
        student: student._id || student, // student might be object or ID
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
    if (!selectedGroup) return toast.error('Qrup seçin');
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
      toast.success('Davamiyyət uğurla yadda saxlanıldı');
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Davamiyyət</h1>
          <p className="text-slate-500 text-sm">Tələbələrin dərslərdə iştirakının qeydiyyatı</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <Calendar size={18} className="text-slate-400 ml-2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-none outline-none text-sm font-medium text-slate-700 bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Group Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-indigo-600" />
              Qrup Seçin
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {groupsData?.data?.map(group => (
                <button
                  key={group._id}
                  onClick={() => setSelectedGroup(group._id)}
                  className={`w-full p-4 rounded-2xl text-left transition-all border ${
                    selectedGroup === group._id 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100' 
                      : 'bg-slate-50 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-sm">{group.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
                    {group.course}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedGroup && (
            <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-200 space-y-3">
              <h4 className="font-bold">Dərs Mövzusu</h4>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Bugünkü dərsdə nə keçildi?"
                className="w-full bg-indigo-500/50 border border-indigo-400/50 rounded-xl p-3 text-sm placeholder:text-indigo-200 outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none h-24"
              ></textarea>
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedGroup ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-[500px] flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Tələbə siyahısı üçün qrup seçin</h3>
              <p className="text-slate-500 max-w-xs">Sol tərəfdəki siyahıdan müvafiq qrupu seçərək davamiyyəti qeyd etməyə başlaya bilərsiniz.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800">{currentGroup?.name} — Tələbə Siyahısı</h3>
                  <p className="text-xs text-slate-500 mt-1">{currentGroup?.students?.length} nəfər</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  <Save size={18} />
                  <span>Yadda Saxla</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/30 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Tələbə</th>
                      <th className="px-6 py-4">İştirak Statusu</th>
                      <th className="px-6 py-4">Qeyd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {records.map((rec) => {
                      const student = currentGroup?.students?.find(s => (s._id || s) === (rec.student._id || rec.student));
                      if (!student) return null;

                      return (
                        <tr key={student._id || student} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                                {student.name?.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                  {student.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl w-fit">
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'present')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  rec.status === 'present' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-white'
                                }`}
                              >
                                <CheckCircle2 size={14} />
                                <span>İştirak</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'absent')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  rec.status === 'absent' ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'text-slate-500 hover:bg-white'
                                }`}
                              >
                                <XCircle size={14} />
                                <span>İştirak etmir</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(student._id || student, 'late')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  rec.status === 'late' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'text-slate-500 hover:bg-white'
                                }`}
                              >
                                <Clock size={14} />
                                <span>Gecikir</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="Qeyd..."
                              value={rec.note}
                              onChange={(e) => {
                                const newRecords = records.map(r => 
                                  (r.student._id || r.student) === (student._id || student) ? { ...r, note: e.target.value } : r
                                );
                                setRecords(newRecords);
                              }}
                              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
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
