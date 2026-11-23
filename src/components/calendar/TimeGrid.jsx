import { useEffect, useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { useOrders } from '../../context/OrdersContext';
import { capacityLevel, printsOnDay } from '../../utils/capacity';
import { hourToTime, toDateKey, today } from '../../utils/dates';
import CalendarEvent from './CalendarEvent';
import { dropTarget } from './dnd';
import './TimeGrid.css';

const HOUR_HEIGHT = 56; // px per hour

/** Lay out overlapping timed events side by side. Returns [{ event, lane, lanes }]. */
function layoutDay(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const placed = [];
  let cluster = [];
  let clusterEnd = 0;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((p) => p.lane + 1));
    cluster.forEach((p) => (p.lanes = lanes));
    cluster = [];
  };
  for (const event of sorted) {
    const start = event.start.getTime();
    const end = start + event.hours * 3600000;
    if (cluster.length && start >= clusterEnd) flush();
    const used = new Set(cluster.filter((p) => p.end > start).map((p) => p.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    const item = { event, lane, lanes: 1, end };
    cluster.push(item);
    placed.push(item);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return placed;
}

function DayColumn({ day, events, startHour, endHour, onDrop }) {
  const [over, setOver] = useState(false);
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  // Convert the drop position into a time, snapped to 30 minutes.
  const handleDrop = (payload, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.max(0, Math.min(totalHeight - 1, e.clientY - rect.top));
    const hour = startHour + Math.floor((y / HOUR_HEIGHT) * 2) / 2;
    onDrop(payload, toDateKey(day), hourToTime(hour));
  };

  return (
    <div
      className={`tgrid__col ${over ? 'is-over' : ''} ${isSameDay(day, today()) ? 'is-today' : ''}`}
      style={{ height: totalHeight }}
      {...dropTarget(handleDrop, setOver)}
    >
      {Array.from({ length: endHour - startHour }, (_, i) => (
        <div key={i} className="tgrid__slot" style={{ height: HOUR_HEIGHT }} />
      ))}
      {layoutDay(events).map(({ event, lane, lanes }) => {
        const startH = event.start.getHours() + event.start.getMinutes() / 60;
        const top = Math.max(0, (startH - startHour) * HOUR_HEIGHT);
        const height = Math.max(30, Math.min(event.hours * HOUR_HEIGHT, totalHeight - top) - 3);
        return (
          <CalendarEvent
            key={event.id}
            event={event}
            variant="block"
            style={{
              top: top + 1,
              height,
              left: `calc(${(lane / lanes) * 100}% + 3px)`,
              width: `calc(${100 / lanes}% - 6px)`,
            }}
          />
        );
      })}
      {isSameDay(day, today()) && <NowLine startHour={startHour} endHour={endHour} />}
    </div>
  );
}

function NowLine({ startHour, endHour }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < startHour || h > endHour) return null;
  return <div className="tgrid__now" style={{ top: (h - startHour) * HOUR_HEIGHT }} />;
}

function AllDayCell({ day, events, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`tgrid__allday-cell ${over ? 'is-over' : ''}`}
      {...dropTarget((payload) => onDrop(payload, toDateKey(day)), setOver)}
    >
      {events.map((e) => (
        <CalendarEvent key={e.id} event={e} variant="chip" />
      ))}
    </div>
  );
}

/** Shared time grid for Week and Day views. */
export default function TimeGrid({ days, events, onDrop }) {
  const { orders, settings } = useOrders();

  // Show working hours, but stretch to fit any job booked outside them.
  const timed = events.filter((e) => !e.allDay);
  const earliest = Math.min(settings.workStart, ...timed.map((e) => e.start.getHours()));
  const latest = Math.max(
    settings.workEnd,
    ...timed.map((e) => Math.ceil(e.start.getHours() + e.start.getMinutes() / 60 + e.hours)),
  );
  const startHour = Math.max(0, earliest);
  const endHour = Math.min(24, latest);
  const cols = { gridTemplateColumns: `56px repeat(${days.length}, minmax(${days.length > 1 ? 120 : 200}px, 1fr))` };

  return (
    <div className="tgrid">
      {/* Day headers with capacity */}
      <div className="tgrid__row tgrid__row--head" style={cols}>
        <div className="tgrid__corner" />
        {days.map((day) => {
          const booked = printsOnDay(orders, day);
          const level = capacityLevel(booked, settings.dailyCapacity);
          const pct = Math.min(100, (booked / settings.dailyCapacity) * 100);
          return (
            <div
              key={day.toISOString()}
              className={`tgrid__dayhead tgrid__dayhead--${level} ${isSameDay(day, today()) ? 'is-today' : ''}`}
            >
              <span>{format(day, 'EEE')}</span>
              <strong>{format(day, 'd')}</strong>
              <div className="tgrid__cap" title={`${booked} of ${settings.dailyCapacity} prints booked`}>
                <div className="tgrid__cap-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <em>
                  {booked}/{settings.dailyCapacity}
                </em>
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events: finish, garments ETA, art due */}
      <div className="tgrid__row tgrid__row--allday" style={cols}>
        <div className="tgrid__gutter-label">All day</div>
        {days.map((day) => (
          <AllDayCell
            key={day.toISOString()}
            day={day}
            events={events.filter((e) => e.allDay && isSameDay(e.start, day))}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* Timed print jobs */}
      <div className="tgrid__row tgrid__row--body" style={cols}>
        <div className="tgrid__gutter">
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={i} style={{ height: HOUR_HEIGHT }}>
              <span>{hourToTime(startHour + i)}</span>
            </div>
          ))}
        </div>
        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            events={timed.filter((e) => isSameDay(e.start, day))}
            startHour={startHour}
            endHour={endHour}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  );
}
