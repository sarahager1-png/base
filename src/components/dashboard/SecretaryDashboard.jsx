import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import { Printer, ShoppingCart, FileText, ClipboardCheck } from 'lucide-react';

export default function SecretaryDashboard() {
  const queryClient = useQueryClient();

  const { data: printQueue = [] } = useQuery({
    queryKey: ['prints', 'pending'],
    queryFn: () => base44.entities.PrintRequest.filter({ status: 'pending' }),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', 'approved'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'approved' }),
  });

  const completePrint = useMutation({
    mutationFn: (id) => base44.entities.PrintRequest.update(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prints'] });
    },
  });

  const totalCopies = printQueue.reduce((sum, job) => sum + job.copies, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="ממתין להדפסה" 
          value={printQueue.length} 
          icon={Printer} 
          color="blue" 
          subtext={`${totalCopies} דפים סה״כ`} 
        />
        <StatCard 
          title="רכש לביצוע" 
          value={purchases.length} 
          icon={ShoppingCart} 
          color="amber" 
          subtext="מאושרים תקציבית" 
        />
        <StatCard 
          title="דוחות לעיבוד" 
          value="0" 
          icon={FileText} 
          color="purple" 
          subtext="הכל מעודכן" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Print Queue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-500" />
            תור הדפסות פעיל
          </h3>
          <div className="space-y-3">
            {printQueue.length > 0 ? (
              printQueue.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${job.urgent ? 'bg-red-100 text-red-600' : 'bg-white text-slate-500'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{job.user_name}</p>
                      <p className="text-xs text-slate-500">{job.file_name} | {job.copies} עותקים</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => completePrint.mutate(job.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    בוצע
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">אין הדפסות ממתינות</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-purple-500" />
              אישור דוחות נוכחות
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              מערכת דוחות הנוכחות תהיה זמינה בקרוב
            </p>
            <button className="w-full py-2 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors border border-purple-200">
              מעבר לאישור מרוכז
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
              רכש וספקים
            </h3>
            <div className="flex gap-3">
              <button className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:border-amber-400 hover:text-amber-600 text-sm font-medium">
                הזמנת ציוד
              </button>
              <button className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:border-amber-400 hover:text-amber-600 text-sm font-medium">
                ניהול ספקים
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}