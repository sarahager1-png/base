import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function PrintRequestModal({ isOpen, onClose, user }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    file: null,
    file_name: '',
    subject: '',
    class_name: '',
    copies: 1,
    pages_per_copy: 1,
    urgent: false
  });

  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file, file_name: file.name });
    } else {
      toast.error('נא להעלות קובץ PDF בלבד');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('נא לבחור קובץ');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      const total_pages = formData.copies * formData.pages_per_copy;
      
      await base44.entities.PrintRequest.create({
        user_email: user.email,
        user_name: user.full_name,
        file_url,
        file_name: formData.file_name,
        subject: formData.subject,
        class_name: formData.class_name,
        copies: formData.copies,
        pages_per_copy: formData.pages_per_copy,
        total_pages,
        urgent: formData.urgent,
        status: 'pending'
      });

      queryClient.invalidateQueries({ queryKey: ['prints'] });
      queryClient.invalidateQueries({ queryKey: ['myPrints'] });
      
      onClose();
      setFormData({
        file: null,
        file_name: '',
        subject: '',
        class_name: '',
        copies: 1,
        pages_per_copy: 1,
        urgent: false
      });
      
      toast.success('הבקשה נשלחה לאישור');
    } catch (error) {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900">בקשת צילום חדשה</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">קובץ PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full p-2 border border-slate-300 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">מקצוע</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="לדוגמה: מתמטיקה"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">כיתה</label>
              <Input
                value={formData.class_name}
                onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                placeholder="לדוגמה: ח'2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">כמות עותקים</label>
              <Input
                type="number"
                min="1"
                value={formData.copies}
                onChange={(e) => setFormData({...formData, copies: parseInt(e.target.value)})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">עמודים בקובץ</label>
              <Input
                type="number"
                min="1"
                value={formData.pages_per_copy}
                onChange={(e) => setFormData({...formData, pages_per_copy: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600">
              סה״כ דפים להדפסה: <span className="font-bold text-blue-600">
                {formData.copies * formData.pages_per_copy}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="urgent"
              checked={formData.urgent}
              onChange={(e) => setFormData({...formData, urgent: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="urgent" className="text-sm font-medium text-slate-700">
              דחוף - נדרש בהקדם
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? 'מעלה...' : 'שלח לאישור'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}