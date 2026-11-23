import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { isActive, isOverdue, itemsSummary } from '../../utils/orders';
import { fmtShort } from '../../utils/dates';
import Card from '../ui/Card';
import StagePill from '../ui/StagePill';
import PipelineBar from '../ui/PipelineBar';

/** Overdue first, then by finish date. */
function byUrgency(a, b) {
  const lateA = isOverdue(a) ? 0 : 1;
  const lateB = isOverdue(b) ? 0 : 1;
  if (lateA !== lateB) return lateA - lateB;
  return (a.dates.finishDate || '').localeCompare(b.dates.finishDate || '');
}

export default function ActiveOrdersTable({ limit = 6 }) {
  const { orders } = useOrders();
  const { openOrder } = useUI();
  const rows = orders.filter((o) => isActive(o) && o.stage !== 'ready').sort(byUrgency).slice(0, limit);

  return (
    <Card
      title="Active Orders"
      actions={
        <Link to="/orders" className="card-link">
          View all
        </Link>
      }
      bodyClassName="card__body--flush"
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order / Customer</th>
              <th>Items</th>
              <th>Stage</th>
              <th>Print date</th>
              <th>Finish date</th>
              <th style={{ width: '20%' }}>Pipeline progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr
                key={order.id}
                className="is-clickable"
                onClick={() => openOrder(order.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openOrder(order.id)}
              >
                <td>
                  <span className="cell-strong">
                    {order.id}{' '}
                    {order.priority === 'rush' && (
                      <span className="tag tag--warning" title="Rush order">
                        <Zap size={10} aria-hidden="true" />
                        Rush
                      </span>
                    )}
                  </span>
                  <span className="cell-sub">{order.customer.company}</span>
                </td>
                <td>{itemsSummary(order)}</td>
                <td>
                  <StagePill stage={order.stage} />
                </td>
                <td>{order.dates.printDate ? fmtShort(order.dates.printDate) : <span className="muted">Not set</span>}</td>
                <td>
                  {fmtShort(order.dates.finishDate)}{' '}
                  {isOverdue(order) && <span className="tag tag--danger">Late</span>}
                </td>
                <td>
                  <PipelineBar order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
