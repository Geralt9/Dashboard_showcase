import { useState } from 'react';
import { Check, PencilLine, FileImage, ImageOff } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import { fmtDateTime, fmtShort } from '../utils/dates';
import { isAtOrPast } from '../utils/stages';
import { itemsSummary } from '../utils/orders';
import Button from '../components/ui/Button';
import StagePill from '../components/ui/StagePill';
import Tabs from '../components/ui/Tabs';
import './ArtApprovals.css';

function ArtCard({ order }) {
  const { actions } = useOrders();
  const { toast, openOrder } = useUI();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const { artwork } = order;
  const last = artwork.revisions[artwork.revisions.length - 1];

  return (
    <article className="art-card">
      <button type="button" className="art-card__thumb" onClick={() => openOrder(order.id)} aria-label={`Open ${order.id}`}>
        {artwork.thumbnailUrl ? <img src={artwork.thumbnailUrl} alt="" /> : <ImageOff size={28} aria-hidden="true" />}
      </button>
      <div className="art-card__body">
        <div className="art-card__top">
          <strong>{order.customer.company}</strong>
          <StagePill stage={order.stage} short />
        </div>
        <p className="muted art-card__meta">
          {order.id} · {itemsSummary(order)} · approve by {fmtShort(order.dates.artApprovalDue)}
        </p>
        {artwork.fileName && (
          <p className="art-card__file">
            <FileImage size={13} aria-hidden="true" /> {artwork.fileName}
          </p>
        )}
        {artwork.status === 'needs-edit' && last && (
          <p className="art-card__revision">
            <strong>Waiting on edit</strong> ({fmtDateTime(last.date)}): {last.note}
          </p>
        )}

        {artwork.status === 'approved' ? (
          <span className="tag tag--success">
            <Check size={11} aria-hidden="true" /> Approved
          </span>
        ) : editing ? (
          <form
            className="art-card__edit"
            onSubmit={(e) => {
              e.preventDefault();
              actions.requestArtEdit(order.id, note.trim());
              toast(`Edit requested for ${order.id}`, 'info');
              setEditing(false);
              setNote('');
            }}
          >
            <textarea className="textarea" placeholder="What needs to change?" value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
            <div className="art-card__actions">
              <Button size="sm" variant="dark" type="submit" disabled={!note.trim()}>
                Send
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="art-card__actions">
            <Button
              size="sm"
              variant="dark"
              icon={Check}
              disabled={!artwork.fileName}
              onClick={() => {
                actions.approveArt(order.id);
                toast(`Artwork approved for ${order.id}`);
              }}
            >
              Approve
            </Button>
            <Button size="sm" icon={PencilLine} disabled={!artwork.fileName} onClick={() => setEditing(true)}>
              Request edit
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ArtApprovals() {
  const { orders } = useOrders();
  const [tab, setTab] = useState('review');

  const awaiting = orders.filter((o) => o.artwork.status !== 'approved' && !isAtOrPast(o.stage, 'art-approved'));
  const withArt = awaiting.filter((o) => o.artwork.fileName);
  const noArt = awaiting.filter((o) => !o.artwork.fileName);
  const approved = orders
    .filter((o) => o.artwork.status === 'approved' && o.stage !== 'completed')
    .sort((a, b) => (a.dates.printDate || '9').localeCompare(b.dates.printDate || '9'));

  const list = tab === 'review' ? withArt : tab === 'missing' ? noArt : approved;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Art Approvals</h2>
          <p>Review customer artwork before garments are ordered.</p>
        </div>
        <Tabs
          variant="segmented"
          label="Artwork filter"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'review', label: `Awaiting review (${withArt.length})` },
            { value: 'missing', label: `No art yet (${noArt.length})` },
            { value: 'approved', label: `Approved (${approved.length})` },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <p className="empty-state">Nothing here, all caught up.</p>
      ) : (
        <div className="art-grid">
          {list.map((o) => (
            <ArtCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
