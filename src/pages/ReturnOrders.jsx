import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X, Phone, User, Package, RefreshCw, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import API_URL from '../config/api';

const STATUS_COLORS = {
  'Requested': { bg: '#FEF9C3', color: '#854D0E' },
  'Approved': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Rejected': { bg: '#FEE2E2', color: '#991B1B' },
  'Pickup Scheduled': { bg: '#E0E7FF', color: '#3730A3' },
  'Picked Up': { bg: '#F3E8FF', color: '#7C3AED' },
  'Refund Processing': { bg: '#FFF7ED', color: '#C2410C' },
  'Refunded': { bg: '#D1FAE5', color: '#065F46' },
};

const STATUS_OPTIONS = ['Requested', 'Approved', 'Rejected', 'Pickup Scheduled', 'Picked Up', 'Refund Processing', 'Refunded'];
const REFUND_METHODS = ['Original Payment', 'Store Credit', 'Bank Transfer'];

const ReturnOrders = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('Original Payment');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/return-orders`, { headers });
      setReturns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  const handleStatusChange = async (returnId, status) => {
    setUpdating(true);
    try {
      const body = { status, refundMethod, adminNotes: adminNotes || undefined };
      await axios.put(`${API_URL}/api/return-orders/${returnId}/status`, body, { headers });
      setReturns(prev => prev.map(r => r._id === returnId ? { ...r, status, refundMethod, adminNotes: adminNotes || r.adminNotes } : r));
      if (selectedReturn?._id === returnId) setSelectedReturn(prev => ({ ...prev, status, refundMethod, adminNotes: adminNotes || prev.adminNotes }));
      if (status === 'Refunded') alert('Refund processed! Product stock has been restored.');
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = returns.filter(r => filterStatus ? r.status === filterStatus : true);

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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Return Orders</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage customer return requests</p>
        </div>
        <button className="btn" style={{ background: '#EEF2FF', color: 'var(--primary)', gap: '0.5rem' }} onClick={fetchReturns}>
          <RefreshCw size={18} /> Refresh
        </button>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STATUS_OPTIONS.map(s => {
          const count = returns.filter(r => r.status === s).length;
          const col = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(prev => prev === s ? '' : s)} style={{
              padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${filterStatus === s ? col.color : 'transparent'}`,
              background: col.bg, color: col.color, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{count}</p>
              <p style={{ fontSize: '0.7rem', fontWeight: 700 }}>{s}</p>
            </button>
          );
        })}
      </div>

      {/* Returns Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading return orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RotateCcw size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
            <p>No {filterStatus || ''} return requests found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Return Code</th>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ret => (
                  <tr key={ret._id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); setRefundMethod(ret.refundMethod || 'Original Payment'); }}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: '#DC2626' }}>
                        {ret.returnCode}
                      </span>
                    </td>
                    <td onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); setRefundMethod(ret.refundMethod || 'Original Payment'); }}>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)' }}>
                        {ret.orderCode}
                      </span>
                    </td>
                    <td onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); setRefundMethod(ret.refundMethod || 'Original Payment'); }}>
                      <p style={{ fontWeight: 600 }}>{ret.customerName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ret.customerPhone}</p>
                    </td>
                    <td onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); setRefundMethod(ret.refundMethod || 'Original Payment'); }}>{ret.items?.length} item(s)</td>
                    <td onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); setRefundMethod(ret.refundMethod || 'Original Payment'); }} style={{ fontWeight: 700, color: '#DC2626' }}>₹{ret.totalRefundAmount?.toLocaleString()}</td>
                    <td><StatusBadge status={ret.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <select
                        value={ret.status}
                        onChange={e => handleStatusChange(ret._id, e.target.value)}
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

      {/* Return Detail Drawer */}
      <AnimatePresence>
        {selectedReturn && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReturn(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(520px, 100%)', background: 'white', zIndex: 101, padding: '2rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Return Details</h2>
                  <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedReturn.returnCode}</p>
                </div>
                <button className="btn btn-icon" onClick={() => setSelectedReturn(null)}><X size={22} /></button>
              </div>

              {/* Status Update */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>UPDATE STATUS</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {STATUS_OPTIONS.map(s => {
                    const col = STATUS_COLORS[s];
                    return (
                      <button key={s} onClick={() => handleStatusChange(selectedReturn._id, s)} disabled={updating} style={{
                        padding: '0.4rem 0.9rem', borderRadius: '999px', border: '2px solid',
                        borderColor: selectedReturn.status === s ? col.color : 'transparent',
                        background: selectedReturn.status === s ? col.bg : '#F1F5F9',
                        color: selectedReturn.status === s ? col.color : '#64748B',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.2s'
                      }}>{s}</button>
                    );
                  })}
                </div>

                {/* Refund Method */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>REFUND METHOD</p>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border)', marginBottom: '1rem' }}
                >
                  {REFUND_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                {/* Admin Notes */}
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>ADMIN NOTES</p>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the customer..."
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--border)', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>CUSTOMER INFO</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <User size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600 }}>{selectedReturn.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Phone size={16} color="var(--primary)" />
                    <span>{selectedReturn.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Return Reason */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#FFF7ED', borderRadius: 'var(--radius-md)', border: '1px solid #FED7AA' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#C2410C' }}>RETURN REASON</p>
                <p style={{ fontSize: '0.9rem', color: '#9A3412' }}>{selectedReturn.returnReason}</p>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>RETURN ITEMS</p>
                {selectedReturn.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <Package size={18} color="var(--primary)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}{item.size ? ` (${item.size})` : ''}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku} · Qty: {item.quantity}</p>
                    </div>
                    <span style={{ fontWeight: 700, color: '#DC2626' }}>₹{item.total?.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#FEE2E2', borderRadius: 'var(--radius-md)', fontWeight: 800, marginTop: '0.5rem' }}>
                  <span>Total Refund</span>
                  <span style={{ color: '#DC2626' }}>₹{selectedReturn.totalRefundAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Linked Order */}
              <div style={{ padding: '1rem', background: '#EEF2FF', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>LINKED ORDER</p>
                <p style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--secondary)' }}>#{selectedReturn.orderCode}</p>
              </div>

              {selectedReturn.adminNotes && (
                <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: '#166534' }}>ADMIN NOTES</p>
                  <p style={{ fontSize: '0.9rem', color: '#15803D' }}>{selectedReturn.adminNotes}</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReturnOrders;
