import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// UI-only state shared across the app: order drawer, new-order modal,
// toasts, confirm dialog, shop/customer view and sidebar collapse.
const UIContext = createContext(null);

function readPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

function writePref(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function UIProvider({ children }) {
  const [drawerOrderId, setDrawerOrderId] = useState(null);
  const [newOrder, setNewOrder] = useState(null); // null = closed, {} = open with defaults
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [viewMode, setViewModeState] = useState(() => readPref('printflow-view', 'shop'));
  const [collapsed, setCollapsedState] = useState(() => readPref('printflow-collapsed', false));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toastSeq = useRef(0);

  const dismissToast = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message, tone = 'success') => {
      toastSeq.current += 1;
      const id = toastSeq.current;
      setToasts((list) => [...list.slice(-3), { id, message, tone }]);
      setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast],
  );

  /** Promise-based confirm dialog: `if (await confirm({...})) { ... }` */
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmState({
          ...options,
          resolve: (answer) => {
            setConfirmState(null);
            resolve(answer);
          },
        });
      }),
    [],
  );

  const setViewMode = useCallback((mode) => {
    setViewModeState(mode);
    writePref('printflow-view', mode);
  }, []);

  const setCollapsed = useCallback((value) => {
    setCollapsedState(value);
    writePref('printflow-collapsed', value);
  }, []);

  const value = useMemo(
    () => ({
      drawerOrderId,
      openOrder: setDrawerOrderId,
      closeOrder: () => setDrawerOrderId(null),
      newOrder,
      openNewOrder: (defaults = {}) => setNewOrder(defaults),
      closeNewOrder: () => setNewOrder(null),
      toasts,
      toast,
      dismissToast,
      confirmState,
      confirm,
      viewMode,
      setViewMode,
      isCustomerView: viewMode === 'customer',
      collapsed,
      setCollapsed,
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [drawerOrderId, newOrder, toasts, toast, dismissToast, confirmState, confirm, viewMode, setViewMode, collapsed, setCollapsed, mobileNavOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
