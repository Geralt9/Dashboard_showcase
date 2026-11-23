import { AlertTriangle } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import Modal from './Modal';
import Button from './Button';

/** Global confirm dialog driven by `useUI().confirm({ title, message, confirmLabel, tone })`. */
export default function ConfirmDialog() {
  const { confirmState } = useUI();
  if (!confirmState) return null;
  const { title, message, confirmLabel = 'Confirm', tone = 'warning', resolve } = confirmState;
  return (
    <Modal
      title={title}
      width={440}
      onClose={() => resolve(false)}
      footer={
        <>
          <Button onClick={() => resolve(false)}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'dark'} onClick={() => resolve(true)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle
          size={20}
          style={{ color: tone === 'danger' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 1 }}
          aria-hidden="true"
        />
        <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{message}</div>
      </div>
    </Modal>
  );
}
