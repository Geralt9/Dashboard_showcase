import { PackageCheck } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { isActive, isOverdue } from '../../utils/orders';
import { stageIndex } from '../../utils/stages';
import { weekUsage } from '../../utils/capacity';
import Card from '../ui/Card';
import ProgressRing from '../ui/ProgressRing';
import './KpiCards.css';

export default function KpiCards() {
  const { orders, settings } = useOrders();

  const active = orders.filter(isActive);
  const inProgress = active.filter((o) => o.stage !== 'ready');
  const onSchedule = inProgress.filter((o) => !isOverdue(o)).length;
  const onSchedulePct = inProgress.length ? Math.round((onSchedule / inProgress.length) * 100) : 100;
  const awaitingArt = active.filter((o) => stageIndex(o.stage) < stageIndex('art-approved')).length;

  const usage = weekUsage(orders, settings);
  const usagePct = Math.round(usage.ratio * 100);
  const ready = orders.filter((o) => o.stage === 'ready');
  const pickups = ready.filter((o) => o.fulfillment === 'pickup').length;

  return (
    <div className="kpi-row">
      <Card title="Production overview">
        <div className="kpi">
          <ProgressRing value={onSchedulePct} size={108} stroke={11} label={`${onSchedulePct}%`} sublabel="on schedule" />
          <ul className="kpi__legend">
            <li>
              <span className="kpi__swatch" style={{ background: 'var(--purple)' }} />
              <div>
                <p>Active orders</p>
                <strong>{active.length}</strong>
              </div>
            </li>
            <li>
              <span className="kpi__swatch" style={{ background: '#e4dcfb' }} />
              <div>
                <p>Awaiting art approval</p>
                <strong>{awaitingArt}</strong>
              </div>
            </li>
          </ul>
        </div>
      </Card>

      <Card title="Shop capacity">
        <div className="kpi">
          <ProgressRing
            value={usagePct}
            size={108}
            stroke={11}
            color={usagePct > 100 ? 'var(--danger)' : 'var(--gold)'}
            track="var(--gold-soft)"
            label={`${usagePct}%`}
            sublabel="this week"
          />
          <div className="kpi__highlight">
            <div className="kpi__highlight-title">
              <PackageCheck size={26} color="var(--gold)" aria-hidden="true" />
              <span>
                Ready for pickup / shipping: <strong>{ready.length}</strong>
              </span>
            </div>
            <p className="muted">
              {pickups} pickup · {ready.length - pickups} shipping · {usage.booked.toLocaleString()} of{' '}
              {usage.capacity.toLocaleString()} prints booked this week
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
