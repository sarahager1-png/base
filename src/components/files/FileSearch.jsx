import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function FileSearch({ onSearch, onFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    fileType: 'all',
    sortBy: 'newest'
  });

  const categories = [
    { id: 'all', label: 'הכל' },
    { id: 'onboarding', label: 'קליטה' },
    { id: 'print_request', label: 'הדפסה' },
    { id: 'maintenance', label: 'תחזוקה' },
    { id: 'purchase', label: 'רכש' },
    { id: 'meeting', label: 'פגישות' },
    { id: 'general', label: 'כללי' }
  ];

  const fileTypes = [
    { id: 'all', label: 'כל הסוגים' },
    { id: 'image', label: 'תמונות' },
    { id: 'pdf', label: 'PDF' },
    { id: 'document', label: 'מסמכים' },
    { id: 'spreadsheet', label: 'גיליונות' },
    { id: 'video', label: 'וידאו' }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch?.(query, filters);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    onFilter?.(searchQuery, newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="חפש בקבצים..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">קטגוריה</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilter({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">סוג קובץ</label>
          <select
            value={filters.fileType}
            onChange={(e) => handleFilter({ ...filters, fileType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          >
            {fileTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">מיון</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilter({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
          >
            <option value="newest">הכי חדש</option>
            <option value="oldest">הכי ישן</option>
            <option value="name">שם הקובץ</option>
            <option value="size">גודל</option>
          </select>
        </div>
      </div>
    </div>
  );
}