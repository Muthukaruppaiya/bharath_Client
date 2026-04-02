import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Search, 
  Calendar, 
  Eye, 
  Printer, 
  Download,
  Filter 
} from 'lucide-react';
import { format } from 'date-fns';
import API_URL from '../config/api';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/sales`, { headers });
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || s.paymentMethod === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-fade-in">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Sales History</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track and manage past transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-icon" title="Export CSV" style={{ border: '1px solid var(--border)' }}><Download size={18} /></button>
          <button className="btn btn-icon" title="Print Reports" style={{ border: '1px solid var(--border)' }}><Printer size={18} /></button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search by invoice # or customer..." 
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={16} /> Filter by:
          </span>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }}
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash Only</option>
            <option value="UPI">UPI Only</option>
            <option value="Card">Card Only</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Adjustment</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale._id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{sale.invoiceNumber}</td>
                  <td style={{ fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} /> <span>{format(new Date(sale.createdAt), 'dd MMM yyyy, p')}</span>
                    </div>
                  </td>
                  <td>{sale.customer?.name || 'Guest'}</td>
                  <td style={{ color: (sale.adjustment || 0) < 0 ? 'var(--danger)' : ((sale.adjustment || 0) > 0 ? 'var(--success)' : 'inherit'), fontWeight: 500 }}>
                    { (sale.adjustment || 0) > 0 ? `+₹${sale.adjustment}` : (sale.adjustment < 0 ? `-₹${Math.abs(sale.adjustment)}` : '₹0') }
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{sale.total.toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      background: sale.paymentMethod === 'Cash' ? '#F0F9FF' : (sale.paymentMethod === 'UPI' ? '#F0FDFA' : '#F5F3FF'), 
                      color: sale.paymentMethod === 'Cash' ? '#0369A1' : (sale.paymentMethod === 'UPI' ? '#0D9488' : '#6D28D9'), 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>{sale.paymentMethod}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" title="View Detail"><Eye size={16} /></button>
                      <button className="btn-icon" title="Reprint"><Printer size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
