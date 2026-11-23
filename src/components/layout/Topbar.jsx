import { Link } from 'react-router-dom';
import { Bell, Menu as MenuIcon, Plus, Store, UserRound } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { buildNotifications, countUnread } from '../../utils/notifications';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import './Topbar.css';

const VIEW_TABS = [
  { value: 'shop', label: 'Shop view', icon: Store },
  { value: 'customer', label: 'Customer view', icon: UserRound },
];

export default function Topbar() {
  const { orders, activity, settings, notificationsReadAt } = useOrders();
  const { viewMode, setViewMode, openNewOrder, setMobileNavOpen } = useUI();
  const unread = countUnread(buildNotifications(orders, activity), notificationsReadAt);

  return (
    <header className="topbar">
      <button type="button" className="topbar__burger" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
        <MenuIcon size={20} />
      </button>

      <div className="topbar__greeting">
        <h1>Welcome back, {settings.userName}!</h1>
        <p>Here&rsquo;s what&rsquo;s happening in the shop today.</p>
      </div>

      <div className="topbar__actions">
        <Tabs items={VIEW_TABS} value={viewMode} onChange={setViewMode} variant="segmented" label="View mode" className="topbar__view" />
        <Button variant="primary" icon={Plus} onClick={() => openNewOrder()}>
          <span className="topbar__new-label">New order</span>
        </Button>
        <Link to="/notifications" className="topbar__bell" aria-label={`Notifications (${unread} unread)`}>
          <Bell size={18} />
          {unread > 0 && <span className="topbar__badge">{unread > 99 ? '99+' : unread}</span>}
        </Link>
      </div>
    </header>
  );
}
