import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Shield, Plus, ChevronRight, ChevronLeft, X, Trash2, Edit2, Settings, CalendarDays, User, Bell, BarChart2 } from 'lucide-react';

const DAYS      = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const DAYS_SH   = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];

const DEFAULT_DUTIES = [
  { id: '_morning',  duty_name: 'תורנות בוקר',      duty_type: 'morning',  time: '07:30', days: [0,1,2,3,4,5] },
  { id: '_break1',   duty_name: 'הפסקה ראשונה',     duty_type: 'break1',   time: '10:00', days: [0,1,2,3,4,5] },
  { id: '_break2',   duty_name: 'הפסקה שנייה',      duty_type: 'break2',   time: '12:00', days: [0,1,2,3,4,5] },
  { id: '_transport',duty_name: 'תורנות הסעות',     duty_type: 'transport',time: '14:00', days: [0,1,2,3,4]   },
];

function weekStart(date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function toISO(d) { return d.toISOString().split('T')[0]; }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL',{day:'numeric',month:'numeric'}); }
function fmtMonth(d) {
  return new Date(d).toLocaleDateString('he-IL',{month:'long',year:'numeric'});
}

export default function DutyManagementPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const specialRoles = Array.isArray(user?.special_roles) ? user.special_roles : [];
  const isAdmin = ['admin','vice_principal','coordinator'].includes(user?.role) || specialRoles.includes('security_coordinator');

  const [tab,        setTab]        = useState('weekly');
  const [weekOf,     setWeekOf]     = useState(() => weekStart(new Date()));
  const [assigning,  setAssigning]  = useState(null); // { dutyId, date }
  const [settingForm,setSettingForm]= useState(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: settings = [] } = useQuery({
    queryKey: ['dutySettings'],
    queryFn: () => base44.entities.DutySettings.list(),
  });

  const allDuties = settings.length > 0 ? settings : DEFAULT_DUTIES;

  const weekDates = Array.from({length:6}, (_,i) => toISO(addDays(weekOf,i)));

  const { data: weekAssignments = [] } = useQuery({
    queryKey: ['dutyAssignments', weekDates[0]],
    queryFn: () => base44.entities.DutyAssignment.filter({ week_start: weekDates[0] }),
  });

  const { data: myAssignments = [] } = useQuery({
    queryKey: ['myDuties', user?.email],
    queryFn: () => base44.entities.DutyAssignment.filter({ staff_email: user.email }),
    enabled: !!user,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });
  const teachers = staff.filter(u => ['teacher','coordinator','counselor','vice_principal','admin'].includes(u.role));

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createAssignment = useMutation({
    mutationFn: (rows) => Promise.all(rows.map(d => base44.entities.DutyAssignment.create(d))),
    onSuccess: (_, rows) => {
      qc.invalidateQueries({ queryKey: ['dutyAssignments','myDuties','allDutyAssignments'] });
      setAssigning(null);
      toast.success(rows.length > 1 ? `${rows.length} שיבוצים נשמרו` : 'שובצה');
    },
    onError: () => toast.error('שגיאה בשיבוץ'),
  });

  const deleteAssignment = useMutation({
    mutationFn: (id) => base44.entities.DutyAssignment.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dutyAssignments','myDuties'] }); toast.success('בוטל'); },
  });

  const createSetting = useMutation({
    mutationFn: (d) => base44.entities.DutySettings.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dutySettings'] }); setSettingForm(null); toast.success('נשמר'); },
  });
  const updateSetting = useMutation({
    mutationFn: ({id, data}) => base44.entities.DutySettings.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dutySettings'] }); setSettingForm(null); toast.success('עודכן'); },
  });
  const deleteSetting = useMutation({
    mutationFn: (id) => base44.entities.DutySettings.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dutySettings'] }); toast.success('נמחק'); },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getCellAssignments = (dutyId, date) =>
    weekAssignments.filter(a => a.duty_id === dutyId && a.date === date);

  const myUpcoming = useMemo(() =>
    myAssignments
      .filter(a => a.date >= toISO(new Date()))
      .sort((a,b) => a.date < b.date ? -1 : 1),
    [myAssignments]);

  const myThisWeek = myAssignments.filter(a => weekDates.includes(a.date));

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['allDutyAssignments'],
    queryFn: () => base44.entities.DutyAssignment.list(),
    enabled: isAdmin,
  });

  const dutyReport = useMemo(() => {
    const byTeacher = {};
    allAssignments.forEach(a => {
      if (!byTeacher[a.staff_name]) byTeacher[a.staff_name] = { name: a.staff_name, total: 0, byType: {} };
      byTeacher[a.staff_name].total++;
      byTeacher[a.staff_name].byType[a.duty_name] = (byTeacher[a.staff_name].byType[a.duty_name] || 0) + 1;
    });
    return Object.values(byTeacher).sort((a,b) => b.total - a.total);
  }, [allAssignments]);

  const TABS = [
    { id:'weekly',  label:'לוח שבועי',     icon: CalendarDays },
    { id:'mine',    label:'התורנויות שלי',  icon: User, badge: myThisWeek.length||null },
    ...(isAdmin ? [
      { id:'reports',  label:'דוחות',      icon: BarChart2 },
      { id:'settings', label:'הגדרות',     icon: Settings },
    ] : []),
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">ניהול תורנויות</h1>
          <p className="text-xs text-slate-400">שיבוץ תורנויות בוקר, הפסקות והסעות</p>
        </div>
      </div>

      {/* Tabs + week nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab===t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="h-4 w-4" />{t.label}
              {t.badge ? <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 rounded-full py-0.5">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'weekly' && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekOf(w => addDays(w,-7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <span className="text-xs font-semibold text-slate-600 min-w-[110px] text-center">
              {fmtDate(weekOf)} – {fmtDate(addDays(weekOf,5))}
            </span>
            <button onClick={() => setWeekOf(w => addDays(w,7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        )}
      </div>

      {/* ══════════ WEEKLY TAB ══════════ */}
      {tab === 'weekly' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-right px-3 py-3 text-xs font-bold text-slate-400 w-[130px]">תורנות</th>
                  {weekDates.map((date,i) => {
                    const isToday = date === toISO(new Date());
                    return (
                      <th key={i} className={`px-2 py-3 text-center min-w-[110px] ${isToday ? 'bg-blue-50' : ''}`}>
                        <p className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>{DAYS_SH[i]} {DAYS[i]}</p>
                        <p className={`text-[10px] mt-0.5 ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{fmtDate(date)}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allDuties.map((duty, idx) => (
                  <tr key={duty.id || duty.duty_type} className={idx%2===0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="px-3 py-3 border-b border-slate-50">
                      <p className="font-semibold text-slate-800 text-xs">{duty.duty_name}</p>
                      {duty.time && <p className="text-[10px] text-slate-400 mt-0.5">{duty.time}</p>}
                    </td>
                    {weekDates.map((date,di) => {
                      const isDutyDay = duty.days?.includes(di) ?? true;
                      const cellAssigns = getCellAssignments(duty.id || duty.duty_type, date);
                      return (
                        <td key={di} className="px-1.5 py-2 border-b border-slate-50 align-top">
                          {isDutyDay ? (
                            <div className="space-y-1">
                              {cellAssigns.map(a => (
                                <div key={a.id} className={`flex items-start justify-between gap-1 rounded-lg px-2 py-1.5 ${a.staff_email === user?.email ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-semibold leading-tight truncate">{a.staff_name?.split(' ')[0]}</p>
                                    {a.location && <p className={`text-[9px] leading-tight ${a.staff_email===user?.email ? 'text-blue-200' : 'text-slate-400'}`}>{a.location}</p>}
                                  </div>
                                  {isAdmin && (
                                    <button onClick={() => deleteAssignment.mutate(a.id)} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5">
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {isAdmin && (
                                <button onClick={() => setAssigning({ dutyId: duty.id || duty.duty_type, dutyName: duty.duty_name, date })}
                                  className="w-full text-[10px] text-slate-300 hover:text-blue-500 hover:bg-blue-50 border-2 border-dashed border-slate-100 hover:border-blue-200 rounded-lg py-1 transition-all">
                                  + הוסף
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-200 text-[10px] px-2">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ MY DUTIES TAB ══════════ */}
      {tab === 'mine' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">התורנויות שלי</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myUpcoming.length} קרובות</span>
          </div>
          {myUpcoming.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-14">אין תורנויות מתוכננות</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {myUpcoming.map(a => {
                const isToday = a.date === toISO(new Date());
                return (
                  <div key={a.id} className={`flex items-center gap-3 px-5 py-4 ${isToday ? 'bg-blue-50' : 'hover:bg-slate-50'} transition-colors`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isToday ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      🛡️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{a.duty_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {isToday
                          ? <span className="text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded-md">היום</span>
                          : <span>{new Date(a.date).toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'numeric'})}</span>}
                        {a.time && <><span>·</span><span>{a.time}</span></>}
                        {a.location && <><span>·</span><span className="font-medium text-slate-600">{a.location}</span></>}
                      </div>
                    </div>
                    {isToday && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold">
                        <Bell className="h-3 w-3" /> היום
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {tab === 'reports' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">תורנויות לפי מורה</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allAssignments.length} שיבוצים</span>
            </div>
            {dutyReport.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-12">אין נתונים עדיין</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {dutyReport.map((t,i) => (
                  <div key={t.name} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-5">{i+1}</span>
                        <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                      </div>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{t.total} תורנויות</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mr-7">
                      {Object.entries(t.byType).map(([type, count]) => (
                        <span key={type} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {type}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">תורנויות לפי סוג</h2>
            </div>
            <div className="p-5">
              {allDuties.map(duty => {
                const count = allAssignments.filter(a => a.duty_name === duty.duty_name).length;
                const maxCount = Math.max(...allDuties.map(d => allAssignments.filter(a => a.duty_name === d.duty_name).length), 1);
                return (
                  <div key={duty.id || duty.duty_type} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-slate-700">{duty.duty_name}</p>
                      <span className="text-xs text-slate-500">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.round((count/maxCount)*100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SETTINGS TAB ══════════ */}
      {tab === 'settings' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">סוגי תורנויות</h2>
              <button onClick={() => setSettingForm({ duty_name:'', duty_type:'morning', time:'', days:[0,1,2,3,4], description:'' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                <Plus className="h-3.5 w-3.5" /> הוסף סוג
              </button>
            </div>

            {settingForm && (
              <div className="mx-4 my-3 bg-blue-50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">{settingForm.id ? 'עריכה' : 'סוג חדש'}</p>
                  <button onClick={() => setSettingForm(null)}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2">
                    <input className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                      value={settingForm.duty_name} onChange={e => setSettingForm(f=>({...f,duty_name:e.target.value}))}
                      placeholder="שם התורנות (תורנות בוקר...)" autoFocus />
                  </div>
                  <input type="time" className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                    value={settingForm.time||''} onChange={e => setSettingForm(f=>({...f,time:e.target.value}))} />
                  <input className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                    value={settingForm.description||''} onChange={e => setSettingForm(f=>({...f,description:e.target.value}))}
                    placeholder="תיאור..." />
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-slate-500 mb-2">ימים</p>
                    <div className="flex gap-2 flex-wrap">
                      {DAYS_SH.map((d,i) => (
                        <button key={i}
                          onClick={() => setSettingForm(f => ({ ...f, days: f.days?.includes(i) ? f.days.filter(x=>x!==i) : [...(f.days||[]),i] }))}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${(settingForm.days||[]).includes(i) ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!settingForm.duty_name?.trim()) return;
                    if (settingForm.id) updateSetting.mutate({ id: settingForm.id, data: settingForm });
                    else createSetting.mutate(settingForm);
                  }}
                  disabled={!settingForm.duty_name?.trim()}
                  className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                  שמור
                </button>
              </div>
            )}

            <div className="divide-y divide-slate-50">
              {allDuties.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-10">לחצי "הוסף סוג" למעלה</p>
              )}
              {allDuties.map(s => (
                <div key={s.id || s.duty_type} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="text-xl flex-shrink-0">🛡️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{s.duty_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.time && <>{s.time} · </>}
                      {(s.days||[]).map(d=>DAYS_SH[d]).join(' ')}
                    </p>
                  </div>
                  {!s.id?.startsWith('_') && (
                    <div className="flex gap-0.5">
                      <button onClick={() => setSettingForm({...s})} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if(confirm('למחוק?')) deleteSetting.mutate(s.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {s.id?.startsWith('_') && <span className="text-[10px] text-slate-300 px-2">ברירת מחדל</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ASSIGN MODAL ══════════ */}
      {assigning && (
        <AssignModal
          dutyName={assigning.dutyName}
          date={assigning.date}
          teachers={teachers}
          onClose={() => setAssigning(null)}
          onAssign={(staffEmail, staffName, location, recurringUntil) => {
            const dates = recurringUntil
              ? getDatesForDayInRange(assigning.date, recurringUntil)
              : [assigning.date];
            createAssignment.mutate(dates.map(date => ({
              duty_id: assigning.dutyId,
              duty_name: assigning.dutyName,
              date,
              week_start: toISO(weekStart(new Date(date))),
              staff_email: staffEmail,
              staff_name: staffName,
              location: location || '',
            })));
          }}
          pending={createAssignment.isPending}
        />
      )}
    </div>
  );
}

function endOfSchoolYear() {
  const now = new Date();
  const thisJun30 = new Date(now.getFullYear(), 5, 30);
  return toISO(now > thisJun30 ? new Date(now.getFullYear() + 1, 5, 30) : thisJun30);
}

function getDatesForDayInRange(startDate, endDate) {
  const dates = [];
  const d = new Date(startDate);
  while (toISO(d) <= endDate) {
    dates.push(toISO(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function AssignModal({ dutyName, date, teachers, onClose, onAssign, pending }) {
  const [staffEmail,    setStaffEmail]    = useState('');
  const [location,      setLocation]      = useState('');
  const [recurring,     setRecurring]     = useState(false);
  const [recurringUntil,setRecurringUntil]= useState(() => {
    const d = new Date(date); d.setDate(d.getDate() + 5 * 7);
    return toISO(d);
  });
  const inp = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white';

  const hebDate = new Date(date).toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'numeric'});
  const previewCount = recurring ? getDatesForDayInRange(date, recurringUntil).length : 1;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl">
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-5 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <h3 className="font-bold text-white text-base">{dutyName}</h3>
            <p className="text-blue-100 text-sm mt-0.5">{hebDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">בחרי מורה <span className="text-red-400">*</span></label>
            <select className={inp} value={staffEmail} onChange={e => setStaffEmail(e.target.value)} autoFocus>
              <option value="">— בחרי מורה —</option>
              {teachers.map(t => (
                <option key={t.id} value={t.email}>{t.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">מיקום / הוראות</label>
            <input className={inp} value={location} onChange={e => setLocation(e.target.value)}
              placeholder="חצר קדמית, שער ראשי..." />
          </div>

          {/* Recurring toggle */}
          <div className={`rounded-xl border p-3 transition-colors ${recurring ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
            <button
              type="button"
              onClick={() => setRecurring(r => !r)}
              className="flex items-center justify-between w-full">
              <span className="text-sm font-semibold text-slate-700">חזרה שבועית</span>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${recurring ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${recurring ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </button>
            {recurring && (
              <div className="mt-2.5 space-y-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">עד תאריך</label>
                  <div className="flex gap-1.5">
                    <input type="date" className={`${inp} flex-1`} value={recurringUntil} min={date}
                      onChange={e => setRecurringUntil(e.target.value)} />
                    <button type="button"
                      onClick={() => setRecurringUntil(endOfSchoolYear())}
                      className="flex-shrink-0 px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors whitespace-nowrap">
                      סוף שנה
                    </button>
                  </div>
                </div>
                {previewCount > 0 && (
                  <p className="text-xs text-blue-600 font-semibold">
                    יישמר ב-{previewCount} שבועות
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const t = teachers.find(x => x.email === staffEmail);
              if (!t) return;
              onAssign(staffEmail, t.full_name, location, recurring ? recurringUntil : null);
            }}
            disabled={pending || !staffEmail}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-colors mt-1">
            {pending ? 'שומר...' : recurring ? `✓  שבצי (${previewCount} שבועות)` : '✓  שבצי'}
          </button>
        </div>
      </div>
    </div>
  );
}
