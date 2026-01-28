import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, Clock, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export default function PrintingPage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPrintRequests = [] } = useQuery({
    queryKey: ['prints'],
    queryFn: () => base44.entities.PrintRequest.list('-created_date'),
    enabled: !!user && user.role === 'secretary',
  });

  const { data: myPrintRequests = [] } = useQuery({
    queryKey: ['myPrints', user?.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const isSecretary = user?.role === 'secretary';
  const displayRequests = isSecretary ? allPrintRequests : myPrintRequests;

  const pendingRequests = displayRequests.filter(r => r.status === 'pending');
  const printingRequests = displayRequests.filter(r => r.status === 'printing');
  const completedRequests = displayRequests.filter(r => r.status === 'completed');
  const totalCopies = pendingRequests.reduce((sum, r) => sum + r.copies, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">מרכז צילומים והדפסות</h1>
          <p className="text-slate-600">
            {isSecretary ? 'ניהול תור ההדפסות' : 'בקשות ההדפסה שלי'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">ממתינים</p>
                <p className="text-2xl font-bold text-slate-800">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Printer className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">בהדפסה</p>
                <p className="text-2xl font-bold text-slate-800">{printingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">הושלמו</p>
                <p className="text-2xl font-bold text-slate-800">{completedRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">סה״כ דפים</p>
                <p className="text-2xl font-bold text-slate-800">{totalCopies}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                תור הדפסות ממתין
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map(request => (
                    <div key={request.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-slate-800">{request.file_name}</span>
                        </div>
                        {request.urgent && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                            דחוף!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{request.user_name}</span>
                        <span>{request.copies} עותקים</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(request.created_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין הדפסות ממתינות</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                הושלמו לאחרונה
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {completedRequests.length > 0 ? (
                  completedRequests.slice(0, 8).map(request => (
                    <div key={request.id} className="p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-slate-800">{request.file_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{request.user_name}</span>
                        <span>{request.copies} עותקים</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין הדפסות שהושלמו</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}