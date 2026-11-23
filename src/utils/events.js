import { toDate } from './dates';
import { isAtOrPast } from './stages';
import { isOverdue } from './orders';

// Calendar event types. Each order can produce up to four events.
export const EVENT_TYPES = [
  { id: 'print', label: 'Print date', color: 'var(--event-print)' },
  { id: 'finish', label: 'Finish (pickup / ship)', color: 'var(--event-finish)' },
  { id: 'garments', label: 'Garment ETA', color: 'var(--event-garments)' },
  { id: 'art', label: 'Art approval due', color: 'var(--event-art)' },
];

export const EVENT_FIELD = {
  print: 'printDate',
  finish: 'finishDate',
  garments: 'garmentsEta',
  art: 'artApprovalDue',
};

export const DEFAULT_FILTERS = {
  stages: [], // empty = all
  types: EVENT_TYPES.map((t) => t.id),
  assignee: 'all',
  rushOnly: false,
  fulfillment: 'all',
};

export function orderMatchesFilters(order, filters) {
  if (filters.stages.length && !filters.stages.includes(order.stage)) return false;
  if (filters.assignee !== 'all' && order.assignee !== filters.assignee) return false;
  if (filters.rushOnly && order.priority !== 'rush') return false;
  if (filters.fulfillment !== 'all' && order.fulfillment !== filters.fulfillment) return false;
  return true;
}

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.stages.length) n++;
  if (filters.types.length !== EVENT_TYPES.length) n++;
  if (filters.assignee !== 'all') n++;
  if (filters.rushOnly) n++;
  if (filters.fulfillment !== 'all') n++;
  return n;
}

/** Turn orders into flat calendar events. */
export function buildEvents(orders, filters = DEFAULT_FILTERS) {
  const events = [];
  for (const order of orders) {
    if (!orderMatchesFilters(order, filters)) continue;
    const overdue = isOverdue(order);
    const add = (type, value, extra = {}) => {
      if (!filters.types.includes(type)) return;
      const start = toDate(value);
      if (!start) return;
      events.push({ id: `${order.id}-${type}`, type, order, start, overdue, ...extra });
    };

    add('print', order.dates.printDate, {
      allDay: false,
      hours: order.estimatedHours,
      done: isAtOrPast(order.stage, 'ready'),
    });
    add('finish', order.dates.finishDate, { allDay: true, done: order.stage === 'completed' });
    add('garments', order.dates.garmentsEta, {
      allDay: true,
      done: order.garmentOrder?.status === 'received',
    });
    add('art', order.dates.artApprovalDue, {
      allDay: true,
      done: order.artwork.status === 'approved',
    });
  }
  return events.sort((a, b) => a.start - b.start);
}

export function eventTitle(event) {
  const name = event.order.customer.company || event.order.customer.name;
  switch (event.type) {
    case 'finish':
      return `${event.order.fulfillment === 'shipping' ? 'Ship' : 'Pickup'} · ${name}`;
    case 'garments':
      return `Garments · ${name}`;
    case 'art':
      return `Art due · ${name}`;
    default:
      return name;
  }
}
