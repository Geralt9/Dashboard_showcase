import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../config';
import { useOrders } from '../context/OrdersContext';
import { useUI } from '../context/UIContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import './Settings.css';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function Settings() {
  const { settings, actions } = useOrders();
  const { toast, confirm } = useUI();
  const [form, setForm] = useState(settings);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = (e) => {
    e.preventDefault();
    if (Number(form.workEnd) <= Number(form.workStart)) {
      toast('Working hours: the end must be after the start.', 'warning');
      return;
    }
    actions.updateSettings({
      shopName: form.shopName.trim() || settings.shopName,
      userName: form.userName.trim() || settings.userName,
      dailyCapacity: Math.max(1, Number(form.dailyCapacity) || settings.dailyCapacity),
      workingDays: Math.min(7, Math.max(1, Number(form.workingDays) || settings.workingDays)),
      workStart: Number(form.workStart),
      workEnd: Number(form.workEnd),
    });
    toast('Settings saved');
  };

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset demo data?',
      message: 'This replaces every order, activity entry and setting with fresh mock data. Changes you made will be lost.',
      confirmLabel: 'Reset data',
      tone: 'danger',
    });
    if (!ok) return;
    actions.resetDemo();
    toast('Demo data reset', 'info');
    setForm({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="page settings">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Shop details, production capacity and demo data.</p>
        </div>
      </div>

      <form onSubmit={save} className="settings__grid">
        <Card title="Shop">
          <div className="settings__fields">
            <label className="field">
              <span>Shop name</span>
              <input className="input" value={form.shopName} onChange={(e) => set({ shopName: e.target.value })} />
            </label>
            <label className="field">
              <span>Your name (welcome message)</span>
              <input className="input" value={form.userName} onChange={(e) => set({ userName: e.target.value })} />
            </label>
          </div>
        </Card>

        <Card title="Production capacity">
          <div className="settings__fields">
            <label className="field">
              <span>Daily print capacity (prints / day)</span>
              <input className="input" type="number" min="1" value={form.dailyCapacity} onChange={(e) => set({ dailyCapacity: e.target.value })} />
            </label>
            <label className="field">
              <span>Working days per week</span>
              <input className="input" type="number" min="1" max="7" value={form.workingDays} onChange={(e) => set({ workingDays: e.target.value })} />
            </label>
            <div className="settings__row">
              <label className="field">
                <span>Day starts</span>
                <select className="select" value={form.workStart} onChange={(e) => set({ workStart: e.target.value })}>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Day ends</span>
                <select className="select" value={form.workEnd} onChange={(e) => set({ workEnd: e.target.value })}>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted settings__hint">
              Weekly capacity: {(Number(form.dailyCapacity) || 0) * (Number(form.workingDays) || 0)} prints. Calendar day headers
              turn amber above 80% and red above 100%.
            </p>
          </div>
        </Card>

        <div className="settings__save">
          <Button variant="primary" type="submit" icon={Save}>
            Save settings
          </Button>
        </div>
      </form>

      <Card title="Demo data" className="settings__danger">
        <div className="settings__danger-body">
          <p className="muted">
            All data lives in your browser (localStorage). Reset to regenerate around 28 mock orders dated around today.
          </p>
          <Button variant="danger" icon={RotateCcw} onClick={reset}>
            Reset demo data
          </Button>
        </div>
      </Card>
    </div>
  );
}
