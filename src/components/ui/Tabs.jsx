import './Tabs.css';

/**
 * items: [{ value, label, icon? }]
 * variant: "underline" (purple underline like the reference) | "segmented" (pill toggle)
 */
export default function Tabs({ items, value, onChange, variant = 'underline', label = 'Tabs', className = '' }) {
  return (
    <div className={`tabs tabs--${variant} ${className}`} role="tablist" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tabs__item ${active ? 'is-active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            <span className="tabs__text">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
