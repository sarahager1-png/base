import React from 'react';
import { FileText, Image as ImageIcon, File, Download, Eye } from 'lucide-react';

export default function FilePreview({ file }) {
  const getPreviewComponent = () => {
    switch (file.file_type) {
      case 'image':
        return (
          <div className="w-full h-64 overflow-auto">
            <img 
              src={file.file_url} 
              alt={file.file_name}
              className="w-full h-auto object-contain"
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <div className="text-center">
              <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">קובץ PDF - לחץ להורדה</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
            <div className="text-center">
              <File className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">{file.file_name}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-slate-200">
        {getPreviewComponent()}
      </div>
      
      <div className="flex gap-2">
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Eye className="h-4 w-4" />
          צפה
        </a>
        <a
          href={file.file_url}
          download={file.file_name}
          className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          הורד
        </a>
      </div>
    </div>
  );
}