import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, Eye, EyeOff, RefreshCw, School, Users, Settings, Shield } from 'lucide-react';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const ROLES = ['admin', 'secretary', 'teacher', 'staff', 'super_admin'];
const ROLE_LABELS = { admin: 'מנהל/ת', secretary: 'מזכיר/ה', teacher: 'מורה', staff: 'צוות', super_admin: 'סופר אדמין' };
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', secretary: 'bg-cyan-100 text-cyan-700', teacher: 'bg-blue-100 text-blue-700', staff: 'bg-slate-100 text-slate-600', super_admin: 'bg-red-100 text-red-700' };

const TABS = [
  { id: 'schools', label: 'בתי ספר', icon: School },
  { id: 'users',   label: 'משתמשים', icon: Users },
  { id: 'settings', label: 'הגדרות תצוגה', icon: Settings },
];

const inp = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white';

export default function SchoolAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('schools');
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: '', city: '', contact_email: '', notes: '' });
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'admin', school_id: '' });
  const [localSettings, setLocalSettings] = useState({
    school_name: localStorage.getItem('school_name') || '',
    principal_name: localStorage.getItem('principal_name') || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([base44.firestoreSchools.list(), base44.firestoreUsers.list()]);
      setSchools(s); setUsers(u);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Shield className="h-12 w-12 text-slate-200" />
        <p className="font-medium">אין הרשאה לדף זה</p>
      </div>
    );
  }

  const saveSchool = async () => {
    if (!schoolForm.name || !schoolForm.city) return toast.error('שם ועיר הם שדות חובה');
    if (editId) await base44.firestoreSchools.update(editId, schoolForm);
    else await base44.firestoreSchools.create(schoolForm);
    toast.success(editId ? 'בית הספר עודכן' : 'בית הספר נוסף');
    setSchoolForm({ name: '', city: '', contact_email: '', notes: '' });
    setShowAdd(false); setEditId(null); load();
  };

  const deleteSchool = async (id) => {
    if (!confirm('למחוק את בית הספר?')) return;
    await base44.firestoreSchools.delete(id);
    toast.success('נמחק'); load();
  };

  const saveUser = async () => {
    if (!userForm.email || !userForm.full_name) return toast.error('אימייל ושם הם שדות חובה');
    if (!editId && !userForm.password) return toast.error('סיסמה נדרשת למשתמש חדש');
    if (editId) await base44.firestoreUsers.update(editId, userForm);
    else await base44.firestoreUsers.create(userForm);
    toast.success(editId ? 'המשתמש עודכן' : 'המשתמש נוסף');
    setUserForm({ email: '', password: '', full_name: '', role: 'admin', school_id: '' });
    setShowAdd(false); setEditId(null); load();
  };

  const deleteUser = async (id) => {
    if (!confirm('למחוק את המשתמש?')) return;
    await base44.firestoreUsers.delete(id);
    toast.success('נמחק'); load();
  };

  const startEditSchool = (s) => {
    setSchoolForm({ name: s.name, city: s.city, contact_email: s.contact_email || '', notes: s.notes || '' });
    setEditId(s.id); setShowAdd(true);
  };

  const startEditUser = (u) => {
    setUserForm({ email: u.email, password: '', full_name: u.full_name, role: u.role, school_id: u.school_id || '' });
    setEditId(u.id); setShowAdd(true);
  };

  const schoolName = (id) => schools.find(s => s.id === id)?.name || (id ? id : '— ללא בית ספר —');

  const closeForm = () => { setShowAdd(false); setEditId(null); };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100"><Shield className="h-5 w-5 text-purple-600" /></div>
            ניהול פיתוח
          </h1>
          <p className="text-sm text-slate-400 mt-1 mr-11">ניהול בתי ספר ומשתמשי מערכת</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); closeForm(); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6">

            {/* ── Schools ── */}
            {tab === 'schools' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{schools.length} בתי ספר רשומים</p>
                  <button onClick={() => { setShowAdd(true); setEditId(null); setSchoolForm({ name: '', city: '', contact_email: '', notes: '' }); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="h-4 w-4" />הוסף בית ספר
                  </button>
                </div>

                {showAdd && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-700">{editId ? 'עריכת בית ספר' : 'בית ספר חדש'}</h3>
                      <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">שם בית הספר *</label>
                        <input className={inp} value={schoolForm.name} onChange={e => setSchoolForm(p => ({ ...p, name: e.target.value }))} placeholder="בית ספר אהלי יוסף" /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">עיר *</label>
                        <input className={inp} value={schoolForm.city} onChange={e => setSchoolForm(p => ({ ...p, city: e.target.value }))} placeholder="תל אביב" /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">אימייל מנהל/ת</label>
                        <input className={inp} type="email" value={schoolForm.contact_email} onChange={e => setSchoolForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="principal@school.edu" /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">הערות</label>
                        <input className={inp} value={schoolForm.notes} onChange={e => setSchoolForm(p => ({ ...p, notes: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveSchool} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Save className="h-4 w-4" />שמור
                      </button>
                      <button onClick={closeForm} className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                        <X className="h-4 w-4" />ביטול
                      </button>
                    </div>
                  </div>
                )}

                {schools.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl">
                    <School className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    אין בתי ספר עדיין
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schools.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <School className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.city}{s.contact_email ? ` · ${s.contact_email}` : ''}</p>
                            <p className="text-[10px] text-slate-300 font-mono mt-0.5 select-all">{s.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditSchool(s)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteSchool(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Users ── */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{users.length} משתמשים רשומים</p>
                  <button onClick={() => { setShowAdd(true); setEditId(null); setUserForm({ email: '', password: '', full_name: '', role: 'admin', school_id: '' }); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="h-4 w-4" />הוסף משתמש
                  </button>
                </div>

                {showAdd && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-700">{editId ? 'עריכת משתמש' : 'משתמש חדש'}</h3>
                      <button onClick={closeForm} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">שם מלא *</label>
                        <input className={inp} value={userForm.full_name} onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))} placeholder="שרה כהן" /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">אימייל *</label>
                        <input className={inp} type="email" dir="ltr" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="user@school.edu" /></div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">{editId ? 'סיסמה חדשה (ריק = אל תשנה)' : 'סיסמה *'}</label>
                        <div className="relative">
                          <input className={inp} type={showPw ? 'text' : 'password'} dir="ltr" value={userForm.password}
                            onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••"
                            style={{ paddingLeft: '36px' }} />
                          <button type="button" onClick={() => setShowPw(p => !p)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div><label className="text-xs font-bold text-slate-500 mb-1 block">תפקיד</label>
                        <select className={inp} value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2"><label className="text-xs font-bold text-slate-500 mb-1 block">בית ספר</label>
                        <select className={inp} value={userForm.school_id} onChange={e => setUserForm(p => ({ ...p, school_id: e.target.value }))}>
                          <option value="">— ללא בית ספר (super_admin) —</option>
                          {schools.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveUser} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <Save className="h-4 w-4" />שמור
                      </button>
                      <button onClick={closeForm} className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                        <X className="h-4 w-4" />ביטול
                      </button>
                    </div>
                  </div>
                )}

                {users.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-2xl">
                    <Users className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                    אין משתמשים
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {u.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800 text-sm">{u.full_name}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono" dir="ltr">{u.email}</p>
                            <p className="text-xs text-slate-300 mt-0.5">{schoolName(u.school_id)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEditUser(u)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Settings ── */}
            {tab === 'settings' && (
              <div className="max-w-md space-y-5">
                <p className="text-sm text-slate-400">הגדרות אלו משפיעות על תצוגת המערכת בדפדפן זה בלבד.</p>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">שם בית הספר (מופיע בכותרת)</label>
                  <input className={inp} value={localSettings.school_name}
                    onChange={e => setLocalSettings(p => ({ ...p, school_name: e.target.value }))}
                    placeholder='בית ספר אהלי יוסף יצחק' />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">שם המנהלת / מנהל</label>
                  <input className={inp} value={localSettings.principal_name}
                    onChange={e => setLocalSettings(p => ({ ...p, principal_name: e.target.value }))}
                    placeholder='שרה הגר' />
                </div>
                <button onClick={() => {
                  localStorage.setItem('school_name', localSettings.school_name);
                  localStorage.setItem('principal_name', localSettings.principal_name);
                  toast.success('הגדרות נשמרו — רענן את הדף לראות שינויים');
                }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <Save className="h-4 w-4" />שמור הגדרות
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
