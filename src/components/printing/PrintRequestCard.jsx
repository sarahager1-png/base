import React from 'react';
import { FileText, Download, Check, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

function handlePrint(fileUrl) {
  const win = window.open(fileUrl, '_blank');
  if (win) {
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
}

function PaperSizeBadge({ paperSize }) {
  const config = {
    special: { label: 'מיוחד', cls: 'bg-amber-100 text-amber-700' },
    A3: { label: 'A3', cls: 'bg-blue-100 text-blue-700' },
  };
  const { label, cls } = config[paperSize] || { label: 'A4', cls: 'bg-slate-100 text-slate-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${cls}`}>{label}</span>;
}

export function AdminRequestCard({ request, onApprove }) {
  return (
    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-slate-800">{request.file_name}</span>
            {request.urgent && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">דחוף!</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-slate-600">
            <span>👤 {request.user_name}</span>
            <span>📚 {request.subject}</span>
            <span>🏫 {request.class_name}</span>
            <span>📄 {request.total_pages} דפים</span>
            <span className="flex items-center gap-1">
              <PaperSizeBadge paperSize={request.paper_size} />
              {request.color_mode === 'color' && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">צבעוני</span>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{new Date(request.created_date).toLocaleDateString('he-IL')}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={request.file_url} target="_blank" rel="noopener noreferrer"
            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="הורד PDF">
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={() => handlePrint(request.file_url)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            title="תצוגה מקדימה להדפסה"
          >
            <Printer className="h-4 w-4" />
          </button>
          <Button size="sm" onClick={() => onApprove(request.id)} className="bg-green-600 hover:bg-green-700">
            <Check className="h-4 w-4 mr-1" />אשר
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SecretaryRequestCard({ request, isSelected, onToggle }) {
  return (
    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={isSelected} onChange={onToggle} className="mt-1 w-5 h-5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-slate-800">{request.file_name}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm text-slate-600">
            <span>👤 {request.user_name}</span>
            <span>📚 {request.subject}</span>
            <span>🏫 {request.class_name}</span>
            <span>📄 {request.total_pages} דפים</span>
            <span className="flex items-center gap-1">
              <PaperSizeBadge paperSize={request.paper_size} />
              {request.color_mode === 'color' && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">צבעוני</span>
              )}
            </span>
            <span>✅ {request.approved_by}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a href={request.file_url} target="_blank" rel="noopener noreferrer"
            className="p-2 hover:bg-blue-100 rounded-lg text-blue-600" title="הורד PDF">
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={() => handlePrint(request.file_url)}
            className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
            title="הדפס ישירות"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeacherRequestCard({ request }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'ממתין לאישור' },
    approved: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'מאושר' },
    printing: { bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'בהדפסה' },
    completed: { bg: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-700', label: 'הושלם' },
  };
  const { bg, badge, label } = statusConfig[request.status] || statusConfig.completed;
  const paperLabel = request.paper_size === 'special' ? 'גודל מיוחד' : request.paper_size === 'A3' ? 'A3' : 'A4';
  const paperCls = request.paper_size === 'special' ? 'bg-amber-100 text-amber-700' : request.paper_size === 'A3' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`p-4 rounded-xl border ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-blue-500" />
        <span className="font-bold text-slate-800">{request.file_name}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${badge}`}>{label}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
        <span>📚 {request.subject}</span>
        <span>🏫 {request.class_name}</span>
        <span>📄 {request.total_pages} דפים</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${paperCls}`}>{paperLabel}</span>
        {request.color_mode === 'color' && (
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">🎨 צבעוני</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">{new Date(request.created_date).toLocaleDateString('he-IL')}</p>
    </div>
  );
}
