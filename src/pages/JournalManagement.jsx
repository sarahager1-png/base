import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Pencil, Trash2, X, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function JournalManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    entry_type: 'announcement',
    priority: 'normal',
    visible_to: ['all']
  });

  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['journal'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date'),
  });

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      resetForm();
      toast.success('הרשומה נוספה בהצלחה');
    },
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }) => base44.entities.JournalEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      resetForm();
      toast.success('הרשומה עודכנה בהצלחה');
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (id) => base44.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('הרשומה נמחקה');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, data: formData });
    } else {
      createEntry.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
      entry_type: 'announcement',
      priority: 'normal',
      visible_to: ['all']
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      title: entry.title,
      content: entry.content,
      entry_type: entry.entry_type,
      priority: entry.priority,
      visible_to: entry.visible_to || ['all']
    });
    setShowForm(true);
  };

  const filteredEntries = entries.filter(entry => {
    const dateMatch = !dateFilter || entry.date === dateFilter;
    const typeMatch = typeFilter === 'all' || entry.entry_type === typeFilter;
    return dateMatch && typeMatch;
  });

  const typeLabels = {
    announcement: 'הודעה',
    reminder: 'תזכורת',
    event: 'אירוע',
    holiday: 'חג',
    meeting: 'פגישה'
  };

  const priorityLabels = {
    normal: 'רגיל',
    important: 'חשוב',
    urgent: 'דחוף'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">ניהול יומן בית הספר</h1>
            <p className="text-slate-600">יצירה ועריכת רשומות ביומן</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            רשומה חדשה
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">סינון:</span>
            </div>
            <div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
                placeholder="תאריך"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">כל הסוגים</option>
                <option value="announcement">הודעות</option>
                <option value="reminder">תזכורות</option>
                <option value="event">אירועים</option>
                <option value="holiday">חגים</option>
                <option value="meeting">פגישות</option>
              </select>
            </div>
            {(dateFilter || typeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  setTypeFilter('all');
                }}
              >
                נקה סינונים
              </Button>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900">
                  {editingEntry ? 'עריכת רשומה' : 'רשומה חדשה'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">תאריך</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">סוג רשומה</label>
                  <select
                    value={formData.entry_type}
                    onChange={(e) => setFormData({...formData, entry_type: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="announcement">הודעה</option>
                    <option value="reminder">תזכורת</option>
                    <option value="event">אירוע</option>
                    <option value="holiday">חג</option>
                    <option value="meeting">פגישה</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">כותרת</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">תוכן</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="h-32"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">עדיפות</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="normal">רגיל</option>
                    <option value="important">חשוב</option>
                    <option value="urgent">דחוף</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    ביטול
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingEntry ? 'עדכן' : 'צור רשומה'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              רשומות ביומן ({filteredEntries.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">תאריך</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">סוג</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">כותרת</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">תוכן</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">עדיפות</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length > 0 ? (
                  filteredEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-700">
                        {new Date(entry.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="p-4">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {typeLabels[entry.entry_type]}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-800">
                        {entry.title}
                      </td>
                      <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                        {entry.content}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          entry.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          entry.priority === 'important' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {priorityLabels[entry.priority]}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('האם למחוק רשומה זו?')) {
                                deleteEntry.mutate(entry.id);
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400">
                      {dateFilter || typeFilter !== 'all' ? 'אין רשומות התואמות את הסינון' : 'אין רשומות ביומן'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}