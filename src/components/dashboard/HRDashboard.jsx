import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Upload, FileText, Calendar, Table, UserPlus, Mail, CheckCircle } from 'lucide-react';

export default function HRDashboard() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteName, setInviteName] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteUser = useMutation({
    mutationFn: async ({ email, role }) => {
      await base44.users.inviteUser(email, role);
      return { email, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setInviteEmail('');
      setInviteName('');
      setInviteTitle('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteUser.mutate({ email: inviteEmail, role: inviteRole });
  };

  const roleOptions = [
    { value: 'user', label: 'מורה/צוות' },
    { value: 'admin', label: 'מנהלת/סגנית' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">ההזמנה נשלחה בהצלחה!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          ניהול מצבת כוח אדם
        </h2>
        
        {/* Quick Invite Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            הזמנת עובד חדש למערכת
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">שם מלא</label>
              <input
                type="text"
                placeholder="לדוגמה: חנה כהן"
                className="w-full p-2 border border-blue-200 rounded-lg bg-white"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">אימייל</label>
              <input
                type="email"
                placeholder="chana@example.com"
                className="w-full p-2 border border-blue-200 rounded-lg bg-white"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">תפקיד</label>
              <input
                type="text"
                placeholder="לדוגמה: מחנכת ח'2"
                className="w-full p-2 border border-blue-200 rounded-lg bg-white"
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">הרשאה במערכת</label>
              <select
                className="w-full p-2 border border-blue-200 rounded-lg bg-white"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail || inviteUser.isPending}
            className="mt-4 w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {inviteUser.isPending ? 'שולח הזמנה...' : 'שלח הזמנה באימייל'}
          </button>
        </div>

        {/* Staff List */}
        <div className="border-t border-slate-100 pt-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Table className="h-4 w-4 text-slate-400" />
            רשימת עובדים במערכת ({users.length})
          </h3>
          
          {users.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-600">שם</th>
                    <th className="p-3 font-bold text-slate-600">אימייל</th>
                    <th className="p-3 font-bold text-slate-600">תפקיד</th>
                    <th className="p-3 font-bold text-slate-600">הרשאה</th>
                    <th className="p-3 font-bold text-slate-600">הצטרף</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{u.full_name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-slate-500">{u.title || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role === 'admin' ? 'מנהל' : 'צוות'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        {new Date(u.created_date).toLocaleDateString('he-IL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
              <UserPlus className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">אין עדיין משתמשים במערכת</p>
              <p className="text-slate-400 text-xs mt-1">התחילי בהזמנת העובדים למעלה</p>
            </div>
          )}
        </div>

        {/* Import Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
          <div className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-full text-green-600 border border-green-100">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">ייבוא רשימת עובדים</h3>
                <p className="text-xs text-slate-500">קובץ Excel/CSV (בעתיד)</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 opacity-50">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <span className="text-sm font-bold text-slate-400">בפיתוח</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 rounded-full text-amber-600 border border-amber-100">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">ייבוא מערכת שעות</h3>
                <p className="text-xs text-slate-500">קובץ Excel (בעתיד)</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 opacity-50">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <span className="text-sm font-bold text-slate-400">בפיתוח</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}