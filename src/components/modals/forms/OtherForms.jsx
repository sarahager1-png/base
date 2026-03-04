import React, { useState } from 'react';

export function ExternalActivityForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">תאריך התחלה</label>
        <input type="date" className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">תאריך סיום</label>
        <input type="date" className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500">שעת התחלה</label>
          <input type="time" className="w-full p-2 border rounded-lg"
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500">שעת סיום</label>
          <input type="time" className="w-full p-2 border rounded-lg"
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">פרוט הפעילות</label>
        <textarea className="w-full p-2 border rounded-lg" rows="3"
          placeholder="לדוגמה: סיור לימודי למוזיאון המדע"
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}></textarea>
      </div>
      <button onClick={() => onSubmit(formData)}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
        שלח לאישור
      </button>
    </div>
  );
}

export function ExternalActivityHistory({ history }) {
  return (
    <div className="space-y-2">
      {history.map(ext => (
        <div key={ext.id} className="p-3 border rounded-lg">
          <p className="font-bold text-sm">{ext.date}</p>
          <p className="text-xs text-slate-500">{ext.destination}</p>
          <p className="text-xs text-slate-400">{ext.start_time} - {ext.end_time}</p>
        </div>
      ))}
    </div>
  );
}

export function PurchaseForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">שם המוצר</label>
        <input type="text" className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">סיבת הבקשה</label>
        <textarea className="w-full p-2 border rounded-lg" rows="3"
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">דחיפות</label>
        <select className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
          <option value="normal">רגיל</option>
          <option value="urgent">דחוף</option>
        </select>
      </div>
      <button onClick={() => onSubmit(formData)}
        className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600">
        שלח למנהלת
      </button>
    </div>
  );
}

export function MaintenanceForm({ feature, onSubmit }) {
  const [formData, setFormData] = useState({});
  const isPC = feature === 'maintenance_pc';
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">מיקום</label>
        <input type="text" className="w-full p-2 border rounded-lg"
          placeholder={isPC ? 'מספר מחשב / חדר' : 'כיתה / מיקום'}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">תיאור הבעיה</label>
        <textarea className="w-full p-2 border rounded-lg" rows="3"
          onChange={(e) => setFormData({ ...formData, issue: e.target.value })}></textarea>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">דחיפות</label>
        <select className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
          <option value="normal">רגיל</option>
          <option value="urgent">דחוף</option>
          {!isPC && <option value="safety">בטיחותי!</option>}
        </select>
      </div>
      <button onClick={() => onSubmit(formData)}
        className={`w-full text-white py-3 rounded-xl font-bold ${isPC ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
        {isPC ? 'דווח לתקשוב' : 'דווח לאב הבית'}
      </button>
    </div>
  );
}
