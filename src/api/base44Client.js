import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const serviceToken = import.meta.env.VITE_BASE44_API_KEY;

export const base44 = createClient({
  appId,
  token,
  serviceToken,
  functionsVersion,
  serverUrl: appBaseUrl || '',
  requiresAuth: false,
  appBaseUrl
});
