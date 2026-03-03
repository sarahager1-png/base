import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">כניסה למערכת</h1>
          <p className="text-slate-500 text-sm">מערכת ניהול בית הספר</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              placeholder="admin@school.local"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600 mb-2">משתמשי ברירת מחדל:</p>
          <p>מנהל: <span className="font-mono">admin@school.local</span> / <span className="font-mono">admin123</span></p>
          <p>מורה: <span className="font-mono">teacher@school.local</span> / <span className="font-mono">teacher123</span></p>
          <p>מזכירה: <span className="font-mono">secretary@school.local</span> / <span className="font-mono">secretary123</span></p>
          <p>HR: <span className="font-mono">hr@school.local</span> / <span className="font-mono">hr123</span></p>
        </div>
      </div>
    </div>
  );
}
