import React, { useState } from 'react';
import { X, Upload, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { base44 } from '@/api/firebaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '@/lib/notify';

const URGENCY_OPTIONS = [
  { value: 'normal',    label: 'רגיל',   cls: 'border-slate-200 bg-white text-slate-700', sel: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'urgent',    label: '🔴 דחוף', cls: 'border-slate-200 bg-white text-slate-700', sel: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'immediate', label: '🚨 מיידי',cls: 'border-slate-200 bg-white text-slate-700', sel: 'border-red-500 bg-red-50 text-red-700' },
];

const EMPTY_FORM = {
  file: null, file_name: '',
  subject: '', class_name: '', lesson_topic: '',
  copies: 1, pages_per_copy: 1,
  paper_size: 'A4', color_mode: 'black_white',
  paper_type: 'regular',    // regular | bristol
  double_sided: false,
  binding: 'none',          // none | stapled
  urgency_level: 'normal',  // normal | urgent | immediate
  needed_by: '', notes: '',
};

export function PrintUploadForm({ user, onClose, prefill = null }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(prefill ? { ...EMPTY_FORM, ...prefill, file: null, file_name: '' } : { ...EMPTY_FORM });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const totalPages = form.copies * form.pages_per_copy;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('נא להעלות קובץ PDF בלבד'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('הקובץ גדול מדי — מקסימום 20MB'); return; }
    const isRealPDF = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const b = new Uint8Array(ev.target.result);
        resolve(b[0]===0x25 && b[1]===0x50 && b[2]===0x44 && b[3]===0x46 && b[4]===0x2D);
      };
      reader.readAsArrayBuffer(file.slice(0, 5));
    });
    if (!isRealPDF) { toast.error('הקובץ אינו PDF תקין'); return; }
    set('file', file);
    set('file_name', file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file) { toast.error('נא לבחור קובץ PDF'); return; }
    if (!form.lesson_topic.trim()) { toast.error('נא למלא נושא השיעור'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: form.file });
      await base44.entities.PrintRequest.create({
        user_email:   user.email,
        user_name:    user.full_name,
        user_phone:   user.phone || '',
        file_url,
        file_name:    form.file_name,
        subject:      form.subject,
        class_name:   form.class_name,
        lesson_topic: form.lesson_topic,
        copies:       form.copies,
        pages_per_copy: form.pages_per_copy,
        total_pages:  totalPages,
        paper_size:   form.paper_size,
        color_mode:   form.color_mode,
        paper_type:   form.paper_type,
        double_sided: form.double_sided,
        binding:      form.binding,
        urgency_level: form.urgency_level,
        needed_by:    form.needed_by,
        notes:        form.notes,
        status:       'pending',
      });

      // Notify admins and secretaries
      try {
        const allUsers = await base44.entities.User.list();
        const notifyRoles = ['admin', 'vice_principal', 'secretary'];
        for (const u of allUsers.filter(u => notifyRoles.includes(u.role))) {
          await notify({
            user_email: u.email,
            phone:      u.phone,
            full_name:  u.full_name,
            type:       'print_new',
            title:      'בקשת צילום חדשה',
            message:    `${user.full_name} הגישה בקשת צילום — ${form.subject}, כיתה ${form.class_name}`,
            link:       'printing',
          }).catch(() => {});
        }
      } catch {}

      queryClient.invalidateQueries({ queryKey: ['prints'] });
      queryClient.invalidateQueries({ queryKey: ['myPrints'] });
      onClose();
      toast.success('הבקשה נשלחה לאישור');
    } catch {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400';
  const sel = inp;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {prefill ? '📋 בקשה דומה לקודמת' : '📄 בקשת צילום חדשה'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto" dir="rtl">

          {/* File */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">קובץ PDF *</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => document.getElementById('print-file-input').click()}>
              {form.file_name
                ? <p className="font-semibold text-blue-700 text-sm">📄 {form.file_name}</p>
                : <><Upload className="h-5 w-5 text-slate-300 mx-auto mb-1" /><p className="text-sm text-slate-400">לחץ לבחירת קובץ PDF</p></>
              }
              <input id="print-file-input" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* Subject + Class + Topic */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">מקצוע *</label>
              <Input className={inp} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="מתמטיקה" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">כיתה *</label>
              <Input className={inp} value={form.class_name} onChange={e => set('class_name', e.target.value)} placeholder="ח׳2" required />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">נושא השיעור *</label>
            <Input className={inp} value={form.lesson_topic} onChange={e => set('lesson_topic', e.target.value)} placeholder="לדוגמה: שברים — תרגול" required />
          </div>

          {/* Copies + Pages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">כמות עותקים</label>
              <Input type="number" min="1" value={form.copies} onChange={e => set('copies', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">עמודים בקובץ</label>
              <Input type="number" min="1" value={form.pages_per_copy} onChange={e => set('pages_per_copy', parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {/* Paper options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">גודל נייר</label>
              <select value={form.paper_size} onChange={e => set('paper_size', e.target.value)} className={sel}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">צבע</label>
              <select value={form.color_mode} onChange={e => set('color_mode', e.target.value)} className={sel}>
                <option value="black_white">שחור-לבן</option>
                <option value="color">צבעוני</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">סוג נייר</label>
              <select value={form.paper_type} onChange={e => set('paper_type', e.target.value)} className={sel}>
                <option value="regular">רגיל</option>
                <option value="bristol">בריסטול</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">כריכה</label>
              <select value={form.binding} onChange={e => set('binding', e.target.value)} className={sel}>
                <option value="none">ללא</option>
                <option value="stapled">מהודק</option>
              </select>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">רמת דחיפות</label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => set('urgency_level', opt.value)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    form.urgency_level === opt.value ? opt.sel : opt.cls
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Needed by + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">נדרש עד תאריך</label>
              <Input type="date" value={form.needed_by} onChange={e => set('needed_by', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.double_sided} onChange={e => set('double_sided', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                הדפסה דו-צדדית
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">הערות למזכירה</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="הוראות מיוחדות..." rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none" />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-700">
              סה״כ דפים: <span className="font-bold text-blue-700 text-lg">{totalPages}</span>
              {form.double_sided && <span className="text-xs text-slate-500 mr-1">(דו-צדדי)</span>}
              {form.paper_type === 'bristol' && <span className="text-xs text-purple-600 font-medium mr-2">· בריסטול</span>}
              {form.color_mode === 'color' && <span className="text-xs text-yellow-600 font-medium mr-1">· צבעוני</span>}
            </p>
            {form.binding === 'stapled' && <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">מהודק</span>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? 'מעלה...' : 'שלח לאישור'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
