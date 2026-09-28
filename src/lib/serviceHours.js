import { format } from 'date-fns';

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes || 0));
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
}

export function logMinutes(log, now = Date.now()) {
  const start = new Date(log.start_time).getTime();
  const end = log.end_time ? new Date(log.end_time).getTime() : now;
  return Math.max(0, (end - start) / 60000);
}

export function logDayKey(log) {
  return format(new Date(log.start_time), 'yyyy-MM-dd');
}

export function groupByDay(logs, now = Date.now()) {
  const map = new Map();
  [...logs]
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .forEach(log => {
      const key = logDayKey(log);
      const entry = map.get(key) || { date: key, minutes: 0, shifts: [] };
      entry.shifts.push(log);
      entry.minutes += logMinutes(log, now);
      map.set(key, entry);
    });
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}