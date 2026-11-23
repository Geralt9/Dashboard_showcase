import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { OrdersProvider } from './context/OrdersContext';
import { UIProvider } from './context/UIContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Calendar from './pages/Calendar';
import ArtApprovals from './pages/ArtApprovals';
import GarmentOrders from './pages/GarmentOrders';
import Customers from './pages/Customers';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

export default function App() {
  return (
    <OrdersProvider>
      <UIProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="art" element={<ArtApprovals />} />
              <Route path="garments" element={<GarmentOrders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </OrdersProvider>
  );
}
