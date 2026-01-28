import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, Clock, CheckCircle, FileText, AlertCircle, Upload, X, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PrintingPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    file: null,
    file_name: '',
    subject: '',
    class_name: '',
    copies: 1,
    pages_per_copy: 1,
    urgent: false
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPrintRequests = [] } = useQuery({
    queryKey: ['prints'],
    queryFn: () => base44.entities.PrintRequest.list('-created_date'),
    enabled: !!user,
  });

  const { data: myPrintRequests = [] } = useQuery({
    queryKey: ['myPrints', user?.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const isSecretary = user?.role === 'secretary';
  const isAdmin = user?.role === 'admin' || user?.role === 'vice_principal';
  const isTeacher = user?.role === 'teacher' || user?.role === 'coordinator' || user?.role === 'counselor';

  const pendingRequests = allPrintRequests.filter(r => r.status === 'pending');
  const approvedRequests = allPrintRequests.filter(r => r.status === 'approved');
  const printingRequests = allPrintRequests.filter(r => r.status === 'printing');
  const completedRequests = allPrintRequests.filter(r => r.status === 'completed');

  const myTotalPages = myPrintRequests.reduce((sum, r) => sum + (r.total_pages || 0), 0);

  const approveMutation = useMutation({
    mutationFn: ({ id, userName }) => base44.entities.PrintRequest.update(id, { 
      status: 'approved',
      approved_by: userName,
      approval_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prints'] });
      toast.success('הבקשה אושרה');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => {
      return Promise.all(ids.map(id => base44.entities.PrintRequest.update(id, { status })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prints'] });
      setSelectedRequests([]);
      toast.success('הסטטוס עודכן בהצלחה');
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file, file_name: file.name });
    } else {
      toast.error('נא להעלות קובץ PDF בלבד');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error('נא לבחור קובץ');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      const total_pages = formData.copies * formData.pages_per_copy;
      
      await base44.entities.PrintRequest.create({
        user_email: user.email,
        user_name: user.full_name,
        file_url,
        file_name: formData.file_name,
        subject: formData.subject,
        class_name: formData.class_name,
        copies: formData.copies,
        pages_per_copy: formData.pages_per_copy,
        total_pages,
        urgent: formData.urgent,
        status: 'pending'
      });

      queryClient.invalidateQueries({ queryKey: ['prints'] });
      queryClient.invalidateQueries({ queryKey: ['myPrints'] });
      
      setShowUploadForm(false);
      setFormData({
        file: null,
        file_name: '',
        subject: '',
        class_name: '',
        copies: 1,
        pages_per_copy: 1,
        urgent: false
      });
      
      toast.success('הבקשה נשלחה לאישור');
    } catch (error) {
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">מרכז צילומים והדפסות</h1>
            <p className="text-slate-600">
              {isSecretary ? 'ניהול תור ההדפסות' : 
               isAdmin ? 'אישור בקשות הדפסה' :
               `סה״כ צילמת: ${myTotalPages} דפים`}
            </p>
          </div>
          {isTeacher && (
            <Button
              onClick={() => setShowUploadForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              בקשת צילום חדשה
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">ממתינים לאישור</p>
                <p className="text-2xl font-bold text-slate-800">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">מאושרים</p>
                <p className="text-2xl font-bold text-slate-800">{approvedRequests.length}</p>
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
                <p className="text-sm text-slate-500">דפים החודש</p>
                <p className="text-2xl font-bold text-slate-800">
                  {allPrintRequests.reduce((sum, r) => sum + (r.total_pages || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900">בקשת צילום חדשה</h2>
                <button onClick={() => setShowUploadForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">קובץ PDF</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-2">מקצוע</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="לדוגמה: מתמטיקה"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-2">כיתה</label>
                    <Input
                      value={formData.class_name}
                      onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                      placeholder="לדוגמה: ח'2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-2">כמות עותקים</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.copies}
                      onChange={(e) => setFormData({...formData, copies: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-2">עמודים בקובץ</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.pages_per_copy}
                      onChange={(e) => setFormData({...formData, pages_per_copy: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    סה״כ דפים להדפסה: <span className="font-bold text-blue-600">
                      {formData.copies * formData.pages_per_copy}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={formData.urgent}
                    onChange={(e) => setFormData({...formData, urgent: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="urgent" className="text-sm font-medium text-slate-700">
                    דחוף - נדרש בהקדם
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                    ביטול
                  </Button>
                  <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                    {uploading ? 'מעלה...' : 'שלח לאישור'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Approval Section */}
        {isAdmin && pendingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                בקשות ממתינות לאישור
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div key={request.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-slate-800">{request.file_name}</span>
                          {request.urgent && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                              דחוף!
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-slate-600">
                          <span>👤 {request.user_name}</span>
                          <span>📚 {request.subject}</span>
                          <span>🏫 {request.class_name}</span>
                          <span>📄 {request.total_pages} דפים</span>
                          <span className="flex items-center gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              request.paper_size === 'special' ? 'bg-amber-100 text-amber-700' :
                              request.paper_size === 'A3' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {request.paper_size === 'special' ? 'מיוחד' :
                               request.paper_size === 'A3' ? 'A3' : 'A4'}
                            </span>
                            {request.color_mode === 'color' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                                צבעוני
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(request.created_date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={request.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ id: request.id, userName: user.full_name })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          אשר
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Secretary Print Queue */}
        {isSecretary && approvedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-green-500" />
                מאושר להדפסה ({approvedRequests.length})
              </h2>
              {selectedRequests.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'printing' })}
                  >
                    סמן בהדפסה ({selectedRequests.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'completed' })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    סמן הושלם ({selectedRequests.length})
                  </Button>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {approvedRequests.map(request => (
                  <div key={request.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleSelection(request.id)}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-slate-800">{request.file_name}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm text-slate-600">
                          <span>👤 {request.user_name}</span>
                          <span>📚 {request.subject}</span>
                          <span>🏫 {request.class_name}</span>
                          <span>📄 {request.total_pages} דפים</span>
                          <span className="flex items-center gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              request.paper_size === 'special' ? 'bg-amber-100 text-amber-700' :
                              request.paper_size === 'A3' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {request.paper_size === 'special' ? 'מיוחד' :
                               request.paper_size === 'A3' ? 'A3' : 'A4'}
                            </span>
                            {request.color_mode === 'color' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                                צבעוני
                              </span>
                            )}
                          </span>
                          <span>✅ {request.approved_by}</span>
                        </div>
                      </div>
                      <a 
                        href={request.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Requests - Teacher View */}
        {isTeacher && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900">הבקשות שלי</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {myPrintRequests.length > 0 ? (
                  myPrintRequests.map(request => (
                    <div key={request.id} className={`p-4 rounded-xl border ${
                      request.status === 'pending' ? 'bg-amber-50 border-amber-200' :
                      request.status === 'approved' ? 'bg-green-50 border-green-200' :
                      request.status === 'printing' ? 'bg-blue-50 border-blue-200' :
                      'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-slate-800">{request.file_name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              request.status === 'approved' ? 'bg-green-100 text-green-700' :
                              request.status === 'printing' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {request.status === 'pending' ? 'ממתין לאישור' :
                               request.status === 'approved' ? 'מאושר' :
                               request.status === 'printing' ? 'בהדפסה' : 'הושלם'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                            <span>📚 {request.subject}</span>
                            <span>🏫 {request.class_name}</span>
                            <span>📄 {request.total_pages} דפים</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              request.paper_size === 'special' ? 'bg-amber-100 text-amber-700' :
                              request.paper_size === 'A3' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {request.paper_size === 'special' ? 'גודל מיוחד' :
                               request.paper_size === 'A3' ? 'A3' : 'A4'}
                            </span>
                            {request.color_mode === 'color' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">
                                🎨 צבעוני
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(request.created_date).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין בקשות הדפסה</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}