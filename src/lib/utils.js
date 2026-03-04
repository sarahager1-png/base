import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = window.self !== window.top;

/** Returns a Hebrew relative time string, e.g. "לפני 3 דקות" */
export function timeAgo(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: he });
}

/**
 * Returns Tailwind badge classes for a generic pending/approved/rejected status.
 * Returns { badgeClass, label }.
 */
export function getStatusBadgeClass(status) {
  if (status === 'approved') return { badgeClass: 'bg-green-100 text-green-700', label: 'מאושר' };
  if (status === 'rejected') return { badgeClass: 'bg-red-100 text-red-700', label: 'נדחה' };
  return { badgeClass: 'bg-amber-100 text-amber-700', label: 'ממתין' };
}
