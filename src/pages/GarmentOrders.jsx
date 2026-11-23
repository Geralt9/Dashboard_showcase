import { useState } from 'react';
import { PackageCheck, Truck } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import { fmtShort } from '../utils/dates';
import { itemQty, totalQty } from '../utils/orders';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import './GarmentOrders.css';

const STATUS = {
  ordered: { label: 'Ordered', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
};

export default function GarmentOrders() {
  const { orders, actions } = useOrders();
  const { toast, openOrder } = useUI();
  const [filter, setFilter] = useState('open');

  const all = orders
    .filter((o) => o.garmentOrder)
    .sort((a, b) => (a.dates.garmentsEta || '').localeCompare(b.dates.garmentsEta || ''));
  const list = all.filter((o) =>
    filter === 'all' ? true : filter === 'open' ? o.garmentOrder.status !== 'received' : o.garmentOrder.status === filter,
  );
  const openCount = all.filter((o) => o.garmentOrder.status !== 'received').length;

  const setStatus = (order, status) => {
    actions.setGarmentStatus(order.id, status);
    toast(status === 'received' ? `Garments received for ${order.id}` : `${order.id} garments marked as shipped`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Garment Orders</h2>
          <p>Blanks ordered from suppliers. Mark them received when the boxes arrive.</p>
        </div>
        <Tabs
          variant="segmented"
          label="Status filter"
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'open', label: `Open (${openCount})` },
            { value: 'received', label: 'Received' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      <Card bodyClassName="card__body--flush">
        {list.length === 0 ? (
          <p className="empty-state">No supplier orders here.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>PO / Order</th>
                  <th>Supplier</th>
                  <th>Garments</th>
                  <th>Qty</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((order) => {
                  const g = order.garmentOrder;
                  const status = STATUS[g.status];
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="cell-strong">{g.po}</span>
                        <button type="button" className="garments__link" onClick={() => openOrder(order.id)}>
                          {order.id} · {order.customer.company}
                        </button>
                      </td>
                      <td>{g.supplier}</td>
                      <td>
                        {order.items.map((it, i) => (
                          <span key={i} className="garments__item">
                            {itemQty(it)}× {it.brand} <span className="muted">({it.color})</span>
                          </span>
                        ))}
                      </td>
                      <td>{totalQty(order)}</td>
                      <td>
                        {fmtShort(order.dates.garmentsEta)}
                        {g.receivedOn && <span className="cell-sub">received {fmtShort(g.receivedOn)}</span>}
                      </td>
                      <td>
                        <span className={`tag tag--${status.tone}`}>{status.label}</span>
                      </td>
                      <td className="garments__actions">
                        {g.status === 'ordered' && (
                          <Button size="sm" variant="ghost" icon={Truck} onClick={() => setStatus(order, 'shipped')}>
                            Mark shipped
                          </Button>
                        )}
                        {g.status !== 'received' && (
                          <Button size="sm" variant="dark" icon={PackageCheck} onClick={() => setStatus(order, 'received')}>
                            Mark received
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
