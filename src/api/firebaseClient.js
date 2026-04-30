// Smart Base — Firebase client
// Auth: localStorage session
// Data: Firestore REST API (school-scoped subcollections)

const FIREBASE_PROJECT = 'smart-base-chabad';
const FIREBASE_API_KEY = 'AIzaSyAddP9aqW8JoRpZQpo6aU0ah-VZNAJc2Lk';
const FIRESTORE_BASE   = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

/* ── Session ── */
const SESSION_KEY  = 'smartbase_user';
const saveSession  = (u) => localStorage.setItem(SESSION_KEY, JSON.stringify(u));
const loadSession  = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const clearSession = () => localStorage.removeItem(SESSION_KEY);
const getSchoolId  = () => loadSession()?.school_id || 'shared';

/* ── Firestore type helpers ── */
const toFs = (val) => {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean')          return { booleanValue: val };
  if (typeof val === 'number')           return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (Array.isArray(val))                return { arrayValue: { values: val.map(toFs) } };
  if (typeof val === 'object')           return { mapValue: { fields: Object.fromEntries(Object.entries(val).map(([k,v]) => [k, toFs(v)])) } };
  return { stringValue: String(val) };
};
const fromFs = (v) => {
  if (!v) return null;
  if ('stringValue'    in v) return v.stringValue;
  if ('integerValue'   in v) return Number(v.integerValue);
  if ('doubleValue'    in v) return v.doubleValue;
  if ('booleanValue'   in v) return v.booleanValue;
  if ('nullValue'      in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue'     in v) return (v.arrayValue.values || []).map(fromFs);
  if ('mapValue'       in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k,v2]) => [k, fromFs(v2)]));
  return null;
};
const docToObj = (doc) => ({
  id: doc.name.split('/').pop(),
  ...Object.fromEntries(Object.entries(doc.fields || {}).map(([k,v]) => [k, fromFs(v)])),
});
const objToFields = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== 'id').map(([k,v]) => [k, toFs(v)]));

/* ── REST helpers ── */
const apiUrl  = (path, qs = '') => `${FIRESTORE_BASE}/${path}?key=${FIREBASE_API_KEY}${qs ? '&' + qs : ''}`;
const genId   = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const fsReq = async (path, method = 'GET', body = null, qs = '') => {
  const res = await fetch(apiUrl(path, qs), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.status === 204 || res.status === 404 ? null : res.json();
};

const fsList = async (colPath) => {
  const json = await fsReq(colPath);
  return (json?.documents || []).map(docToObj);
};

const fsGet = async (docPath) => {
  const json = await fsReq(docPath);
  return json ? docToObj(json) : null;
};

const fsCreate = async (colPath, id, data) => {
  const json = await fsReq(`${colPath}?documentId=${id}&key=${FIREBASE_API_KEY}`.replace('?key=', '?'), 'POST',
    { fields: objToFields(data) }, `documentId=${id}`);
  return json ? docToObj(json) : { id, ...data };
};

const fsPatch = async (docPath, data) => {
  const fields = objToFields(data);
  const mask   = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const json   = await fsReq(docPath, 'PATCH', { fields }, mask);
  return json ? docToObj(json) : data;
};

const fsDelete = async (docPath) => { await fsReq(docPath, 'DELETE'); };

/* ── School-scoped entity path ── */
const colPath = (col) => `schools/${getSchoolId()}/${col}`;

/* ── Subscriber map for real-time feel (30s poll) ── */
const _subs = {};
const _pollers = {};

const startPoller = (col, cb) => {
  if (_pollers[col]) return;
  _pollers[col] = setInterval(async () => {
    try {
      const docs = await fsList(colPath(col));
      (_subs[col] || []).forEach(fn => fn({ type: 'update', docs }));
    } catch {}
  }, 30_000);
};

/* ── Entity factory (Firestore-backed) ── */
const createEntity = (col) => ({
  list: async (_sort, _limit) => {
    const docs = await fsList(colPath(col));
    if (_limit) return docs.slice(0, _limit);
    return docs;
  },

  filter: async (filters = {}, _sort, _limit) => {
    const docs = await fsList(colPath(col));
    const filtered = docs.filter(item =>
      Object.entries(filters).every(([k, v]) => String(item[k]) === String(v))
    );
    if (_limit) return filtered.slice(0, _limit);
    return filtered;
  },

  get: async (id) => fsGet(`${colPath(col)}/${id}`),

  create: async (data) => {
    const id   = genId();
    const item = { ...data, id, created_date: new Date().toISOString() };
    await fsReq(`${colPath(col)}`, 'POST', { fields: objToFields(item) }, `documentId=${id}`);
    (_subs[col] || []).forEach(fn => fn({ type: 'create', id }));
    return item;
  },

  update: async (id, data) => {
    await fsPatch(`${colPath(col)}/${id}`, data);
    (_subs[col] || []).forEach(fn => fn({ type: 'update', id }));
    return { id, ...data };
  },

  delete: async (id) => {
    await fsDelete(`${colPath(col)}/${id}`);
    (_subs[col] || []).forEach(fn => fn({ type: 'delete', id }));
    return { id };
  },

  subscribe: (cb) => {
    if (!_subs[col]) _subs[col] = [];
    _subs[col].push(cb);
    startPoller(col, cb);
    return () => { _subs[col] = _subs[col].filter(f => f !== cb); };
  },
});

/* ── Auth helpers ── */
const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

let _authListeners = [];

const auth = {
  me: async () => {
    const u = loadSession();
    if (!u) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    return u;
  },

  loginViaEmailPassword: async (email, password) => {
    const hashed = await hashPassword(password);
    const [users, staffJson] = await Promise.all([
      fsList('users'),
      fetch(`${FIRESTORE_BASE}/staff?key=${FIREBASE_API_KEY}`).then(r => r.json()),
    ]);
    const staff = (staffJson.documents || []).map(docToObj);
    const all   = [...users, ...staff];
    const found = all.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
    if (!found)                         throw new Error('אימייל לא נמצא במערכת');
    if (found.password_hash !== hashed) throw new Error('סיסמה שגויה');
    const user = { id: found.id, email: found.email, full_name: found.full_name, role: found.role, school_id: found.school_id || null, gender: found.gender || 'female', title: found.title || '' };
    saveSession(user);
    _authListeners.forEach(l => l(user));
    return user;
  },

  logout: async () => { clearSession(); window.location.reload(); },

  updateMe: async (data) => {
    const user = loadSession();
    if (user) saveSession({ ...user, ...data });
  },

  changePassword: async (oldPassword, newPassword) => {
    const user    = loadSession();
    if (!user) throw new Error('לא מחובר');
    const oldHash = await hashPassword(oldPassword);
    const users   = await fsList('users');
    const found   = users.find(u => u.email === user.email);
    if (!found)                         throw new Error('משתמש לא נמצא');
    if (found.password_hash !== oldHash) throw new Error('סיסמה ישנה שגויה');
    await fsPatch(`users/${found.id}`, { password_hash: await hashPassword(newPassword) });
  },

  redirectToLogin: () => { clearSession(); window.location.reload(); },
  sendPasswordReset: async () => {},

  onAuthStateChanged: (cb) => {
    _authListeners.push(cb);
    setTimeout(() => cb(loadSession()), 0);
    return () => { _authListeners = _authListeners.filter(l => l !== cb); };
  },
};

/* ── Admin: users / staff / schools ── */
const firestoreUsers = {
  list:   async ()                       => fsList('users'),
  create: async ({ email, password, full_name, role, school_id }) => {
    const id = genId();
    return fsReq('users', 'POST', { fields: objToFields({ email, password_hash: await hashPassword(password), full_name, role, school_id: school_id || '', created_date: new Date().toISOString() }) }, `documentId=${id}`);
  },
  update: async (id, { password, ...rest }) => {
    const updates = { ...rest };
    if (password) updates.password_hash = await hashPassword(password);
    return fsPatch(`users/${id}`, updates);
  },
  delete: async (id) => { await fsDelete(`users/${id}`); return { id }; },
};

const firestoreStaff = {
  list:   async (school_id) => { const all = await fsList('staff'); return school_id ? all.filter(s => s.school_id === school_id) : all; },
  create: async ({ email, full_name, role, school_id, gender, title }) => {
    const id = genId();
    await fsReq('staff', 'POST', { fields: objToFields({ email, full_name, role, school_id: school_id || '', gender: gender || 'female', title: title || '', created_date: new Date().toISOString() }) }, `documentId=${id}`);
    return { id };
  },
  update: async (id, data) => fsPatch(`staff/${id}`, data),
  delete: async (id) => { await fsDelete(`staff/${id}`); return { id }; },
};

const firestoreSchools = {
  list:   async ()       => fsList('schools'),
  create: async (data)   => { const id = genId(); return fsReq('schools', 'POST', { fields: objToFields({ ...data, created_date: new Date().toISOString() }) }, `documentId=${id}`); },
  update: async (id, data) => fsPatch(`schools/${id}`, data),
  delete: async (id)     => { await fsDelete(`schools/${id}`); return { id }; },
};

/* ── Rooms — localStorage primary, Firestore sync attempt ── */
const ROOMS_LS_KEY = 'smartbase_rooms_v2';
const _lsRooms  = () => { try { return JSON.parse(localStorage.getItem(ROOMS_LS_KEY)) || []; } catch { return []; } };
const _saveRooms = (arr) => localStorage.setItem(ROOMS_LS_KEY, JSON.stringify(arr));

const firestoreRooms = {
  list: async () => {
    try {
      const docs = await fsList('rooms');
      if (docs.length > 0) { _saveRooms(docs); return docs; }
    } catch {}
    return _lsRooms();
  },
  create: async (data) => {
    const id   = genId();
    const item = { ...data, id, created_date: new Date().toISOString() };
    _saveRooms([..._lsRooms(), item]);
    try { await fsReq('rooms', 'POST', { fields: objToFields(item) }, `documentId=${id}`); } catch {}
    return item;
  },
  update: async (id, data) => {
    const rooms = _lsRooms();
    const idx   = rooms.findIndex(r => r.id === id);
    if (idx >= 0) { rooms[idx] = { ...rooms[idx], ...data }; _saveRooms(rooms); }
    try { await fsPatch(`rooms/${id}`, data); } catch {}
    return { id, ...data };
  },
  delete: async (id) => {
    _saveRooms(_lsRooms().filter(r => r.id !== id));
    try { await fsDelete(`rooms/${id}`); } catch {}
    return { id };
  },
};

/* ── Room Bookings — localStorage primary, Firestore sync attempt ── */
const BOOKINGS_LS_KEY = 'smartbase_bookings_v1';
const _lsBookings  = () => { try { return JSON.parse(localStorage.getItem(BOOKINGS_LS_KEY)) || []; } catch { return []; } };
const _saveBookings = (arr) => localStorage.setItem(BOOKINGS_LS_KEY, JSON.stringify(arr));

const firestoreRoomBookings = {
  list: async () => {
    try {
      const docs = await fsList('room_bookings');
      if (docs.length > 0) { _saveBookings(docs); return docs; }
    } catch {}
    return _lsBookings();
  },
  filter: async (filters = {}) => {
    const all = await firestoreRoomBookings.list();
    return all.filter(item =>
      Object.entries(filters).every(([k, v]) => String(item[k]) === String(v))
    );
  },
  create: async (data) => {
    const id   = genId();
    const item = { ...data, id, created_date: new Date().toISOString() };
    _saveBookings([..._lsBookings(), item]);
    try { await fsReq('room_bookings', 'POST', { fields: objToFields(item) }, `documentId=${id}`); } catch {}
    return item;
  },
  update: async (id, data) => {
    const all = _lsBookings();
    const idx = all.findIndex(b => b.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...data }; _saveBookings(all); }
    try { await fsPatch(`room_bookings/${id}`, data); } catch {}
    return { id, ...data };
  },
};

/* ── Entities ── */
const entities = {
  Absence:               createEntity('Absence'),
  Birthday:              createEntity('Birthday'),
  DailyAnnouncement:     createEntity('DailyAnnouncement'),
  DailyMessage:          createEntity('DailyMessage'),
  DutyAssignment:        createEntity('DutyAssignment'),
  DutySettings:          createEntity('DutySettings'),
  ExternalActivity:      createEntity('ExternalActivity'),
  FileManagement:        createEntity('FileManagement'),
  Holiday:               createEntity('Holiday'),
  InstitutionSettings:   createEntity('InstitutionSettings'),
  JournalEntry:          createEntity('JournalEntry'),
  MaintenanceTicket:     createEntity('MaintenanceTicket'),
  Meeting:               createEntity('Meeting'),
  Message:               createEntity('Message'),
  Notification:          createEntity('Notification'),
  OnboardingDocument:    createEntity('OnboardingDocument'),
  OvertimeReport:        createEntity('OvertimeReport'),
  PrintRequest:          createEntity('PrintRequest'),
  PurchaseRequest:       createEntity('PurchaseRequest'),
  Room:                  createEntity('Room'),
  RoomBooking:           createEntity('RoomBooking'),
  SchoolEvent:           createEntity('SchoolEvent'),
  SpecialOvertimeReport: createEntity('SpecialOvertimeReport'),
  SubstituteReport:      createEntity('SubstituteReport'),
  Task:                  createEntity('Task'),
  User:                  createEntity('User'),
  School:                createEntity('School'),
};

/* ── Absence ↔ SubstituteReport sync ──
   כאשר יוצרים היעדרות → מחפשים מ.מ. קיים באותו תאריך ומקשרים
   כאשר יוצרים מ.מ.   → מחפשים היעדרות קיימת באותו תאריך ומקשרים  */
const _origAbsenceCreate = entities.Absence.create.bind(entities.Absence);
entities.Absence.create = async (data) => {
  const absence = await _origAbsenceCreate(data);
  // auto-link matching substitute report
  try {
    const subs = await entities.SubstituteReport.filter({ date: data.start_date });
    const match = subs.find(s => !s.absence_id && (s.original_teacher_email === data.user_email || s.original_teacher === data.user_name));
    if (match) {
      await entities.SubstituteReport.update(match.id, { absence_id: absence.id });
      await entities.Absence.update(absence.id, { substitute_id: match.id });
    }
  } catch {}
  return absence;
};

const _origSubCreate = entities.SubstituteReport.create.bind(entities.SubstituteReport);
entities.SubstituteReport.create = async (data) => {
  const sub = await _origSubCreate(data);
  // auto-link matching absence
  try {
    const absences = await entities.Absence.filter({ start_date: data.date });
    const match = absences.find(a => !a.substitute_id && (a.user_email === data.original_teacher_email || a.user_name === data.original_teacher));
    if (match) {
      await entities.Absence.update(match.id, { substitute_id: sub.id });
      await entities.SubstituteReport.update(sub.id, { absence_id: match.id });
    }
  } catch {}
  return sub;
};

export const base44 = {
  auth,
  entities,
  firestoreUsers,
  firestoreSchools,
  firestoreStaff,
  firestoreRooms,
  firestoreRoomBookings,
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Upload to Firestore Storage or return placeholder
        const name = `${genId()}_${file.name}`;
        return { file_url: `https://storage.googleapis.com/${FIREBASE_PROJECT}/${name}` };
      },
    },
  },
  functions: {
    invoke: async (name, params) => ({ data: null }),
  },
};
