import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ASSIGNEES } from '../../config';
import { STAGES, stageColor } from '../../utils/stages';
import { DEFAULT_FILTERS, EVENT_TYPES, countActiveFilters } from '../../utils/events';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import './Filters.css';

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** "Filters" button + dropdown panel: stage, event type, assignee, rush only, pickup vs shipping. */
export default function Filters({ filters, onChange, size = 'md', align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = countActiveFilters(filters);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="filters" ref={ref}>
      <Button size={size} icon={SlidersHorizontal} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Filters{active > 0 && <span className="filters__count">{active}</span>}
      </Button>

      {open && (
        <div className={`filters__panel filters__panel--${align}`} role="dialog" aria-label="Calendar filters">
          <div className="filters__section">
            <h5>Stage</h5>
            <div className="chip-row">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${filters.stages.includes(s.id) ? 'is-active' : ''}`}
                  onClick={() => set({ stages: toggle(filters.stages, s.id) })}
                >
                  <span className="dot" style={{ background: stageColor(s.id) }} />
                  {s.short}
                </button>
              ))}
            </div>
          </div>

          <div className="filters__section">
            <h5>Event type</h5>
            <div className="filters__checks">
              {EVENT_TYPES.map((t) => (
                <label key={t.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(t.id)}
                    onChange={() => set({ types: toggle(filters.types, t.id) })}
                  />
                  <span className="filters__swatch" style={{ background: t.color }} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div className="filters__row">
            <label className="field">
              <span>Assignee</span>
              <select className="select" value={filters.assignee} onChange={(e) => set({ assignee: e.target.value })}>
                <option value="all">Everyone</option>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Fulfillment</span>
              <Tabs
                variant="segmented"
                label="Fulfillment"
                value={filters.fulfillment}
                onChange={(v) => set({ fulfillment: v })}
                items={[
                  { value: 'all', label: 'All' },
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'shipping', label: 'Shipping' },
                ]}
              />
            </div>
          </div>

          <label className="checkbox">
            <input type="checkbox" checked={filters.rushOnly} onChange={(e) => set({ rushOnly: e.target.checked })} />
            Rush orders only
          </label>

          <div className="filters__footer">
            <Button size="sm" variant="ghost" onClick={() => onChange(DEFAULT_FILTERS)}>
              Clear all
            </Button>
            <Button size="sm" variant="dark" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
