import { STAGES, stageIndex } from '../../utils/stages';
import { isOverdue } from '../../utils/orders';
import './PipelineBar.css';

/** Green fill = progress through the 9 stages. The remaining part turns red when overdue. */
export default function PipelineBar({ order }) {
  const step = stageIndex(order.stage) + 1;
  const pct = (step / STAGES.length) * 100;
  const late = isOverdue(order);
  const text = `Step ${step} of ${STAGES.length}${late ? ', overdue' : ''}`;
  return (
    <div className={`pipeline ${late ? 'pipeline--late' : ''}`} role="img" aria-label={text} title={text}>
      <span className="pipeline__fill" style={{ width: `${pct}%` }} />
      {pct < 100 && <span className="pipeline__rest" />}
    </div>
  );
}
