import { differenceInCalendarDays } from 'date-fns';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { EVENT_FIELD } from '../../utils/events';
import { fmtShort, moveToDay, toDate } from '../../utils/dates';

const FIELD_LABEL = {
  printDate: 'Print date',
  finishDate: 'Finish date',
  garmentsEta: 'Garments ETA',
  artApprovalDue: 'Art approval due',
};

/** Conflicts when a print date lands before garments arrive or before the art is approved. */
export function printConflicts(order, newPrintDate) {
  const day = toDate(newPrintDate);
  const issues = [];
  const eta = toDate(order.dates.garmentsEta);
  if (order.garmentOrder?.status !== 'received' && eta && differenceInCalendarDays(day, eta) < 0) {
    issues.push(`Garments are only expected on ${fmtShort(eta)}.`);
  }
  const artDue = toDate(order.dates.artApprovalDue);
  if (order.artwork.status !== 'approved') {
    if (artDue && differenceInCalendarDays(day, artDue) < 0) {
      issues.push(`Art approval isn't due until ${fmtShort(artDue)}.`);
    } else {
      issues.push('The artwork is not approved yet.');
    }
  }
  return issues;
}

/**
 * Returns `reschedule(orderId, type, dateKey, time?)`.
 * - print events keep their time unless a new `time` ("HH:mm") is given
 * - other events are date-only
 */
export function useReschedule() {
  const { orders, settings, actions } = useOrders();
  const { toast, confirm } = useUI();

  return async function reschedule(orderId, type, dateKey, time) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const field = EVENT_FIELD[type];
    const fallback = `${String(settings.workStart).padStart(2, '0')}:00`;
    const value = type === 'print' ? (time ? `${dateKey}T${time}` : moveToDay(order.dates.printDate, dateKey, fallback)) : dateKey;
    if (order.dates[field] === value) return;

    if (type === 'print') {
      const issues = printConflicts(order, value);
      if (issues.length) {
        toast(`Heads up: ${issues[0]}`, 'warning');
        const ok = await confirm({
          title: `Schedule ${order.id} anyway?`,
          message: `You're moving the print date to ${fmtShort(value)}.\n\n${issues.join('\n')}`,
          confirmLabel: 'Move anyway',
        });
        if (!ok) {
          toast('Reschedule cancelled', 'info');
          return;
        }
      }
    }

    actions.updateDates(orderId, { [field]: value });
    toast(`${FIELD_LABEL[field]} for ${order.id} moved to ${fmtShort(value)}${type === 'print' && value.includes('T') ? ` ${value.split('T')[1]}` : ''}`);
  };
}
