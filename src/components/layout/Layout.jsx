import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OrderDrawer from '../orders/OrderDrawer';
import NewOrderModal from '../orders/NewOrderModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import ToastStack from '../ui/Toast';
import './Layout.css';

export default function Layout() {
  const { mobileNavOpen, setMobileNavOpen } = useUI();
  const { pathname } = useLocation();

  // Close the mobile menu after navigating.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <div className="app">
      <Sidebar />
      {mobileNavOpen && <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}
      <div className="app__main">
        <Topbar />
        <main className="app__content">
          <Outlet />
        </main>
      </div>
      <OrderDrawer />
      <NewOrderModal />
      <ConfirmDialog />
      <ToastStack />
    </div>
  );
}
