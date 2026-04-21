import { base44 } from '@/api/firebaseClient';
import { sendWhatsApp } from './whatsapp';
import { sendEmail, isEmailConfigured } from './email';

// Looks up a user's phone + name by email when not already known
async function lookupUser(email) {
  try {
    const list = await base44.entities.User.filter({ email });
    const u = list[0];
    return { phone: u?.phone || null, full_name: u?.full_name || '' };
  } catch { return { phone: null, full_name: '' }; }
}

/**
 * Create an in-app notification and send via WhatsApp or email (fallback).
 *
 * Priority:
 *   1. WhatsApp — if phone is available and WA is configured
 *   2. Email    — if no phone and email is configured
 *   3. In-app only (always created regardless)
 *
 * @param {object} params
 * @param {string} params.user_email
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} params.type
 * @param {boolean} [params.read=false]
 * @param {string}  [params.link]
 * @param {string}  [params.phone]     - pass when already known to skip DB lookup
 * @param {string}  [params.full_name] - pass when already known to skip DB lookup
 */
export async function notify({ user_email, title, message, type, read = false, link, phone, full_name }) {
  // 1. Always create in-app notification
  const notifData = { user_email, title, message, type, read };
  if (link) notifData.link = link;
  await base44.entities.Notification.create(notifData);

  // 2. Resolve phone / name if not supplied
  let tel = phone ?? null;
  let name = full_name ?? null;
  if (tel === null || name === null) {
    const found = await lookupUser(user_email);
    if (tel === null) tel = found.phone;
    if (name === null) name = found.full_name;
  }

  // 3. WhatsApp — preferred channel
  if (tel) {
    const waOk = await sendWhatsApp(tel, `*${title}*\n${message}`).then(() => true).catch(() => false);
    if (waOk) return; // sent — done
  }

  // 4. Email fallback — when no phone (or WA failed)
  if (isEmailConfigured() && user_email) {
    await sendEmail(user_email, title, message, name || user_email).catch(() => {});
  }
}
