import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  History, 
  LogOut,
  Menu,
  X,
  Truck,
  Settings,
  ShieldCheck,
  Building,
  Globe,
  Store,
  LayoutGrid,
  RotateCcw,
  Tag
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import API_URL from '../config/api';

const Layout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/online-orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPendingCount(res.data.filter(o => o.status === 'Pending').length))
      .catch(() => {});
  }, []);

  const menuItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Billing (POS)', path: '/pos', icon: ShoppingCart },
    { title: 'Purchase Entry', path: '/purchases', icon: Truck },
    { title: 'Inventory', path: '/inventory', icon: Package },
    { title: 'Customers', path: '/customers', icon: Users },
    { title: 'Sales History', path: '/sales', icon: History },
    { title: 'Online Orders', path: '/online-orders', icon: Globe, badge: pendingCount },
    { title: 'Return Orders', path: '/return-orders', icon: RotateCcw },
    { title: 'E-Commerce Sync', path: '/online-catalog', icon: Store },
  ];

  // Admin Only Items
  const adminItems = [
    { title: 'Online Store Admin', path: '/online-store', icon: LayoutGrid },
    { title: 'Coupons', path: '/coupons', icon: Tag },
    { title: 'Manage Staff', path: '/users', icon: ShieldCheck },
    { title: 'Store Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="layout-container">
      <button 
        className={`btn-icon mobile-hamburger ${isSidebarOpen ? 'hidden' : ''}`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={24} />
      </button>

      <aside className={`sidebar ${!isSidebarOpen ? 'sidebar-closed' : ''}`} style={{ transition: '0.3s', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', marginTop: '0.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #C084FC)', padding: '0.4rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>
            <Building color="white" size={24} />
          </div>
          <h2 style={{ 
            background: 'linear-gradient(to right, #818CF8, #C084FC)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            fontWeight: 800, 
            fontSize: '1.5rem',
            letterSpacing: '1px'
          }}>BHARATH</h2>
          <button className="btn-icon mobile-close" onClick={() => setIsSidebarOpen(false)} style={{ color: '#94A3B8' }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', marginBottom: '0.75rem', paddingLeft: '1rem' }}>MAIN MENU</p>
          <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <motion.li 
                  key={item.path} 
                  style={{ marginBottom: '0.35rem' }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={item.path} className={`nav-link ${isActive ? 'active' : ''}`} style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Icon size={18} className={isActive ? 'icon-active' : ''} />
                      <span>{item.title}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{ 
                        background: '#EF4444', 
                        color: 'white', 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '999px',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          {user?.role === 'admin' && (
            <>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', marginBottom: '0.75rem', paddingLeft: '1rem' }}>ADMINISTRATION</p>
              <ul style={{ listStyle: 'none' }}>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.li 
                      key={item.path} 
                      style={{ marginBottom: '0.35rem' }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                        <Icon size={18} className={isActive ? 'icon-active' : ''} />
                        <span>{item.title}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
           <div className="glass-dark" style={{ borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #C084FC)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)' }}>
                  {user?.name[0].toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</p>
                  <p style={{ fontSize: '0.65rem', color: '#94A3B8', letterSpacing: '0.5px' }}>{user?.role.toUpperCase()}</p>
                </div>
             </div>
             
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleLogout} 
               style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem', color: '#FDA4AF', background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: '0.2s' }}
             >
               <LogOut size={16} />
               <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Logout</span>
             </motion.button>
           </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1.25rem;
          text-decoration: none;
          color: #94A3B8; /* Slate 400 */
          font-weight: 500;
          font-size: 0.875rem;
          border-radius: var(--radius-md);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #F8FAFC;
        }
        .nav-link.active {
          background: linear-gradient(135deg, var(--primary) 0%, #818CF8 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
          font-weight: 600;
        }
        .icon-active {
          filter: drop-shadow(0 2px 4px rgba(255,255,255,0.3));
        }
        
        /* Mobile Navigation Elements (Hidden on Desktop) */
        .mobile-hamburger {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 100;
          display: none;
          background: white;
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-sm);
          color: var(--text-main);
        }
        .mobile-close {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar-closed { left: -280px; }
          .sidebar { position: fixed; left: 0; z-index: 50; }
          
          /* Show on mobile */
          .mobile-hamburger { display: block; }
          .mobile-hamburger.hidden { display: none; }
          .mobile-close { display: block; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
