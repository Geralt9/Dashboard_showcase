import { startOfWeek, endOfWeek } from 'date-fns';
import { toDate, sameDay } from './dates';
import { totalQty } from './orders';

/** Prints booked on a given day (orders whose print date falls on that day). */
export function printsOnDay(orders, day) {
  return orders
    .filter((o) => sameDay(o.dates.printDate, day))
    .reduce((sum, o) => sum + totalQty(o), 0);
}

/** "ok" | "high" (> 80%) | "over" (> 100%) */
export function capacityLevel(booked, capacity) {
  if (!capacity) return 'ok';
  const ratio = booked / capacity;
  if (ratio > 1) return 'over';
  if (ratio > 0.8) return 'high';
  return 'ok';
}

/** Prints booked in the week containing `ref` (Sun–Sat, like the calendar). */
export function weekUsage(orders, settings, ref = new Date()) {
  const start = startOfWeek(ref);
  const end = endOfWeek(ref);
  const booked = orders
    .filter((o) => {
      const d = toDate(o.dates.printDate);
      return d && d >= start && d <= end;
    })
    .reduce((sum, o) => sum + totalQty(o), 0);
  const capacity = settings.dailyCapacity * settings.workingDays;
  return { booked, capacity, ratio: capacity ? booked / capacity : 0 };
}
