import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { ChevronRight, ChevronLeft, Plus, X, Trash2, Edit2, Settings, Layers, Calendar, ToggleLeft, ToggleRight, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { notify } from '@/lib/notify';
import * as XLSX from 'xlsx';

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const HOURS = [1, 2, 3, 4, 5, 6, 7];
const CANCEL_HOURS = 24; // teacher can cancel up to this many hours before

const RESOURCE_EMOJI = { room: '🏫', equipment: '🔧' };

// ── Date helpers ──────────────────────────────────────────────────────────────
function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toISO(date) { return date.toISOString().split('T')[0]; }
function fmtDate(d) { return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }); }
function hebDay(d) { return DAYS[new Date(d).getDay()] || ''; }

// ── Resource form defaults ────────────────────────────────────────────────────
const EMPTY_RESOURCE = { name: '', resource_type: 'room', capacity: '', quantity: 1, notes: '', active: true };

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RoomManagementPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const isAdmin = ['admin', 'vice_principal'].includes(user?.role);

  const [weekOf, setWeekOf]       = useState(() => weekStart(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() < 5 ? new Date().getDay() : 0);
  const [tab, setTab]             = useState('calendar'); // calendar | rooms | equipment | mine
  const [bookingTarget, setBookingTarget] = useState(null);  // { resource, date, hour }
  const [releaseTarget, setReleaseTarget] = useState(null);  // booking to release
  const [resourceForm, setResourceForm]   = useState(null);  // null = hidden, obj = form

  const selectedDate = toISO(addDays(weekOf, selectedDay));

  // Queries
  const { data: resources = [] } = useQuery({
    queryKey: ['rooms-v2'],
    queryFn: () => base44.entities.Room.list(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['room-bookings-v2'],
    queryFn: () => base44.entities.RoomBooking.filter({ status: 'active' }),
  });

  const activeResources = resources.filter(r => r.active !== false);
  const rooms      = activeResources.filter(r => r.resource_type !== 'equipment');
  const equipment  = activeResources.filter(r => r.resource_type === 'equipment');
  const allResources = [...rooms, ...equipment];

  // Bookings for selected date (keyed by resource_id + hour)
  const dayBookings = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (b.date === selectedDate) map[`${b.resource_id}_${b.hour_number}`] = b;
    });
    return map;
  }, [bookings, selectedDate]);

  // My upcoming bookings
  const myBookings = useMemo(() =>
    bookings.filter(b => b.teacher_email === user?.email)
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.hour_number - b.hour_number),
    [bookings, user?.email]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createBooking = useMutation({
    mutationFn: async ({ resource, date, hour, classN, subject, notes }) => {
      const key = `${resource.id}_${hour}`;
      // Re-check live conflict
      const existing = await base44.entities.RoomBooking.filter({ resource_id: resource.id, date, hour_number: hour, status: 'active' });
      if (existing.length > 0) throw new Error('המשבצת נתפסה זה עתה, אנא בחרי שעה אחרת');
      return base44.entities.RoomBooking.create({
        resource_id:   resource.id,
        resource_name: resource.name,
        date, hour_number: hour,
        teacher_email: user.email,
        teacher_name:  user.full_name,
        class_name:    classN,
        subject:       subject || '',
        notes:         notes || '',
        status:        'active',
      });
    },
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['room-bookings-v2'] });
      toast.success(`שובצת בהצלחה ב${vars.resource.name}, ${fmtDate(vars.date)}, שעה ${vars.hour}`);
      await notify({
        user_email: user.email,
        phone:      user.phone,
        type:       'booking_confirm',
        title:      'אישור שיבוץ',
        message:    `שובצת ב${vars.resource.name}, ${hebDay(vars.date)} ${fmtDate(vars.date)}, שעה ${vars.hour}, כיתה ${vars.classN}.`,
        link:       'room-management',
      }).catch(() => {});
      setBookingTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const releaseBooking = useMutation({
    mutationFn: async ({ booking, reason }) => {
      return base44.entities.RoomBooking.update(booking.id, {
        status: 'released',
        released_by: user.full_name,
        release_reason: reason,
        released_date: new Date().toISOString(),
      });
    },
    onSuccess: async (_, vars) => {
      qc.invalidateQueries({ queryKey: ['room-bookings-v2'] });
      toast.success('השיבוץ שוחרר');
      await notify({
        user_email: vars.booking.teacher_email,
        type:       'booking_released',
        title:      'שיבוץ בוטל על ידי המנהלת',
        message:    `השיבוץ שלך ב${vars.booking.resource_name}, ${fmtDate(vars.booking.date)}, שעה ${vars.booking.hour_number} בוטל. סיבה: ${vars.reason}`,
        link:       'room-management',
      }).catch(() => {});
      setReleaseTarget(null);
    },
    onError: () => toast.error('שגיאה בשחרור'),
  });

  const cancelOwnBooking = useMutation({
    mutationFn: (booking) => base44.entities.RoomBooking.update(booking.id, { status: 'released', released_by: user.full_name, release_reason: 'ביטול עצמי', released_date: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-bookings-v2'] }); toast.success('השיבוץ בוטל'); },
    onError: () => toast.error('שגיאה'),
  });

  const saveResource = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.Room.update(data.id, data)
      : base44.entities.Room.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms-v2'] }); setResourceForm(null); toast.success('נשמר'); },
    onError: () => toast.error('שגיאה'),
  });

  const deleteResource = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms-v2'] }); toast.success('נמחק'); },
  });

  const toggleActive = (res) =>
    base44.entities.Room.update(res.id, { active: !res.active }).then(() => qc.invalidateQueries({ queryKey: ['rooms-v2'] }));

  // ── Excel export ──────────────────────────────────────────────────────────
  function exportExcel() {
    const rows = bookings.filter(b => b.status === 'active').map(b => ({
      'משאב': b.resource_name, 'תאריך': b.date, 'יום': hebDay(b.date),
      'שעה': b.hour_number, 'מורה': b.teacher_name, 'כיתה': b.class_name,
      'מקצוע': b.subject || '', 'הערות': b.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'שיבוצים');
    XLSX.writeFile(wb, `bookings-${toISO(new Date())}.xlsx`);
    toast.success('Excel הורד');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const canCancelOwn = (b) => {
    const msLeft = new Date(b.date + 'T08:00') - new Date();
    return msLeft > CANCEL_HOURS * 3_600_000;
  };

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400';

  const weekLabel = `${fmtDate(weekOf)} – ${fmtDate(addDays(weekOf, 4))}`;

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">שיבוץ חדרים וציוד</h1>
          <p className="text-sm text-slate-500">בחרי משאב, תאריך ושעה</p>
        </div>
        {isAdmin && (
          <button onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm">
            <FileSpreadsheet className="h-4 w-4" />Excel
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit flex-wrap">
        {[
          { id: 'calendar', label: '📅 לוח שיבוצים' },
          { id: 'mine',     label: '🙋 שיבוצים שלי' },
          ...(isAdmin ? [
            { id: 'rooms',     label: '🏫 חדרים' },
            { id: 'equipment', label: '🔧 ציוד' },
          ] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Calendar tab ─────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Week nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={() => setWeekOf(w => addDays(w, -7))}
              className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-5 w-5" /></button>
            <span className="text-sm font-bold text-slate-700">{weekLabel}</span>
            <button onClick={() => setWeekOf(w => addDays(w, 7))}
              className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-5 w-5" /></button>
          </div>

          {/* Day tabs */}
          <div className="flex border-b border-slate-100">
            {DAYS.map((d, i) => {
              const date = toISO(addDays(weekOf, i));
              const hasBooking = bookings.some(b => b.date === date && b.status === 'active');
              return (
                <button key={i} onClick={() => setSelectedDay(i)}
                  className={`flex-1 py-3 text-sm font-bold transition-colors relative ${
                    selectedDay === i ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                  <span>{d}</span>
                  <br />
                  <span className="text-[10px] font-normal">{fmtDate(date)}</span>
                  {hasBooking && selectedDay !== i && (
                    <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {allResources.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              {isAdmin ? 'הוסיפי חדרים וציוד בטאבים למעלה' : 'אין משאבים מוגדרים עדיין'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 min-w-[130px]">משאב</th>
                    {HOURS.map(h => (
                      <th key={h} className="px-2 py-3 text-xs font-bold text-slate-500 text-center min-w-[80px]">שעה {h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allResources.map(res => (
                    <tr key={res.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span>{RESOURCE_EMOJI[res.resource_type] || '🏫'}</span>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{res.name}</p>
                            {res.capacity && <p className="text-[10px] text-slate-400">עד {res.capacity}</p>}
                            {res.quantity > 1 && <p className="text-[10px] text-slate-400">{res.quantity} יחידות</p>}
                          </div>
                        </div>
                      </td>
                      {HOURS.map(h => {
                        const booking = dayBookings[`${res.id}_${h}`];
                        const isOwn   = booking?.teacher_email === user?.email;
                        return (
                          <td key={h} className="px-1 py-1.5 text-center">
                            {booking ? (
                              <button
                                onClick={() => isAdmin ? setReleaseTarget(booking) : (isOwn ? setReleaseTarget(booking) : null)}
                                className={`w-full rounded-lg px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${
                                  isOwn
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    : isAdmin
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-red-100 text-red-700 cursor-default'
                                }`}>
                                {booking.teacher_name.split(' ')[0]}
                                <br />
                                <span className="text-[10px] opacity-75">{booking.class_name}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setBookingTarget({ resource: res, date: selectedDate, hour: h })}
                                className="w-full h-10 rounded-lg border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-slate-300 hover:text-blue-400 text-lg">
                                +
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block" />השיבוץ שלי</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" />תפוס</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-slate-200 inline-block" />פנוי — לחצי לשיבוץ</span>
          </div>
        </div>
      )}

      {/* ── My bookings tab ───────────────────────────────────────────── */}
      {tab === 'mine' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">השיבוצים שלי</h2>
          </div>
          <div className="p-5 space-y-2">
            {myBookings.length === 0 && <p className="text-slate-400 text-sm text-center py-8">אין שיבוצים פעילים</p>}
            {myBookings.map(b => {
              const cancellable = canCancelOwn(b);
              return (
                <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{b.resource_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {hebDay(b.date)} {fmtDate(b.date)} · שעה {b.hour_number} · כיתה {b.class_name}
                      {b.subject ? ` · ${b.subject}` : ''}
                    </p>
                  </div>
                  {cancellable ? (
                    <button onClick={() => cancelOwnBooking.mutate(b)}
                      className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium">
                      בטלי
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-300">מתחת ל-{CANCEL_HOURS}ש׳</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Resources management (admin) ──────────────────────────────── */}
      {(tab === 'rooms' || tab === 'equipment') && isAdmin && (
        <ResourceManager
          resources={resources.filter(r => tab === 'equipment' ? r.resource_type === 'equipment' : r.resource_type !== 'equipment')}
          type={tab === 'equipment' ? 'equipment' : 'room'}
          form={resourceForm}
          setForm={setResourceForm}
          onSave={(data) => saveResource.mutate({ ...data, resource_type: tab === 'equipment' ? 'equipment' : 'room' })}
          onDelete={(id) => { if (confirm('למחוק?')) deleteResource.mutate(id); }}
          onToggle={toggleActive}
          saving={saveResource.isPending}
        />
      )}

      {/* ── Booking modal ─────────────────────────────────────────────── */}
      {bookingTarget && (
        <BookingModal
          target={bookingTarget}
          onClose={() => setBookingTarget(null)}
          onSubmit={(classN, subject, notes) =>
            createBooking.mutate({ ...bookingTarget, classN, subject, notes })}
          pending={createBooking.isPending}
        />
      )}

      {/* ── Release modal ─────────────────────────────────────────────── */}
      {releaseTarget && (
        <ReleaseModal
          booking={releaseTarget}
          isAdmin={isAdmin}
          isOwn={releaseTarget.teacher_email === user?.email}
          canCancel={canCancelOwn(releaseTarget)}
          onClose={() => setReleaseTarget(null)}
          onRelease={(reason) => releaseBooking.mutate({ booking: releaseTarget, reason })}
          onCancelOwn={() => { cancelOwnBooking.mutate(releaseTarget); setReleaseTarget(null); }}
          pending={releaseBooking.isPending || cancelOwnBooking.isPending}
        />
      )}
    </div>
  );
}

// ── Resource manager component ─────────────────────────────────────────────────
function ResourceManager({ resources, type, form, setForm, onSave, onDelete, onToggle, saving }) {
  const label = type === 'equipment' ? 'ציוד' : 'חדר';
  const empty = { ...{ name: '', capacity: '', quantity: 1, notes: '', active: true }, resource_type: type };
  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800">ניהול {label === 'חדר' ? 'חדרים' : 'ציוד'}</h2>
        <button onClick={() => setForm(form ? null : { ...empty })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl">
          <Plus className="h-4 w-4" />{label} חדש/{type === 'equipment' ? 'ה' : ''}
        </button>
      </div>

      {form && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-slate-700">{form.id ? 'עריכה' : `${label} חדש`}</h3>
            <button onClick={() => setForm(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 block mb-1">שם *</label>
              <input className={inp} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={type === 'equipment' ? 'עגלת מחשבים ניידים' : 'חדר ספורט'} />
            </div>
            {type === 'room' && (
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">קיבולת</label>
                <input type="number" className={inp} value={form.capacity || ''} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="30" />
              </div>
            )}
            {type === 'equipment' && (
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">כמות יחידות</label>
                <input type="number" min="1" className={inp} value={form.quantity || 1} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
            )}
            <div className={type === 'room' ? '' : 'col-span-1'}>
              <label className="text-xs font-bold text-slate-500 block mb-1">הערות</label>
              <input className={inp} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="מיקום, הוראות שימוש..." />
            </div>
          </div>
          <button onClick={() => { if (!form.name?.trim()) { return; } onSave(form); }} disabled={saving || !form.name?.trim()}
            className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {resources.length === 0 && <p className="text-slate-400 text-sm text-center py-8">אין {label === 'חדר' ? 'חדרים' : 'ציוד'} — הוסיפי למעלה</p>}
        {resources.map(r => (
          <div key={r.id} className={`flex items-center justify-between bg-white rounded-xl border px-4 py-3 ${r.active === false ? 'opacity-50 border-slate-100' : 'border-slate-100 shadow-sm'}`}>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{RESOURCE_EMOJI[r.resource_type]} {r.name}</p>
              <p className="text-xs text-slate-400">
                {r.capacity ? `קיבולת ${r.capacity}` : ''}
                {r.quantity > 1 ? ` · ${r.quantity} יחידות` : ''}
                {r.notes ? ` · ${r.notes}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onToggle(r)} title={r.active === false ? 'הפעל' : 'השבת'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                {r.active === false ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5 text-green-500" />}
              </button>
              <button onClick={() => setForm({ ...r })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(r.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Booking modal ──────────────────────────────────────────────────────────────
function BookingModal({ target, onClose, onSubmit, pending }) {
  const [classN, setClassN]   = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes]     = useState('');
  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" dir="rtl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-800">שיבוץ {target.resource.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{hebDay(target.date)} {fmtDate(target.date)} · שעה {target.hour}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">כיתה *</label>
            <input className={inp} value={classN} onChange={e => setClassN(e.target.value)} placeholder="ח׳2" autoFocus />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">מקצוע / נושא</label>
            <input className={inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="מתמטיקה" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">הערות</label>
            <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="הוראות מיוחדות..." />
          </div>
          <button onClick={() => { if (!classN.trim()) { return; } onSubmit(classN, subject, notes); }}
            disabled={pending || !classN.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm mt-2">
            {pending ? 'שומר...' : 'אשרי שיבוץ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Release modal ──────────────────────────────────────────────────────────────
function ReleaseModal({ booking: b, isAdmin, isOwn, canCancel, onClose, onRelease, onCancelOwn, pending }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" dir="rtl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">פרטי שיבוץ</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm mb-4">
          <p><span className="text-slate-500">משאב:</span> <span className="font-semibold">{b.resource_name}</span></p>
          <p><span className="text-slate-500">תאריך:</span> {hebDay(b.date)} {fmtDate(b.date)}, שעה {b.hour_number}</p>
          <p><span className="text-slate-500">מורה:</span> {b.teacher_name}</p>
          <p><span className="text-slate-500">כיתה:</span> {b.class_name}</p>
          {b.subject && <p><span className="text-slate-500">מקצוע:</span> {b.subject}</p>}
          {b.notes && <p><span className="text-slate-500">הערות:</span> {b.notes}</p>}
        </div>

        {isAdmin && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-red-500 block mb-1">סיבת שחרור *</label>
              <input
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm outline-none focus:border-red-400"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="מורה בחופש, טעות בשיבוץ..." />
            </div>
            <button onClick={() => { if (!reason.trim()) return; onRelease(reason); }}
              disabled={pending || !reason.trim()}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm">
              {pending ? 'משחרר...' : 'שחרר משבצת'}
            </button>
          </div>
        )}

        {isOwn && !isAdmin && (
          canCancel
            ? <button onClick={onCancelOwn} disabled={pending}
                className="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-sm disabled:opacity-50">
                {pending ? 'מבטל...' : 'בטלי שיבוץ'}
              </button>
            : <p className="text-xs text-center text-slate-400">לא ניתן לבטל — פחות מ-{CANCEL_HOURS} שעות לפני</p>
        )}

        {!isOwn && !isAdmin && (
          <p className="text-xs text-center text-slate-400">רק המנהלת יכולה לשחרר משבצת זו</p>
        )}
      </div>
    </div>
  );
}
