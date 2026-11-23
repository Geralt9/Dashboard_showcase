import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Table2, Columns3, Plus } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import { STAGES, stageColor } from '../utils/stages';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import OrdersTable from '../components/orders/OrdersTable';
import KanbanBoard from '../components/orders/KanbanBoard';
import './Orders.css';

const SORTS = {
  print: { label: 'Print date', key: (o) => o.dates.printDate || '9999' },
  finish: { label: 'Finish date', key: (o) => o.dates.finishDate || '9999' },
  requested: { label: 'Newest first', key: (o) => o.dates.requested, desc: true },
};

export default function Orders() {
  const { orders } = useOrders();
  const { openNewOrder } = useUI();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [stage, setStage] = useState('all');
  const [sort, setSort] = useState('finish');
  const [mode, setMode] = useState('table');

  const setQuery = (q) => setParams(q ? { q } : {}, { replace: true });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const s = SORTS[sort];
    return orders
      .filter((o) => stage === 'all' || o.stage === stage)
      .filter((o) => {
        if (!q) return true;
        const hay = [o.id, o.customer.name, o.customer.company, o.customer.email, ...o.items.map((i) => i.garment)]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (s.desc ? s.key(b).localeCompare(s.key(a)) : s.key(a).localeCompare(s.key(b))));
  }, [orders, query, stage, sort]);

  const countFor = (id) => orders.filter((o) => o.stage === id).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>
            {filtered.length} of {orders.length} orders
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => openNewOrder()}>
          New order
        </Button>
      </div>

      <Card bodyClassName="orders__toolbar-body">
        <div className="orders__toolbar">
          <label className="orders__search">
            <Search size={16} aria-hidden="true" />
            <span className="visually-hidden">Search orders</span>
            <input
              className="input"
              type="search"
              placeholder="Search by order, customer, email, garment…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="orders__sort">
            <span>Sort by</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Tabs
            variant="segmented"
            label="Layout"
            value={mode}
            onChange={setMode}
            items={[
              { value: 'table', label: 'Table', icon: Table2 },
              { value: 'kanban', label: 'Kanban', icon: Columns3 },
            ]}
          />
        </div>
        {mode === 'table' && (
          <div className="chip-row orders__chips">
            <button type="button" className={`chip ${stage === 'all' ? 'is-active' : ''}`} onClick={() => setStage('all')}>
              All <span>{orders.length}</span>
            </button>
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${stage === s.id ? 'is-active' : ''}`}
                onClick={() => setStage(s.id)}
              >
                <span className="dot" style={{ background: stageColor(s.id) }} />
                {s.short} <span>{countFor(s.id)}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {mode === 'table' ? (
        <Card bodyClassName="card__body--flush">
          <OrdersTable orders={filtered} />
        </Card>
      ) : (
        <KanbanBoard orders={filtered} />
      )}
    </div>
  );
}
