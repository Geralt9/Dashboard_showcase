import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, addMonths, addWeeks } from 'date-fns';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import { DEFAULT_FILTERS, buildEvents } from '../utils/events';
import { toDateKey, today } from '../utils/dates';
import CalendarHeader from '../components/calendar/CalendarHeader';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import DayView from '../components/calendar/DayView';
import UnscheduledTray from '../components/calendar/UnscheduledTray';
import { useReschedule } from '../components/calendar/useReschedule';
import './Calendar.css';

const VIEWS = ['month', 'week', 'day'];

export default function Calendar() {
  const { orders } = useOrders();
  const { openNewOrder } = useUI();
  const [params, setParams] = useSearchParams();
  const view = VIEWS.includes(params.get('view')) ? params.get('view') : 'week';
  const [cursor, setCursor] = useState(today);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const reschedule = useReschedule();

  const events = useMemo(() => buildEvents(orders, filters), [orders, filters]);

  const setView = (v) => setParams({ view: v }, { replace: true });
  const step = (dir) => {
    if (view === 'month') setCursor((d) => addMonths(d, dir));
    else if (view === 'week') setCursor((d) => addWeeks(d, dir));
    else setCursor((d) => addDays(d, dir));
  };

  // Drop handler shared by every view: payload = { orderId, type }
  const handleDrop = (payload, dateKey, time) => reschedule(payload.orderId, payload.type, dateKey, time);

  const showDay = (day) => {
    setCursor(day);
    setView('day');
  };

  return (
    <div className="calendar-page">
      <section className="calendar-page__main">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          cursor={cursor}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onToday={() => setCursor(today())}
          filters={filters}
          onFiltersChange={setFilters}
          onAdd={() => openNewOrder({ printDay: toDateKey(cursor) })}
        />
        {view === 'month' && <MonthView cursor={cursor} events={events} onDrop={handleDrop} onShowDay={showDay} />}
        {view === 'week' && <WeekView cursor={cursor} events={events} onDrop={handleDrop} />}
        {view === 'day' && <DayView cursor={cursor} events={events} onDrop={handleDrop} />}
      </section>
      <UnscheduledTray />
    </div>
  );
}
