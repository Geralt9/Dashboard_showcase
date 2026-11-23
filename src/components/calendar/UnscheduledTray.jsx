import { GripVertical, Inbox, Zap } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { isUnscheduled, itemsSummary } from '../../utils/orders';
import { fmtShort } from '../../utils/dates';
import StagePill from '../ui/StagePill';
import { startDrag } from './dnd';
import './UnscheduledTray.css';

/** Approved orders without a print date. Drag a card onto the calendar to schedule it. */
export default function UnscheduledTray() {
  const { orders } = useOrders();
  const { openOrder } = useUI();
  const list = orders.filter(isUnscheduled).sort((a, b) => a.dates.finishDate.localeCompare(b.dates.finishDate));

  return (
    <aside className="tray">
      <header className="tray__header">
        <Inbox size={16} aria-hidden="true" />
        <h3>Unscheduled</h3>
        <span className="tray__count">{list.length}</span>
      </header>
      <p className="tray__hint">Approved orders with no print date. Drag one onto a day or time slot.</p>

      <div className="tray__list">
        {list.length === 0 && <p className="empty-state">Everything approved is scheduled.</p>}
        {list.map((order) => (
          <div
            key={order.id}
            className="tray__card"
            draggable
            onDragStart={(e) => startDrag(e, { orderId: order.id, type: 'print' })}
            onClick={() => openOrder(order.id)}
            onKeyDown={(e) => e.key === 'Enter' && openOrder(order.id)}
            role="button"
            tabIndex={0}
            title="Drag onto the calendar to schedule"
          >
            <GripVertical size={14} className="tray__grip" aria-hidden="true" />
            <div className="tray__body">
              <div className="tray__top">
                <strong>{order.customer.company}</strong>
                {order.priority === 'rush' && <Zap size={12} className="tray__rush" aria-label="Rush" />}
              </div>
              <span className="tray__meta">
                {order.id} · {itemsSummary(order)}
              </span>
              <div className="tray__bottom">
                <StagePill stage={order.stage} short />
                <span className="tray__due">Due {fmtShort(order.dates.finishDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
