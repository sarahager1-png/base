import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  X, Stethoscope, Clock, Map, Timer, Printer, 
  ShoppingCart, Hammer, Monitor, Upload, AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export default function ReportingModal({ isOpen, onClose, feature, user }) {
  const [activeTab, setActiveTab] = useState('report');
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({});
  const [subHoursCount, setSubHoursCount] = useState(0);
  const [offsetType, setOffsetType] = useState('');
  const [dutyAlert, setDutyAlert] = useState(false);

  const currentHours = 7; // Mock current daily hours
  const totalHours = currentHours + subHoursCount;
  const isOverLimit = totalHours > 9;

  // Queries for history
  const { data: absenceHistory = [] } = useQuery({
    queryKey: ['absences', user.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'absence' && activeTab === 'history',
  });

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

  const { data: printHistory = [] } = useQuery({
    queryKey: ['prints', user.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'copies' && activeTab === 'history',
  });

  // Mutations
  const createAbsence = useMutation({
    mutationFn: (data) => base44.entities.Absence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      onClose();
    },
  });

  const createSubstitute = useMutation({
    mutationFn: (data) => base44.entities.SubstituteReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
      onClose();
    },
  });

  const createOvertime = useMutation({
    mutationFn: (data) => base44.entities.OvertimeReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
      onClose();
    },
  });

  const createExternal = useMutation({
    mutationFn: (data) => base44.entities.ExternalActivity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external'] });
      onClose();
    },
  });

  const createPurchase = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      onClose();
    },
  });

  const createMaintenance = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (feature === 'absence') {
      createAbsence.mutate({
        user_email: user.email,
        user_name: user.full_name,
        absence_type: formData.absence_type || 'sick',
        start_date: formData.start_date,
        end_date: formData.end_date,
        medical_certificate_url: formData.file_url,
      });
    } else if (feature === 'substitute') {
      if (isOverLimit && !offsetType) return;
      createSubstitute.mutate({
        reporter_email: user.email,
        reporter_name: user.full_name,
        date: formData.date,
        original_teacher: formData.original_teacher,
        hours_count: subHoursCount,
        offset_hour_type: offsetType || 'none',
      });
    } else if (feature === 'overtime') {
      createOvertime.mutate({
        user_email: user.email,
        user_name: user.full_name,
        date: formData.date,
        hours: formData.hours,
        reason: formData.reason,
      });
    } else if (feature === 'external') {
      createExternal.mutate({
        user_email: user.email,
        user_name: user.full_name,
        date: formData.date,
        destination: formData.destination,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
    } else if (feature === 'purchase') {
      createPurchase.mutate({
        user_email: user.email,
        user_name: user.full_name,
        item_name: formData.item_name,
        reason: formData.reason,
        urgency: formData.urgency || 'normal',
      });
    } else if (feature === 'maintenance_general' || feature === 'maintenance_pc') {
      createMaintenance.mutate({
        reporter_email: user.email,
        reporter_name: user.full_name,
        ticket_type: feature === 'maintenance_pc' ? 'computer' : 'general',
        location: formData.location,
        issue: formData.issue,
        urgency: formData.urgency || 'normal',
      });
    }
  };

  if (!isOpen) return null;

  const featureConfig = {
    absence: { icon: Stethoscope, title: 'דיווח היעדרות', color: 'red' },
    substitute: { icon: Clock, title: 'דיווח מילוי מקום', color: 'purple' },
    external: { icon: Map, title: 'פעילות חוץ', color: 'green' },
    overtime: { icon: Timer, title: 'שעות נוספות', color: 'amber' },
    copies: { icon: Printer, title: 'מכסת צילומים', color: 'blue' },
    purchase: { icon: ShoppingCart, title: 'בקשת רכש', color: 'amber' },
    maintenance_general: { icon: Hammer, title: 'תחזוקה כללית', color: 'slate' },
    maintenance_pc: { icon: Monitor, title: 'תחזוקת מחשבים', color: 'blue' },
  };

  const config = featureConfig[feature] || {};
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {Icon && <Icon className={`text-${config.color}-500`} />}
            {config.title}
          </h3>
          <button onClick={onClose}>
            <X className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        {!['purchase', 'maintenance_general', 'maintenance_pc'].includes(feature) && (
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              דיווח חדש
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              היסטוריה ונתונים
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* ABSENCE */}
          {feature === 'absence' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">סוג היעדרות</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-white"
                  onChange={(e) => setFormData({...formData, absence_type: e.target.value})}
                >
                  <option value="sick">מחלה</option>
                  <option value="child_sick">מחלת ילד</option>
                  <option value="personal_day">יום בחירה</option>
                  <option value="bereavement">אבל</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500">מ-</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">עד</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                שלח דיווח
              </button>
            </div>
          )}

          {feature === 'absence' && activeTab === 'history' && (
            <div className="space-y-2">
              {absenceHistory.map(abs => (
                <div key={abs.id} className="p-3 border rounded-lg">
                  <p className="font-bold text-sm">{abs.start_date} - {abs.end_date}</p>
                  <p className="text-xs text-slate-500">{abs.absence_type} • {abs.status}</p>
                </div>
              ))}
            </div>
          )}

          {/* SUBSTITUTE */}
          {feature === 'substitute' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">תאריך</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">כמות שעות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubHoursCount(val === 'day' ? 6 : parseInt(val) || 0);
                  }}
                >
                  <option value="0">בחר...</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="day">יום מלא (6)</option>
                </select>
              </div>
              {isOverLimit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
                  <p className="font-bold text-red-600 flex items-center gap-1 mb-2">
                    <AlertTriangle className="h-3 w-3"/> חריגה (מעל 9 שעות)
                  </p>
                  <select 
                    className="w-full p-1 border border-red-300 rounded bg-white"
                    onChange={(e) => setOffsetType(e.target.value)}
                  >
                    <option value="">בחר שעה לקיזוז...</option>
                    <option value="stay">שהייה</option>
                    <option value="individual">פרטני</option>
                  </select>
                </div>
              )}
              <button 
                onClick={handleSubmit}
                disabled={isOverLimit && !offsetType}
                className={`w-full text-white py-3 rounded-xl font-bold ${isOverLimit && !offsetType ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                שלח דיווח
              </button>
            </div>
          )}

          {feature === 'substitute' && activeTab === 'history' && (
            <div className="space-y-2">
              {substituteHistory.map(sub => (
                <div key={sub.id} className="p-3 border rounded-lg">
                  <p className="font-bold text-sm">{sub.date} - {sub.hours_count} שעות</p>
                  <p className="text-xs text-slate-500">{sub.status}</p>
                </div>
              ))}
            </div>
          )}

          {/* PURCHASE */}
          {feature === 'purchase' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">שם המוצר</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">סיבת הבקשה</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">דחיפות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="normal">רגיל</option>
                  <option value="urgent">דחוף</option>
                </select>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600"
              >
                שלח למנהלת
              </button>
            </div>
          )}

          {/* MAINTENANCE */}
          {(feature === 'maintenance_general' || feature === 'maintenance_pc') && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">מיקום</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  placeholder={feature === 'maintenance_pc' ? 'מספר מחשב / חדר' : 'כיתה / מיקום'}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">תיאור הבעיה</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">דחיפות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="normal">רגיל</option>
                  <option value="urgent">דחוף</option>
                  {feature === 'maintenance_general' && <option value="safety">בטיחותי!</option>}
                </select>
              </div>
              <button 
                onClick={handleSubmit}
                className={`w-full text-white py-3 rounded-xl font-bold ${feature === 'maintenance_pc' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}
              >
                {feature === 'maintenance_pc' ? 'דווח לתקשוב' : 'דווח לאב הבית'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}