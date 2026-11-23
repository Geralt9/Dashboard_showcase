import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { atRiskReason, daysLate, isActive, orderHealth } from '../../utils/orders';
import { fmtShort } from '../../utils/dates';
import Card from '../ui/Card';
import Menu from '../ui/Menu';
import ProgressRing from '../ui/ProgressRing';
import './DeadlineWatch.css';

export default function DeadlineWatch() {
  const { orders } = useOrders();
  const { openOrder } = useUI();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  const active = orders.filter((o) => isActive(o) && o.stage !== 'ready');
  const groups = {
    overdue: active.filter((o) => orderHealth(o) === 'overdue'),
    'at-risk': active.filter((o) => orderHealth(o) === 'at-risk'),
    'on-track': active.filter((o) => orderHealth(o) === 'on-track'),
  };
  const pct = (n) => (active.length ? Math.round((n / active.length) * 100) : 0);

  const rows = [
    {
      key: 'overdue',
      label: 'Overdue',
      color: 'var(--danger)',
      track: 'var(--danger-soft)',
      subtitle: `${groups.overdue.length} order${groups.overdue.length === 1 ? '' : 's'} past finish date`,
      tag: groups.overdue.length ? { tone: 'danger', text: 'Late' } : null,
      detail: (o) => `${daysLate(o)}d late · due ${fmtShort(o.dates.finishDate)}`,
    },
    {
      key: 'at-risk',
      label: 'At risk',
      color: 'var(--warning)',
      track: 'var(--warning-soft)',
      subtitle: 'Garments not arrived / art not approved, print in < 3 days',
      tag: groups['at-risk'].length ? { tone: 'warning', text: `${groups['at-risk'].length} at risk` } : null,
      detail: (o) => `${atRiskReason(o)} · prints ${fmtShort(o.dates.printDate)}`,
    },
    {
      key: 'on-track',
      label: 'On track',
      color: 'var(--success)',
      track: '#e3f6ea',
      subtitle: `${groups['on-track'].length} orders moving as planned`,
      tag: null,
      detail: (o) => `Finish ${fmtShort(o.dates.finishDate)}`,
    },
  ];

  return (
    <Card
      title="Deadline Watch"
      divider={false}
      actions={<Menu items={[{ label: 'Open orders list', icon: ClipboardList, onClick: () => navigate('/orders') }]} />}
    >
      <ul className="watch">
        {rows.map((row) => {
          const list = groups[row.key];
          const open = expanded === row.key;
          return (
            <li key={row.key} className="watch__row">
              <button
                type="button"
                className="watch__head"
                onClick={() => setExpanded(open ? null : row.key)}
                aria-expanded={open}
              >
                <ProgressRing
                  value={pct(list.length)}
                  size={44}
                  stroke={4}
                  color={row.color}
                  track={row.track}
                  label={`${pct(list.length)}%`}
                  labelSize={10}
                />
                <div className="watch__text">
                  <strong>{row.label}</strong>
                  <span>{row.subtitle}</span>
                </div>
                {row.tag && <span className={`tag tag--${row.tag.tone}`}>{row.tag.text}</span>}
                <ChevronDown size={16} className={`watch__chev ${open ? 'is-open' : ''}`} aria-hidden="true" />
              </button>
              {open && (
                <ul className="watch__list">
                  {list.length === 0 && <li className="muted">Nothing here.</li>}
                  {list.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => openOrder(o.id)}>
                        <span className="cell-strong">{o.id}</span> {o.customer.company}
                        <span className="cell-sub">{row.detail(o)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
