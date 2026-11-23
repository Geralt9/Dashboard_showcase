import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { DEFAULT_FILTERS, buildEvents } from '../../utils/events';
import { jobStatus, totalQty } from '../../utils/orders';
import { capacityLevel, printsOnDay } from '../../utils/capacity';
import { fmtDuration, toDateKey, today } from '../../utils/dates';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import Button, { IconButton } from '../ui/Button';
import Filters from '../calendar/Filters';
import './CalendarPreview.css';

const TABS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

function JobBlock({ event, onOpen }) {
  const status = jobStatus(event.order);
  return (
    <button type="button" className={`job job--${status.key}`} onClick={() => onOpen(event.order.id)}>
      <span className="job__title">{event.order.customer.company}</span>
      <span className="job__meta">
        {totalQty(event.order)} pcs · {fmtDuration(event.order.estimatedHours)}
      </span>
      <span className={`tag tag--${status.tone}`}>{status.label}</span>
    </button>
  );
}

export default function CalendarPreview() {
  const { orders, settings } = useOrders();
  const { openOrder, openNewOrder } = useUI();
  const navigate = useNavigate();
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(today);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // The preview focuses on print jobs; other event types are on the full calendar.
  const events = useMemo(() => buildEvents(orders, { ...filters, types: ['print'] }), [orders, filters]);
  const eventsOn = (day) => events.filter((e) => isSameDay(e.start, day));

  const step = (dir) => {
    if (view === 'day') setCursor((d) => addDays(d, dir));
    if (view === 'week') setCursor((d) => addWeeks(d, dir));
    if (view === 'month') setCursor((d) => addMonths(d, dir));
  };

  const days =
    view === 'month'
      ? eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) })
      : view === 'week'
        ? eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) })
        : [cursor];

  return (
    <Card
      title="Production Calendar"
      divider={false}
      className="cal-preview"
      actions={
        <Button variant="primary" size="md" icon={Plus} onClick={() => openNewOrder({ printDay: toDateKey(cursor) })}>
          Add job
        </Button>
      }
    >
      <Tabs items={TABS} value={view} onChange={setView} label="Calendar range" className="cal-preview__tabs" />

      <div className="cal-preview__bar">
        <div>
          <h4>{format(cursor, 'MMMM')}</h4>
          <p className="muted">Today {format(new Date(), 'MMM d, yyyy')}</p>
        </div>
        <div className="cal-preview__controls">
          <Button size="sm" onClick={() => navigate(`/calendar?view=${view}`)}>
            View calendar
          </Button>
          <Filters filters={filters} onChange={setFilters} size="sm" />
          <IconButton icon={ChevronLeft} label="Previous" className="icon-btn--bordered" onClick={() => step(-1)} />
          <IconButton icon={ChevronRight} label="Next" className="icon-btn--bordered" onClick={() => step(1)} />
        </div>
      </div>

      {view === 'month' ? (
        <div className="cal-preview__month">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <span key={d} className="cal-preview__dow">
              {d}
            </span>
          ))}
          {days.map((day) => {
            const list = eventsOn(day);
            return (
              <button
                type="button"
                key={day.toISOString()}
                className={`cal-preview__mday ${isSameMonth(day, cursor) ? '' : 'is-outside'} ${isSameDay(day, today()) ? 'is-today' : ''}`}
                onClick={() => {
                  setCursor(day);
                  setView('day');
                }}
              >
                <span>{format(day, 'd')}</span>
                {list.length > 0 && (
                  <span className="cal-preview__dots">
                    {list.slice(0, 4).map((e) => (
                      <i key={e.id} className={`job-dot job-dot--${jobStatus(e.order).key}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`cal-preview__grid ${view === 'day' ? 'is-day' : ''}`}>
          {days.map((day) => {
            const booked = printsOnDay(orders, day);
            const level = capacityLevel(booked, settings.dailyCapacity);
            const list = eventsOn(day);
            return (
              <div
                key={day.toISOString()}
                className={`cal-preview__col ${isSameDay(day, today()) ? 'is-today' : ''} ${isWeekend(day) ? 'is-weekend' : ''}`}
              >
                <div className="cal-preview__head">
                  <span>{format(day, view === 'day' ? 'EEEE' : 'EEE')}</span>
                  <strong>{format(day, 'd')}</strong>
                  {booked > 0 && (
                    <em className={`cap cap--${level}`} title="Prints booked / daily capacity">
                      {booked}/{settings.dailyCapacity}
                    </em>
                  )}
                </div>
                <div className="cal-preview__cell">
                  {list.map((e) => (
                    <JobBlock key={e.id} event={e} onOpen={openOrder} />
                  ))}
                  {view === 'day' && list.length === 0 && <p className="empty-state">No print jobs this day.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
