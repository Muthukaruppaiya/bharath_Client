import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, Percent, IndianRupee, Calendar, Trash2, Edit2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import API_URL from '../config/api';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    code: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', maxDiscountAmount: '', usageLimit: '',
    expiryDate: '', isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/coupons`, { headers });
      setCoupons(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue || !form.expiryDate) {
      alert('Code, discount value and expiry date are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`${API_URL}/api/coupons/${editing}`, form, { headers });
      } else {
        await axios.post(`${API_URL}/api/coupons`, form, { headers });
      }
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleActive = async (coupon) => {
    try {
      await axios.put(`${API_URL}/api/coupons/${coupon._id}`, { isActive: !coupon.isActive }, { headers });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
    } catch (err) { alert('Failed to update'); }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API_URL}/api/coupons/${id}`, { headers });
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Coupons</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create discount codes for your shop</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ background: '#EEF2FF', color: 'var(--primary)' }} onClick={fetchCoupons}>
            <RefreshCw size={18} />
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> New Coupon
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : coupons.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <Tag size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
          <p>No coupons yet. Create your first coupon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {coupons.map(coupon => (
            <motion.div
              key={coupon._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ padding: 0, overflow: 'hidden', border: `1px solid ${coupon.isActive ? 'var(--border)' : '#FEE2E2'}` }}
            >
              {/* Coupon Header */}
              <div style={{
                padding: '1rem 1.25rem',
                background: coupon.isActive ? (coupon.discountType === 'percentage' ? '#EEF2FF' : '#FEF3C7') : '#FEF2F2',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: coupon.isActive ? 'var(--primary)' : '#EF4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}>
                    {coupon.discountType === 'percentage' ? <Percent size={18} /> : <IndianRupee size={18} />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace', letterSpacing: '1px' }}>{coupon.code}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                  background: coupon.isActive && !isExpired(coupon.expiryDate) ? '#D1FAE5' : '#FEE2E2',
                  color: coupon.isActive && !isExpired(coupon.expiryDate) ? '#065F46' : '#991B1B',
                }}>
                  {isExpired(coupon.expiryDate) ? 'EXPIRED' : coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Coupon Body */}
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {coupon.minOrderAmount > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Min Order</span>
                      <p style={{ fontWeight: 700 }}>₹{coupon.minOrderAmount}</p>
                    </div>
                  )}
                  {coupon.maxDiscountAmount && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Max Discount</span>
                      <p style={{ fontWeight: 700 }}>₹{coupon.maxDiscountAmount}</p>
                    </div>
                  )}
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Used</span>
                    <p style={{ fontWeight: 700 }}>{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Expires</span>
                    <p style={{ fontWeight: 700, color: isExpired(coupon.expiryDate) ? '#DC2626' : 'inherit' }}>
                      {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleActive(coupon)} style={{
                    flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    color: coupon.isActive ? '#DC2626' : '#065F46',
                  }}>
                    {coupon.isActive ? <><XCircle size={14} /> Disable</> : <><CheckCircle size={14} /> Enable</>}
                  </button>
                  <button onClick={() => openEdit(coupon)} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)',
                    background: 'white', cursor: 'pointer',
                  }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteCoupon(coupon._id)} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #FECACA',
                    background: '#FEF2F2', cursor: 'pointer', color: '#DC2626',
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(480px, 100%)', background: 'white', zIndex: 101, padding: '2rem', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
                <button className="btn btn-icon" onClick={() => setShowForm(false)}><X size={22} /></button>
              </div>

              {/* Code */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>COUPON CODE *</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. FLAT100" style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }} />
              </div>

              {/* Discount Type & Value */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TYPE *</label>
                  <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {form.discountType === 'percentage' ? 'DISCOUNT % *' : 'DISCOUNT ₹ *'}
                  </label>
                  <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '10' : '100'} />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>MIN ORDER ₹</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="0" />
                </div>
                {form.discountType === 'percentage' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>MAX DISCOUNT ₹</label>
                    <input type="number" value={form.maxDiscountAmount} onChange={e => setForm(p => ({ ...p, maxDiscountAmount: e.target.value }))} placeholder="No limit" />
                  </div>
                )}
              </div>

              {/* Usage Limit & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>USAGE LIMIT</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>EXPIRY DATE *</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
                </div>
              </div>

              {/* Active Toggle */}
              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: form.isActive ? '#10B981' : '#E2E8F0', position: 'relative', transition: '0.2s',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '2px', left: form.isActive ? '22px' : '2px',
                    transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{form.isActive ? 'Active' : 'Inactive'}</span>
              </div>

              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
