import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { STAGES, stageColor, stageLabel } from '../../utils/stages';
import { isOverdue, itemsSummary } from '../../utils/orders';
import { fmtShort } from '../../utils/dates';
import './KanbanBoard.css';

const MIME = 'application/x-printflow-order';

function Column({ stage, orders, onDropOrder }) {
  const { openOrder, isCustomerView } = useUI();
  const [over, setOver] = useState(false);

  return (
    <section
      className={`kanban__col ${over ? 'is-over' : ''}`}
      style={{ '--col': stageColor(stage.id) }}
      onDragOver={(e) => {
        if (!Array.from(e.dataTransfer.types).includes(MIME)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData(MIME);
        if (id) onDropOrder(id, stage.id);
      }}
    >
      <header className="kanban__head">
        <span className="kanban__dot" />
        <h4>{stage.label}</h4>
        <span className="kanban__count">{orders.length}</span>
      </header>
      <div className="kanban__list">
        {orders.map((order) => (
          <article
            key={order.id}
            className={`kanban__card ${isOverdue(order) ? 'is-late' : ''}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(MIME, order.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => openOrder(order.id)}
            onKeyDown={(e) => e.key === 'Enter' && openOrder(order.id)}
            tabIndex={0}
            role="button"
          >
            <div className="kanban__card-top">
              <strong>{order.id}</strong>
              {order.priority === 'rush' && <Zap size={12} className="kanban__rush" aria-label="Rush" />}
              {isOverdue(order) && <span className="tag tag--danger">Late</span>}
            </div>
            <p className="kanban__customer">{order.customer.company}</p>
            <p className="kanban__meta">{itemsSummary(order)}</p>
            <footer>
              <span>Due {fmtShort(order.dates.finishDate)}</span>
              {!isCustomerView && (
                <span className="kanban__avatar" title={order.assignee}>
                  {order.assignee[0]}
                </span>
              )}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Stage columns; drag cards between columns to change stage. */
export default function KanbanBoard({ orders }) {
  const { orders: all, actions } = useOrders();
  const { toast } = useUI();

  const move = (id, stage) => {
    const order = all.find((o) => o.id === id);
    if (!order || order.stage === stage) return;
    actions.setStage(id, stage);
    toast(`${id} moved to ${stageLabel(stage)}`);
  };

  return (
    <div className="kanban">
      {STAGES.map((stage) => (
        <Column key={stage.id} stage={stage} orders={orders.filter((o) => o.stage === stage.id)} onDropOrder={move} />
      ))}
    </div>
  );
}
