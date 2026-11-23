import { useState } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useOrders } from '../../context/OrdersContext';
import { capacityLevel, printsOnDay } from '../../utils/capacity';
import { toDateKey, today } from '../../utils/dates';
import CalendarEvent from './CalendarEvent';
import { dropTarget } from './dnd';
import './MonthView.css';

const MAX_VISIBLE = 3;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DayCell({ day, cursor, events, onDrop, onShowDay }) {
  const { orders, settings } = useOrders();
  const [over, setOver] = useState(false);
  const booked = printsOnDay(orders, day);
  const level = capacityLevel(booked, settings.dailyCapacity);
  const hidden = events.length - MAX_VISIBLE;

  return (
    <div
      className={[
        'month__cell',
        isSameMonth(day, cursor) ? '' : 'is-outside',
        isSameDay(day, today()) ? 'is-today' : '',
        over ? 'is-over' : '',
      ].join(' ')}
      {...dropTarget((payload) => onDrop(payload, toDateKey(day)), setOver)}
    >
      <div className={`month__head month__head--${level}`}>
        <button type="button" className="month__num" onClick={() => onShowDay(day)} title="Open day view">
          {format(day, 'd')}
        </button>
        {booked > 0 && (
          <span className={`cap cap--${level}`} title="Prints booked / daily capacity">
            {booked}/{settings.dailyCapacity}
          </span>
        )}
      </div>
      <div className="month__events">
        {events.slice(0, MAX_VISIBLE).map((e) => (
          <CalendarEvent key={e.id} event={e} variant="compact" />
        ))}
        {hidden > 0 && (
          <button type="button" className="month__more" onClick={() => onShowDay(day)}>
            +{hidden} more
          </button>
        )}
      </div>
    </div>
  );
}

export default function MonthView({ cursor, events, onDrop, onShowDay }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });

  return (
    <div className="month">
      {WEEKDAYS.map((d) => (
        <div key={d} className="month__dow">
          {d}
        </div>
      ))}
      {days.map((day) => (
        <DayCell
          key={day.toISOString()}
          day={day}
          cursor={cursor}
          events={events.filter((e) => isSameDay(e.start, day))}
          onDrop={onDrop}
          onShowDay={onShowDay}
        />
      ))}
    </div>
  );
}
