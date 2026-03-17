import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Save, Users, Bell, UserCog, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';
import DailyAnnouncementsManager from './DailyAnnouncementsManager';
import { useAccessibility } from '@/lib/AccessibilityContext';

const FEATURES = [
  { id: 'absences_enabled',    label: 'דיווח היעדרויות' },
  { id: 'substitutes_enabled', label: 'דיווח מילוי מקום' },
  { id: 'purchases_enabled',   label: 'בקשות רכש' },
  { id: 'printing_enabled',    label: 'בקשות הדפסה' },
  { id: 'maintenance_enabled', label: 'דיווחי תחזוקה' },
  { id: 'meetings_enabled',    label: 'יומן פגישות' },
  { id: 'birthdays_enabled',   label: 'תאריכי לידה' },
  { id: 'overtime_enabled',    label: 'שעות נוספות' },
  { id: 'journal_enabled',     label: 'יומן בית הספר' },
  { id: 'messages_enabled',    label: 'הודעות צוות' },
];

const GENDER_OPTIONS = [
  { value: 'female', label: 'בית ספר בנות', emoji: '👩', desc: 'פנייה בלשון נקבה' },
  { value: 'male',   label: 'בית ספר בנים', emoji: '👨', desc: 'פנייה בלשון זכר' },
  { value: 'mixed',  label: 'בית ספר מעורב', emoji: '👥', desc: 'פנייה כללית' },
];

const ROLE_LABELS = {
  admin: 'מנהל/ת', vice_principal: 'סגן/ית מנהל', secretary: 'מזכיר/ה',
  teacher: 'עובד/ת הוראה', counselor: 'יועץ/ת', coordinator: 'רכז/ת',
  maintenance: 'אב בית', substitute: 'ממלא/ת מקום', assistant: 'סייע/ת', user: 'עובד/ת כללי'
};

function TeamGenderPanel() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users-gender'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateGender = useMutation({
    mutationFn: ({ id, gender }) => base44.entities.User.update(id, { gender }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users-gender'] });
      toast.success('מגדר עודכן בהצלחה');
    },
  });

  if (isLoading) return <div className="text-center py-8 text-slate-400">טוען...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
          <UserCog className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">הגדרת מגדר חברי הצוות</h3>
          <p className="text-xs text-slate-400">שינוי מגדר משפיע על לשון הפנייה האישית</p>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                {u.avatar || u.full_name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.full_name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[u.role] || u.role}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => updateGender.mutate({ id: u.id, gender: 'female' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  u.gender === 'female'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-500 hover:border-pink-300'
                }`}
              >
                👩 נקבה
              </button>
              <button
                onClick={() => updateGender.mutate({ id: u.id, gender: 'male' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  u.gender === 'male'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-500 hover:border-indigo-300'
                }`}
              >
                👨 זכר
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-slate-400 py-6 text-sm">לא נמצאו משתמשים</p>
        )}
      </div>
    </div>
  );
}

export default function InstitutionSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const { schoolGender, setSchoolGender } = useAccessibility();
  const qc = useQueryClient();

  const { data: allSettings = [] } = useQuery({
    queryKey: ['institution-settings'],
    queryFn: () => base44.entities.InstitutionSettings.list(),
    onSuccess: (data) => { if (data.length > 0) setSettings(data[0]); }
  });

  const saveMut = useMutation({
    mutationFn: (data) => settings?.id
      ? base44.entities.InstitutionSettings.update(settings.id, data)
      : base44.entities.InstitutionSettings.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['institution-settings'] }); toast.success('ההגדרות נשמרו'); },
  });

  const handleToggle = (id) => {
    if (!settings) return;
    setSettings({ ...settings, [id]: !settings[id] });
  };

  const handleSave = () => {
    if (!settings) { toast.error('יש להכניס שם מוסד'); return; }
    saveMut.mutate(settings);
  };

  if (!settings && allSettings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">הגדרות מוסד</h3>
        </div>
        <input
          type="text"
          placeholder="שם המוסד"
          value={settings?.institution_name || ''}
          onChange={(e) => setSettings({ ...settings || {}, institution_name: e.target.value })}
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:text-white"
        />
        <button
          onClick={() => saveMut.mutate({ institution_name: settings?.institution_name || 'המוסד שלי' })}
          className="w-full px-4 py-2 text-white rounded-lg font-semibold"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          אתחל הגדרות
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'features',      label: 'תכונות',          icon: Settings },
    { id: 'gender',        label: 'סוג בית הספר',    icon: Users },
    { id: 'team',          label: 'מגדר צוות',       icon: UserCog },
    { id: 'staff_hours',   label: 'כוח אדם',         icon: BookOpen },
    { id: 'announcements', label: 'הודעות יומיות',   icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Nav */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all
              ${activeTab === t.id ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">הגדרות מוסד</h3>
                {settings && <p className="text-xs text-slate-400">{settings.institution_name}</p>}
              </div>
            </div>
            <button onClick={handleSave} disabled={saveMut.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Save className="h-4 w-4" />
              שמור
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">תכונות פעילות</p>
            {FEATURES.map(f => (
              <label key={f.id}
                     className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors group">
                <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{f.label}</span>
                <div
                  onClick={() => handleToggle(f.id)}
                  className={`relative w-10 h-5 rounded-full transition-all cursor-pointer flex-shrink-0
                    ${(settings?.[f.id] ?? true) ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all
                    ${(settings?.[f.id] ?? true) ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Gender Tab */}
      {activeTab === 'gender' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">סוג בית הספר</h3>
              <p className="text-xs text-slate-400">משפיע על לשון הפנייה בכל המערכת</p>
            </div>
          </div>

          <div className="space-y-3">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSchoolGender(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right
                  ${schoolGender === opt.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}
              >
                <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${schoolGender === opt.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
                {schoolGender === opt.value && (
                  <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <p className="text-xs text-slate-500 font-medium mb-2">תצוגה מקדימה:</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {schoolGender === 'male'   && 'בוקר טוב, המנהל! יש לך 3 פריטים לטיפול.'}
              {schoolGender === 'female' && 'בוקר טוב, המנהלת! יש לך 3 פריטים לטיפול.'}
              {schoolGender === 'mixed'  && 'בוקר טוב! יש 3 פריטים לטיפול.'}
            </p>
          </div>
        </div>
      )}

      {/* Team Gender Tab */}
      {activeTab === 'team' && <TeamGenderPanel />}

      {/* Staff Hours Tab */}
      {activeTab === 'staff_hours' && <StaffHoursPanel />}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && <DailyAnnouncementsManager />}
    </div>
  );
}

function StaffHoursPanel() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users-hours'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateHours = useMutation({
    mutationFn: ({ id, frontline_hours, pregnancy_hours_quota, declaration_days_quota }) =>
      base44.entities.User.update(id, { frontline_hours, pregnancy_hours_quota, declaration_days_quota }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users-hours'] });
      toast.success('שעות עודכנו בהצלחה');
    },
  });

  const [editing, setEditing] = useState({});

  const teachingStaff = users.filter(u =>
    ['teacher', 'coordinator', 'counselor', 'vice_principal', 'admin'].includes(u.role)
  );

  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: parseInt(value) || 0 },
    }));
  };

  const handleSave = (user) => {
    const changes = editing[user.id] || {};
    updateHours.mutate({
      id: user.id,
      frontline_hours: changes.frontline_hours ?? user.frontline_hours ?? 24,
      pregnancy_hours_quota: changes.pregnancy_hours_quota ?? user.pregnancy_hours_quota ?? 40,
      declaration_days_quota: changes.declaration_days_quota ?? user.declaration_days_quota ?? 2,
    });
    setEditing(prev => { const n = { ...prev }; delete n[user.id]; return n; });
  };

  if (isLoading) return <div className="text-center py-8 text-slate-400">טוען...</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">שעות תקן וקיצבות שנתיות</h3>
          <p className="text-xs text-slate-400">הגדרת שעות פרונטליות ומכסות לכל עובד/ת הוראה</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-600">
              <th className="pb-3 pr-0 text-xs font-bold text-slate-500">שם</th>
              <th className="pb-3 px-3 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />שעות פרונטליות</div>
              </th>
              <th className="pb-3 px-3 text-xs font-bold text-slate-500">מכסת הריון (שעות)</th>
              <th className="pb-3 px-3 text-xs font-bold text-slate-500">ימי הצהרה</th>
              <th className="pb-3 pl-0 text-xs font-bold text-slate-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {teachingStaff.map(u => {
              const e = editing[u.id] || {};
              const isDirty = Object.keys(e).length > 0;
              return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 pr-0">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        {u.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-xs">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{ROLE_LABELS[u.role] || u.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number" min="0" max="40"
                      value={e.frontline_hours ?? u.frontline_hours ?? 24}
                      onChange={(e2) => handleChange(u.id, 'frontline_hours', e2.target.value)}
                      className="w-16 text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number" min="0" max="80"
                      value={e.pregnancy_hours_quota ?? u.pregnancy_hours_quota ?? 40}
                      onChange={(e2) => handleChange(u.id, 'pregnancy_hours_quota', e2.target.value)}
                      className="w-16 text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number" min="0" max="10"
                      value={e.declaration_days_quota ?? u.declaration_days_quota ?? 2}
                      onChange={(e2) => handleChange(u.id, 'declaration_days_quota', e2.target.value)}
                      className="w-16 text-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </td>
                  <td className="py-3 pl-0">
                    {isDirty && (
                      <button
                        onClick={() => handleSave(u)}
                        disabled={updateHours.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                      >
                        <Save className="h-3 w-3" />שמור
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {teachingStaff.length === 0 && (
          <p className="text-center text-slate-400 py-8">אין עובדי הוראה במערכת</p>
        )}
      </div>

      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          <strong>הסבר:</strong> שעות פרונטליות = מגבלת מ״מ יומית. מכסת הריון = מקסימום שעות היעדרות עקב הריון. ימי הצהרה = מקסימום ימי הצהרת מחלה.
        </p>
      </div>
    </div>
  );
}
