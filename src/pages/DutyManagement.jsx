import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Plus, Calendar, MapPin, Clock, X, Trash2, Edit2, Save, CheckCircle, XCircle, Bell } from 'lucide-react';

export default function DutyManagementPage() {
  const { user } = useAuth();
  const [showAddSetting, setShowAddSetting] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState({
    duty_name: '',
    duty_type: 'break',
    location: '',
    time: '',
    days: [],
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['dutySettings'],
    queryFn: () => base44.entities.DutySettings.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['dutyAssignments', selectedMonth, selectedYear],
    queryFn: () => base44.entities.DutyAssignment.filter({ 
      month: selectedMonth + 1,
      year: selectedYear 
    }),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const teachers = staff.filter(u => ['teacher', 'coordinator', 'counselor', 'vice_principal'].includes(u.role));

  const createSetting = useMutation({
    mutationFn: (data) => base44.entities.DutySettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySettings'] });
      setShowAddSetting(false);
      setFormData({ duty_name: '', duty_type: 'break', location: '', time: '', days: [], description: '' });
    },
  });

  const updateSetting = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DutySettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySettings'] });
      setEditingSetting(null);
    },
  });

  const deleteSetting = useMutation({
    mutationFn: (id) => base44.entities.DutySettings.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutySettings'] });
    },
  });

  const createAssignment = useMutation({
    mutationFn: (data) => base44.entities.DutyAssignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutyAssignments'] });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: (id) => base44.entities.DutyAssignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutyAssignments'] });
    },
  });

  const updateAssignmentStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.DutyAssignment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dutyAssignments'] });
    },
  });

  const isManager = user && ['admin', 'vice_principal', 'principal'].includes(user.role);

  // Teacher's own pending duty assignments
  const myPendingDuties = assignments.filter(a =>
    a.staff_email === user?.email && (!a.status || a.status === 'pending')
  );

  const handleSubmit = () => {
    if (editingSetting) {
      updateSetting.mutate({ id: editingSetting, data: formData });
    } else {
      createSetting.mutate(formData);
    }
  };

  const handleAssign = (day, settingId, staffEmail, staffName) => {
    const setting = settings.find(s => s.id === settingId);
    createAssignment.mutate({
      staff_email: staffEmail,
      staff_name: staffName,
      day,
      duty_type: setting.duty_name,
      time: setting.time,
      month: selectedMonth + 1,
      year: selectedYear,
    });
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ניהול תורנויות</h1>
          <p className="text-sm text-slate-500">הגדרת תורנויות ושיבוץ צוות</p>
        </div>
      </div>

      {/* Teacher: Pending Duty Approvals */}
      {myPendingDuties.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
          <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-amber-600" />
            תורנויות הממתינות לאישורך ({myPendingDuties.length})
          </h3>
          <div className="space-y-2">
            {myPendingDuties.map(duty => (
              <div key={duty.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                <div>
                  <p className="font-semibold text-slate-800">{duty.duty_type}</p>
                  <p className="text-sm text-slate-500">{duty.day}/{selectedMonth + 1}/{selectedYear} • {duty.time}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateAssignmentStatus.mutate({ id: duty.id, status: 'confirmed' })}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    אישור
                  </button>
                  <button
                    onClick={() => updateAssignmentStatus.mutate({ id: duty.id, status: 'declined' })}
                    className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm font-bold hover:bg-red-200 flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    דחייה
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Management */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            הגדרות תורנויות
          </h2>
          <button
            onClick={() => {
              setShowAddSetting(true);
              setEditingSetting(null);
              setFormData({ duty_name: '', duty_type: 'break', location: '', time: '', days: [], description: '' });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            תורנות חדשה
          </button>
        </div>

        {showAddSetting && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">
                {editingSetting ? 'עריכת תורנות' : 'תורנות חדשה'}
              </h3>
              <button onClick={() => setShowAddSetting(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">שם התורנות</label>
                <input
                  type="text"
                  value={formData.duty_name}
                  onChange={(e) => setFormData({ ...formData, duty_name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="כניסה בוקר"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">סוג</label>
                <select
                  value={formData.duty_type}
                  onChange={(e) => setFormData({ ...formData, duty_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="entrance">כניסה</option>
                  <option value="break">הפסקה</option>
                  <option value="exit">יציאה</option>
                  <option value="lunch">ארוחת צהריים</option>
                  <option value="special">מיוחד</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">מיקום</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="שער ראשי"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">שעה</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-2">ימים</label>
                <div className="flex gap-2">
                  {dayNames.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const days = formData.days.includes(idx)
                          ? formData.days.filter(d => d !== idx)
                          : [...formData.days, idx];
                        setFormData({ ...formData, days });
                      }}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        formData.days.includes(idx)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                  placeholder="פרטים נוספים..."
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              שמור
            </button>
          </div>
        )}

        <div className="space-y-3">
          {settings.map(setting => (
            <div key={setting.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {setting.duty_name}
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {setting.duty_type === 'entrance' ? 'כניסה' :
                       setting.duty_type === 'break' ? 'הפסקה' :
                       setting.duty_type === 'exit' ? 'יציאה' :
                       setting.duty_type === 'lunch' ? 'ארוחת צהריים' : 'מיוחד'}
                    </span>
                  </h4>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {setting.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {setting.time}
                    </p>
                    <p className="text-xs">
                      ימים: {setting.days.map(d => dayNames[d]).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSetting(setting.id);
                      setFormData(setting);
                      setShowAddSetting(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSetting.mutate(setting.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Schedule */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            לוח תורנויות חודשי
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleDateString('he-IL', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="p-3 text-right font-bold">תאריך</th>
                {settings.map(setting => (
                  <th key={setting.id} className="p-3 text-center font-bold">
                    {setting.duty_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(selectedYear, selectedMonth, day);
                const dayOfWeek = date.getDay();
                
                return (
                  <tr key={day} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">
                      {day}/{selectedMonth + 1} ({dayNames[dayOfWeek]})
                    </td>
                    {settings.map(setting => {
                      const assignment = assignments.find(a => 
                        a.day === day && a.duty_type === setting.duty_name
                      );
                      const isDutyDay = setting.days.includes(dayOfWeek);

                      return (
                        <td key={setting.id} className="p-2 text-center">
                          {isDutyDay ? (
                            assignment ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  assignment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                  assignment.status === 'declined' ? 'bg-red-100 text-red-700 line-through' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {assignment.staff_name}
                                  {assignment.status === 'confirmed' && ' ✓'}
                                  {assignment.status === 'declined' && ' ✗'}
                                </span>
                                {isManager && (
                                <button
                                  onClick={() => deleteAssignment.mutate(assignment.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                )}
                              </div>
                            ) : (
                              <select
                                onChange={(e) => {
                                  const teacher = teachers.find(t => t.email === e.target.value);
                                  if (teacher) {
                                    handleAssign(day, setting.id, teacher.email, teacher.full_name);
                                  }
                                }}
                                className="text-xs p-1 border rounded w-full"
                                value=""
                              >
                                <option value="">בחר...</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.email}>{t.full_name}</option>
                                ))}
                              </select>
                            )
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}