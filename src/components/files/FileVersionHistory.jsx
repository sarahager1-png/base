import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Download } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function FileVersionHistory({ fileId }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['file-versions', fileId],
    queryFn: async () => {
      const files = await base44.entities.FileManagement.list('-created_date', 100);
      const versionChain = [];
      let current = files.find(f => f.id === fileId);
      
      while (current) {
        versionChain.push(current);
        if (current.previous_version_id) {
          current = files.find(f => f.id === current.previous_version_id);
        } else {
          break;
        }
      }
      
      return versionChain;
    }
  });

  if (versions.length <= 1) {
    return <p className="text-sm text-slate-500 text-center py-4">אין גרסאות קודמות</p>;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-700 text-sm">היסטוריית גרסאות</h4>
      
      <div className="space-y-2">
        {versions.map((version, idx) => (
          <div key={version.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              v{versions.length - idx}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700">{version.file_name}</p>
                {idx === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">הנוכחי</span>}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {timeAgo(version.created_date)}
              </p>
            </div>

            <a
              href={version.file_url}
              download={version.file_name}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="הורד גרסה זו"
            >
              <Download className="h-4 w-4 text-slate-600" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}