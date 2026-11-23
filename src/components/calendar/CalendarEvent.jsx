import { Printer, Truck, Store, Shirt, Palette, Zap } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { eventTitle } from '../../utils/events';
import { stageColor } from '../../utils/stages';
import { fmtTime } from '../../utils/dates';
import { totalQty } from '../../utils/orders';
import StagePill from '../ui/StagePill';
import { startDrag } from './dnd';
import './CalendarEvent.css';

function eventIcon(event) {
  if (event.type === 'finish') return event.order.fulfillment === 'shipping' ? Truck : Store;
  if (event.type === 'garments') return Shirt;
  if (event.type === 'art') return Palette;
  return Printer;
}

/**
 * One calendar event. `variant`: "compact" (month cells) | "block" (time grid) | "chip" (all-day row)
 */
export default function CalendarEvent({ event, variant = 'compact', style }) {
  const { openOrder } = useUI();
  const Icon = eventIcon(event);
  const { order } = event;
  const classes = [
    'cal-event',
    `cal-event--${event.type}`,
    `cal-event--${variant}`,
    event.overdue && !event.done ? 'is-overdue' : '',
    event.done ? 'is-done' : '',
  ].join(' ');

  return (
    <div
      className={classes}
      style={style}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        startDrag(e, { orderId: order.id, type: event.type });
      }}
      onClick={(e) => {
        e.stopPropagation();
        openOrder(order.id);
      }}
      onKeyDown={(e) => e.key === 'Enter' && openOrder(order.id)}
      role="button"
      tabIndex={0}
      title={`${eventTitle(event)} · ${order.id} — drag to reschedule`}
    >
      <div className="cal-event__line">
        <Icon size={12} aria-hidden="true" className="cal-event__icon" />
        {variant !== 'block' && event.type === 'print' && <span className="cal-event__time">{fmtTime(event.start)}</span>}
        <span className="cal-event__title">{eventTitle(event)}</span>
        {variant === 'compact' && (
          <span className="cal-event__stage" style={{ background: stageColor(order.stage) }} title={order.stage} />
        )}
        {order.priority === 'rush' && <Zap size={11} className="cal-event__rush" aria-label="Rush" />}
      </div>
      {variant === 'block' && (
        <>
          <span className="cal-event__meta">
            {fmtTime(event.start)} · {totalQty(order)} pcs · {order.id}
          </span>
          <StagePill stage={order.stage} short />
        </>
      )}
    </div>
  );
}
