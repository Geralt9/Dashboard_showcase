import { useState } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { ASSIGNEES, GARMENTS, PRINT_METHODS } from '../../config';
import { estimateHours } from '../../utils/orders';
import { toDate, toDateKey, toDateTimeKey } from '../../utils/dates';
import Modal from '../ui/Modal';
import Button, { IconButton } from '../ui/Button';
import Tabs from '../ui/Tabs';
import './NewOrderModal.css';

const SIZED = ['S', 'M', 'L', 'XL', '2XL'];
const ONE_SIZE = ['Hat', 'Tote bag'];

function emptyItem() {
  return { garment: 'T-shirt', brand: 'Gildan 5000', color: 'Black', method: 'Screen print', printLocation: 'Front', sizes: { S: 0, M: 0, L: 0, XL: 0, '2XL': 0 }, qty: 0 };
}

function initialForm(defaults) {
  const printDay = defaults.printDay ? toDate(defaults.printDay) : addDays(new Date(), 10);
  return {
    name: '',
    company: '',
    email: '',
    phone: '',
    items: [emptyItem()],
    artApprovalDue: toDateKey(subDays(printDay, 4)),
    garmentsEta: toDateKey(subDays(printDay, 2)),
    printDate: defaults.printDay ? `${defaults.printDay}T09:00` : '',
    finishDate: toDateKey(addDays(printDay, 2)),
    fulfillment: 'pickup',
    priority: 'normal',
    assignee: ASSIGNEES[0],
    notes: '',
  };
}

function nextOrderId(orders) {
  const max = Math.max(1000, ...orders.map((o) => Number(o.id.replace(/\D/g, '')) || 0));
  return `ORD-${max + 1}`;
}

/** Turn a form item into the stored item shape. */
function toItem(it) {
  const sizes = ONE_SIZE.includes(it.garment)
    ? { OS: Number(it.qty) || 0 }
    : Object.fromEntries(Object.entries(it.sizes).filter(([, n]) => Number(n) > 0).map(([s, n]) => [s, Number(n)]));
  return { garment: it.garment, brand: it.brand, color: it.color, sizes, printLocation: it.printLocation, method: it.method };
}

function NewOrderForm({ defaults, onClose }) {
  const { orders, actions, settings } = useOrders();
  const { toast, openOrder } = useUI();
  const [form, setForm] = useState(() => initialForm(defaults));
  const [error, setError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setItem = (i, patch) => set({ items: form.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });

  const submit = (e) => {
    e.preventDefault();
    const items = form.items.map(toItem);
    const qty = items.reduce((s, it) => s + Object.values(it.sizes).reduce((a, b) => a + b, 0), 0);
    if (!form.company.trim() && !form.name.trim()) return setError('Add a customer name or company.');
    if (qty <= 0) return setError('Add at least one piece to the order.');
    if (!form.finishDate) return setError('Set a finish date.');

    const id = nextOrderId(orders);
    const now = toDateTimeKey(new Date());
    actions.addOrder({
      id,
      customer: {
        name: form.name.trim() || form.company.trim(),
        company: form.company.trim() || form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      items,
      artwork: { fileName: null, thumbnailUrl: null, status: 'pending', notes: '', revisions: [] },
      stage: 'request-received',
      stageHistory: [{ stage: 'request-received', date: now, by: settings.userName }],
      dates: {
        requested: format(new Date(), 'yyyy-MM-dd'),
        artApprovalDue: form.artApprovalDue || null,
        garmentsEta: form.garmentsEta || null,
        printDate: form.printDate || null,
        finishDate: form.finishDate,
      },
      estimatedHours: estimateHours(items),
      garmentOrder: null,
      fulfillment: form.fulfillment,
      priority: form.priority,
      assignee: form.assignee,
      notes: form.notes,
    });
    toast(`Order ${id} created`);
    onClose();
    openOrder(id);
  };

  return (
    <Modal
      title="New order"
      width={720}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-order-form">
            Create order
          </Button>
        </>
      }
    >
      <form id="new-order-form" className="no-form" onSubmit={submit}>
        <fieldset>
          <legend>Customer</legend>
          <div className="no-grid">
            <label className="field">
              <span>Company / group</span>
              <input className="input" value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Café Atlas" autoFocus />
            </label>
            <label className="field">
              <span>Contact name</span>
              <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Camille Laurent" />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="(555) 000-0000" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Items</legend>
          {form.items.map((it, i) => (
            <div key={i} className="no-item">
              <div className="no-item__row">
                <label className="field">
                  <span>Garment</span>
                  <select className="select" value={it.garment} onChange={(e) => setItem(i, { garment: e.target.value })}>
                    {GARMENTS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Brand / style</span>
                  <input className="input" value={it.brand} onChange={(e) => setItem(i, { brand: e.target.value })} />
                </label>
                <label className="field">
                  <span>Color</span>
                  <input className="input" value={it.color} onChange={(e) => setItem(i, { color: e.target.value })} />
                </label>
                <label className="field">
                  <span>Method</span>
                  <select className="select" value={it.method} onChange={(e) => setItem(i, { method: e.target.value })}>
                    {PRINT_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Location</span>
                  <input className="input" value={it.printLocation} onChange={(e) => setItem(i, { printLocation: e.target.value })} />
                </label>
              </div>
              <div className="no-item__sizes">
                {ONE_SIZE.includes(it.garment) ? (
                  <label className="field">
                    <span>Qty</span>
                    <input className="input" type="number" min="0" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
                  </label>
                ) : (
                  SIZED.map((s) => (
                    <label key={s} className="field">
                      <span>{s}</span>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={it.sizes[s]}
                        onChange={(e) => setItem(i, { sizes: { ...it.sizes, [s]: e.target.value } })}
                      />
                    </label>
                  ))
                )}
                {form.items.length > 1 && (
                  <IconButton icon={Trash2} label="Remove item" onClick={() => set({ items: form.items.filter((_, idx) => idx !== i) })} />
                )}
              </div>
            </div>
          ))}
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => set({ items: [...form.items, emptyItem()] })}>
            Add another item
          </Button>
        </fieldset>

        <fieldset>
          <legend>Schedule</legend>
          <div className="no-grid no-grid--4">
            <label className="field">
              <span>Art approval due</span>
              <input className="input" type="date" value={form.artApprovalDue} onChange={(e) => set({ artApprovalDue: e.target.value })} />
            </label>
            <label className="field">
              <span>Garments ETA</span>
              <input className="input" type="date" value={form.garmentsEta} onChange={(e) => set({ garmentsEta: e.target.value })} />
            </label>
            <label className="field">
              <span>Print date (optional)</span>
              <input className="input" type="datetime-local" value={form.printDate} onChange={(e) => set({ printDate: e.target.value })} />
            </label>
            <label className="field">
              <span>Finish date</span>
              <input className="input" type="date" value={form.finishDate} onChange={(e) => set({ finishDate: e.target.value })} required />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Details</legend>
          <div className="no-grid no-grid--3">
            <div className="field">
              <span>Fulfillment</span>
              <Tabs
                variant="segmented"
                label="Fulfillment"
                value={form.fulfillment}
                onChange={(v) => set({ fulfillment: v })}
                items={[
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'shipping', label: 'Shipping' },
                ]}
              />
            </div>
            <label className="field">
              <span>Assignee</span>
              <select className="select" value={form.assignee} onChange={(e) => set({ assignee: e.target.value })}>
                {ASSIGNEES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Priority</span>
              <label className="checkbox no-rush">
                <input type="checkbox" checked={form.priority === 'rush'} onChange={(e) => set({ priority: e.target.checked ? 'rush' : 'normal' })} />
                Rush order
              </label>
            </div>
          </div>
          <label className="field">
            <span>Internal notes</span>
            <textarea className="textarea" value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Anything the team should know" />
          </label>
        </fieldset>

        {error && (
          <p className="no-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

/** Mounted once in the layout; opened with `useUI().openNewOrder({ printDay? })`. */
export default function NewOrderModal() {
  const { newOrder, closeNewOrder } = useUI();
  if (!newOrder) return null;
  return <NewOrderForm defaults={newOrder} onClose={closeNewOrder} />;
}
