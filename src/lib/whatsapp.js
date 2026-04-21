const WA_CONFIG_KEY = 'whatsapp_config';

export function getWAConfig() {
  try {
    return JSON.parse(localStorage.getItem(WA_CONFIG_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveWAConfig(config) {
  localStorage.setItem(WA_CONFIG_KEY, JSON.stringify(config));
}

// Green API: https://green-api.com
// Endpoint: https://api.green-api.com/waInstance{instanceId}/sendMessage/{apiTokenInstance}
export async function sendWhatsApp(phone, message) {
  const { instanceId, token } = getWAConfig();
  if (!instanceId || !token) throw new Error('WhatsApp לא מוגדר');

  // normalize Israeli phone: 05X → 972-5X
  const normalized = phone.replace(/^0/, '972').replace(/[-\s]/g, '');
  const chatId = `${normalized}@c.us`;

  const res = await fetch(
    `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    }
  );
  if (!res.ok) throw new Error(`שגיאת WhatsApp: ${res.status}`);
  return res.json();
}

export async function sendWhatsAppToMany(phones, message) {
  const results = await Promise.allSettled(phones.map(p => sendWhatsApp(p, message)));
  const failed = results.filter(r => r.status === 'rejected').length;
  return { sent: phones.length - failed, failed };
}
