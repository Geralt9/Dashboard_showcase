import { eachDayOfInterval, endOfWeek, startOfWeek } from 'date-fns';
import TimeGrid from './TimeGrid';

export default function WeekView({ cursor, events, onDrop }) {
  const days = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });
  return <TimeGrid days={days} events={events} onDrop={onDrop} />;
}
