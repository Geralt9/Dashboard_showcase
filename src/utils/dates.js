import { format, parseISO, isValid, startOfDay, isSameDay } from 'date-fns';

// Dates are stored as strings:
//  - date-only fields: "yyyy-MM-dd"
//  - printDate:        "yyyy-MM-ddTHH:mm" (local time)

export function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(value);
  return isValid(d) ? d : null;
}

export function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function toDateTimeKey(date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

/** "Nov 26" */
export function fmtShort(value) {
  const d = toDate(value);
  return d ? format(d, 'MMM d') : '—';
}

/** "Nov 26, 2026" */
export function fmtLong(value) {
  const d = toDate(value);
  return d ? format(d, 'MMM d, yyyy') : '—';
}

/** "09:00" */
export function fmtTime(value) {
  const d = toDate(value);
  return d ? format(d, 'HH:mm') : '';
}

/** "Nov 26, 09:41" */
export function fmtDateTime(value) {
  const d = toDate(value);
  return d ? format(d, 'MMM d, HH:mm') : '—';
}

export function sameDay(value, date) {
  const d = toDate(value);
  return d ? isSameDay(d, date) : false;
}

export function today() {
  return startOfDay(new Date());
}

/** Hours as "2 hrs" / "1 hr" / "45 min" */
export function fmtDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'hr' : 'hrs'}`;
}

/** Keep the time of `iso` but move it to the day `dateKey`. */
export function moveToDay(iso, dateKey, fallbackTime = '09:00') {
  const time = iso && iso.includes('T') ? iso.split('T')[1] : fallbackTime;
  return `${dateKey}T${time}`;
}

export function hourToTime(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
