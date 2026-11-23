import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, addMinutes, format } from 'date-fns';
import { CalendarDays, CalendarClock, ExternalLink, Play, PackageCheck, UserRound } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { jobLabel, jobStatus } from '../../utils/orders';
import { fmtDuration, fmtTime, sameDay, toDate, today } from '../../utils/dates';
import Card from '../ui/Card';
import Menu from '../ui/Menu';
import './TodayProduction.css';

export default function TodayProduction() {
  const { orders, actions } = useOrders();
  const { openOrder, toast } = useUI();
  const navigate = useNavigate();
  const [dayOffset, setDayOffset] = useState(0);
  const day = addDays(today(), dayOffset);
  const dayName = dayOffset === 0 ? 'Today' : 'Tomorrow';

  const jobs = orders
    .filter((o) => sameDay(o.dates.printDate, day))
    .sort((a, b) => a.dates.printDate.localeCompare(b.dates.printDate));

  return (
    <Card
      title={dayOffset === 0 ? "Today's Production" : "Tomorrow's Production"}
      divider={false}
      actions={
        <Menu
          items={[
            dayOffset === 0
              ? { label: "Show tomorrow's jobs", icon: CalendarClock, onClick: () => setDayOffset(1) }
              : { label: "Show today's jobs", icon: CalendarClock, onClick: () => setDayOffset(0) },
            { label: 'Open in calendar', icon: CalendarDays, onClick: () => navigate('/calendar?view=day') },
          ]}
        />
      }
      className="today"
    >
      {jobs.length === 0 && <p className="empty-state">No print jobs scheduled for {dayName.toLowerCase()}.</p>}
      <ol className="timeline">
        {jobs.map((order) => {
          const start = toDate(order.dates.printDate);
          const end = addMinutes(start, order.estimatedHours * 60);
          const status = jobStatus(order);
          return (
            <li key={order.id} className="timeline__item">
              <div className="timeline__rail">
                <span className="timeline__label">{dayName}</span>
                <span className="timeline__dot">{format(day, 'd')}</span>
                <span className="timeline__line" />
              </div>
              <article
                className="timeline__card"
                onClick={() => openOrder(order.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openOrder(order.id)}
              >
                <header>
                  <strong>
                    {fmtTime(start)} – {format(end, 'HH:mm')}
                  </strong>
                  <span className="muted">{fmtDuration(order.estimatedHours)}</span>
                  <Menu
                    label={`Actions for ${order.id}`}
                    items={[
                      { label: 'Open order', icon: ExternalLink, onClick: () => openOrder(order.id) },
                      {
                        label: 'Start printing',
                        icon: Play,
                        onClick: () => {
                          actions.setStage(order.id, 'printing');
                          toast(`${order.id} is now printing`);
                        },
                      },
                      {
                        label: 'Mark ready',
                        icon: PackageCheck,
                        onClick: () => {
                          actions.setStage(order.id, 'ready');
                          toast(`${order.id} is ready for ${order.fulfillment === 'shipping' ? 'shipping' : 'pickup'}`);
                        },
                      },
                    ]}
                  />
                </header>
                <p className="timeline__title">{jobLabel(order)}</p>
                <p className="timeline__sub">
                  {order.customer.company} · {order.id}
                </p>
                <footer>
                  <span className="timeline__meta">
                    <UserRound size={12} aria-hidden="true" /> {order.assignee}
                  </span>
                  <span className={`tag tag--${status.tone}`}>{status.label}</span>
                </footer>
              </article>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
