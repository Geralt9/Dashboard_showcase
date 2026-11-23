import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { subDays } from 'date-fns';
import { DEFAULT_SETTINGS } from '../config';
import { generateActivity, generateOrders } from '../data/mockData';
import { STAGE_IDS, isAtOrPast, nextStageId, stageIndex, stageLabel } from '../utils/stages';
import { fmtShort, toDateKey, toDateTimeKey } from '../utils/dates';

const STORAGE_KEY = 'printflow-demo-state-v1';
const OrdersContext = createContext(null);

/* ---------- initial state ---------- */

export function createInitialState() {
  const orders = generateOrders();
  return {
    orders,
    activity: generateActivity(orders),
    settings: { ...DEFAULT_SETTINGS },
    // Pretend the user last checked notifications yesterday morning, so a few show as new.
    notificationsReadAt: toDateTimeKey(subDays(new Date(new Date().setHours(9, 0, 0, 0)), 1)),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.orders)) {
        return { ...createInitialState(), ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
      }
    }
  } catch {
    // Storage unavailable or corrupted: fall back to fresh demo data.
  }
  return createInitialState();
}

/* ---------- reducer helpers ---------- */

const nowIso = () => toDateTimeKey(new Date());
let activitySeq = 0;

function log(state, entry) {
  activitySeq += 1;
  const item = { id: `act-${Date.now()}-${activitySeq}`, date: nowIso(), ...entry };
  return { ...state, activity: [item, ...state.activity].slice(0, 200) };
}

function patchOrder(state, id, updater) {
  return { ...state, orders: state.orders.map((o) => (o.id === id ? updater(o) : o)) };
}

/** Move an order to a stage, keeping related fields consistent. */
function applyStage(order, stage, by) {
  if (order.stage === stage) return order;
  const next = {
    ...order,
    stage,
    stageHistory: [...order.stageHistory, { stage, date: nowIso(), by }],
  };
  // Reaching "art approved" (or later) implies the artwork is final.
  if (isAtOrPast(stage, 'art-approved') && order.artwork.status !== 'approved') {
    next.artwork = { ...order.artwork, status: 'approved' };
  }
  // Reaching "garments ordered" creates a supplier order if there isn't one.
  if (isAtOrPast(stage, 'garments-ordered') && !order.garmentOrder) {
    next.garmentOrder = {
      po: `PO-${Math.floor(6000 + Math.random() * 3000)}`,
      supplier: 'SanMar',
      orderedOn: toDateKey(new Date()),
      status: 'ordered',
      receivedOn: null,
    };
  }
  // Printing can only start with garments in hand.
  if (isAtOrPast(stage, 'printing') && next.garmentOrder && next.garmentOrder.status !== 'received') {
    next.garmentOrder = { ...next.garmentOrder, status: 'received', receivedOn: toDateKey(new Date()) };
  }
  return next;
}

const DATE_LABELS = {
  requested: 'Request date',
  artApprovalDue: 'Art approval due',
  garmentsEta: 'Garments ETA',
  printDate: 'Print date',
  finishDate: 'Finish date',
};

/* ---------- reducer ---------- */

function reducer(state, action) {
  const by = state.settings.userName;
  const find = (id) => state.orders.find((o) => o.id === id);

  switch (action.type) {
    case 'SET_STAGE': {
      const order = find(action.id);
      if (!order || order.stage === action.stage || !STAGE_IDS.includes(action.stage)) return state;
      const next = patchOrder(state, action.id, (o) => applyStage(o, action.stage, by));
      return log(next, {
        type: action.stage === 'completed' ? 'completed' : 'stage',
        orderId: action.id,
        message: `${action.id} moved to ${stageLabel(action.stage)}`,
      });
    }

    case 'NEXT_STAGE': {
      const order = find(action.id);
      const stage = order && nextStageId(order.stage);
      return stage ? reducer(state, { type: 'SET_STAGE', id: action.id, stage }) : state;
    }

    case 'UPDATE_DATES': {
      const order = find(action.id);
      if (!order) return state;
      let next = patchOrder(state, action.id, (o) => {
        let updated = { ...o, dates: { ...o.dates, ...action.dates } };
        // Giving a print date to an order whose garments are ordered schedules it.
        if (action.dates.printDate && o.stage === 'garments-ordered') {
          updated = applyStage(updated, 'print-scheduled', by);
        }
        return updated;
      });
      for (const [field, value] of Object.entries(action.dates)) {
        if (order.dates[field] === value) continue;
        next = log(next, {
          type: 'date-change',
          orderId: action.id,
          message: `${DATE_LABELS[field] || field} for ${action.id} set to ${value ? fmtShort(value) : '—'}`,
        });
      }
      return next;
    }

    case 'UPDATE_ORDER':
      return patchOrder(state, action.id, (o) => ({ ...o, ...action.patch }));

    case 'APPROVE_ART': {
      const order = find(action.id);
      if (!order) return state;
      const next = patchOrder(state, action.id, (o) => {
        const updated = { ...o, artwork: { ...o.artwork, status: 'approved' } };
        return stageIndex(o.stage) < stageIndex('art-approved') ? applyStage(updated, 'art-approved', by) : updated;
      });
      return log(next, {
        type: 'art-approved',
        orderId: action.id,
        message: `Artwork approved for ${action.id} (${order.customer.company})`,
      });
    }

    case 'REQUEST_ART_EDIT': {
      const order = find(action.id);
      if (!order) return state;
      const revision = { date: nowIso(), note: action.note || 'Edits requested.', by };
      const next = patchOrder(state, action.id, (o) => {
        const updated = {
          ...o,
          artwork: { ...o.artwork, status: 'needs-edit', revisions: [...o.artwork.revisions, revision] },
        };
        return applyStage(updated, 'art-review', by);
      });
      return log(next, {
        type: 'art-edit',
        orderId: action.id,
        message: `Edit requested on ${action.id} artwork: “${revision.note}”`,
      });
    }

    case 'ADD_ORDER': {
      const next = { ...state, orders: [action.order, ...state.orders] };
      return log(next, {
        type: 'order-created',
        orderId: action.order.id,
        message: `New order ${action.order.id} from ${action.order.customer.company || action.order.customer.name}`,
      });
    }

    case 'SET_GARMENT_STATUS': {
      const order = find(action.id);
      if (!order?.garmentOrder) return state;
      const received = action.status === 'received';
      const next = patchOrder(state, action.id, (o) => ({
        ...o,
        garmentOrder: {
          ...o.garmentOrder,
          status: action.status,
          receivedOn: received ? toDateKey(new Date()) : o.garmentOrder.receivedOn,
        },
      }));
      return log(next, {
        type: received ? 'garments-arrived' : 'garments-shipped',
        orderId: action.id,
        message: received
          ? `Garments arrived from ${order.garmentOrder.supplier} for ${action.id}`
          : `${order.garmentOrder.supplier} shipped garments for ${action.id}`,
      });
    }

    case 'NOTIFY_CUSTOMER': {
      const order = find(action.id);
      if (!order) return state;
      const what = action.kind === 'finish' ? (order.fulfillment === 'shipping' ? 'ship date' : 'pickup date') : 'print date';
      const value = action.kind === 'finish' ? order.dates.finishDate : order.dates.printDate;
      return log(state, {
        type: 'notify',
        orderId: action.id,
        message: `Customer notified: ${what} ${fmtShort(value)} (${order.customer.email})`,
      });
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notificationsReadAt: nowIso() };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

/* ---------- provider ---------- */

export function OrdersProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / privacy-mode errors; the demo still works in memory.
    }
  }, [state]);

  const actions = useMemo(
    () => ({
      setStage: (id, stage) => dispatch({ type: 'SET_STAGE', id, stage }),
      nextStage: (id) => dispatch({ type: 'NEXT_STAGE', id }),
      updateDates: (id, dates) => dispatch({ type: 'UPDATE_DATES', id, dates }),
      updateOrder: (id, patch) => dispatch({ type: 'UPDATE_ORDER', id, patch }),
      approveArt: (id) => dispatch({ type: 'APPROVE_ART', id }),
      requestArtEdit: (id, note) => dispatch({ type: 'REQUEST_ART_EDIT', id, note }),
      addOrder: (order) => dispatch({ type: 'ADD_ORDER', order }),
      setGarmentStatus: (id, status) => dispatch({ type: 'SET_GARMENT_STATUS', id, status }),
      notifyCustomer: (id, kind) => dispatch({ type: 'NOTIFY_CUSTOMER', id, kind }),
      updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', settings }),
      markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
      resetDemo: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, actions }), [state, actions]);
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>');
  return ctx;
}

export function useOrder(id) {
  const { orders } = useOrders();
  return orders.find((o) => o.id === id) || null;
}
