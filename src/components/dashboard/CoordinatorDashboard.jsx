import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import { Users, Calendar, FileSignature, Megaphone, MessageCircle, Upload, ArrowRight, CheckSquare } from 'lucide-react';

export default function CoordinatorDashboard() {
  const { data: events = [] } = useQuery({
    queryKey: ['schoolEvents'],
    queryFn: () => base44.entities.SchoolEvent.list('-start_date', 5),
  });

  const upcomingEvent = events.find(e => e.start_date >= new Date().getDate());

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="הצוות שלי" 
          value="12" 
          icon={Users} 
          color="purple" 
          subtext="מורות תחת הנחייתך" 
        />
        <StatCard 
          title="אירוע קרוב" 
          value={upcomingEvent ? `${upcomingEvent.start_date - new Date().getDate()} ימים` : 'אין'} 
          icon={Calendar} 
          color="blue" 
          subtext={upcomingEvent?.title || 'אין אירועים קרובים'} 
        />
        <StatCard 
          title="קבצים לחתימה" 
          value="0" 
          icon={FileSignature} 
          color="amber" 
          subtext="הכל מאושר" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-purple-500" />
            ניהול הצוות החברתי
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-slate-500 group-hover:text-purple-600 shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">הודעה לצוות</p>
                  <p className="text-xs text-slate-500">שלחי עדכון לכל המחנכות בשכבה</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-slate-500 group-hover:text-purple-600 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">שיבוץ ימי שיא</p>
                  <p className="text-xs text-slate-500">עדכון הלו"ז המוסדי</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-amber-500" />
            העלאת קבצים לחתימה
          </h3>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
            <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3 group-hover:text-blue-500" />
            <p className="text-sm font-medium text-slate-600">גררי קבצים לכאן או לחצי להעלאה</p>
            <p className="text-xs text-slate-400 mt-1">תוכניות עבודה, אישורי הורים, דוחות סיכום</p>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 mb-2">קבצים אחרונים:</p>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm text-green-800 flex items-center gap-2">
                <CheckSquare className="h-3 w-3" /> תוכנית שנתית תשפ"ו.pdf
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-green-700 shadow-sm">
                נחתם ע"י מנהלת
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}