import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import * as XLSX from 'xlsx';
import {
  BarChart3, Download, Users, Clock, ShoppingCart, Printer,
  Wrench, FileSpreadsheet, Calendar, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const TODAY = new Date();

function exportToExcel(data, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
  toast.success(`קובץ ${fileName}.xlsx הורד`);
}

const REASON_HE = {
  sick_child: 'ילד חולה', sick: 'מחלה', choice_day: 'יום בחירה',
  declaration_days: 'ימי הצהרה', family: 'אירוע משפחתי', other: 'אחר',
};

const STATUS_HE = { pending: 'ממתין', approved: 'מאושר', rejected: 'נדחה', awaiting_certificate: 'ממתין לאישור רפואי', completed: 'הושלם' };

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('absences');

  const isAdmin = user && ['admin', 'vice_principal', 'coordinator', 'secretary'].includes(user.role);

  const { data: absences  = [] } = useQuery({ queryKey: ['absences',  'all'], queryFn: () => base44.entities.Absence.list('-created_date'),            enabled: isAdmin });
  const { data: purchases = [] } = useQuery({ queryKey: ['purchases', 'all'], queryFn: () => base44.entities.PurchaseRequest.list('-created_date'),   enabled: isAdmin });
  const { data: prints    = [] } = useQuery({ queryKey: ['prints',    'all'], queryFn: () => base44.entities.PrintRequest.list('-created_date'),       enabled: isAdmin });
  const { data: tickets   = [] } = useQuery({ queryKey: ['tickets',   'all'], queryFn: () => base44.entities.MaintenanceTicket.list('-created_date'),  enabled: isAdmin });
  const { data: duties    = [] } = useQuery({ queryKey: ['duties',    'all'], queryFn: () => base44.entities.DutyAssignment.list(),                    enabled: isAdmin });
  const { data: users     = [] } = useQuery({ queryKey: ['users'],            queryFn: () => base44.entities.User.list(),                              enabled: isAdmin });

  if (!isAdmin) return (
    <div className="p-10 text-center text-slate-400">
      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-200" />
      <p>דוחות זמינים להנהלה בלבד</p>
    </div>
  );

  // ── Stats ──
  const approvedAbsences = absences.filter(a => a.status === 'approved');
  const absencesByPerson = {};
  approvedAbsences.forEach(a => {
    absencesByPerson[a.user_name] = (absencesByPerson[a.user_name] || 0) + 1;
  });
  const topAbsent = Object.entries(absencesByPerson).sort((x, y) => y[1] - x[1]).slice(0, 5);

  const totalPrintPages = prints.reduce((s, p) => s + (p.total_pages || 0), 0);
  const openTickets     = tickets.filter(t => t.status === 'open').length;
  const pendingBudget   = purchases.filter(p => p.status === 'pending').reduce((s, p) => s + (p.estimated_cost || 0), 0);

  // ── Export helpers ──
  function exportAbsences() {
    exportToExcel(
      absences.map(a => ({
        שם: a.user_name,
        סיבה: REASON_HE[a.absence_reason] || a.absence_reason,
        'תאריך התחלה': a.start_date,
        'תאריך סיום': a.end_date,
        סטטוס: STATUS_HE[a.status] || a.status,
        'אישור רפואי': a.medical_certificate_url ? 'כן' : 'לא',
      })),
      'היעדרויות', 'absences-report'
    );
  }

  function exportPurchases() {
    exportToExcel(
      purchases.map(p => ({
        פריט: p.item_name,
        מבקש: p.user_name,
        'עלות משוערת': p.estimated_cost || 0,
        סטטוס: STATUS_HE[p.status] || p.status,
        תיאור: p.description || '',
      })),
      'רכש', 'purchases-report'
    );
  }

  function exportPrints() {
    exportToExcel(
      prints.map(p => ({
        מורה: p.user_name,
        קובץ: p.file_name,
        מקצוע: p.subject || '',
        כיתה: p.class_name || '',
        עותקים: p.copies,
        'סה"כ דפים': p.total_pages,
        'צבע/שחלב': p.color_mode === 'color' ? 'צבע' : 'שחור-לבן',
        סטטוס: STATUS_HE[p.status] || p.status,
      })),
      'הדפסות', 'prints-report'
    );
  }

  function exportDuties() {
    exportToExcel(
      duties.map(d => ({
        עובד: d.staff_name,
        סוג: d.duty_type,
        יום: d.day,
        חודש: d.month,
        שנה: d.year,
        שעה: d.time || '',
      })),
      'תורנויות', 'duties-report'
    );
  }

  function exportTickets() {
    exportToExcel(
      tickets.map(t => ({
        מיקום: t.location,
        תקלה: t.issue,
        דחיפות: t.urgency,
        מדווח: t.reporter_name,
        סטטוס: t.status,
      })),
      'תחזוקה', 'maintenance-report'
    );
  }

  const TABS = [
    { id: 'absences',  label: 'היעדרויות',  icon: Clock,     count: absences.length,  export: exportAbsences  },
    { id: 'purchases', label: 'רכש',         icon: ShoppingCart, count: purchases.length, export: exportPurchases },
    { id: 'prints',    label: 'הדפסות',      icon: Printer,   count: prints.length,    export: exportPrints    },
    { id: 'duties',    label: 'תורנויות',    icon: Users,     count: duties.length,    export: exportDuties    },
    { id: 'tickets',   label: 'תחזוקה',      icon: Wrench,    count: tickets.length,   export: exportTickets   },
  ];

  const activeExport = TABS.find(t => t.id === activeTab)?.export;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-500" />
            דוחות ויצוא
          </h1>
          <p className="text-slate-500">סטטיסטיקות ויצוא Excel לכל המודולים</p>
        </div>
        {activeExport && (
          <button onClick={activeExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm transition-colors">
            <FileSpreadsheet className="h-4 w-4" />
            יצוא Excel
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'היעדרויות מאושרות',  value: approvedAbsences.length, icon: Clock,       color: 'blue'   },
          { label: 'תקלות פתוחות',        value: openTickets,              icon: Wrench,      color: 'red'    },
          { label: 'רכש ממתין (₪)',       value: `₪${pendingBudget.toLocaleString()}`, icon: ShoppingCart, color: 'amber' },
          { label: 'דפים הודפסו',         value: totalPrintPages,          icon: Printer,     color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => {
          const cls = { blue: 'bg-blue-50 border-blue-100 text-blue-700', red: 'bg-yellow-50 border-yellow-100 text-yellow-700', amber: 'bg-yellow-50 border-yellow-100 text-yellow-700', purple: 'bg-yellow-50 border-yellow-100 text-yellow-700' };
          return (
            <div key={label} className={`rounded-2xl border p-5 flex items-center gap-3 ${cls[color]}`}>
              <Icon className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs mt-1 opacity-70">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top absent employees */}
      {topAbsent.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            היעדרויות מאושרות — לפי עובד
          </h3>
          <div className="space-y-2">
            {topAbsent.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-36 text-sm font-medium text-slate-700 truncate">{name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${Math.min(100, (count / topAbsent[0][1]) * 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-yellow-700 w-6 text-left">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 flex-shrink-0 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="h-4 w-4" />
              {label}
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'absences' && <TableView data={absences.map(a => ({
            שם: a.user_name, סיבה: REASON_HE[a.absence_reason] || a.absence_reason,
            'תאריך התחלה': a.start_date, 'תאריך סיום': a.end_date,
            סטטוס: STATUS_HE[a.status] || a.status,
          }))} />}
          {activeTab === 'purchases' && <TableView data={purchases.map(p => ({
            פריט: p.item_name, מבקש: p.user_name,
            'עלות ₪': p.estimated_cost || 0, סטטוס: STATUS_HE[p.status] || p.status,
          }))} />}
          {activeTab === 'prints' && <TableView data={prints.map(p => ({
            מורה: p.user_name, מקצוע: p.subject || '', כיתה: p.class_name || '',
            עותקים: p.copies, 'דפים': p.total_pages, סטטוס: STATUS_HE[p.status] || p.status,
          }))} />}
          {activeTab === 'duties' && <TableView data={duties.map(d => ({
            עובד: d.staff_name, סוג: d.duty_type, יום: d.day, חודש: d.month,
          }))} />}
          {activeTab === 'tickets' && <TableView data={tickets.map(t => ({
            מיקום: t.location, תקלה: t.issue, דחיפות: t.urgency, סטטוס: t.status,
          }))} />}
        </div>
      </div>
    </div>
  );
}

function TableView({ data }) {
  if (!data.length) return <p className="text-center text-slate-400 py-10">אין נתונים</p>;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k} className="text-right font-bold text-slate-600 bg-slate-50 px-3 py-2 border-b border-slate-200">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
              {keys.map(k => (
                <td key={k} className="px-3 py-2 text-slate-700">{row[k]}</td>
              ))}
            </tr>
          ))}
          {data.length > 100 && (
            <tr><td colSpan={keys.length} className="text-center text-slate-400 py-2 text-xs">מוצגות 100 מתוך {data.length} שורות — לכל הנתונים ייצא Excel</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
