import { format, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { EVENT_TYPES } from '../../utils/events';
import Tabs from '../ui/Tabs';
import Button, { IconButton } from '../ui/Button';
import Filters from './Filters';
import './CalendarHeader.css';

const VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

function rangeLabel(view, cursor) {
  if (view === 'month') return format(cursor, 'MMMM yyyy');
  if (view === 'day') return format(cursor, 'EEEE, MMMM d, yyyy');
  const start = startOfWeek(cursor);
  const end = endOfWeek(cursor);
  return isSameMonth(start, end)
    ? `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export default function CalendarHeader({ view, onViewChange, cursor, onPrev, onNext, onToday, filters, onFiltersChange, onAdd }) {
  return (
    <div className="cal-header">
      <div className="cal-header__top">
        <div className="cal-header__nav">
          <Button size="sm" onClick={onToday}>
            Today
          </Button>
          <IconButton icon={ChevronLeft} label="Previous" className="icon-btn--bordered" onClick={onPrev} />
          <IconButton icon={ChevronRight} label="Next" className="icon-btn--bordered" onClick={onNext} />
          <h3>{rangeLabel(view, cursor)}</h3>
        </div>
        <div className="cal-header__actions">
          <Tabs items={VIEWS} value={view} onChange={onViewChange} variant="segmented" label="Calendar view" />
          <Filters filters={filters} onChange={onFiltersChange} />
          <Button variant="primary" icon={Plus} onClick={onAdd}>
            Add job
          </Button>
        </div>
      </div>
      <ul className="cal-header__legend" aria-label="Event types">
        {EVENT_TYPES.map((t) => (
          <li key={t.id}>
            <span style={{ background: t.color }} />
            {t.label}
          </li>
        ))}
        <li>
          <span className="cal-header__late" />
          Overdue
        </li>
        <li className="muted">Drag events or tray cards to reschedule</li>
      </ul>
    </div>
  );
}
