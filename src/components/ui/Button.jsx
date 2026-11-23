import './Button.css';

/**
 * variant: "primary" (teal) | "dark" | "secondary" (outlined) | "ghost" | "danger"
 * size: "sm" | "md"
 * icon: a lucide icon component
 */
export default function Button({ variant = 'secondary', size = 'md', icon: Icon, children, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn--${variant} btn--${size} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = '', size = 16, ...props }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
