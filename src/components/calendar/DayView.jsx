import TimeGrid from './TimeGrid';

export default function DayView({ cursor, events, onDrop }) {
  return <TimeGrid days={[cursor]} events={events} onDrop={onDrop} />;
}
