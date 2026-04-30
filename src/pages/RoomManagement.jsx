import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { ChevronRight, ChevronLeft, Plus, X, Trash2, Edit2, ToggleLeft, ToggleRight, FileSpreadsheet, CalendarDays, BookOpen, Layers, Clock, BarChart2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { notify } from '@/lib/notify';
import * as XLSX from 'xlsx';

const DAYS       = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳'];
const HOURS      = [8, 9, 10, 11, 12, 13, 14];
const CANCEL_HOURS = 24;

const fmtHour   = (h) => `${String(h).padStart(2,'0')}:00`;
const fmtPeriod = (h) => `שעה ${HOURS.indexOf(h) + 1}`;
const EMOJI    = { room: '🏫', equipment: '🔧' };
const TYPE_LABEL = { room: 'חדר', equipment: 'ציוד' };

function weekStart(date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function toISO(d) { return d.toISOString().split('T')[0]; }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL',{day:'numeric',month:'numeric'}); }
function hebDay(d) { return DAYS[new Date(d).getDay()] || ''; }

export default function RoomManagementPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const specialRoles = Array.isArray(user?.special_roles) ? user.special_roles : [];
  const isAdmin   = ['admin','vice_principal'].includes(user?.role) || specialRoles.includes('room_manager') || specialRoles.includes('equipment_manager');
  const canManage = !!user;

  const [weekOf,        setWeekOf]        = useState(() => weekStart(new Date()));
  const [selDay,        setSelDay]        = useState(new Date().getDay() < 5 ? new Date().getDay() : 0);
  const [tab,           setTab]           = useState('calendar');
  const [bookingTarget, setBookingTarget] = useState(null);
  const [releaseTarget, setReleaseTarget] = useState(null);
  const [resourceForm,  setResourceForm]  = useState(null);
  const [filterType,    setFilterType]    = useState('all');
  const [quickHour,     setQuickHour]     = useState(null); // מצב חיפוש מהיר לפי שעה

  const selDate  = toISO(addDays(weekOf, selDay));
  const todayISO = toISO(new Date());
  const isThisWeek = toISO(weekStart(new Date())) === toISO(weekOf);

  const { data: resources = [] } = useQuery({ queryKey: ['rooms-v2'],         queryFn: () => base44.firestoreRooms.list() });
  const { data: bookings  = [] } = useQuery({ queryKey: ['room-bookings-v2'], queryFn: () => base44.firestoreRoomBookings.filter({ status: 'active' }) });

  const activeRes  = resources.filter(r => r.active !== false);
  const visibleRes = activeRes.filter(r =>
    filterType === 'all'       ? true :
    filterType === 'room'      ? r.resource_type !== 'equipment' :
    r.resource_type === 'equipment'
  );
  const rooms     = activeRes.filter(r => r.resource_type !== 'equipment');
  const equipment = activeRes.filter(r => r.resource_type === 'equipment');

  const dayBookings = useMemo(() => {
    const map = {};
    bookings.forEach(b => { if (b.date === selDate) map[`${b.resource_id}_${b.hour_number}`] = b; });
    return map;
  }, [bookings, selDate]);

  const myBookings = useMemo(() =>
    bookings.filter(b => b.teacher_email === user?.email)
      .sort((a,b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.hour_number - b.hour_number),
    [bookings, user?.email]);

  const todayTotal = bookings.filter(b => b.date === todayISO).length;
  const weekTotal  = bookings.filter(b => {
    const d = new Date(b.date); return d >= weekOf && d <= addDays(weekOf, 4);
  }).length;

  const createBooking = useMutation({
    mutationFn: async ({ resource, date, hour, classN, subject, notes }) => {
      const ex = await base44.firestoreRoomBookings.filter({ resource_id: resource.id, date, hour_number: hour, status: 'active' });
      if (ex.length > 0) throw new Error('המשבצת נתפסה זה עתה');
      return base44.firestoreRoomBookings.create({ resource_id: resource.id, resource_name: resource.name, date, hour_number: hour, teacher_email: user.email, teacher_name: user.full_name, class_name: classN, subject: subject||'', notes: notes||'', status: 'active' });
    },
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['room-bookings-v2'] });
      toast.success(`שובצת: ${vars.resource.name} ${fmtHour(vars.hour)}`);
      await notify({ user_email: user.email, phone: user.phone, type: 'booking_confirm', title: 'אישור שיבוץ', message: `שובצת ב${vars.resource.name}, ${hebDay(vars.date)} ${fmtDate(vars.date)}, ${fmtHour(vars.hour)}, כיתה ${vars.classN}.`, link: 'room-management' }).catch(()=>{});
      setBookingTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const releaseBooking = useMutation({
    mutationFn: ({ booking, reason }) => base44.firestoreRoomBookings.update(booking.id, { status:'released', released_by: user.full_name, release_reason: reason, released_date: new Date().toISOString() }),
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['room-bookings-v2'] });
      toast.success('השיבוץ שוחרר');
      await notify({ user_email: vars.booking.teacher_email, type: 'booking_released', title: 'שיבוץ בוטל', message: `השיבוץ שלך ב${vars.booking.resource_name}, ${fmtDate(vars.booking.date)}, ${fmtHour(vars.booking.hour_number)} בוטל. סיבה: ${vars.reason}`, link: 'room-management' }).catch(()=>{});
      setReleaseTarget(null);
    },
    onError: () => toast.error('שגיאה'),
  });

  const cancelOwn = useMutation({
    mutationFn: (b) => base44.firestoreRoomBookings.update(b.id, { status:'released', released_by: user.full_name, release_reason:'ביטול עצמי', released_date: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-bookings-v2'] }); toast.success('השיבוץ בוטל'); setReleaseTarget(null); },
  });

  const saveResource = useMutation({
    mutationFn: (d) => d.id ? base44.firestoreRooms.update(d.id, d) : base44.firestoreRooms.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms-v2'] }); setResourceForm(null); toast.success('נשמר'); },
    onError: () => toast.error('שגיאה'),
  });
  const deleteResource = useMutation({
    mutationFn: (id) => base44.firestoreRooms.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms-v2'] }); toast.success('נמחק'); },
  });
  const toggleActive = (r) => base44.firestoreRooms.update(r.id, { active: !r.active }).then(() => qc.invalidateQueries({ queryKey: ['rooms-v2'] }));

  const canCancelOwn = (b) => new Date(b.date+'T08:00') - new Date() > CANCEL_HOURS * 3_600_000;

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(bookings.map(b => ({ 'משאב': b.resource_name, 'תאריך': b.date, 'יום': hebDay(b.date), 'שעה': fmtHour(b.hour_number), 'מורה': b.teacher_name, 'כיתה': b.class_name, 'מקצוע': b.subject||'', 'הערות': b.notes||'' })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'שיבוצים');
    XLSX.writeFile(wb, `bookings-${toISO(new Date())}.xlsx`); toast.success('Excel הורד');
  }

  const bookingReport = useMemo(() => {
    const byRes = {};
    bookings.forEach(b => {
      if (!byRes[b.resource_name]) byRes[b.resource_name] = { name: b.resource_name, total: 0, byTeacher: {} };
      byRes[b.resource_name].total++;
      byRes[b.resource_name].byTeacher[b.teacher_name] = (byRes[b.resource_name].byTeacher[b.teacher_name]||0) + 1;
    });
    return Object.values(byRes).sort((a,b) => b.total - a.total);
  }, [bookings]);

  const teacherReport = useMemo(() => {
    const byT = {};
    bookings.forEach(b => {
      if (!byT[b.teacher_name]) byT[b.teacher_name] = { name: b.teacher_name, total: 0 };
      byT[b.teacher_name].total++;
    });
    return Object.values(byT).sort((a,b) => b.total - a.total);
  }, [bookings]);

  const TABS = [
    { id: 'calendar', label: 'לוח שיבוצים',   icon: CalendarDays },
    { id: 'mine',     label: 'שלי',            icon: BookOpen, badge: myBookings.length || null },
    ...(isAdmin ? [{ id: 'reports', label: 'דוחות', icon: BarChart2 }] : []),
    ...(canManage ? [{ id: 'manage', label: 'ניהול', icon: Layers }] : []),
  ];

  return (
    <div className="space-y-4" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">שיבוץ חדרים וציוד</h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>השבוע: <strong className="text-slate-600">{weekTotal}</strong></span>
            {todayTotal > 0 && <span className="text-blue-600 font-semibold">· היום: {todayTotal}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
          )}
        </div>
      </div>

      {/* ── Nav bar: tabs + week nav together ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold transition-all ${tab===t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon className="h-5 w-5" />
              {t.label}
              {t.badge ? <span className="bg-blue-500 text-white text-xs font-bold px-2 rounded-full leading-none py-0.5">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'calendar' && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setWeekOf(w => addDays(w,-7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <span className="text-xs font-semibold text-slate-600 min-w-[96px] text-center">
              {fmtDate(weekOf)}–{fmtDate(addDays(weekOf,4))}
            </span>
            <button onClick={() => setWeekOf(w => addDays(w,7))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            {!isThisWeek && (
              <button onClick={() => { setWeekOf(weekStart(new Date())); setSelDay(new Date().getDay() < 5 ? new Date().getDay() : 0); }}
                className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg font-semibold transition-colors">
                היום
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ CALENDAR TAB ══════════════ */}
      {tab === 'calendar' && (
        <div className="space-y-3">

          {/* Day selector */}
          <div className="grid grid-cols-5 gap-2">
            {DAYS_SHORT.map((d, i) => {
              const date  = toISO(addDays(weekOf, i));
              const count = bookings.filter(b => b.date === date).length;
              const isToday = date === todayISO;
              return (
                <button key={i} onClick={() => setSelDay(i)}
                  className={`py-3 px-1 rounded-xl text-center transition-all relative ${
                    selDay===i
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  }`}>
                  <p className="text-base font-bold">{d}</p>
                  <p className={`text-xs mt-0.5 ${selDay===i ? 'text-blue-200' : 'text-slate-400'}`}>{fmtDate(date)}</p>
                  {count > 0 && (
                    <span className={`absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] text-[10px] font-bold px-1 rounded-full flex items-center justify-center ${selDay===i ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">סנן:</span>
            {[['all','הכל'],['room','🏫 חדרים'],['equipment','🔧 ציוד']].map(([v,l]) => (
              <button key={v} onClick={() => setFilterType(v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterType===v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Quick hour search */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">מה פנוי בשעה?</p>
              {quickHour !== null && (
                <button onClick={() => setQuickHour(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> הצג הכל
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {HOURS.map(h => {
                const freeCount = visibleRes.filter(r => !dayBookings[`${r.id}_${h}`]).length;
                return (
                  <button key={h} onClick={() => setQuickHour(quickHour === h ? null : h)}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[64px] ${
                      quickHour === h
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                        : freeCount === 0
                        ? 'bg-slate-50 border-slate-100 text-slate-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    <span className="text-sm font-bold">{fmtPeriod(h)}</span>
                    <span className={`text-[11px] mt-0.5 ${quickHour===h ? 'text-blue-200' : freeCount===0 ? 'text-slate-300' : 'text-emerald-600 font-semibold'}`}>
                      {freeCount === 0 ? 'תפוס' : `${freeCount} פנויים`}
                    </span>
                  </button>
                );
              })}
            </div>
            {quickHour !== null && (
              <p className="mt-3 text-sm text-slate-500">
                חדרים פנויים ב<strong className="text-blue-600">{fmtPeriod(quickHour)}</strong>:
              </p>
            )}
          </div>

          {/* Resource cards */}
          {quickHour !== null && visibleRes.filter(r => !dayBookings[`${r.id}_${quickHour}`]).length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-10 text-center">
              <p className="text-slate-400 text-sm">אין משאבים פנויים ב{fmtPeriod(quickHour)}</p>
            </div>
          )}
          {visibleRes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
              <p className="text-slate-400 text-sm">
                {activeRes.length === 0
                  ? (canManage ? <>עברי לטאב <strong>ניהול</strong> להוספת חדרים וציוד</> : 'אין משאבים מוגדרים')
                  : 'אין משאבים בסינון זה'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleRes
                .filter(r => quickHour === null || !dayBookings[`${r.id}_${quickHour}`])
                .map(res => (
                <ResourceCard
                  key={res.id}
                  res={res}
                  hours={quickHour !== null ? [quickHour] : HOURS}
                  dayBookings={dayBookings}
                  userEmail={user?.email}
                  isAdmin={isAdmin}
                  selDate={selDate}
                  onBook={(hour) => setBookingTarget({ resource: res, date: selDate, hour })}
                  onRelease={(b) => setReleaseTarget(b)}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap px-1">
            {[['bg-blue-500','text-white','שיבוץ שלי'],['bg-rose-50 border border-rose-200','text-rose-700','תפוס'],['bg-white border-2 border-dashed border-slate-200','text-slate-400','פנוי']].map(([bg,tc,label]) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className={`w-5 h-5 rounded-lg ${bg} ${tc} flex items-center justify-center text-[8px] font-bold`}>
                  {label === 'פנוי' ? '+' : '✓'}
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ MY BOOKINGS TAB ══════════════ */}
      {tab === 'mine' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">השיבוצים שלי</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myBookings.length} פעילים</span>
          </div>
          {myBookings.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-14">אין שיבוצים פעילים</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {myBookings.map(b => {
                const cancellable = canCancelOwn(b);
                const isToday = b.date === todayISO;
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isToday ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {EMOJI[b.resource_type] || '🏫'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{b.resource_name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {isToday
                          ? <span className="text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-md">היום</span>
                          : <span>{hebDay(b.date)} {fmtDate(b.date)}</span>}
                        <Clock className="h-3 w-3 text-slate-300 flex-shrink-0" />
                        <span className="font-medium text-slate-500">{fmtPeriod(b.hour_number)}</span>
                        <span>·</span>
                        <span>כיתה {b.class_name}</span>
                        {b.subject && <><span>·</span><span>{b.subject}</span></>}
                      </div>
                    </div>
                    {cancellable ? (
                      <button onClick={() => cancelOwn.mutate(b)}
                        className="flex-shrink-0 text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition-colors border border-transparent hover:border-red-100">
                        ביטול
                      </button>
                    ) : (
                      <span className="flex-shrink-0 text-[10px] text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">נעול</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MANAGE TAB ══════════════ */}
      {tab === 'manage' && canManage && (
        <div className="space-y-4">
          {[{ type:'room', list: rooms, label:'חדר', plural:'חדרים', emoji:'🏫' },
            { type:'equipment', list: equipment, label:'ציוד', plural:'ציוד', emoji:'🔧' }
          ].map(({ type, list, label, plural, emoji }) => (
            <div key={type} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <h2 className="font-bold text-slate-800">{plural}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{list.length}</span>
                </div>
                <button
                  onClick={() => setResourceForm(resourceForm?.resource_type === type && !resourceForm?.id ? null : { name:'', resource_type: type, capacity:'', quantity:1, notes:'', active:true })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                  <Plus className="h-3.5 w-3.5" /> הוסף {label}
                </button>
              </div>

              {resourceForm?.resource_type === type && (
                <div className="mx-4 my-3 bg-blue-50 rounded-xl border border-blue-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-slate-700">{resourceForm.id ? 'עריכה' : `${label} חדש`}</p>
                    <button onClick={() => setResourceForm(null)}><X className="h-4 w-4 text-slate-400" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="col-span-2">
                      <input
                        className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                        value={resourceForm.name||''} onChange={e => setResourceForm(f=>({...f, name:e.target.value}))}
                        placeholder={type==='equipment' ? 'מקרן, מחשב נייד...' : 'ספרייה, חדר אמנות...'}
                        autoFocus />
                    </div>
                    {type==='room' ? (
                      <input type="number" placeholder="קיבולת (תלמידים)" className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                        value={resourceForm.capacity||''} onChange={e => setResourceForm(f=>({...f, capacity:e.target.value}))} />
                    ) : (
                      <input type="number" min="1" placeholder="כמות יחידות" className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                        value={resourceForm.quantity||1} onChange={e => setResourceForm(f=>({...f, quantity:parseInt(e.target.value)||1}))} />
                    )}
                    <input className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400"
                      value={resourceForm.notes||''} onChange={e => setResourceForm(f=>({...f, notes:e.target.value}))}
                      placeholder="הערות..." />
                  </div>
                  <button
                    onClick={() => { if (!resourceForm.name?.trim()) return; saveResource.mutate({ ...resourceForm, resource_type: type }); }}
                    disabled={saveResource.isPending || !resourceForm.name?.trim()}
                    className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                    {saveResource.isPending ? 'שומר...' : 'שמור'}
                  </button>
                </div>
              )}

              <div className="divide-y divide-slate-50">
                {list.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-10">לחצי "הוסף {label}" למעלה</p>
                )}
                {list.map(r => (
                  <div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${r.active===false ? 'opacity-40' : ''}`}>
                    <span className="text-xl flex-shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{r.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.capacity ? `עד ${r.capacity} תלמידים` : ''}
                        {r.quantity > 1 ? ` ${r.quantity} יחידות` : ''}
                        {r.notes ? ` · ${r.notes}` : ''}
                        {r.active===false ? ' · לא פעיל' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => toggleActive(r)} title={r.active===false ? 'הפעל' : 'השבת'}
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        {r.active===false
                          ? <ToggleLeft className="h-5 w-5 text-slate-300" />
                          : <ToggleRight className="h-5 w-5 text-green-500" />}
                      </button>
                      <button onClick={() => setResourceForm({...r})} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm('למחוק?')) deleteResource.mutate(r.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ REPORTS TAB ══════════════ */}
      {tab === 'reports' && isAdmin && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* By resource */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">ניצול לפי משאב</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{bookings.length} שיבוצים</span>
              </div>
              {bookingReport.length === 0
                ? <p className="text-center text-slate-400 text-sm py-12">אין נתונים</p>
                : (
                  <div className="p-4 space-y-3">
                    {bookingReport.map(r => {
                      const maxTotal = Math.max(...bookingReport.map(x=>x.total), 1);
                      return (
                        <div key={r.name}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-slate-700 truncate">{r.name}</p>
                            <span className="text-xs font-bold text-blue-700 flex-shrink-0 mr-2">{r.total}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((r.total/maxTotal)*100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* By teacher */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">שיבוצים לפי מורה</h2>
              </div>
              {teacherReport.length === 0
                ? <p className="text-center text-slate-400 text-sm py-12">אין נתונים</p>
                : (
                  <div className="divide-y divide-slate-50">
                    {teacherReport.map((t,i) => (
                      <div key={t.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0">{i+1}</span>
                        <p className="flex-1 text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{t.total}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Excel export */}
          <div className="flex justify-end">
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
              <FileSpreadsheet className="h-4 w-4" /> ייצוא Excel מלא
            </button>
          </div>
        </div>
      )}

      {bookingTarget && (
        <BookingModal target={bookingTarget} onClose={() => setBookingTarget(null)}
          onSubmit={(c,s,n) => createBooking.mutate({...bookingTarget, classN:c, subject:s, notes:n})}
          pending={createBooking.isPending} />
      )}

      {releaseTarget && (
        <ReleaseModal booking={releaseTarget} isAdmin={isAdmin}
          isOwn={releaseTarget.teacher_email === user?.email}
          canCancel={canCancelOwn(releaseTarget)}
          onClose={() => setReleaseTarget(null)}
          onRelease={(reason) => releaseBooking.mutate({ booking: releaseTarget, reason })}
          onCancelOwn={() => cancelOwn.mutate(releaseTarget)}
          pending={releaseBooking.isPending || cancelOwn.isPending} />
      )}
    </div>
  );
}

function ResourceCard({ res, hours, dayBookings, userEmail, isAdmin, selDate, onBook, onRelease }) {
  const freeCount = hours.filter(h => !dayBookings[`${res.id}_${h}`]).length;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50">
        <span className="text-2xl leading-none">{EMOJI[res.resource_type] || '🏫'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-base">{res.name}</p>
          {(res.capacity || res.notes) && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {res.capacity ? `עד ${res.capacity} תלמידים` : ''}{res.notes ? ` · ${res.notes}` : ''}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${freeCount === 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
          {freeCount === 0 ? 'תפוס' : `${freeCount} פנויות`}
        </span>
      </div>
      <div className="px-3 py-3 flex flex-wrap gap-2">
        {hours.map(h => {
          const b     = dayBookings[`${res.id}_${h}`];
          const isOwn = b?.teacher_email === userEmail;
          if (b) {
            return (
              <button key={h}
                onClick={() => (isAdmin || isOwn) ? onRelease(b) : null}
                title={`${b.teacher_name} · כיתה ${b.class_name}`}
                className={`flex flex-col items-center justify-center rounded-xl transition-all px-3 py-3 min-w-[72px] ${
                  isOwn
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200 cursor-pointer'
                    : isAdmin
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-default'
                }`}>
                <span className="text-sm font-bold leading-none">{fmtPeriod(h)}</span>
                <span className="text-xs mt-1 leading-none opacity-80 truncate max-w-[64px]">
                  {isOwn ? `כ׳${b.class_name}` : b.teacher_name.split(' ')[0]}
                </span>
              </button>
            );
          }
          return (
            <button key={h}
              onClick={() => onBook(h)}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all px-3 py-3 min-w-[72px] group">
              <span className="text-sm font-bold text-slate-300 group-hover:text-blue-500 leading-none transition-colors">{fmtPeriod(h)}</span>
              <Plus className="h-4 w-4 text-slate-200 group-hover:text-blue-400 mt-1 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingModal({ target, onClose, onSubmit, pending }) {
  const [classN,   setClassN]   = useState('');
  const [subject,  setSubject]  = useState('');
  const [notes,    setNotes]    = useState('');
  const inp = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl">
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-5 py-4 rounded-t-2xl flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-0.5">{EMOJI[target.resource.resource_type] || '🏫'} {TYPE_LABEL[target.resource.resource_type] || 'חדר'}</p>
            <h3 className="font-bold text-white text-lg leading-tight">{target.resource.name}</h3>
            <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {hebDay(target.date)} {fmtDate(target.date)} · {fmtPeriod(target.hour)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">כיתה <span className="text-red-400">*</span></label>
            <input className={inp} value={classN} onChange={e => setClassN(e.target.value)} placeholder="ח׳2" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">מקצוע / נושא</label>
            <input className={inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="מתמטיקה" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">הערות</label>
            <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="הוראות מיוחדות..." />
          </div>
          <button onClick={() => { if (!classN.trim()) return; onSubmit(classN, subject, notes); }}
            disabled={pending || !classN.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-blue-200 mt-2">
            {pending ? 'שומר...' : '✓  אשרי שיבוץ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReleaseModal({ booking: b, isAdmin, isOwn, canCancel, onClose, onRelease, onCancelOwn, pending }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">פרטי שיבוץ</h3>
            <p className="text-xs text-slate-400 mt-0.5">{b.resource_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            {[['📍','משאב',b.resource_name],['📅','תאריך',`${hebDay(b.date)} ${fmtDate(b.date)}`],['⏰','שעה',fmtPeriod(b.hour_number)],['👩‍🏫','מורה',b.teacher_name],['🎓','כיתה',b.class_name + (b.subject ? ` · ${b.subject}` : '')]].map(([em,lbl,val]) => (
              <div key={lbl} className="flex items-start gap-2 text-sm">
                <span>{em}</span>
                <span className="text-slate-400 w-14 flex-shrink-0 text-xs pt-0.5">{lbl}</span>
                <span className="font-semibold text-slate-700 text-xs">{val}</span>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="סיבת שחרור (חובה)..." autoFocus />
              <button onClick={() => { if (!reason.trim()) return; onRelease(reason); }}
                disabled={pending || !reason.trim()}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm transition-colors">
                {pending ? 'משחרר...' : 'שחרר משבצת'}
              </button>
            </div>
          )}
          {isOwn && !isAdmin && (
            canCancel
              ? <button onClick={onCancelOwn} disabled={pending}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm disabled:opacity-50 border border-red-100 transition-colors">
                  {pending ? 'מבטל...' : 'בטלי שיבוץ'}
                </button>
              : <p className="text-xs text-center text-slate-400 py-2">לא ניתן לבטל — פחות מ-{CANCEL_HOURS} שעות לפני השיבוץ</p>
          )}
          {!isOwn && !isAdmin && (
            <p className="text-xs text-center text-slate-400 py-2">רק המנהלת יכולה לשחרר משבצת זו</p>
          )}
        </div>
      </div>
    </div>
  );
}
