import './Card.css';

/** White card with optional header (title + right-side actions). */
export default function Card({ title, actions, children, className = '', bodyClassName = '', divider = true }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className={`card__header ${divider ? 'card__header--divider' : ''}`}>
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={`card__body ${bodyClassName}`}>{children}</div>
    </section>
  );
}
