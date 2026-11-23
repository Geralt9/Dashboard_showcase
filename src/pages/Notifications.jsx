import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  FilePlus2,
  PackageCheck,
  PencilLine,
  Send,
  Truck,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import { buildNotifications, countUnread } from '../utils/notifications';
import { fmtDateTime } from '../utils/dates';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import './Notifications.css';

const TYPES = {
  overdue: { icon: AlertTriangle, color: 'var(--danger)', label: 'Overdue' },
  'art-uploaded': { icon: Upload, color: 'var(--stage-art-received)', label: 'Art uploaded' },
  'art-approved': { icon: CircleCheck, color: 'var(--stage-art-approved)', label: 'Art approved' },
  'art-edit': { icon: PencilLine, color: 'var(--stage-art-review)', label: 'Edit requested' },
  'garments-arrived': { icon: PackageCheck, color: 'var(--success)', label: 'Garments arrived' },
  'garments-shipped': { icon: Truck, color: 'var(--warning)', label: 'Garments shipped' },
  notify: { icon: Send, color: 'var(--teal)', label: 'Customer notified' },
  'order-created': { icon: FilePlus2, color: 'var(--purple)', label: 'New order' },
  'date-change': { icon: CalendarClock, color: 'var(--text-muted)', label: 'Date changed' },
  stage: { icon: ArrowRightLeft, color: 'var(--purple)', label: 'Stage change' },
  completed: { icon: CheckCircle2, color: 'var(--stage-completed)', label: 'Completed' },
};

export default function Notifications() {
  const { orders, activity, notificationsReadAt, actions } = useOrders();
  const { openOrder } = useUI();
  const [filter, setFilter] = useState('all');
  // Remember which items were unread when the page opened, so highlights stay visible.
  const readAtOnOpen = useRef(notificationsReadAt);

  const all = useMemo(() => buildNotifications(orders, activity), [orders, activity]);
  const unread = countUnread(all, notificationsReadAt);
  const list = all.filter((n) => {
    if (filter === 'alerts') return ['overdue', 'garments-arrived', 'art-uploaded', 'art-edit'].includes(n.type);
    if (filter === 'unread') return !readAtOnOpen.current || n.date > readAtOnOpen.current;
    return true;
  });

  // Opening the page marks everything as read (the bell badge clears).
  useEffect(() => {
    actions.markNotificationsRead();
  }, [actions]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p>Generated from shop activity: art uploads, garment deliveries, overdue orders and more.</p>
        </div>
        <div className="notif__head-actions">
          <Tabs
            variant="segmented"
            label="Notification filter"
            value={filter}
            onChange={setFilter}
            items={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'New' },
              { value: 'alerts', label: 'Alerts' },
            ]}
          />
          <Button size="md" icon={CheckCheck} disabled={unread === 0} onClick={actions.markNotificationsRead}>
            Mark all read
          </Button>
        </div>
      </div>

      <Card bodyClassName="card__body--flush">
        {list.length === 0 && <p className="empty-state">You&rsquo;re all caught up.</p>}
        <ul className="notif">
          {list.map((n) => {
            const t = TYPES[n.type] || TYPES.stage;
            const Icon = t.icon;
            const isNew = !readAtOnOpen.current || n.date > readAtOnOpen.current;
            return (
              <li key={n.id}>
                <button type="button" className={`notif__item ${isNew ? 'is-new' : ''}`} onClick={() => n.orderId && openOrder(n.orderId)}>
                  <span className="notif__icon" style={{ '--c': t.color }}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="notif__text">
                    <span className="notif__msg">{n.message}</span>
                    <span className="notif__meta">
                      {t.label} · {fmtDateTime(n.date)}
                    </span>
                  </span>
                  {isNew && <span className="notif__dot" aria-label="New" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
