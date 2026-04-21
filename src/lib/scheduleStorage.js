// Schedule data stored in localStorage, keyed by email
// Each entry: { day: 0-5 (Sun-Fri), hour: 1-9, subject, className, room }

const KEY = 'school_schedule_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getScheduleForEmail(email) {
  return load()[email] || [];
}

export function getAllSchedules() {
  return load();
}

// entries: [{ email, day, hour, subject, className, room }]
export function importSchedule(entries) {
  const data = load();
  entries.forEach(e => {
    if (!e.email) return;
    if (!data[e.email]) data[e.email] = [];
    // remove existing slot for same day+hour
    data[e.email] = data[e.email].filter(s => !(s.day === e.day && s.hour === e.hour));
    data[e.email].push({ day: e.day, hour: e.hour, subject: e.subject, className: e.className, room: e.room || '' });
  });
  save(data);
}

export function clearSchedule() {
  localStorage.removeItem(KEY);
}

// Returns free slots for an email on a given day (hours where no lesson)
export function getFreeSlots(email, day) {
  const lessons = getScheduleForEmail(email);
  const busy = new Set(lessons.filter(l => l.day === day).map(l => l.hour));
  return [1,2,3,4,5,6,7,8].filter(h => !busy.has(h));
}

// Build CSV example text for download
export const CSV_TEMPLATE = `email,day,hour,subject,className,room
teacher@school.edu,0,1,מתמטיקה,ח'2,101
teacher@school.edu,0,2,מתמטיקה,ח'3,101
teacher@school.edu,1,1,פיזיקה,ט'1,102
`;
