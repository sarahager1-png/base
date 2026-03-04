import React from 'react';
import { Clock, Check, Printer, CheckCircle, FileText } from 'lucide-react';

export function PrintStats({ pending, approved, printing, completed, totalPages }) {
  const stats = [
    { label: 'ממתינים לאישור', value: pending, icon: Clock, color: 'amber' },
    { label: 'מאושרים', value: approved, icon: Check, color: 'green' },
    { label: 'בהדפסה', value: printing, icon: Printer, color: 'blue' },
    { label: 'הושלמו', value: completed, icon: CheckCircle, color: 'green' },
    { label: 'דפים החודש', value: totalPages, icon: FileText, color: 'purple' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-${color}-100 rounded-full`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
