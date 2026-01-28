import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar, Plus } from 'lucide-react';

export default function AddJournalEntry({ defaultDate, onClose }) {
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    entry_type: 'announcement',
    priority: 'normal',
    visible_to: ['all']
  });

  const queryClient = useQueryClient();

  const createEntry = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntry.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            רשומה חדשה ליומן
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-xs font-bold text-slate-600 block mb-2">סוג</label>
              <Select 
                value={formData.entry_type}
                onValueChange={(value) => setFormData({...formData, entry_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">הודעה</SelectItem>
                  <SelectItem value="reminder">תזכורת</SelectItem>
                  <SelectItem value="event">אירוע</SelectItem>
                  <SelectItem value="meeting">ישיבה</SelectItem>
                  <SelectItem value="holiday">חג</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">כותרת</label>
            <Input
              placeholder="לדוגמה: ישיבת צוות, יום הולדת..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">פרטים</label>
            <Textarea
              placeholder="תוכן מפורט של האירוע..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="h-32"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">רמת חשיבות</label>
            <Select 
              value={formData.priority}
              onValueChange={(value) => setFormData({...formData, priority: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">רגיל</SelectItem>
                <SelectItem value="important">חשוב</SelectItem>
                <SelectItem value="urgent">דחוף</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createEntry.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createEntry.isPending ? 'שומר...' : 'הוסף ליומן'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}