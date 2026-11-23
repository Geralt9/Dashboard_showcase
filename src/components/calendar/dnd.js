// Native HTML5 drag & drop helpers for calendar events and the unscheduled tray.
const MIME = 'application/x-printflow-event';

/** payload: { orderId, type } where type is "print" | "finish" | "garments" | "art" */
export function startDrag(e, payload) {
  e.dataTransfer.setData(MIME, JSON.stringify(payload));
  e.dataTransfer.setData('text/plain', payload.orderId);
  e.dataTransfer.effectAllowed = 'move';
}

export function isEventDrag(e) {
  return Array.from(e.dataTransfer.types || []).includes(MIME);
}

export function readDrag(e) {
  try {
    return JSON.parse(e.dataTransfer.getData(MIME));
  } catch {
    return null;
  }
}

/** Spread onto any element that should accept drops. */
export function dropTarget(onDropPayload, setOver) {
  return {
    onDragOver: (e) => {
      if (!isEventDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOver?.(true);
    },
    onDragLeave: () => setOver?.(false),
    onDrop: (e) => {
      setOver?.(false);
      const payload = readDrag(e);
      if (!payload) return;
      e.preventDefault();
      onDropPayload(payload, e);
    },
  };
}
