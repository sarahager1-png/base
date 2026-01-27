import React from 'react';

const getColorCode = (colorName) => {
  const colors = { 
    red: '#dc2626', 
    amber: '#d97706', 
    green: '#16a34a', 
    blue: '#2563eb', 
    purple: '#9333ea' 
  };
  return colors[colorName] || '#64748b';
};

export default function StatCard({ title, value, icon: Icon, color, subtext }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {subtext && (
          <p className={`text-xs mt-2 font-medium ${color === 'red' ? 'text-red-600' : 'text-slate-400'}`}>
            {subtext}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon className="h-6 w-6" color={getColorCode(color)} />
      </div>
    </div>
  );
}