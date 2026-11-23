import { Check } from 'lucide-react';
import { STAGES, stageColor, stageIndex } from '../../utils/stages';
import './StageStepper.css';

/** Horizontal 9-step stepper. Clicking a step sets that stage (when `onSelect` is given). */
export default function StageStepper({ stage, onSelect }) {
  const current = stageIndex(stage);
  return (
    <ol className="stepper" style={{ '--current': stageColor(stage) }}>
      {STAGES.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s.id} className={`stepper__step is-${state}`}>
            <button
              type="button"
              className="stepper__dot"
              onClick={() => onSelect?.(s.id)}
              disabled={!onSelect}
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={`${s.label}${state === 'current' ? ' (current)' : ''}`}
              title={onSelect ? `Set stage: ${s.label}` : s.label}
              style={state === 'current' ? { background: stageColor(s.id) } : undefined}
            >
              {state === 'done' ? <Check size={12} strokeWidth={3} /> : i + 1}
            </button>
            <span className="stepper__label">{s.short}</span>
          </li>
        );
      })}
    </ol>
  );
}
