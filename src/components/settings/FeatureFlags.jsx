import React, { useState } from 'react';
import { DEFAULT_FLAGS, getFlags, setFlag } from '@/lib/featureFlags';
import { ToggleLeft, ToggleRight, Settings2 } from 'lucide-react';

export default function FeatureFlags() {
  const [flags, setFlags] = useState(() => getFlags());

  function toggle(key) {
    const newVal = !flags[key].enabled;
    setFlag(key, newVal);
    setFlags(prev => ({ ...prev, [key]: { ...prev[key], enabled: newVal } }));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-bold text-slate-800">פיצ׳רים פעילים</h3>
        <span className="text-xs text-slate-400 mr-auto">שינויים נכנסים לתוקף מיד</span>
      </div>
      <div className="space-y-3">
        {Object.entries(flags).map(([key, { label, description, enabled }]) => (
          <div key={key}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              enabled ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
            <div>
              <p className="font-semibold text-sm text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button onClick={() => toggle(key)} className="flex-shrink-0 ml-4">
              {enabled
                ? <ToggleRight className="h-8 w-8 text-blue-600" />
                : <ToggleLeft  className="h-8 w-8 text-slate-400" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
