import React, { useState } from 'react';
import { Settings, MessageCircle, Bell, School, Save, CheckCircle, Eye, EyeOff, AlertTriangle, Shield, ToggleLeft, ToggleRight, ClipboardCheck, Mail, Plus, X, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import FeatureFlags from '../components/settings/FeatureFlags';
import { getWAConfig, saveWAConfig, sendWhatsApp } from '../lib/whatsapp';
import { getEmailConfig, saveEmailConfig, sendEmail, isEmailConfigured } from '../lib/email';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { useApprovalSettings, APPROVAL_SETTINGS_QUERY_KEY } from '@/hooks/useApprovalSettings';

const TABS = [
  { id: 'features',     label: 'פיצ׳רים',        icon: Settings },
  { id: 'coordinators', label: 'הרשאות מערכת',   icon: Shield },
  { id: 'approvals',    label: 'אישורים',         icon: ClipboardCheck },
  { id: 'whatsapp',     label: 'WhatsApp',        icon: MessageCircle },
  { id: 'email',        label: 'מייל',            icon: Mail },
  { id: 'school',       label: 'בית הספר',       icon: School },
  { id: 'push',         label: 'התראות',         icon: Bell },
];

const COORD_ROLE_LABELS = {
  secretary: 'מזכירה/מזכיר',
  teacher: 'מורה',
  counselor: 'יועצת/יועץ',
  coordinator: 'רכזת/רכז',
  assistant: 'סייעת/סייע',
};

function CoordinatorPermissions() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-settings'],
    queryFn: () => base44.entities.User.list(),
  });

  // Show users who can potentially be coordinator (not already admin/vice)
  const candidates = users.filter(u =>
    !['admin', 'vice_principal', 'super_admin'].includes(u.role)
  );

  const toggle = async (u) => {
    setSaving(u.id);
    try {
      await base44.entities.User.update(u.id, { is_system_coordinator: !u.is_system_coordinator });
      qc.invalidateQueries({ queryKey: ['all-users-settings'] });
      qc.invalidateQueries({ queryKey: ['system-coordinators'] });
      toast.success(u.is_system_coordinator ? `${u.full_name} הוסרה מאחראיות המערכת` : `${u.full_name} הוגדרה כאחראית מערכת`);
    } catch { toast.error('שגיאה בשמירה'); }
    setSaving(null);
  };

  const autoCoords = users.filter(u => ['admin', 'vice_principal'].includes(u.role));

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 rounded-xl"><Shield className="h-5 w-5 text-indigo-600" /></div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">הרשאות אחראי/ת מערכת</h3>
          <p className="text-xs text-slate-500">מנהלת וסגנית הן אחראיות מערכת באופן קבוע. מזכירה או מורה נוספת ניתן להגדיר לפי הצורך.</p>
        </div>
      </div>

      {/* Always-coordinators */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">אחראיות קבועות</p>
        <div className="space-y-2">
          {autoCoords.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800 text-sm">{u.full_name}</p>
                <p className="text-xs text-slate-500">{u.role === 'admin' ? 'מנהלת/מנהל' : 'סגנית/סגן מנהל'} · {u.email}</p>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">קבוע</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toggleable coordinators */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">הגדרה לפי בחירה</p>
        {candidates.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">אין משתמשים נוספים במערכת</p>
        ) : (
          <div className="space-y-2">
            {candidates.map(u => (
              <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors
                ${u.is_system_coordinator ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{COORD_ROLE_LABELS[u.role] || u.role} · {u.email}</p>
                </div>
                <button
                  onClick={() => toggle(u)}
                  disabled={saving === u.id}
                  className="flex items-center gap-2 disabled:opacity-50"
                  title={u.is_system_coordinator ? 'הסר הרשאה' : 'הגדר כאחראי/ת מערכת'}
                >
                  {saving === u.id ? (
                    <span className="text-xs text-slate-400">שומר...</span>
                  ) : u.is_system_coordinator ? (
                    <>
                      <span className="text-xs font-bold text-green-700">אחראי/ת מערכת</span>
                      <ToggleRight className="h-7 w-7 text-green-600" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-400">לא מוגדר</span>
                      <ToggleLeft className="h-7 w-7 text-slate-300" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Special Roles Manager
// ─────────────────────────────────────────────────────────────────────────────
const BUILTIN_SPECIAL_ROLES = [
  { id: 'security_coordinator', label: 'רכזת ביטחון ובטיחות', desc: 'שיבוץ ועריכת תורנויות, הגדרת סוגי תורנויות', icon: '🛡️', builtin: true },
  { id: 'room_manager',         label: 'אחראית חדרים',        desc: 'הגדרת חדרי ספח ושחרור שיבוצים',            icon: '🏫', builtin: true },
  { id: 'equipment_manager',    label: 'אחראית ציוד / לבורנטית', desc: 'הגדרת ציוד משותף ושחרור שיבוצים',      icon: '🔧', builtin: true },
  { id: 'photo_manager',        label: 'אחראית צילומים',      desc: 'אישור ודחיית בקשות צילום',                 icon: '🖨️', builtin: true },
  { id: 'tech_coordinator',     label: 'רכזת טכנולוגיה',      desc: 'קבלת תקלות מחשבים וטיפול בהן',             icon: '💻', builtin: true },
  { id: 'ab_bayit',             label: 'אב הבית',             desc: 'קבלת ליקויי תחזוקה וסימון ביצוע',          icon: '🔨', builtin: true },
];

const EMOJI_OPTIONS = ['⭐','📋','🎯','🔑','📌','🗂️','🧩','📣','🛠️','🎓','📊','🏷️'];

function SpecialRolesManager() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [saving,   setSaving]   = useState(null);
  const [showLog,  setShowLog]  = useState(false);
  const [newRole,  setNewRole]  = useState(null); // null or { label:'', desc:'', icon:'⭐' }

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-special-roles'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: customRolesSetting = [] } = useQuery({
    queryKey: ['custom-special-roles'],
    queryFn: () => base44.entities.InstitutionSettings.filter({ type: 'custom_special_roles' }),
  });
  const customRolesRecord = customRolesSetting[0] || null;
  const customRoles = React.useMemo(() => {
    try { return customRolesRecord?.roles ? JSON.parse(customRolesRecord.roles) : []; }
    catch { return []; }
  }, [customRolesRecord]);

  const allRoles = [...BUILTIN_SPECIAL_ROLES, ...customRoles];

  const { data: roleLogs = [] } = useQuery({
    queryKey: ['role-change-log'],
    queryFn: () => base44.entities.InstitutionSettings.filter({ type: 'role_change_log' }),
    enabled: showLog,
  });
  const sortedLog = [...roleLogs].sort((a,b) => (b.changed_at||'') > (a.changed_at||'') ? 1 : -1);

  const saveCustomRoles = useMutation({
    mutationFn: (roles) => {
      const data = { type: 'custom_special_roles', roles: JSON.stringify(roles) };
      if (customRolesRecord?.id) return base44.entities.InstitutionSettings.update(customRolesRecord.id, data);
      return base44.entities.InstitutionSettings.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custom-special-roles'] }); setNewRole(null); toast.success('תפקיד נשמר'); },
    onError: () => toast.error('שגיאה בשמירה'),
  });

  const toggleRole = async (u, roleId) => {
    setSaving(`${u.id}_${roleId}`);
    try {
      const current = Array.isArray(u.special_roles) ? u.special_roles : [];
      const adding = !current.includes(roleId);
      const next = adding ? [...current, roleId] : current.filter(r => r !== roleId);
      await base44.entities.User.update(u.id, { special_roles: next });
      await Promise.allSettled([
        base44.firestoreUsers.update(u.id, { special_roles: next }),
        base44.firestoreStaff.update(u.id, { special_roles: next }),
      ]);
      // Save log entry
      const role = allRoles.find(r => r.id === roleId);
      try {
        await base44.entities.InstitutionSettings.create({
          type: 'role_change_log',
          user_id: u.id,
          user_name: u.full_name,
          role_id: roleId,
          role_label: role?.label || roleId,
          action: adding ? 'added' : 'removed',
          changed_by: currentUser?.full_name || currentUser?.email || 'מנהלת',
          changed_at: new Date().toISOString(),
        });
      } catch { /* log failure is non-critical */ }
      qc.invalidateQueries({ queryKey: ['all-users-special-roles', 'role-change-log'] });
      toast.success(adding ? `${u.full_name} הוגדרה כ${role?.label}` : 'תפקיד הוסר');
    } catch { toast.error('שגיאה בשמירה'); }
    setSaving(null);
  };

  const deleteCustomRole = (roleId) => {
    const next = customRoles.filter(r => r.id !== roleId);
    saveCustomRoles.mutate(next);
  };

  return (
    <div dir="rtl" className="space-y-6 mt-8 pt-8 border-t border-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl"><Shield className="h-5 w-5 text-amber-600" /></div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">תפקידים מיוחדים</h3>
            <p className="text-xs text-slate-500">שיוך תפקידים מיוחדים למורות — כל תפקיד מפעיל יכולות ייחודיות במערכת.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLog(l => !l)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${showLog ? 'bg-slate-100 text-slate-700 border-slate-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
            <Clock className="h-3.5 w-3.5" />{showLog ? 'הסתר לוג' : 'לוג שינויים'}
          </button>
          <button
            onClick={() => setNewRole({ id: `custom_${Date.now()}`, label: '', desc: '', icon: '⭐', builtin: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors">
            <Plus className="h-3.5 w-3.5" /> תפקיד חדש
          </button>
        </div>
      </div>

      {/* New custom role form */}
      {newRole && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-700 text-sm">תפקיד חדש מותאם אישית</p>
            <button onClick={() => setNewRole(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <input
                autoFocus
                className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-amber-400"
                placeholder="שם התפקיד (לדוגמה: רכזת ספרייה)"
                value={newRole.label}
                onChange={e => setNewRole(r => ({ ...r, label: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <input
                className="w-full px-3 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-amber-400"
                placeholder="תיאור קצר (אופציונלי)"
                value={newRole.desc}
                onChange={e => setNewRole(r => ({ ...r, desc: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-500 mb-1.5">בחרי אייקון</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setNewRole(r => ({ ...r, icon: e }))}
                    className={`w-9 h-9 rounded-xl text-lg transition-all ${newRole.icon === e ? 'bg-amber-200 ring-2 ring-amber-400' : 'bg-white border border-slate-200 hover:border-amber-300'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => saveCustomRoles.mutate([...customRoles, newRole])}
            disabled={!newRole.label.trim() || saveCustomRoles.isPending}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            {saveCustomRoles.isPending ? 'שומר...' : 'שמור תפקיד'}
          </button>
        </div>
      )}

      {/* Roles grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allRoles.map(role => {
          const assigned = users.filter(u => Array.isArray(u.special_roles) && u.special_roles.includes(role.id));
          return (
            <div key={role.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl flex-shrink-0">{role.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{role.label}</p>
                    {!role.builtin && (
                      <button onClick={() => { if(confirm('למחוק תפקיד?')) deleteCustomRole(role.id); }}
                        className="flex-shrink-0 text-slate-300 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{role.desc}</p>
                </div>
              </div>
              {assigned.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                  {assigned.map(u => (
                    <span key={u.id} className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {u.full_name?.split(' ')[0]}
                      <button onClick={() => toggleRole(u, role.id)} disabled={saving === `${u.id}_${role.id}`}
                        className="hover:text-red-600 transition-colors ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
              <select
                className="w-full text-xs px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none focus:border-amber-400 mt-1"
                value=""
                onChange={async (e) => {
                  const u = users.find(x => x.id === e.target.value);
                  if (u) await toggleRole(u, role.id);
                }}>
                <option value="">+ הוסף מורה לתפקיד</option>
                {users
                  .filter(u => !['admin','vice_principal','super_admin'].includes(u.role) && !(Array.isArray(u.special_roles) && u.special_roles.includes(role.id)))
                  .map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      {/* Role change log */}
      {showLog && (
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <p className="font-bold text-slate-700 text-sm">לוג שינויי תפקידים</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{roleLogs.length} שינויים</span>
          </div>
          {sortedLog.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">אין שינויים מתועדים עדיין</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {sortedLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`flex-shrink-0 text-lg`}>{entry.action === 'added' ? '➕' : '➖'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{entry.user_name}</span>
                      {entry.action === 'added' ? ' הוגדרה כ' : ' הוסר תפקיד '}
                      <span className="font-semibold text-amber-700">{entry.role_label}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ע"י {entry.changed_by} · {entry.changed_at ? new Date(entry.changed_at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const APPROVAL_ITEMS = [
  { key: 'require_absence_approval',    label: 'היעדרויות',    desc: 'בקשות היעדרות ידרשו אישור מנהלת לפני שיירשמו כמאושרות' },
  { key: 'require_print_approval',      label: 'בקשות צילום',  desc: 'בקשות צילום ידרשו אישור מנהלת לפני ביצוע' },
  { key: 'require_onboarding_approval', label: 'מסמכי קליטה',  desc: 'מסמכי קליטה שהועלו ידרשו בדיקה ואישור' },
];

function ApprovalSettings() {
  const qc = useQueryClient();
  const { record, ...current } = useApprovalSettings();
  const [saving, setSaving] = useState(null);

  const toggle = async (key) => {
    setSaving(key);
    const newVal = !current[key];
    try {
      const payload = { [key]: newVal };
      if (record) {
        await base44.entities.InstitutionSettings.update(record.id, payload);
      } else {
        await base44.entities.InstitutionSettings.create({ type: 'approval_settings', ...payload });
      }
      qc.invalidateQueries({ queryKey: APPROVAL_SETTINGS_QUERY_KEY });
      toast.success(newVal ? 'אישור הופעל' : 'אישור בוטל');
    } catch { toast.error('שגיאה בשמירה'); }
    setSaving(null);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-xl"><ClipboardCheck className="h-5 w-5 text-blue-600" /></div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">הגדרות אישורים</h3>
          <p className="text-xs text-slate-500">בחרי אילו פעולות דורשות אישור מנהלת. כשהאישור כבוי — הפעולה מאושרת אוטומטית.</p>
        </div>
      </div>
      <div className="space-y-3">
        {APPROVAL_ITEMS.map(({ key, label, desc }) => {
          const isOn = current[key];
          return (
            <div key={key} className={`flex items-center justify-between p-4 rounded-xl border transition-colors
              ${isOn ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={saving === key}
                className="flex items-center gap-2 mr-4 disabled:opacity-50 flex-shrink-0"
              >
                {saving === key ? (
                  <span className="text-xs text-slate-400">שומר...</span>
                ) : isOn ? (
                  <>
                    <span className="text-xs font-bold text-blue-700">נדרש אישור</span>
                    <ToggleRight className="h-7 w-7 text-blue-600" />
                  </>
                ) : (
                  <>
                    <span className="text-xs text-slate-400">ללא אישור</span>
                    <ToggleLeft className="h-7 w-7 text-slate-300" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab]         = useState('features');
  const [waConfig, setWaConfig] = useState(() => getWAConfig());
  const [showToken, setShowToken] = useState(false);
  const [testPhone, setTestPhone]   = useState('');
  const [testing,   setTesting]     = useState(false);
  const [waSaved,   setWaSaved]     = useState(false);
  const [emailConfig, setEmailConfig] = useState(() => getEmailConfig());
  const [emailSaved, setEmailSaved] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [schoolName, setSchoolName] = useState(
    () => localStorage.getItem('school_name') || ''
  );
  const [schoolSaved, setSchoolSaved] = useState(false);

  const isAdmin = user && ['admin', 'vice_principal', 'super_admin'].includes(user.role);
  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-slate-400">
        <Settings className="h-12 w-12 mx-auto mb-3 text-slate-200" />
        <p>הגדרות זמינות למנהלת ולסגנית בלבד</p>
      </div>
    );
  }

  function saveWA() {
    saveWAConfig(waConfig);
    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 2000);
    toast.success('הגדרות WhatsApp נשמרו');
  }

  async function testWA() {
    if (!testPhone) return toast.error('הזיני מספר טלפון לבדיקה');
    setTesting(true);
    try {
      await sendWhatsApp(testPhone, '✅ זוהי הודעת בדיקה ממערכת Smart Base');
      toast.success('הודעת בדיקה נשלחה!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  }

  function saveEmailSettings() {
    saveEmailConfig(emailConfig);
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
    toast.success('הגדרות מייל נשמרו');
  }

  async function testEmailSend() {
    if (!testEmail) return toast.error('הזיני כתובת מייל לבדיקה');
    setTestingEmail(true);
    try {
      await sendEmail(testEmail, '✅ בדיקה ממערכת Smart Base', 'זוהי הודעת בדיקה אוטומטית מהמערכת. אם קיבלת הודעה זו — המייל מוגדר כהלכה.');
      toast.success('מייל בדיקה נשלח!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTestingEmail(false);
    }
  }

  function saveSchool() {
    localStorage.setItem('school_name', schoolName);
    setSchoolSaved(true);
    setTimeout(() => setSchoolSaved(false), 2000);
    toast.success('שם בית הספר עודכן');
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-1 flex items-center gap-2">
          <Settings className="h-7 w-7 text-blue-500" />
          הגדרות מערכת
        </h1>
        <p className="text-slate-500">ניהול פיצ׳רים, אינטגרציות והתאמות</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
              tab === id
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">

        {/* ── Features ── */}
        {tab === 'features' && <FeatureFlags />}

        {/* ── Coordinators ── */}
        {tab === 'coordinators' && (
          <div>
            <CoordinatorPermissions />
            <SpecialRolesManager />
          </div>
        )}

        {/* ── Approvals ── */}
        {tab === 'approvals' && <ApprovalSettings />}

        {/* ── WhatsApp ── */}
        {tab === 'whatsapp' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-bold text-slate-800">חיבור WhatsApp — Green API</h3>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800">
              <p className="font-bold mb-1">הגדרה חד-פעמית:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>נכנסים ל-<a href="https://green-api.com" target="_blank" rel="noreferrer" className="underline">green-api.com</a> → נרשמים חשבון חינמי</li>
                <li>יוצרים Instance חדש → מחברים את הנייד דרך QR</li>
                <li>מעתיקים את Instance ID ואת API Token לפה</li>
              </ol>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-600">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>הפרטים נשמרים בדפדפן של המחשב הזה בלבד (localStorage). אל תתחברו ממחשב ציבורי. מומלץ להשתמש ב-Token עם הרשאות מינימליות.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Instance ID</label>
                <input value={waConfig.instanceId || ''}
                  onChange={e => setWaConfig(c => ({ ...c, instanceId: e.target.value }))}
                  placeholder="1234567890"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">API Token</label>
                <div className="relative">
                  <input type={showToken ? 'text' : 'password'}
                    value={waConfig.token || ''}
                    onChange={e => setWaConfig(c => ({ ...c, token: e.target.value }))}
                    placeholder="••••••••••••••••"
                    dir="ltr"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 pl-9"
                  />
                  <button type="button" onClick={() => setShowToken(p => !p)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  מספר הוואצאפ של המנהל/ת <span className="font-normal text-slate-400">(המספר המחובר ל-Green API)</span>
                </label>
                <input value={waConfig.adminPhone || ''}
                  onChange={e => setWaConfig(c => ({ ...c, adminPhone: e.target.value }))}
                  placeholder="0501234567"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
                <p className="text-xs text-slate-400 mt-1">זה המספר שדרכו נשלחות הודעות לצוות. חייב להיות מחובר לאותו Instance.</p>
              </div>
            </div>
            <div className="flex gap-3 mb-6">
              <button onClick={saveWA}
                className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  waSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {waSaved ? <><CheckCircle className="h-4 w-4" /> נשמר</> : <><Save className="h-4 w-4" /> שמור הגדרות</>}
              </button>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-bold text-slate-600 mb-3">בדיקת שליחה</p>
              <div className="flex gap-3">
                <input value={testPhone} onChange={e => setTestPhone(e.target.value)}
                  placeholder="0501234567" dir="ltr"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
                <button onClick={testWA} disabled={testing}
                  className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {testing ? 'שולח...' : 'שלח בדיקה'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Email ── */}
        {tab === 'email' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">שליחת מייל — EmailJS</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
              <p className="font-bold mb-1">מתי ישלח מייל?</p>
              <p>כאשר למשתמשת אין מספר טלפון (וואצאפ) — המערכת תשלח את ההתראה למייל שלה.</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-sm text-yellow-800">
              <p className="font-bold mb-1">הגדרה חד-פעמית:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>נכנסים ל-<a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline">emailjs.com</a> → נרשמים חשבון חינמי (200 מיילים/חודש)</li>
                <li>מחברים שירות מייל (Gmail / Outlook)</li>
                <li>יוצרים Template עם משתנים: <code className="bg-yellow-100 px-1 rounded">{'{{to_email}}'}</code>, <code className="bg-yellow-100 px-1 rounded">{'{{subject}}'}</code>, <code className="bg-yellow-100 px-1 rounded">{'{{message}}'}</code></li>
                <li>מעתיקים Service ID, Template ID ו-Public Key לפה</li>
              </ol>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Service ID</label>
                <input value={emailConfig.serviceId || ''}
                  onChange={e => setEmailConfig(c => ({ ...c, serviceId: e.target.value }))}
                  placeholder="service_xxxxxxx"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Template ID</label>
                <input value={emailConfig.templateId || ''}
                  onChange={e => setEmailConfig(c => ({ ...c, templateId: e.target.value }))}
                  placeholder="template_xxxxxxx"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Public Key</label>
                <input value={emailConfig.publicKey || ''}
                  onChange={e => setEmailConfig(c => ({ ...c, publicKey: e.target.value }))}
                  placeholder="xxxxxxxxxxxxxxxx"
                  dir="ltr"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={saveEmailSettings}
                className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  emailSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {emailSaved ? <><CheckCircle className="h-4 w-4" /> נשמר</> : <><Save className="h-4 w-4" /> שמור הגדרות</>}
              </button>
              {isEmailConfigured() && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" /> מייל מוגדר ופעיל
                </span>
              )}
            </div>
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm font-bold text-slate-600 mb-3">בדיקת שליחה</p>
              <div className="flex gap-3">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  placeholder="test@example.com" dir="ltr" type="email"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
                <button onClick={testEmailSend} disabled={testingEmail}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {testingEmail ? 'שולח...' : 'שלח בדיקה'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── School ── */}
        {tab === 'school' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <School className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-800">פרטי בית הספר</h3>
            </div>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">שם בית הספר</label>
                <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
              </div>
              <button onClick={saveSchool}
                className={`px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  schoolSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {schoolSaved ? <><CheckCircle className="h-4 w-4" /> נשמר</> : <><Save className="h-4 w-4" /> שמור</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Push Notifications ── */}
        {tab === 'push' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-bold text-slate-800">התראות לנייד (Push)</h3>
            </div>
            <PushSettings />
          </div>
        )}
      </div>
    </div>
  );
}

function PushSettings() {
  const [status, setStatus] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  async function requestPermission() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setStatus(perm);
    if (perm === 'granted') {
      toast.success('התראות הופעלו בהצלחה!');
      // register service worker
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <div className={`p-4 rounded-xl border text-sm font-medium ${
        status === 'granted'  ? 'bg-green-50 border-green-200 text-green-800' :
        status === 'denied'   ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
        status === 'unsupported' ? 'bg-slate-50 border-slate-200 text-slate-500' :
        'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        {status === 'granted'     && '✅ התראות מופעלות על מכשיר זה'}
        {status === 'denied'      && '❌ ההרשאה נדחתה — יש לאפשר ידנית בהגדרות הדפדפן'}
        {status === 'default'     && '⏳ ההרשאה טרם ניתנה'}
        {status === 'unsupported' && '⚠ דפדפן זה אינו תומך בהתראות'}
      </div>
      {status !== 'granted' && status !== 'unsupported' && (
        <button onClick={requestPermission}
          className="px-5 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg hover:bg-yellow-700 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          הפעל התראות
        </button>
      )}
      <p className="text-xs text-slate-400">
        התראות יישלחו על: אישור/דחיית בקשות, הודעת בוקר, תורנות היום
      </p>
    </div>
  );
}
