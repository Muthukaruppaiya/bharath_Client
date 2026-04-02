import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Phone, MapPin, User, Package, RefreshCw } from 'lucide-react';
import API_URL from '../config/api';

const STATUS_COLORS = {
  Pending:   { bg: '#FEF9C3', color: '#854D0E' },
  Confirmed: { bg: '#DBEAFE', color: '#1D4ED8' },
  Shipped:   { bg: '#F3E8FF', color: '#7C3AED' },
  Delivered: { bg: '#D1FAE5', color: '#065F46' },
  Cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  'Return Requested': { bg: '#FFF7ED', color: '#C2410C' },
  Returned: { bg: '#FEE2E2', color: '#991B1B' },
};

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'];

const OnlineOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/online-orders`, { headers });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/api/online-orders/${orderId}/status`, { status }, { headers });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status }));
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => filterStatus ? o.status === filterStatus : true);

  const StatusBadge = ({ status }) => (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      background: STATUS_COLORS[status]?.bg || '#F1F5F9',
      color: STATUS_COLORS[status]?.color || '#334155',
    }}>{status}</span>
  );

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Online Orders</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage orders from the online shop</p>
        </div>
        <button className="btn" style={{ background: '#EEF2FF', color: 'var(--primary)', gap: '0.5rem' }} onClick={fetchOrders}>
          <RefreshCw size={18} /> Refresh
        </button>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STATUS_OPTIONS.map(s => {
          const count = orders.filter(o => o.status === s).length;
          const col = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(prev => prev === s ? '' : s)} style={{
              padding: '1rem', borderRadius: 'var(--radius-md)', border: `2px solid ${filterStatus === s ? col.color : 'transparent'}`,
              background: col.bg, color: col.color, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{count}</p>
              <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s}</p>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShoppingCart size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
            <p>No {filterStatus || ''} orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => setSelectedOrder(order)}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)' }}>
                        {order.orderCode}
                      </span>
                    </td>
                    <td onClick={() => setSelectedOrder(order)}>
                      <p style={{ fontWeight: 600 }}>{order.customerName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerPhone}</p>
                    </td>
                    <td onClick={() => setSelectedOrder(order)}>{order.items?.length} item(s)</td>
                    <td onClick={() => setSelectedOrder(order)} style={{ fontWeight: 700 }}>₹{order.total?.toLocaleString()}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order._id, e.target.value)}
                        disabled={updating}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 100%)', background: 'white', zIndex: 101, padding: '2rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Order Details</h2>
                  <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedOrder.orderCode}</p>
                </div>
                <button className="btn btn-icon" onClick={() => setSelectedOrder(null)}><X size={22} /></button>
              </div>

              {/* Status */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>UPDATE STATUS</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => {
                    const col = STATUS_COLORS[s];
                    return (
                      <button key={s} onClick={() => handleStatusChange(selectedOrder._id, s)} disabled={updating} style={{
                        padding: '0.4rem 0.9rem', borderRadius: '999px', border: '2px solid',
                        borderColor: selectedOrder.status === s ? col.color : 'transparent',
                        background: selectedOrder.status === s ? col.bg : '#F1F5F9',
                        color: selectedOrder.status === s ? col.color : '#64748B',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.2s'
                      }}>{s}</button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>CUSTOMER INFO</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <User size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600 }}>{selectedOrder.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Phone size={16} color="var(--primary)" />
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedOrder.customerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ORDER ITEMS</p>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <Package size={18} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}{item.size ? ` (${item.size})` : ''}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku} · Qty: {item.quantity}</p>
                    </div>
                    <span style={{ fontWeight: 700 }}>₹{item.total?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery</span>
                    <span style={{ color: selectedOrder.deliveryFee === 0 ? '#10B981' : 'inherit' }}>
                      {selectedOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.deliveryFee?.toLocaleString()}`}
                    </span>
                  </div>
                  {selectedOrder.couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#065F46', fontWeight: 600 }}>Coupon ({selectedOrder.couponCode})</span>
                      <span style={{ color: '#065F46', fontWeight: 600 }}>-₹{selectedOrder.couponDiscount?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#EEF2FF', borderRadius: 'var(--radius-md)', fontWeight: 800, marginTop: '0.5rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{selectedOrder.total?.toLocaleString()}</span>
                </div>

                {/* Payment Info */}
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#F0FDF4', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAYMENT</p>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : selectedOrder.paymentMethod === 'UPI' ? 'UPI' : selectedOrder.paymentMethod === 'Card' ? 'Card' : 'Net Banking'}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                    background: selectedOrder.paymentStatus === 'Paid' ? '#D1FAE5' : '#FEF9C3',
                    color: selectedOrder.paymentStatus === 'Paid' ? '#065F46' : '#854D0E',
                  }}>
                    {selectedOrder.paymentStatus === 'Paid' ? 'PAID' : 'PENDING'}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: 'var(--radius-md)', border: '1px solid #FCD34D' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: '#92400E' }}>NOTES</p>
                  <p style={{ fontSize: '0.9rem', color: '#78350F' }}>{selectedOrder.notes}</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineOrders;
