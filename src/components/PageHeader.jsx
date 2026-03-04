import React from 'react';

/**
 * PageHeader - כותרת דף אחידה ומעוצבת
 * Props:
 *   icon        - Lucide icon component
 *   iconColor   - gradient from color (hex), e.g. '#6366f1'
 *   iconColor2  - gradient to color (hex), optional
 *   title       - main title string
 *   subtitle    - optional subtitle string
 *   actions     - optional JSX (buttons etc.) rendered on the left
 */
export default function PageHeader({ icon: Icon, iconColor = '#6366f1', iconColor2, title, subtitle, actions }) {
  const to = iconColor2 || iconColor;

  return (
    <div
      className="rounded-2xl px-4 py-3.5 md:px-6 md:py-5 mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3 shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${iconColor}, ${to})`,
              boxShadow: `0 4px 18px ${iconColor}55`,
            }}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white leading-tight">{title}</h1>
          {subtitle && <p className="text-slate-400 text-xs md:text-sm mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
