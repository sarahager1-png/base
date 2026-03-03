/**
 * Local API client — replaces the Base44 SDK.
 * Provides the same interface so all existing components work unchanged.
 */

const getToken = () => localStorage.getItem('auth_token');

const apiFetch = async (method, path, body = null) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = err;
    throw error;
  }

  return res.json();
};

const createEntityProxy = (name) => ({
  list: (sort = '-created_date', limit = 500) =>
    apiFetch('GET', `/entities/${name}?sort=${encodeURIComponent(sort)}&limit=${limit}`),

  filter: (query = {}, sort = '-created_date', limit = 500) => {
    const params = new URLSearchParams({ sort, limit });
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.set(k, v);
    }
    return apiFetch('GET', `/entities/${name}?${params}`);
  },

  create: (data) => apiFetch('POST', `/entities/${name}`, data),

  bulkCreate: (items) => apiFetch('POST', `/entities/${name}/bulk`, items),

  update: (id, data) => apiFetch('PUT', `/entities/${name}/${id}`, data),

  delete: (id) => apiFetch('DELETE', `/entities/${name}/${id}`),

  subscribe: (callback) => {
    const token = getToken();
    if (!token) return () => {};

    const url = `/api/subscribe/${name}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      if (!e.data || e.data.startsWith(':')) return;
      try {
        const event = JSON.parse(e.data);
        callback(event);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      // EventSource auto-reconnects — nothing to do
    };

    return () => es.close();
  },
});

export const base44 = {
  auth: {
    me: () => apiFetch('GET', '/auth/me'),

    logout: () => {
      localStorage.removeItem('auth_token');
    },

    redirectToLogin: () => {
      localStorage.removeItem('auth_token');
      window.location.reload();
    },

    updateMe: (data) => apiFetch('PUT', '/auth/me', data),
  },

  entities: new Proxy({}, {
    get: (_, name) => createEntityProxy(name),
  }),

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      },
    },
  },

  functions: {
    invoke: (name, params) => apiFetch('POST', `/functions/${name}`, params),
  },

  users: {
    inviteUser: (email, role) => apiFetch('POST', '/users/invite', { email, role }),
  },

  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
};
