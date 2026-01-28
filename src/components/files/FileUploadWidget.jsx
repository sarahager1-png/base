import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Loader2 } from 'lucide-react';

export default function FileUploadWidget({ 
  category, 
  onFileUploaded, 
  user,
  relatedEntity = null,
  maxSize = 50 * 1024 * 1024 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.startsWith('video/')) return 'video';
    return 'other';
  };

  const handleUpload = async (files) => {
    setError(null);
    
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`הקובץ ${file.name} גדול מדי (מקסימום 50MB)`);
        continue;
      }

      setIsUploading(true);
      try {
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        
        const fileRecord = await base44.entities.FileManagement.create({
          user_email: user.email,
          user_name: user.full_name,
          file_url: uploadRes.file_url,
          file_name: file.name,
          file_type: getFileType(file.type),
          category,
          file_size: file.size,
          related_entity_type: relatedEntity?.type,
          related_entity_id: relatedEntity?.id,
          tags: []
        });

        setUploadedFiles(prev => [...prev, fileRecord]);
        onFileUploaded?.(fileRecord);
      } catch (err) {
        setError(`שגיאה בהעלאת ${file.name}: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700 mb-1">גרור קבצים לכאן או לחץ להעלאה</p>
        <p className="text-xs text-slate-500">עד 50MB לקובץ</p>
        
        <input
          type="file"
          multiple
          onChange={(e) => handleUpload(Array.from(e.target.files))}
          className="hidden"
          id="file-input"
          disabled={isUploading}
        />
        <label htmlFor="file-input" className="block mt-4">
          <button
            type="button"
            disabled={isUploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center gap-2 mx-auto text-sm"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'מעלה...' : 'בחר קבצים'}
          </button>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-700 text-sm">קבצים שהועלו:</h4>
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center text-green-600 font-bold text-xs">
                ✓
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.file_name}</p>
                <p className="text-xs text-slate-500">{(file.file_size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}