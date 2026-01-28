import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  { id: 'absences_enabled', label: 'דיווח היעדרויות' },
  { id: 'substitutes_enabled', label: 'דיווח מילוי מקום' },
  { id: 'purchases_enabled', label: 'בקשות רכש' },
  { id: 'printing_enabled', label: 'בקשות הדפסה' },
  { id: 'maintenance_enabled', label: 'דיווחי תחזוקה' },
  { id: 'meetings_enabled', label: 'יומן פגישות' },
  { id: 'birthdays_enabled', label: 'תאריכי לידה' },
  { id: 'overtime_enabled', label: 'שעות נוספות' },
  { id: 'journal_enabled', label: 'יומן בית הספר' },
  { id: 'messages_enabled', label: 'הודעות צוות' }
];

export default function InstitutionSettingsPanel() {
  const [settings, setSettings] = useState(null);
  const queryClient = useQueryClient();

  const { data: allSettings = [] } = useQuery({
    queryKey: ['institution-settings'],
    queryFn: () => base44.entities.InstitutionSettings.list(),
    onSuccess: (data) => {
      if (data.length > 0) {
        setSettings(data[0]);
      }
    }
  });

  const createSettings = useMutation({
    mutationFn: (data) => {
      if (settings?.id) {
        return base44.entities.InstitutionSettings.update(settings.id, data);
      }
      return base44.entities.InstitutionSettings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-settings'] });
      toast.success('ההגדרות נשמרו בהצלחה');
    },
  });

  const handleToggle = (featureId) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [featureId]: !settings[featureId]
    });
  };

  const handleSave = () => {
    if (!settings) {
      toast.error('אתה צריך להכניס שם מוסד');
      return;
    }
    createSettings.mutate(settings);
  };

  if (!settings && allSettings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">הגדרות מוסד</h3>
        </div>
        <input
          type="text"
          placeholder="שם המוסד"
          value={settings?.institution_name || ''}
          onChange={(e) => setSettings({ ...settings || {}, institution_name: e.target.value })}
          className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => createSettings.mutate({ institution_name: settings?.institution_name || 'המוסד שלי' })}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          אתחל הגדרות
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">הגדרות מוסד</h3>
            {settings && <p className="text-sm text-slate-500">{settings.institution_name}</p>}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={createSettings.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          שמור
        </button>
      </div>

      {settings && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-600 mb-4">בחר אילו תכונות פעילות:</p>
          {FEATURES.map(feature => (
            <label key={feature.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings[feature.id] ?? true}
                onChange={() => handleToggle(feature.id)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-800">{feature.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}