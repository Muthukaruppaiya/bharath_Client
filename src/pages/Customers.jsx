import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/customers`, { headers });
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/customers`, formData, { headers });
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="animate-fade-in">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Customers</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage client database and loyalty</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>New Customer</span>
        </button>
      </header>

      <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.625rem 0.625rem 0.625rem 2.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {filteredCustomers.map(customer => (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            key={customer._id} 
            className="card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                {customer.name[0].toUpperCase()}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SPENT</p>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>₹{customer.totalSpent.toLocaleString()}</p>
              </div>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>{customer.name}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} /> <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} /> <span>{customer.email}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} /> <span>{customer.orderCount} Orders placed</span>
              </div>
            </div>
            
            <button className="btn btn-icon" style={{ width: '100%', marginTop: '1.5rem', border: '1px solid var(--border)' }}>
              View History
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card" style={{ width: '450px', position: 'relative', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <h2 style={{ fontWeight: 700 }}>Add New Customer</h2>
                  <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={24}/></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Full Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Phone Number</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Email (Optional)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Address</label>
                    <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'none' }} rows="2"></textarea>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>Create Customer Profile</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
