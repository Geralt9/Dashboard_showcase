import { Truck, Store, Zap } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { isOverdue, itemsSummary, totalQty } from '../../utils/orders';
import { fmtShort } from '../../utils/dates';
import StagePill from '../ui/StagePill';
import PipelineBar from '../ui/PipelineBar';

export default function OrdersTable({ orders }) {
  const { openOrder, isCustomerView } = useUI();
  if (orders.length === 0) return <p className="empty-state">No orders match these filters.</p>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Order / Customer</th>
            <th>Items</th>
            <th>Stage</th>
            {!isCustomerView && <th>Assignee</th>}
            <th>Print date</th>
            <th>Finish date</th>
            <th>Fulfillment</th>
            <th style={{ width: '16%' }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
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
                    <span className="tag tag--warning">
                      <Zap size={10} aria-hidden="true" /> Rush
                    </span>
                  )}
                </span>
                <span className="cell-sub">{order.customer.company}</span>
              </td>
              <td>
                {itemsSummary(order)}
                <span className="cell-sub">{totalQty(order)} pcs total</span>
              </td>
              <td>
                <StagePill stage={order.stage} />
              </td>
              {!isCustomerView && <td>{order.assignee}</td>}
              <td>{order.dates.printDate ? fmtShort(order.dates.printDate) : <span className="muted">Not set</span>}</td>
              <td>
                {fmtShort(order.dates.finishDate)} {isOverdue(order) && <span className="tag tag--danger">Late</span>}
              </td>
              <td>
                <span className="tag tag--neutral">
                  {order.fulfillment === 'shipping' ? <Truck size={11} aria-hidden="true" /> : <Store size={11} aria-hidden="true" />}
                  {order.fulfillment === 'shipping' ? 'Shipping' : 'Pickup'}
                </span>
              </td>
              <td>
                <PipelineBar order={order} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
