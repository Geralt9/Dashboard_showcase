import { useEffect } from 'react';
import './Drawer.css';

/** Right-hand slide-in panel. Closes on Escape and overlay click. */
export default function Drawer({ open, onClose, label, children, width = 600 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={label} style={{ maxWidth: width }}>
        {children}
      </aside>
    </div>
  );
}
