import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Palmtree } from 'lucide-react';

export default function AddHoliday({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    type: 'holiday'
  });

  const queryClient = useQueryClient();

  const createHoliday = useMutation({
    mutationFn: (data) => base44.entities.Holiday.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createHoliday.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-green-600" />
            הוספת חופשה/חג
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">שם</label>
            <Input
              placeholder="לדוגמה: חופשת פסח"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">תאריך התחלה</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">תאריך סיום</label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">סוג</label>
            <Select 
              value={formData.type}
              onValueChange={(value) => setFormData({...formData, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">חג</SelectItem>
                <SelectItem value="vacation">חופשה</SelectItem>
                <SelectItem value="professional_development">השתלמות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={createHoliday.isPending}
            >
              {createHoliday.isPending ? 'שומר...' : 'הוסף'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}