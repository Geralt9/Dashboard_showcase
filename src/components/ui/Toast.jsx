import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import './Toast.css';

const ICONS = { success: CheckCircle2, warning: AlertTriangle, info: Info, danger: AlertTriangle };

/** Renders the toast stack (bottom-right). Use `useUI().toast(message, tone)` to show one. */
export default function ToastStack() {
  const { toasts, dismissToast } = useUI();
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone] || Info;
        return (
          <div key={t.id} className={`toast toast--${t.tone}`} role="status">
            <Icon size={18} aria-hidden="true" />
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
