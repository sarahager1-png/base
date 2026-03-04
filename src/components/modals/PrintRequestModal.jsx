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
    paper_size: 'A4',
    color_mode: 'black_white',
    print_type: 'regular',
    transparency_count: 0,
    double_sided: false,
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
        paper_size: formData.paper_size,
        color_mode: formData.color_mode,
        print_type: formData.print_type,
        transparency_count: formData.print_type === 'transparency' ? formData.transparency_count : 0,
        double_sided: formData.double_sided,
        urgent: formData.urgent,
        status: 'pending'
      });

      queryClient.invalidateQueries({ queryKey: ['prints'] });
      queryClient.invalidateQueries({ queryKey: ['myPrints'] });
      onClose();
      toast.success('הבקשה נשלחה לאישור');
      setFormData({
        file: null, file_name: '', subject: '', class_name: '',
        copies: 1, pages_per_copy: 1, paper_size: 'A4',
        color_mode: 'black_white', print_type: 'regular',
        transparency_count: 0, double_sided: false, urgent: false
      });
    } catch (error) {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const isTransparency = formData.print_type === 'transparency';

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

          {/* Print type */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">סוג חומר</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'regular',      label: '📄 דף רגיל',   desc: 'נייר A4/A3 רגיל' },
                { value: 'transparency', label: '🔲 דף שקוף',   desc: 'שקפית לתצוגה' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, print_type: opt.value })}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${
                    formData.print_type === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Transparency count - shown only when transparency is selected */}
          {isTransparency && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="text-xs font-bold text-amber-800 block mb-2">
                🔲 כמות דפים שקופים
              </label>
              <Input
                type="number"
                min="1"
                value={formData.transparency_count}
                onChange={(e) => setFormData({ ...formData, transparency_count: parseInt(e.target.value) || 0 })}
                className="bg-white border-amber-300"
                placeholder="מספר דפים שקופים"
              />
              <p className="text-[10px] text-amber-600 mt-1">
                דפים שקופים נספרים בנפרד ממכסת הצילומים הרגילה
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">גודל דף</label>
              <select
                value={formData.paper_size}
                onChange={(e) => setFormData({...formData, paper_size: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                disabled={isTransparency}
              >
                <option value="A4">A4 רגיל</option>
                <option value="A3">A3 גדול</option>
                <option value="special">גודל מיוחד</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">סוג הדפסה</label>
              <select
                value={formData.color_mode}
                onChange={(e) => setFormData({...formData, color_mode: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="black_white">שחור-לבן</option>
                <option value="color">צבעוני</option>
              </select>
            </div>
          </div>

          {/* Double-sided - only for regular paper */}
          {!isTransparency && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="double_sided"
                checked={formData.double_sided}
                onChange={(e) => setFormData({...formData, double_sided: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="double_sided" className="text-sm font-medium text-slate-700">
                הדפסה דו-צדדית
              </label>
            </div>
          )}

          {/* Summary */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            {isTransparency ? (
              <>
                <p className="text-sm text-slate-600">
                  סה״כ דפים שקופים: <span className="font-bold text-amber-600">{formData.transparency_count}</span>
                </p>
                <p className="text-xs text-amber-600 font-medium">🔲 שקפיות - נספרות בנפרד מהמכסה הרגילה</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  סה״כ דפים להדפסה:{' '}
                  <span className="font-bold text-blue-600">
                    {formData.copies * formData.pages_per_copy}
                    {formData.double_sided && <span className="text-slate-500 font-normal text-xs"> (דו-צדדי)</span>}
                  </span>
                </p>
                {formData.paper_size === 'special' && (
                  <p className="text-xs text-amber-600 font-medium">⚠️ גודל מיוחד - דורש אישור מיוחד</p>
                )}
                {formData.color_mode === 'color' && (
                  <p className="text-xs text-purple-600 font-medium">🎨 הדפסה צבעונית</p>
                )}
              </>
            )}
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