import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { fmtShort } from '../utils/dates';
import { isActive, totalQty } from '../utils/orders';
import Card from '../components/ui/Card';
import StagePill from '../components/ui/StagePill';
import './Customers.css';

export default function Customers() {
  const { orders } = useOrders();
  const navigate = useNavigate();

  // Group orders by company (falls back to contact name).
  const customers = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      const key = o.customer.company || o.customer.name;
      const entry = map.get(key) || { key, customer: o.customer, orders: [] };
      entry.orders.push(o);
      map.set(key, entry);
    }
    return [...map.values()]
      .map((c) => {
        const sorted = [...c.orders].sort((a, b) => b.dates.requested.localeCompare(a.dates.requested));
        return {
          ...c,
          last: sorted[0],
          active: c.orders.filter(isActive).length,
          pieces: c.orders.reduce((s, o) => s + totalQty(o), 0),
        };
      })
      .sort((a, b) => b.last.dates.requested.localeCompare(a.last.dates.requested));
  }, [orders]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>{customers.length} customers. Click one to see their orders.</p>
        </div>
      </div>
      <Card bodyClassName="card__body--flush">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Pieces</th>
                <th>Last order</th>
                <th>Latest stage</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.key}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => navigate(`/orders?q=${encodeURIComponent(c.key)}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders?q=${encodeURIComponent(c.key)}`)}
                >
                  <td>
                    <div className="customers__name">
                      <span className="customers__avatar">{c.key[0]}</span>
                      <span className="cell-strong">{c.key}</span>
                    </div>
                  </td>
                  <td>
                    {c.customer.name}
                    <span className="cell-sub">{c.customer.email}</span>
                  </td>
                  <td>
                    {c.orders.length}
                    {c.active > 0 && <span className="cell-sub">{c.active} active</span>}
                  </td>
                  <td>{c.pieces}</td>
                  <td>
                    {fmtShort(c.last.dates.requested)}
                    <span className="cell-sub">{c.last.id}</span>
                  </td>
                  <td>
                    <StagePill stage={c.last.stage} short />
                  </td>
                  <td className="customers__chev">
                    <ChevronRight size={16} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
