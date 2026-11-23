import { addDays, differenceInBusinessDays, differenceInCalendarDays } from 'date-fns';
import { stageIndex, isAtOrPast } from './stages';
import { toDate, today } from './dates';

export function itemQty(item) {
  return Object.values(item.sizes || {}).reduce((sum, n) => sum + Number(n || 0), 0);
}

export function totalQty(order) {
  return order.items.reduce((sum, item) => sum + itemQty(item), 0);
}

/** "50× T-shirt" (+ "+1 more" when there are several item lines) */
export function itemsSummary(order) {
  const [first, ...rest] = order.items;
  if (!first) return '—';
  const base = `${itemQty(first)}× ${first.garment}`;
  return rest.length ? `${base} +${rest.length}` : base;
}

/** "Screen print 48 tees" style label for production cards. */
export function jobLabel(order) {
  const first = order.items[0];
  if (!first) return order.id;
  const noun = {
    'T-shirt': 'tees',
    Hoodie: 'hoodies',
    Crewneck: 'crewnecks',
    Hat: 'hats',
    'Tote bag': 'totes',
    Polo: 'polos',
    'Tank top': 'tanks',
  }[first.garment] || first.garment.toLowerCase();
  return `${first.method} ${totalQty(order)} ${noun}`;
}

export function isActive(order) {
  return order.stage !== 'completed';
}

/** Past the finish date and not yet ready/completed. */
export function isOverdue(order, ref = today()) {
  const finish = toDate(order.dates.finishDate);
  if (!finish || isAtOrPast(order.stage, 'ready')) return false;
  return differenceInCalendarDays(finish, ref) < 0;
}

/** Prints within 3 working days but art isn't approved or garments haven't arrived. */
export function isAtRisk(order, ref = today()) {
  if (isOverdue(order, ref) || isAtOrPast(order.stage, 'printing')) return false;
  const print = toDate(order.dates.printDate);
  if (!print) return false;
  if (differenceInCalendarDays(print, ref) < 0) return false;
  if (differenceInBusinessDays(print, ref) >= 3) return false;
  const artMissing = order.artwork.status !== 'approved';
  const garmentsMissing = order.garmentOrder?.status !== 'received';
  return artMissing || garmentsMissing;
}

export function atRiskReason(order) {
  if (order.artwork.status !== 'approved') return 'Art not approved';
  if (order.garmentOrder?.status !== 'received') return 'Garments not arrived';
  return '';
}

/** "overdue" | "at-risk" | "on-track" | "done" */
export function orderHealth(order, ref = today()) {
  if (isAtOrPast(order.stage, 'ready')) return 'done';
  if (isOverdue(order, ref)) return 'overdue';
  if (isAtRisk(order, ref)) return 'at-risk';
  return 'on-track';
}

/** Status tag on calendar job blocks: Late / In progress / Done / Scheduled */
export function jobStatus(order) {
  if (isAtOrPast(order.stage, 'ready')) return { key: 'done', label: 'Done', tone: 'success' };
  if (isOverdue(order)) return { key: 'late', label: 'Late', tone: 'danger' };
  if (order.stage === 'printing') return { key: 'in-progress', label: 'In progress', tone: 'warning' };
  if (isAtRisk(order)) return { key: 'at-risk', label: 'At risk', tone: 'warning' };
  return { key: 'scheduled', label: 'Scheduled', tone: 'purple' };
}

export function daysLate(order, ref = today()) {
  const finish = toDate(order.dates.finishDate);
  return finish ? Math.max(0, differenceInCalendarDays(ref, finish)) : 0;
}

/** Approved orders that still need a print date (the calendar's "unscheduled tray"). */
export function isUnscheduled(order) {
  const idx = stageIndex(order.stage);
  return !order.dates.printDate && idx >= stageIndex('art-approved') && idx < stageIndex('printing');
}

/** Rough print-time estimate: setup + per-piece time by method. */
export function estimateHours(items) {
  const perPiece = { 'Screen print': 0.02, DTG: 0.05, Embroidery: 0.08, 'Heat transfer': 0.04, DTF: 0.04 };
  const hours = items.reduce((sum, item) => sum + itemQty(item) * (perPiece[item.method] ?? 0.04), 0.5);
  return Math.min(8, Math.max(1, Math.round(hours * 2) / 2));
}

export function inNextDays(value, days, ref = today()) {
  const d = toDate(value);
  return d ? d >= ref && d < addDays(ref, days) : false;
}
