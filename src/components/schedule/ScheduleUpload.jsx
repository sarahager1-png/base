import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { importSchedule, clearSchedule, CSV_TEMPLATE } from '@/lib/scheduleStorage';
import { toast } from 'sonner';

const DAY_MAP = { '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5,
  'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5 };

function parseRows(rows) {
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const emailIdx   = headers.findIndex(h => h === 'email' || h === 'מייל');
  const dayIdx     = headers.findIndex(h => h === 'day' || h === 'יום');
  const hourIdx    = headers.findIndex(h => h === 'hour' || h === 'שעה');
  const subjectIdx = headers.findIndex(h => h === 'subject' || h === 'מקצוע');
  const classIdx   = headers.findIndex(h => h === 'classname' || h === 'class_name' || h === 'כיתה');
  const roomIdx    = headers.findIndex(h => h === 'room' || h === 'חדר');

  if (emailIdx < 0 || dayIdx < 0 || hourIdx < 0) return null;

  return rows.slice(1)
    .filter(r => r.some(c => c !== '' && c !== null && c !== undefined))
    .map(r => ({
      email:     String(r[emailIdx] || '').trim().toLowerCase(),
      day:       DAY_MAP[String(r[dayIdx] || '').trim().toLowerCase()] ?? parseInt(r[dayIdx]),
      hour:      parseInt(r[hourIdx]),
      subject:   String(r[subjectIdx] ?? '').trim(),
      className: String(r[classIdx]   ?? '').trim(),
      room:      roomIdx >= 0 ? String(r[roomIdx] ?? '').trim() : '',
    }))
    .filter(e => e.email && !isNaN(e.day) && !isNaN(e.hour));
}

export default function ScheduleUpload({ onImported }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'schedule-template.csv';
    a.click();
  }

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    let rows;

    if (ext === 'csv') {
      const text = await file.text();
      const result = Papa.parse(text, { skipEmptyLines: true });
      rows = result.data;
    } else if (['xlsx', 'xls'].includes(ext)) {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf);
      const ws  = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    } else {
      toast.error('יש להעלות קובץ CSV, XLSX או XLS');
      return;
    }

    const entries = parseRows(rows);
    if (!entries) {
      toast.error('פורמט לא תקין — ודאי שיש עמודות email, day, hour');
      return;
    }
    setPreview({ entries, fileName: file.name });
  }

  function confirmImport() {
    setImporting(true);
    importSchedule(preview.entries);
    toast.success(`יובאו ${preview.entries.length} שורות מערכת שעות`);
    setPreview(null);
    setImporting(false);
    onImported?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-slate-800">יבוא מערכת שעות</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
            <Download className="h-3.5 w-3.5" />
            הורד תבנית CSV
          </button>
          <button onClick={() => clearSchedule() || onImported?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-yellow-200 rounded-lg hover:bg-yellow-50 text-yellow-700">
            נקה מערכת
          </button>
        </div>
      </div>

      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
        <Upload className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-600 mb-1">גרור קובץ לכאן או לחץ לבחירה</p>
        <p className="text-xs text-slate-400">CSV, Excel (.xlsx / .xls) — מקובץ ייצוא של תוכנת המערכת</p>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border border-slate-100">
        <p className="font-bold mb-1">פורמט נדרש (עמודות):</p>
        <code className="font-mono">email | day (0=ראשון…5=שישי) | hour | subject | className | room</code>
        <p className="mt-1">מערכות נתמכות: Ashalim, Tikshuv, Mesila — יצא ל-Excel/CSV ויבא כאן</p>
      </div>

      {preview && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="font-bold text-slate-800">{preview.fileName}</p>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{preview.entries.length} שורות</span>
            </div>
            <button onClick={() => setPreview(null)}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <div className="max-h-48 overflow-auto mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  {['מייל','יום','שעה','מקצוע','כיתה','חדר'].map(h => (
                    <th key={h} className="p-2 text-right font-bold text-slate-500 border-b border-slate-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.entries.slice(0, 20).map((e, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-2 font-mono text-slate-600">{e.email}</td>
                    <td className="p-2">{['א','ב','ג','ד','ה','ו'][e.day]}</td>
                    <td className="p-2">{e.hour}</td>
                    <td className="p-2">{e.subject}</td>
                    <td className="p-2">{e.className}</td>
                    <td className="p-2">{e.room}</td>
                  </tr>
                ))}
                {preview.entries.length > 20 && (
                  <tr><td colSpan={6} className="p-2 text-slate-400 text-center">...ועוד {preview.entries.length - 20} שורות</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={confirmImport} disabled={importing}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {importing ? 'מייבא...' : `אישור יבוא — ${preview.entries.length} שורות`}
          </button>
        </div>
      )}
    </div>
  );
}
