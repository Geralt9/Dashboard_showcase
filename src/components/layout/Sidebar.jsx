import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Palette,
  Shirt,
  Users,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useUI } from '../../context/UIContext';
import { weekUsage } from '../../utils/capacity';
import './Sidebar.css';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/calendar', label: 'Production Calendar', icon: CalendarDays },
  { to: '/art', label: 'Art Approvals', icon: Palette },
  { to: '/garments', label: 'Garment Orders', icon: Shirt },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M9 10.5 13 7.5h6l4 3-2.5 3.2H19V24.5h-6V13.7h-1.5z"
        fill="none"
        stroke="var(--mint)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="2.2" fill="var(--mint)" />
    </svg>
  );
}

export default function Sidebar() {
  const { orders, settings } = useOrders();
  const { collapsed, setCollapsed, mobileNavOpen, setMobileNavOpen, toast } = useUI();
  const navigate = useNavigate();
  const usage = weekUsage(orders, settings);
  const pct = Math.min(100, Math.round(usage.ratio * 100));

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileNavOpen ? 'is-open' : ''}`}>
      <div className="sidebar__brand">
        <Logo />
        <span className="sidebar__name">{settings.shopName}</span>
        <button
          type="button"
          className="sidebar__collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button
          type="button"
          className="sidebar__close"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="sidebar__link" title={collapsed ? label : undefined}>
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className="sidebar__link"
          title={collapsed ? 'Log out' : undefined}
          onClick={() => toast('Logged out (demo): authentication is not wired up yet.', 'info')}
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </nav>

      <div className="sidebar__promo">
        <h4>This week&rsquo;s capacity</h4>
        <p>
          <strong>{usage.booked.toLocaleString()}</strong> / {usage.capacity.toLocaleString()} prints booked
        </p>
        <div className="sidebar__promo-bar" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        <button type="button" className="sidebar__promo-btn" onClick={() => navigate('/calendar')}>
          <CalendarDays size={14} aria-hidden="true" />
          View calendar
        </button>
      </div>
    </aside>
  );
}
