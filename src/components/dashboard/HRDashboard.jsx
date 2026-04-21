import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trash2, Edit2, Save, X, Users, RefreshCw, Phone, Mail, AlertCircle } from 'lucide-react';

const ROLE_LABELS = {
  admin: 'מנהלת/מנהל',
  vice_principal: 'סגנית/סגן מנהל',
  secretary: 'מזכירה/מזכיר',
  teacher: 'מורה',
  counselor: 'יועצת/יועץ',
  coordinator: 'רכזת/רכז',
  assistant: 'סייעת/סייע',
  substitute: 'מחליפה/מחליף',
  maintenance: 'אחזקה',
  staff: 'צוות כללי',
};

// ─── Contact Details Tab ──────────────────────────────────────────────────────
function ContactDetailsTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.User.list();
      setUsers(list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'he')));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (u) => {
    setEditId(u.id);
    setEditForm({ phone: u.phone || '', email: u.email || '' });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({ phone: '', email: '' }); };

  const saveContact = async (u) => {
    if (!editForm.email.trim()) { setMsg('מייל הוא שדה חובה'); return; }
    setSaving(true);
    try {
      await base44.entities.User.update(u.id, {
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
      });
      setMsg('נשמר');
      setTimeout(() => setMsg(''), 2500);
      setEditId(null);
      load();
    } catch { setMsg('שגיאה בשמירה'); }
    setSaving(false);
  };

  const missingCount = users.filter(u => !u.phone).length;

  const inp = 'px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-full';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {missingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 font-medium">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {missingCount} משתמשות ללא טלפון — לא יקבלו התראות וואצאפ
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">{msg}</span>}
          <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-right" dir="rtl">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">שם</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">תפקיד</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />מייל</span>
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />טלפון</span>
                </th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400">אין משתמשות במערכת</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.phone ? 'bg-yellow-50/40' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{u.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {editId === u.id ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className={inp}
                        dir="ltr"
                        placeholder="user@example.com"
                      />
                    ) : (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        {u.email || <span className="text-red-400 font-medium">חסר</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className={inp}
                        dir="ltr"
                        placeholder="05X-XXXXXXX"
                      />
                    ) : (
                      <span className={`flex items-center gap-1 text-xs ${u.phone ? 'text-slate-700' : 'text-yellow-600 font-medium'}`}>
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {u.phone || 'חסר'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => saveContact(u)}
                          disabled={saving}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">
                          <Save className="h-3 w-3" />שמור
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                          <X className="h-3 w-3" />ביטול
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(u)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="h-3 w-3" />עריכה
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        טלפון — נדרש לשליחת התראות וואצאפ. מייל — משמש לכניסה למערכת.
      </p>
    </div>
  );
}

// ─── Main HRDashboard ─────────────────────────────────────────────────────────
export default function HRDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('staff');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ email: '', full_name: '', role: 'teacher', phone: '' });

  const schoolId = user?.school_id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.firestoreStaff.list(schoolId);
      setStaff(list);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const save = async () => {
    if (!form.email || !form.full_name) return flash('אימייל ושם הם שדות חובה');
    if (editId) {
      await base44.firestoreStaff.update(editId, { ...form, school_id: schoolId });
    } else {
      await base44.firestoreStaff.create({ ...form, school_id: schoolId });
    }
    flash(editId ? 'עודכן' : 'איש צוות נוסף');
    setForm({ email: '', full_name: '', role: 'teacher', phone: '' });
    setShowAdd(false); setEditId(null); load();
  };

  const del = async (id) => {
    if (!confirm('למחוק?')) return;
    await base44.firestoreStaff.delete(id);
    flash('נמחק'); load();
  };

  const startEdit = (s) => {
    setForm({ email: s.email, full_name: s.full_name, role: s.role, phone: s.phone || '' });
    setEditId(s.id); setShowAdd(true);
  };

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400';
  const btn = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="max-w-4xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />ניהול צוות
        </h2>
        {msg && <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg">{msg}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'staff',    label: 'רשימת צוות' },
          { id: 'contacts', label: 'מייל וטלפון' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Staff list tab ── */}
      {tab === 'staff' && (
        <div className="space-y-4">
          <button
            onClick={() => { setShowAdd(true); setEditId(null); setForm({ email: '', full_name: '', role: 'teacher', phone: '' }); }}
            className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2`}>
            <Plus className="h-4 w-4" />הוסף איש צוות
          </button>

          {showAdd && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-700 mb-3">{editId ? 'עריכה' : 'איש צוות חדש'}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">שם מלא *</label>
                  <input className={inp} value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="שרה כהן" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">אימייל גוגל *</label>
                  <input className={inp} type="email" dir="ltr" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="sarah@gmail.com" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                    <Phone className="h-3 w-3" /> טלפון (לוואצאפ)
                  </label>
                  <input className={inp} type="tel" dir="ltr" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="05X-XXXXXXX" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">תפקיד</label>
                  <select className={inp} value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={save} className={`${btn} bg-green-600 text-white hover:bg-green-700 flex items-center gap-1`}>
                  <Save className="h-4 w-4" />שמור
                </button>
                <button onClick={() => { setShowAdd(false); setEditId(null); }}
                  className={`${btn} bg-slate-200 text-slate-700 flex items-center gap-1`}>
                  <X className="h-4 w-4" />ביטול
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {staff.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-sm">אין אנשי צוות — לחצי "הוסף איש צוות"</p>
              )}
              {staff.map(s => (
                <div key={s.id}
                  className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{s.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" />{s.email}
                      </span>
                      {s.phone && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{s.phone}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[s.role] || s.role}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => del(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-xl text-xs text-blue-700">
            <p className="font-semibold mb-1">כיצד עובד הכניסה?</p>
            <p>כל איש צוות נכנס למערכת עם כתובת הגוגל שהזנת כאן — ללא סיסמה נפרדת.</p>
          </div>
        </div>
      )}

      {/* ── Contact details tab ── */}
      {tab === 'contacts' && <ContactDetailsTab />}
    </div>
  );
}
