import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Clock, Map, Timer, Printer, ShoppingCart, Hammer, Monitor, Sparkles } from 'lucide-react';
import { SubstituteForm, SubstituteHistory } from './forms/SubstituteForm';
import { OvertimeForm, OvertimeHistory, SpecialOvertimeForm, SpecialOvertimeHistory } from './forms/OvertimeForms';
import { ExternalActivityForm, ExternalActivityHistory, PurchaseForm, MaintenanceForm } from './forms/OtherForms';

const featureConfig = {
  substitute: { icon: Clock, title: 'דיווח מילוי מקום', color: 'purple' },
  external: { icon: Map, title: 'פעילות חוץ', color: 'green' },
  overtime: { icon: Timer, title: 'שעות נוספות', color: 'amber' },
  special_overtime: { icon: Sparkles, title: 'שעות נוספות מיוחדות', color: 'indigo' },
  copies: { icon: Printer, title: 'מכסת צילומים', color: 'blue' },
  purchase: { icon: ShoppingCart, title: 'בקשת רכש', color: 'amber' },
  maintenance_general: { icon: Hammer, title: 'תחזוקה כללית', color: 'slate' },
  maintenance_pc: { icon: Monitor, title: 'תחזוקת מחשבים', color: 'blue' },
};

const noHistoryFeatures = ['purchase', 'maintenance_general', 'maintenance_pc'];

export default function ReportingModal({ isOpen, onClose, feature, user }) {
  const [activeTab, setActiveTab] = useState('report');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isOpen) setActiveTab('report');
  }, [isOpen]);

  const { data: substituteHistory = [] } = useQuery({
    queryKey: ['substitutes', user.email],
    queryFn: () => base44.entities.SubstituteReport.filter({ reporter_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'substitute' && activeTab === 'history',
  });
  const { data: overtimeHistory = [] } = useQuery({
    queryKey: ['overtime', user.email],
    queryFn: () => base44.entities.OvertimeReport.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'overtime' && activeTab === 'history',
  });
  const { data: externalHistory = [] } = useQuery({
    queryKey: ['external', user.email],
    queryFn: () => base44.entities.ExternalActivity.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'external' && activeTab === 'history',
  });
  const { data: specialOvertimeHistory = [] } = useQuery({
    queryKey: ['special_overtime', user.email],
    queryFn: () => base44.entities.SpecialOvertimeReport.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'special_overtime' && activeTab === 'history',
  });

  const createSubstitute = useMutation({
    mutationFn: (data) => base44.entities.SubstituteReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['substitutes'] }); onClose(); },
  });
  const createOvertime = useMutation({
    mutationFn: (data) => base44.entities.OvertimeReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['overtime'] }); onClose(); },
  });
  const createExternal = useMutation({
    mutationFn: (data) => base44.entities.ExternalActivity.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['external'] }); onClose(); },
  });
  const createPurchase = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); onClose(); },
  });
  const createMaintenance = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceTicket.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance'] }); onClose(); },
  });
  const createSpecialOvertime = useMutation({
    mutationFn: (data) => base44.entities.SpecialOvertimeReport.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['special_overtime'] }); onClose(); },
  });

  const handleSubmit = (data) => {
    if (feature === 'substitute') createSubstitute.mutate(data);
    else if (feature === 'overtime') createOvertime.mutate({ user_email: user.email, user_name: user.full_name, ...data });
    else if (feature === 'external') createExternal.mutate({ user_email: user.email, user_name: user.full_name, date: data.start_date, destination: data.destination, start_time: data.start_time, end_time: data.end_time });
    else if (feature === 'purchase') createPurchase.mutate({ user_email: user.email, user_name: user.full_name, ...data });
    else if (feature === 'maintenance_general' || feature === 'maintenance_pc') createMaintenance.mutate({ reporter_email: user.email, reporter_name: user.full_name, ticket_type: feature === 'maintenance_pc' ? 'computer' : 'general', ...data });
    else if (feature === 'special_overtime') createSpecialOvertime.mutate({ user_email: user.email, user_name: user.full_name, activity_type: data.activity_type, dates: data.dates, total_hours: data.total_hours, details: data.details || '' });
  };

  if (!isOpen) return null;

  const config = featureConfig[feature] || {};
  const Icon = config.icon;
  const showTabs = !noHistoryFeatures.includes(feature);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {Icon && <Icon className={`text-${config.color}-500`} />}
            {config.title}
          </h3>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {showTabs && (
          <div className="flex border-b border-slate-100">
            <button onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              דיווח חדש
            </button>
            <button onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              {feature === 'overtime' ? 'יתרת שעות: 40' : 'היסטוריה ונתונים'}
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {feature === 'substitute' && activeTab === 'report' && <SubstituteForm user={user} onSubmit={handleSubmit} />}
          {feature === 'substitute' && activeTab === 'history' && <SubstituteHistory history={substituteHistory} />}
          {feature === 'overtime' && activeTab === 'report' && <OvertimeForm onSubmit={handleSubmit} />}
          {feature === 'overtime' && activeTab === 'history' && <OvertimeHistory history={overtimeHistory} />}
          {feature === 'special_overtime' && activeTab === 'report' && <SpecialOvertimeForm onSubmit={handleSubmit} />}
          {feature === 'special_overtime' && activeTab === 'history' && <SpecialOvertimeHistory history={specialOvertimeHistory} />}
          {feature === 'external' && activeTab === 'report' && <ExternalActivityForm onSubmit={handleSubmit} />}
          {feature === 'external' && activeTab === 'history' && <ExternalActivityHistory history={externalHistory} />}
          {feature === 'purchase' && <PurchaseForm onSubmit={handleSubmit} />}
          {(feature === 'maintenance_general' || feature === 'maintenance_pc') && <MaintenanceForm feature={feature} onSubmit={handleSubmit} />}
        </div>
      </div>
    </div>
  );
}
