// The 9-step production pipeline. Order matters: index = progress.
export const STAGES = [
  { id: 'request-received', label: 'Request received', short: 'Request' },
  { id: 'art-received', label: 'Art received', short: 'Art in' },
  { id: 'art-review', label: 'Art review / editing', short: 'Art review' },
  { id: 'art-approved', label: 'Art approved', short: 'Approved' },
  { id: 'garments-ordered', label: 'Garments ordered', short: 'Garments' },
  { id: 'print-scheduled', label: 'Print scheduled', short: 'Scheduled' },
  { id: 'printing', label: 'Printing', short: 'Printing' },
  { id: 'ready', label: 'Ready', short: 'Ready' },
  { id: 'completed', label: 'Completed', short: 'Done' },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

export function stageIndex(stageId) {
  return STAGE_IDS.indexOf(stageId);
}

export function stageLabel(stageId) {
  return STAGES.find((s) => s.id === stageId)?.label ?? stageId;
}

export function stageShort(stageId) {
  return STAGES.find((s) => s.id === stageId)?.short ?? stageId;
}

export function nextStageId(stageId) {
  const i = stageIndex(stageId);
  return i >= 0 && i < STAGES.length - 1 ? STAGE_IDS[i + 1] : null;
}

/** CSS color for a stage, e.g. var(--stage-printing) */
export function stageColor(stageId) {
  return `var(--stage-${stageId})`;
}

/** 0–1: how far the order is through the pipeline. */
export function stageProgress(stageId) {
  return (stageIndex(stageId) + 1) / STAGES.length;
}

/** True when `stageId` is at or past `targetId`. */
export function isAtOrPast(stageId, targetId) {
  return stageIndex(stageId) >= stageIndex(targetId);
}
