import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users,
  AlertCircle,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStock: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for chart - in real case would fetch from sales history
  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [salesRes, productsRes, customersRes] = await Promise.all([
          axios.get(`${API_URL}/api/sales`, { headers }),
          axios.get(`${API_URL}/api/products`, { headers }),
          axios.get(`${API_URL}/api/customers`, { headers })
        ]);

        const today = new Date().toLocaleDateString();
        const salesToday = salesRes.data.filter(s => new Date(s.createdAt).toLocaleDateString() === today);
        
        setStats({
          todaySales: salesToday.reduce((sum, s) => sum + s.total, 0),
          todayOrders: salesToday.length,
          totalProducts: productsRes.data.length,
          totalCustomers: customersRes.data.length,
          lowStock: productsRes.data.filter(p => p.stock < 10).length
        });
        
        setRecentSales(salesRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Today\'s Sales', value: `₹${stats.todaySales.toLocaleString()}`, icon: TrendingUp, color: '#4F46E5', trend: '+12%' },
    { label: 'Total Orders', value: stats.todayOrders, icon: ShoppingCart, color: '#10B981', trend: '+5%' },
    { label: 'Inventory Items', value: stats.totalProducts, icon: Package, color: '#6366F1', trend: 'Total' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: '#F59E0B', trend: '+2' },
  ];

  if (loading) return <div>Loading Dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1E293B' }}>Overview Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Bharath Textiles Admin</p>
      </header>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <div style={{ 
          background: '#FEF2F2', 
          border: '1px solid #FEE2E2', 
          color: '#991B1B', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <span><strong>Alert:</strong> {stats.lowStock} items are low on stock and need attention.</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem' 
      }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{card.label}</p>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{card.value}</h3>
                </div>
                <div style={{ 
                  backgroundColor: `${card.color}15`, 
                  color: card.color, 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)' 
                }}>
                  <Icon size={24} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight size={14} /> {card.trend}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>than yesterday</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Sales Chart */}
        <div className="card" style={{ minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600 }}>Sales Analytics</h3>
            <button className="btn btn-icon"><ChevronRight size={18} /></button>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1.5rem' }}>Recent Invoices</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentSales.map((sale, i) => (
              <div key={sale._id} style={{ 
                paddingBottom: '1rem', 
                borderBottom: i === recentSales.length - 1 ? 'none' : '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{sale.invoiceNumber}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.customer?.name || 'Guest Customer'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{sale.total.toLocaleString()}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No sales today yet</p>}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.875rem' }}>View All Records</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
