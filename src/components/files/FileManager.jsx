import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import FileSearch from './FileSearch';
import FilePreview from './FilePreview';
import FileVersionHistory from './FileVersionHistory';
import { File, FileText, Image as ImageIcon, Video, Sheet } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function FileManager({ userEmail = null, category = null }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: category || 'all',
    fileType: 'all',
    sortBy: 'newest'
  });

  const { data: files = [] } = useQuery({
    queryKey: ['file-management', userEmail, category],
    queryFn: () => {
      if (userEmail) {
        return base44.entities.FileManagement.filter({ user_email: userEmail }, '-created_date', 100);
      }
      return base44.entities.FileManagement.list('-created_date', 100);
    }
  });

  const filteredFiles = useMemo(() => {
    let result = files.filter(f => f.is_active);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.file_name.toLowerCase().includes(query) || 
        (f.description || '').toLowerCase().includes(query) ||
        (f.tags || []).some(t => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter(f => f.category === filters.category);
    }

    // File type filter
    if (filters.fileType !== 'all') {
      result = result.filter(f => f.file_type === filters.fileType);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case 'name':
        result.sort((a, b) => a.file_name.localeCompare(b.file_name, 'he'));
        break;
      case 'size':
        result.sort((a, b) => a.file_size - b.file_size);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return result;
  }, [files, searchQuery, filters]);

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-amber-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'spreadsheet':
        return <Sheet className="h-4 w-4 text-green-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Files List */}
      <div className="lg:col-span-2 space-y-4">
        <FileSearch onSearch={setSearchQuery} onFilter={setFilters} />

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {filteredFiles.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-3 rounded-lg border transition-colors ${
                    selectedFile?.id === file.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>{getFileIcon(file.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{file.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {file.category}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(file.file_size / 1024).toFixed(0)} KB
                        </span>
                        <span className="text-xs text-slate-400">
                          {timeAgo(file.created_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">לא נמצאו קבצים</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          {filteredFiles.length} קבצים מתוך {files.length}
        </p>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 mb-2 break-words">{selectedFile.file_name}</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-medium">מעלה:</span> {selectedFile.user_name}</p>
                <p><span className="font-medium">קטגוריה:</span> {selectedFile.category}</p>
                <p><span className="font-medium">סוג:</span> {selectedFile.file_type}</p>
                <p><span className="font-medium">גודל:</span> {(selectedFile.file_size / 1024).toFixed(2)} KB</p>
                {selectedFile.description && (
                  <p><span className="font-medium">תיאור:</span> {selectedFile.description}</p>
                )}
              </div>
            </div>

            <FilePreview file={selectedFile} />

            <FileVersionHistory fileId={selectedFile.id} />
          </div>
        </div>
      )}
    </div>
  );
}