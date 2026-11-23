import { useState } from 'react';
import {
  X,
  Zap,
  Truck,
  Store,
  ArrowRight,
  Check,
  PencilLine,
  Send,
  Mail,
  Phone,
  FileImage,
  History,
  EyeOff,
} from 'lucide-react';
import { useOrders, useOrder } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { ASSIGNEES, SIZE_ORDER } from '../../config';
import { STAGES, nextStageId, stageLabel } from '../../utils/stages';
import { itemQty, totalQty, isOverdue, daysLate } from '../../utils/orders';
import { fmtDateTime, fmtShort } from '../../utils/dates';
import Drawer from '../ui/Drawer';
import Button, { IconButton } from '../ui/Button';
import StagePill from '../ui/StagePill';
import StageStepper from './StageStepper';
import { useReschedule } from '../calendar/useReschedule';
import './OrderDrawer.css';

const ART_STATUS = {
  pending: { label: 'Pending review', tone: 'neutral' },
  'needs-edit': { label: 'Needs edit', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
};

const DATE_FIELDS = [
  { field: 'artApprovalDue', label: 'Art approval due', type: 'art' },
  { field: 'garmentsEta', label: 'Garments ETA', type: 'garments' },
  { field: 'printDate', label: 'Print date', type: 'print', notify: 'print' },
  { field: 'finishDate', label: 'Finish date', type: 'finish', notify: 'finish' },
];

function Section({ title, children, aside }) {
  return (
    <section className="od-section">
      <header>
        <h4>{title}</h4>
        {aside}
      </header>
      {children}
    </section>
  );
}

function ArtworkPanel({ order }) {
  const { actions } = useOrders();
  const { toast } = useUI();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const { artwork } = order;
  const status = ART_STATUS[artwork.status] || ART_STATUS.pending;

  if (!artwork.fileName) {
    return <p className="muted od-empty">No artwork uploaded yet. The customer will upload it from their request link.</p>;
  }

  return (
    <div className="od-art">
      <img src={artwork.thumbnailUrl} alt={`Artwork preview for ${order.id}`} className="od-art__thumb" />
      <div className="od-art__info">
        <div className="od-art__file">
          <FileImage size={14} aria-hidden="true" /> {artwork.fileName}
        </div>
        <span className={`tag tag--${status.tone}`}>{status.label}</span>
        {artwork.notes && <p className="muted od-art__notes">{artwork.notes}</p>}

        {artwork.status !== 'approved' && !editing && (
          <div className="od-art__actions">
            <Button
              size="sm"
              variant="dark"
              icon={Check}
              onClick={() => {
                actions.approveArt(order.id);
                toast(`Artwork approved for ${order.id}`);
              }}
            >
              Approve
            </Button>
            <Button size="sm" icon={PencilLine} onClick={() => setEditing(true)}>
              Request edit
            </Button>
          </div>
        )}
        {artwork.status === 'approved' && !editing && (
          <button type="button" className="od-link" onClick={() => setEditing(true)}>
            Request another revision
          </button>
        )}
        {editing && (
          <form
            className="od-art__edit"
            onSubmit={(e) => {
              e.preventDefault();
              actions.requestArtEdit(order.id, note.trim());
              toast(`Edit requested for ${order.id}`, 'info');
              setNote('');
              setEditing(false);
            }}
          >
            <textarea
              className="textarea"
              placeholder="What needs to change? (sent to the designer / customer)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <div className="od-art__actions">
              <Button size="sm" variant="dark" type="submit" disabled={!note.trim()}>
                Send request
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {artwork.revisions.length > 0 && (
          <ul className="od-revisions">
            {artwork.revisions.map((r, i) => (
              <li key={i}>
                <strong>Rev {i + 1}</strong> · {fmtDateTime(r.date)} · {r.by}
                <p>{r.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ItemsTable({ order }) {
  const sizes = SIZE_ORDER.filter((s) => order.items.some((it) => it.sizes[s]));
  return (
    <div className="table-wrap od-items">
      <table className="table">
        <thead>
          <tr>
            <th>Garment</th>
            {sizes.map((s) => (
              <th key={s} className="num">
                {s}
              </th>
            ))}
            <th className="num">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>
                <span className="cell-strong">{item.garment}</span>
                <span className="cell-sub">
                  {item.brand} · {item.color}
                </span>
                <span className="cell-sub">
                  {item.method} · {item.printLocation}
                </span>
              </td>
              {sizes.map((s) => (
                <td key={s} className="num">
                  {item.sizes[s] || '–'}
                </td>
              ))}
              <td className="num cell-strong">{itemQty(item)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={sizes.length + 1}>Total</td>
            <td className="num">{totalQty(order)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function DatesPanel({ order }) {
  const { actions } = useOrders();
  const { toast } = useUI();
  const reschedule = useReschedule();

  const onChange = (f, value) => {
    if (!value) {
      actions.updateDates(order.id, { [f.field]: null });
      return;
    }
    if (f.type === 'print') {
      const [day, time] = value.split('T');
      reschedule(order.id, 'print', day, time);
    } else {
      reschedule(order.id, f.type, value);
    }
  };

  return (
    <div className="od-dates">
      {DATE_FIELDS.map((f) => {
        const value = order.dates[f.field] || '';
        return (
          <div key={f.field} className="od-dates__row">
            <label className="field">
              <span>{f.label}</span>
              <input
                className="input"
                type={f.type === 'print' ? 'datetime-local' : 'date'}
                value={value}
                onChange={(e) => onChange(f, e.target.value)}
              />
            </label>
            {f.notify && (
              <Button
                size="sm"
                icon={Send}
                disabled={!value}
                onClick={() => {
                  actions.notifyCustomer(order.id, f.notify);
                  const what = f.notify === 'print' ? 'print date' : order.fulfillment === 'shipping' ? 'ship date' : 'pickup date';
                  toast(`Customer notified: ${what} ${fmtShort(value)}`);
                }}
              >
                Notify customer
              </Button>
            )}
          </div>
        );
      })}
      <p className="muted od-dates__requested">Requested on {fmtShort(order.dates.requested)} · est. print time {order.estimatedHours} h</p>
    </div>
  );
}

function ActivityLog({ order }) {
  const { activity } = useOrders();
  const entries = activity.filter((a) => a.orderId === order.id).slice(0, 8);
  const history = [...order.stageHistory].reverse();
  return (
    <div className="od-log">
      <div>
        <h5>Activity</h5>
        {entries.length === 0 && <p className="muted">No activity yet.</p>}
        <ul>
          {entries.map((a) => (
            <li key={a.id}>
              <span>{a.message}</span>
              <time>{fmtDateTime(a.date)}</time>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h5>
          <History size={12} aria-hidden="true" /> Stage history
        </h5>
        <ul>
          {history.map((h, i) => (
            <li key={`${h.stage}-${i}`}>
              <span>
                {stageLabel(h.stage)} <em>by {h.by}</em>
              </span>
              <time>{fmtDateTime(h.date)}</time>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DrawerContent({ order }) {
  const { actions } = useOrders();
  const { closeOrder, toast, isCustomerView } = useUI();
  const next = nextStageId(order.stage);
  const overdue = isOverdue(order);

  const setStage = (stage) => {
    if (stage === order.stage) return;
    actions.setStage(order.id, stage);
    toast(`${order.id} moved to ${stageLabel(stage)}`);
  };

  return (
    <>
      <header className="od-header">
        <div className="od-header__top">
          <h2>{order.id}</h2>
          {order.priority === 'rush' && (
            <span className="tag tag--warning">
              <Zap size={11} aria-hidden="true" /> Rush
            </span>
          )}
          <span className="tag tag--neutral">
            {order.fulfillment === 'shipping' ? <Truck size={11} aria-hidden="true" /> : <Store size={11} aria-hidden="true" />}
            {order.fulfillment === 'shipping' ? 'Shipping' : 'Pickup'}
          </span>
          {overdue && <span className="tag tag--danger">{daysLate(order)}d late</span>}
          <IconButton icon={X} label="Close" onClick={closeOrder} className="od-header__close" />
        </div>
        <p className="od-header__customer">
          <strong>{order.customer.company}</strong> · {order.customer.name}
        </p>
        <p className="od-header__contact">
          <a href={`mailto:${order.customer.email}`}>
            <Mail size={12} aria-hidden="true" /> {order.customer.email}
          </a>
          <span>
            <Phone size={12} aria-hidden="true" /> {order.customer.phone}
          </span>
        </p>
      </header>

      <div className="od-body">
        <Section title="Production stage" aside={<StagePill stage={order.stage} />}>
          <StageStepper stage={order.stage} onSelect={setStage} />
          <div className="od-stage-actions">
            <Button variant="dark" icon={ArrowRight} disabled={!next} onClick={() => next && setStage(next)}>
              {next ? `Move to ${stageLabel(next)}` : 'Order completed'}
            </Button>
            <label className="od-stage-select">
              <span className="visually-hidden">Set stage</span>
              <select className="select" value={order.stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {i + 1}. {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        <Section title="Artwork">
          <ArtworkPanel key={order.id} order={order} />
        </Section>

        <Section title="Items" aside={<span className="muted">{totalQty(order)} pcs</span>}>
          <ItemsTable order={order} />
        </Section>

        <Section title="Dates">
          <DatesPanel order={order} />
        </Section>

        {!isCustomerView ? (
          <Section title="Internal">
            <div className="od-internal">
              <label className="field">
                <span>Assignee</span>
                <select
                  className="select"
                  value={order.assignee}
                  onChange={(e) => actions.updateOrder(order.id, { assignee: e.target.value })}
                >
                  {ASSIGNEES.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Priority</span>
                <select
                  className="select"
                  value={order.priority}
                  onChange={(e) => actions.updateOrder(order.id, { priority: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="rush">Rush</option>
                </select>
              </label>
              <label className="field od-internal__notes">
                <span>Internal notes</span>
                <textarea
                  className="textarea"
                  key={order.id}
                  defaultValue={order.notes}
                  placeholder="Only visible to the shop team"
                  onBlur={(e) => e.target.value !== order.notes && actions.updateOrder(order.id, { notes: e.target.value })}
                />
              </label>
            </div>
          </Section>
        ) : (
          <p className="od-customer-note">
            <EyeOff size={14} aria-hidden="true" /> Customer view: internal notes and assignment are hidden.
          </p>
        )}

        <Section title="Activity log">
          <ActivityLog order={order} />
        </Section>
      </div>
    </>
  );
}

/** Slide-in order details. Mounted once in the layout; opened with `useUI().openOrder(id)`. */
export default function OrderDrawer() {
  const { drawerOrderId, closeOrder } = useUI();
  const order = useOrder(drawerOrderId);
  return (
    <Drawer open={Boolean(order)} onClose={closeOrder} label={order ? `Order ${order.id}` : 'Order'}>
      {order && <DrawerContent order={order} />}
    </Drawer>
  );
}
