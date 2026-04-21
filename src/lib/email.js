// EmailJS REST API — no npm package needed
// Setup: https://www.emailjs.com  →  create account → connect Gmail/Outlook → create template
// Template must have variables: {{to_email}}, {{to_name}}, {{subject}}, {{message}}

const EMAIL_CONFIG_KEY = 'smartbase_email_config';

export function getEmailConfig() {
  try { return JSON.parse(localStorage.getItem(EMAIL_CONFIG_KEY) || '{}'); }
  catch { return {}; }
}

export function saveEmailConfig(cfg) {
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(cfg));
}

export function isEmailConfigured() {
  const { serviceId, templateId, publicKey } = getEmailConfig();
  return !!(serviceId && templateId && publicKey);
}

/**
 * Send an email via EmailJS REST API.
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} body   - plain-text body
 * @param {string} [toName]
 */
export async function sendEmail(toEmail, subject, body, toName = '') {
  const { serviceId, templateId, publicKey } = getEmailConfig();
  if (!serviceId || !templateId || !publicKey) throw new Error('מייל לא מוגדר');

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  serviceId,
      template_id: templateId,
      user_id:     publicKey,
      template_params: {
        to_email: toEmail,
        to_name:  toName || toEmail,
        subject,
        message: body,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.status);
    throw new Error(`שגיאת מייל: ${txt}`);
  }
  return true;
}
