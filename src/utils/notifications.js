import { addDays, format } from 'date-fns';
import { isOverdue, daysLate } from './orders';
import { toDate } from './dates';

/** Notifications = activity feed + live "order overdue" alerts. Newest first. */
export function buildNotifications(orders, activity) {
  const overdue = orders.filter((o) => isOverdue(o)).map((o) => {
    const late = daysLate(o);
    return {
      id: `overdue-${o.id}`,
      type: 'overdue',
      orderId: o.id,
      message: `${o.id} (${o.customer.company}) is ${late} day${late === 1 ? '' : 's'} past its finish date`,
      // Alert "fires" the morning after the missed finish date.
      date: format(addDays(toDate(o.dates.finishDate), 1), "yyyy-MM-dd'T'08:00"),
    };
  });
  return [...overdue, ...activity].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function countUnread(notifications, readAt) {
  if (!readAt) return notifications.length;
  return notifications.filter((n) => n.date > readAt).length;
}
