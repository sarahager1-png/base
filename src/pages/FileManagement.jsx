import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import FileManager from '../components/files/FileManager';
import FileUploadWidget from '../components/files/FileUploadWidget';
import { Files, Upload } from 'lucide-react';

export default function FileManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (!user) return <div className="flex items-center justify-center h-screen">טוען...</div>;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <Files className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900">ניהול קבצים</h1>
        </div>
        <p className="text-slate-600">עלה, ארגן וחפש קבצים בצורה קלה</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'browse'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <Files className="h-4 w-4 inline ml-2" />
          עיון בקבצים
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'upload'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          <Upload className="h-4 w-4 inline ml-2" />
          העלאת קובץ חדש
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'browse' && (
          <FileManager userEmail={user.email} category={selectedCategory} />
        )}

        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">העלה קובץ חדש</h2>
              <FileUploadWidget 
                category="general" 
                user={user}
                onFileUploaded={() => setActiveTab('browse')}
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4">טיפים להעלאה</h3>
              <ul className="space-y-3 text-sm text-blue-800">
                <li>✓ תומך בכל סוגי הקבצים עד 50MB</li>
                <li>✓ תמונות מוצגות בתצוגה מקדימה</li>
                <li>✓ גרסאות ישמרו אוטומטית</li>
                <li>✓ חפש קבצים לפי שם או תגיות</li>
                <li>✓ הקבצים מסודרים בקטגוריות</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}