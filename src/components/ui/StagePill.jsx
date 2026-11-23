import { stageColor, stageLabel, stageShort } from '../../utils/stages';
import './StagePill.css';

export default function StagePill({ stage, short = false }) {
  return (
    <span className="stage-pill" style={{ '--pill': stageColor(stage) }}>
      <span className="stage-pill__dot" />
      {short ? stageShort(stage) : stageLabel(stage)}
    </span>
  );
}
