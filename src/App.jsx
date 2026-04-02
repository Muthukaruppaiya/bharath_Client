import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';
import SalesHistory from './pages/SalesHistory';
import Purchase from './pages/Purchase';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import OnlineOrders from './pages/OnlineOrders';
import ReturnOrders from './pages/ReturnOrders';
import Coupons from './pages/Coupons';
import OnlineCatalog from './pages/OnlineCatalog';
import OnlineStore from './pages/OnlineStore';
import Layout from './components/Layout';

const App = () => {
  const userData = JSON.parse(localStorage.getItem('user'));
  const user = userData;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/purchases" element={<Purchase />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales" element={<SalesHistory />} />
        <Route path="/online-orders" element={<OnlineOrders />} />
        <Route path="/return-orders" element={<ReturnOrders />} />
        <Route path="/online-catalog" element={<OnlineCatalog />} />
        
        {/* Admin Only Routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/online-store" element={<OnlineStore />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
      </Route>
    </Routes>
  );
};

export default App;

