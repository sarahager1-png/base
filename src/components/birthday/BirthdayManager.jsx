import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Cake, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BirthdayManager() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: birthdays = [] } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () => base44.entities.Birthday.list(),
  });

  const createBirthday = useMutation({
    mutationFn: async () => {
      const user = users.find(u => u.email === selectedUser);
      return base44.entities.Birthday.create({
        user_email: selectedUser,
        user_name: user?.full_name || '',
        birth_date: birthDate,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
      toast.success('תאריך לידה נוסף בהצלחה');
      setSelectedUser('');
      setBirthDate('');
      setShowForm(false);
    },
  });

  const deleteBirthday = useMutation({
    mutationFn: (id) => base44.entities.Birthday.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
      toast.success('תאריך לידה הוסר');
    },
  });

  const usedEmails = birthdays.map(b => b.user_email);
  const availableUsers = users.filter(u => !usedEmails.includes(u.email));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Cake className="h-5 w-5 text-pink-600" />
          </div>
          ניהול תאריכי לידה
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          הוסף תאריך לידה
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
          <div className="space-y-3">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">בחר עובד</option>
              {availableUsers.map(user => (
                <option key={user.email} value={user.email}>
                  {user.full_name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedUser('');
                  setBirthDate('');
                }}
                className="flex-1 px-3 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                ביטול
              </button>
              <button
                onClick={() => createBirthday.mutate()}
                disabled={!selectedUser || !birthDate || createBirthday.isPending}
                className="flex-1 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-slate-300"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {birthdays.length > 0 ? (
          birthdays.map(birthday => {
            const birthDateObj = new Date(birthday.birth_date);
            const monthDay = `${birthDateObj.getDate()}/${birthDateObj.getMonth() + 1}`;
            return (
              <div key={birthday.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">{birthday.user_name}</p>
                  <p className="text-sm text-slate-500">{monthDay}</p>
                </div>
                <button
                  onClick={() => deleteBirthday.mutate(birthday.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-center py-4">אין תאריכי לידה</p>
        )}
      </div>
    </div>
  );
}