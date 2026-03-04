import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Wrench,
  Star, Zap, AlertTriangle, CheckCircle, Clock, BarChart2
} from 'lucide-react';

/* ── Health Gauge (SVG semicircle) ── */
function HealthGauge({ score }) {
  const r = 58, cx = 80, cy = 80;
  const circ = Math.PI * r;
  const fill = Math.max(0, Math.min(1, score / 100)) * circ;
  const color = score >= 85 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const label = score >= 85 ? 'מצוין ✨' : score >= 60 ? 'טוב 👍' : 'דורש שיפור ⚠️';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="160" height="95" viewBox="0 0 160 95">
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" strokeWidth="12" strokeLinecap="round"
                stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${fill} ${circ}`}
                style={{ transition: 'stroke-dasharray 1.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
          <circle cx={cx} cy={cy} r="6" fill={color} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-4xl font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

/* ── Horizontal Bar Chart ── */
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-14 text-slate-400 dark:text-slate-500 text-right shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end px-2"
              style={{
                width: `${Math.max(d.value > 0 ? 5 : 0, (d.value / max) * 100)}%`,
                background: d.color || 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                transition: `width ${0.5 + i * 0.15}s cubic-bezier(0.34,1.56,0.64,1)`,
              }}
            >
              {d.value > 0 && <span className="text-[9px] text-white font-bold">{d.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CSS Conic Donut Chart ── */
function DonutChart({ segments, size = 100 }) {
  let cum = 0;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const parts = segments.map(seg => {
    const pct = (seg.value / total) * 100;
    const part = `${seg.color} ${cum.toFixed(1)}% ${(cum + pct).toFixed(1)}%`;
    cum += pct;
    return part;
  });
  return (
    <div className="rounded-full shrink-0" style={{
      width: size, height: size,
      background: `conic-gradient(${parts.join(', ')})`,
      WebkitMask: 'radial-gradient(farthest-side, transparent 57%, black 58%)',
      mask: 'radial-gradient(farthest-side, transparent 57%, black 58%)',
    }} />
  );
}

/* ── Metric Card ── */
function MetricCard({ icon: Icon, label, value, sub, trend, color }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendCls = trend === 'up' ? 'text-red-500' : 'text-green-500';
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: color + '20' }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {TrendIcon && <TrendIcon className={`h-4 w-4 ${trendCls}`} />}
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className={`text-[10px] mt-1 font-medium ${trendCls}`}>{sub}</p>}
    </div>
  );
}

/* ── Smart Insight Item ── */
function InsightItem({ icon: Icon, text, type }) {
  const styles = {
    good:  { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  icon: 'text-green-600' },
    warn:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800',  icon: 'text-amber-600' },
    alert: { bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-200 dark:border-red-800',      icon: 'text-red-600' },
    info:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-600' },
  };
  const s = styles[type] || styles.info;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.icon}`} />
      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{text}</p>
    </div>
  );
}

/* ── Main Component ── */
export default function InsightsDashboard() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

  const { data: absences  = [] } = useQuery({ queryKey: ['abs-analytics'],  queryFn: () => base44.entities.Absence.list(),          staleTime: 300000 });
  const { data: purchases = [] } = useQuery({ queryKey: ['pur-analytics'],  queryFn: () => base44.entities.PurchaseRequest.list(), staleTime: 300000 });
  const { data: tickets   = [] } = useQuery({ queryKey: ['mnt-analytics'],  queryFn: () => base44.entities.MaintenanceTicket.list(), staleTime: 300000 });
  const { data: users     = [] } = useQuery({ queryKey: ['usr-analytics'],  queryFn: () => base44.entities.User.list(),             staleTime: 600000 });

  const a = useMemo(() => {
    const inMonth = (arr, m, y) => arr.filter(x => {
      const d = new Date(x.created_date || x.date || x.start_date);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const thisAbs = inMonth(absences, thisMonth, thisYear);
    const prevAbs = inMonth(absences, prevMonth, prevYear);
    const trend = thisAbs.length > prevAbs.length ? 'up' : thisAbs.length < prevAbs.length ? 'down' : 'same';
    const delta = Math.abs(thisAbs.length - prevAbs.length);

    // Week breakdown (4 most recent weeks)
    const weekData = [3, 2, 1, 0].map(w => {
      const end   = new Date(now); end.setDate(end.getDate() - w * 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const count = absences.filter(x => { const d = new Date(x.created_date || x.date); return d >= start && d < end; }).length;
      return { label: w === 0 ? 'שבוע זה' : `לפני ${w + 1}ש'`, value: count, color: w === 0 ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : 'linear-gradient(90deg,#94a3b8,#64748b)' };
    });

    // Day of week breakdown
    const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
    const dayData = DAY_NAMES.map((label, i) => ({
      label,
      value: absences.filter(x => new Date(x.created_date || x.date).getDay() === i).length,
    }));

    // Purchase breakdown
    const pApproved = purchases.filter(p => p.status === 'approved');
    const pPending  = purchases.filter(p => p.status === 'pending');
    const pRejected = purchases.filter(p => p.status === 'rejected');
    const approvalRate = purchases.length > 0 ? Math.round((pApproved.length / purchases.length) * 100) : 0;

    // Open tickets
    const openTickets = tickets.filter(t => !['closed','resolved','done'].includes(t.status));

    // Health score
    let score = 100;
    score -= Math.min(30, thisAbs.length * 2);
    score -= Math.min(20, pPending.length * 2);
    score -= Math.min(25, openTickets.length * 3);
    if (trend === 'down' && delta > 0) score += 5;
    if (approvalRate >= 80) score += 5;
    score = Math.max(20, Math.min(100, Math.round(score)));

    // Smart insights
    const insights = [];
    if (thisAbs.length === 0) {
      insights.push({ icon: CheckCircle, text: 'אין היעדרויות החודש — המוסד פועל במלוא הכוח! 💪', type: 'good' });
    } else if (trend === 'down' && delta > 0) {
      insights.push({ icon: TrendingDown, text: `שיפור! ${delta} פחות היעדרויות לעומת חודש שעבר`, type: 'good' });
    } else if (trend === 'up' && thisAbs.length > 5) {
      insights.push({ icon: AlertTriangle, text: `עלייה של ${delta} היעדרויות לעומת חודש שעבר — כדאי לבדוק`, type: 'warn' });
    }
    if (openTickets.length > 5) {
      insights.push({ icon: AlertTriangle, text: `${openTickets.length} כרטיסי תחזוקה פתוחים הדורשים טיפול`, type: 'alert' });
    } else if (openTickets.length === 0 && tickets.length > 0) {
      insights.push({ icon: CheckCircle, text: 'כל כרטיסי התחזוקה טופלו — עבודה מצוינת!', type: 'good' });
    }
    if (pPending.length > 3) {
      insights.push({ icon: Clock, text: `${pPending.length} בקשות רכש ממתינות לאישור`, type: 'warn' });
    }
    if (approvalRate >= 80 && purchases.length > 2) {
      insights.push({ icon: Star, text: `שיעור אישור הרכש עומד על ${approvalRate}% — מדהים!`, type: 'good' });
    }
    if (insights.length === 0) {
      insights.push({ icon: Zap, text: 'הכל נראה תקין! המוסד פועל בצורה מיטבית 🎯', type: 'info' });
    }

    return {
      score, trend, delta,
      absenceCount: thisAbs.length,
      pendingPurchases: pPending.length,
      openTickets: openTickets.length,
      activeUsers: users.filter(u => u.role).length,
      weekData, dayData,
      purchaseSegments: [
        { label: 'אושר',  value: pApproved.length, color: '#22c55e' },
        { label: 'ממתין', value: pPending.length,  color: '#f59e0b' },
        { label: 'נדחה',  value: pRejected.length, color: '#ef4444' },
      ],
      approvalRate,
      insights,
    };
  }, [absences, purchases, tickets, users]);

  return (
    <div className="space-y-5 pb-10" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">תובנות ואנליטיקס</h2>
          <p className="text-xs text-slate-400">נתוני המוסד בזמן אמת — מחושבים מכל פעילות המערכת</p>
        </div>
      </div>

      {/* Row 1: Health Score + 4 Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ציון בריאות המוסד</p>
          <HealthGauge score={a.score} />
          <p className="text-[10px] text-slate-400 text-center max-w-[160px]">
            מחושב על בסיס היעדרויות, תחזוקה ובקשות רכש
          </p>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <MetricCard
            icon={Users} color="#6366f1" label="היעדרויות החודש" value={a.absenceCount}
            trend={a.trend === 'up' ? 'up' : a.trend === 'down' ? 'down' : null}
            sub={a.delta > 0 ? `${a.trend === 'down' ? '↓' : '↑'} ${a.delta} לעומת חודש שעבר` : null}
          />
          <MetricCard
            icon={ShoppingCart} color="#f59e0b" label="בקשות רכש ממתינות" value={a.pendingPurchases}
            trend={a.pendingPurchases > 3 ? 'up' : null}
          />
          <MetricCard
            icon={Wrench} color="#ef4444" label="כרטיסי תחזוקה פתוחים" value={a.openTickets}
            trend={a.openTickets > 5 ? 'up' : a.openTickets === 0 ? 'down' : null}
          />
          <MetricCard
            icon={Users} color="#22c55e" label="אנשי צוות פעילים" value={a.activeUsers}
          />
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Absence Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-700 dark:text-white">היעדרויות לפי שבוע</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              a.trend === 'down' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              a.trend === 'up'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'       :
              'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
              {a.trend === 'down' ? '↓ ירידה' : a.trend === 'up' ? '↑ עלייה' : '— יציב'}
            </span>
          </div>
          <BarChart data={a.weekData} />
        </div>

        {/* Purchase Donut */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-700 dark:text-white mb-4">סטטוס בקשות רכש</p>
          <div className="flex items-center gap-6">
            <DonutChart segments={a.purchaseSegments} size={100} />
            <div className="space-y-2 flex-1">
              {a.purchaseSegments.map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
                  </div>
                  <span className="font-black text-slate-800 dark:text-white">{s.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                <p className="text-[10px] text-slate-400">
                  שיעור אישור: <span className="font-bold text-slate-600 dark:text-slate-300">{a.approvalRate}%</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Day Heatmap + Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-bold text-slate-700 dark:text-white mb-4">היעדרויות לפי יום בשבוע</p>
          <BarChart data={a.dayData} />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-bold text-slate-700 dark:text-white">תובנות חכמות</p>
          </div>
          <div className="space-y-2">
            {a.insights.map((insight, i) => (
              <InsightItem key={i} {...insight} />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
