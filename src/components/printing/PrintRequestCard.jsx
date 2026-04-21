import React, { useState } from 'react';
import { FileText, Download, Check, Printer, X, MessageCircle, Calendar, StickyNote, Pause, Copy, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { notify } from '@/lib/notify';
import { toast } from 'sonner';

// ── Print via iframe ───────────────────────────────────────────────────────────
function printFile(fileUrl) {
  const existing = document.getElementById('__print_iframe__');
  if (existing) existing.remove();
  const iframe = document.createElement('iframe');
  iframe.id = '__print_iframe__';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0';
  iframe.src = fileUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch { window.open(fileUrl, '_blank'); }
  };
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:            { bg: 'bg-yellow-50 border-yellow-200',  badge: 'bg-yellow-100 text-yellow-700',  label: 'ממתינה לאישור' },
  held:               { bg: 'bg-purple-50 border-purple-200',  badge: 'bg-purple-100 text-purple-700',  label: '⏸ בהמתנה זמנית' },
  approved:           { bg: 'bg-green-50 border-green-200',    badge: 'bg-green-100 text-green-700',    label: '✓ מאושרת' },
  approval_cancelled: { bg: 'bg-orange-50 border-orange-200',  badge: 'bg-orange-100 text-orange-700',  label: 'אישור בוטל' },
  printing:           { bg: 'bg-blue-50 border-blue-200',      badge: 'bg-blue-100 text-blue-700',      label: '🖨 בהדפסה' },
  completed:          { bg: 'bg-slate-50 border-slate-200',    badge: 'bg-slate-100 text-slate-700',    label: '✅ הושלמה' },
  rejected:           { bg: 'bg-red-50 border-red-200',        badge: 'bg-red-100 text-red-700',        label: '✗ נדחתה' },
  cancelled:          { bg: 'bg-slate-50 border-slate-200',    badge: 'bg-slate-100 text-slate-600',    label: 'בוטלה' },
};

const URGENCY_BADGE = {
  urgent:    'bg-orange-100 text-orange-700',
  immediate: 'bg-red-100 text-red-700',
};

function UrgencyBadge({ level }) {
  if (!level || level === 'normal') return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${URGENCY_BADGE[level] || ''}`}>
      {level === 'immediate' ? '🚨 מיידי' : '🔴 דחוף'}
    </span>
  );
}

function MetaBadges({ r }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {r.paper_size === 'A3' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">A3</span>}
      {r.color_mode === 'color' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700">צבעוני</span>}
      {r.double_sided && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">דו-צדדי</span>}
      {r.paper_type === 'bristol' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">בריסטול</span>}
      {r.binding === 'stapled' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">מהודק</span>}
      {r.needed_by && (
        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <Calendar className="h-3 w-3" />עד {new Date(r.needed_by).toLocaleDateString('he-IL')}
        </span>
      )}
    </div>
  );
}

// ── Admin card ─────────────────────────────────────────────────────────────────
export function AdminRequestCard({ request: r, onAction }) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);
  const queryClient = useQueryClient();

  const act = async (status, extra = {}) => {
    setActing(true);
    try {
      await base44.entities.PrintRequest.update(r.id, { status, ...extra });

      const msgs = {
        approved:  { title: 'בקשת הצילום אושרה',      message: `הבקשה עבור ${r.subject}, כיתה ${r.class_name} אושרה ועברה למזכירה להדפסה.` },
        held:      { title: 'בקשת הצילום הושהתה',     message: `הבקשה עבור ${r.subject}, כיתה ${r.class_name} הושהתה זמנית.` },
        rejected:  { title: 'בקשת הצילום נדחתה',      message: `הבקשה עבור ${r.subject} נדחתה${extra.rejection_reason ? ': ' + extra.rejection_reason : ''}.` },
        approval_cancelled: { title: 'אישור בקשת הצילום בוטל', message: `אישור הבקשה עבור ${r.subject}, כיתה ${r.class_name} בוטל.` },
        pending:   null,
      };

      if (msgs[status]) {
        await notify({ user_email: r.user_email, phone: r.user_phone, type: 'print_status', link: 'printing', ...msgs[status] }).catch(() => {});
      }

      // If cancelling approval — also notify secretary
      if (status === 'approval_cancelled') {
        const secretaries = await base44.entities.User.filter({ role: 'secretary' }).catch(() => []);
        for (const sec of secretaries) {
          await notify({
            user_email: sec.email, phone: sec.phone, full_name: sec.full_name,
            type: 'print_cancelled', link: 'printing',
            title: 'אישור בקשת צילום בוטל',
            message: `הבקשה של ${r.user_name} (${r.subject}, כיתה ${r.class_name}) בוטלה על ידי המנהלת.`,
          }).catch(() => {});
        }
      }

      queryClient.invalidateQueries({ queryKey: ['prints'] });
      toast.success({ approved: 'הבקשה אושרה', held: 'הבקשה הושהתה', rejected: 'הבקשה נדחתה', approval_cancelled: 'האישור בוטל', pending: 'הבקשה הוחזרה להמתנה' }[status] || 'עודכן');
      onAction?.();
    } catch { toast.error('שגיאה בעדכון הסטטוס'); }
    finally { setActing(false); setShowRejectInput(false); setRejectReason(''); }
  };

  const isApproved = r.status === 'approved';
  const canAct = ['pending', 'held', 'approved', 'approval_cancelled'].includes(r.status);

  const cardBg = r.status === 'held' ? 'bg-purple-50 border-purple-200' : 'bg-yellow-50 border-yellow-200';

  return (
    <div className={`p-4 rounded-xl border ${cardBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="font-bold text-slate-800 truncate">{r.file_name}</span>
            <UrgencyBadge level={r.urgency_level} />
            {r.status === 'held' && <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700">⏸ בהמתנה</span>}
          </div>
          {/* Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-sm text-slate-600 mt-1">
            <span>👤 {r.user_name}</span>
            <span>📚 {r.subject}</span>
            <span>🏫 {r.class_name}</span>
            {r.lesson_topic && <span className="col-span-2 text-xs text-slate-500">📝 {r.lesson_topic}</span>}
            <span>📄 {r.total_pages} דפים ({r.copies} עותקים)</span>
          </div>
          <MetaBadges r={r} />
          {r.notes && (
            <p className="text-xs text-slate-500 mt-2 bg-white rounded-lg px-3 py-1.5 border border-yellow-100 flex items-start gap-1">
              <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-yellow-600" />{r.notes}
            </p>
          )}
          {r.rejection_reason && (
            <p className="text-xs text-red-600 mt-1 bg-red-50 rounded-lg px-2 py-1">סיבת דחייה: {r.rejection_reason}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
          <a href={r.file_url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 hover:bg-white/60 rounded-lg text-blue-500" title="הורד PDF">
            <Download className="h-4 w-4" />
          </a>
          {canAct && !isApproved && (
            <>
              <button onClick={() => act('approved')} disabled={acting}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                <Check className="h-3.5 w-3.5" />אשר
              </button>
              <button onClick={() => act('held')} disabled={acting}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold rounded-lg disabled:opacity-50">
                <Pause className="h-3.5 w-3.5" />השהה
              </button>
              <button onClick={() => setShowRejectInput(p => !p)} disabled={acting}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg disabled:opacity-50">
                <X className="h-3.5 w-3.5" />דחה
              </button>
            </>
          )}
          {isApproved && (
            <button onClick={() => act('approval_cancelled')} disabled={acting}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-lg disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" />בטל אישור
            </button>
          )}
        </div>
      </div>

      {/* Reject reason input */}
      {showRejectInput && (
        <div className="mt-3 flex gap-2">
          <input
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="סיבת הדחייה (אופציונלי)..."
            className="flex-1 px-3 py-1.5 text-sm border border-red-200 rounded-lg outline-none focus:border-red-400 bg-white"
          />
          <button onClick={() => act('rejected', { rejection_reason: rejectReason })} disabled={acting}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
            אשר דחייה
          </button>
        </div>
      )}
    </div>
  );
}

// ── Secretary card ─────────────────────────────────────────────────────────────
export function SecretaryRequestCard({ request: r, isSelected, onToggle, onComplete }) {
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await base44.entities.PrintRequest.update(r.id, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] });
      await notify({
        user_email: r.user_email,
        phone:      r.user_phone,
        type:       'print_ready',
        link:       'printing',
        title:      'הדפים שלך מוכנים לאיסוף',
        message:    `הצילומים של ${r.subject}, כיתה ${r.class_name} (${r.total_pages} דפים) הודפסו ומוכנים לאיסוף.`,
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['prints'] });
      toast.success('סומן כהושלם — המורה קיבלה התראה');
      onComplete?.();
    } catch { toast.error('שגיאה'); }
    finally { setCompleting(false); }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-green-100 border-green-400 shadow-sm' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={isSelected} onChange={onToggle}
          className="mt-1 w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="font-bold text-slate-800 truncate">{r.file_name}</span>
            <UrgencyBadge level={r.urgency_level} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5 text-sm text-slate-600">
            <span>👤 {r.user_name}</span>
            <span>📚 {r.subject}</span>
            <span>🏫 {r.class_name}</span>
            {r.lesson_topic && <span className="col-span-2 text-xs text-slate-500">📝 {r.lesson_topic}</span>}
            <span>📄 {r.total_pages} דפים</span>
          </div>
          <MetaBadges r={r} />
          {r.notes && (
            <p className="text-xs text-slate-500 mt-2 bg-white rounded-lg px-3 py-1.5 border border-green-100 flex items-start gap-1">
              <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-600" />{r.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => printFile(r.file_url)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm">
            <Printer className="h-4 w-4" />הדפס
          </button>
          <a href={r.file_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">
            <Download className="h-3.5 w-3.5" />הורד
          </a>
          <button onClick={handleComplete} disabled={completing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg disabled:opacity-50">
            <Check className="h-3.5 w-3.5" />{completing ? '...' : 'בוצע'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Teacher card ───────────────────────────────────────────────────────────────
export function TeacherRequestCard({ request: r, onCancel, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const { bg, badge, label } = STATUS_CFG[r.status] || STATUS_CFG.completed;

  return (
    <div className={`rounded-xl border ${bg}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="font-bold text-slate-800 truncate">{r.file_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${badge}`}>{label}</span>
              <UrgencyBadge level={r.urgency_level} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600 mt-1">
              <span>📚 {r.subject}</span>
              <span>🏫 {r.class_name}</span>
              {r.lesson_topic && <span className="text-xs text-slate-500">📝 {r.lesson_topic}</span>}
              <span>📄 {r.total_pages} דפים</span>
            </div>
            <MetaBadges r={r} />
            {r.rejection_reason && (
              <p className="text-xs text-red-500 mt-1.5 bg-red-50 rounded px-2 py-1">
                סיבת דחייה: {r.rejection_reason}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1.5">{new Date(r.created_date).toLocaleDateString('he-IL')}</p>
          </div>

          <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
            {r.status === 'pending' && onCancel && (
              <button onClick={() => onCancel(r.id)} title="בטל בקשה"
                className="p-1.5 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
            {onDuplicate && (
              <button onClick={() => onDuplicate(r)} title="בקשה דומה"
                className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400 transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
