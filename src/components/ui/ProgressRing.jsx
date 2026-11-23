import './ProgressRing.css';

/** Hand-drawn SVG ring. `value` is 0–100. */
export default function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  color = 'var(--purple)',
  track = '#eceaf8',
  label,
  sublabel,
  labelSize,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          className="ring__value"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {(label || sublabel) && (
        <div className="ring__label">
          {label && <strong style={labelSize ? { fontSize: labelSize } : undefined}>{label}</strong>}
          {sublabel && <span>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
