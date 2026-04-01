import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import API_URL from '../config/api';

const Settings = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    phone: '',
    email: '',
    address: '',
    billHeader: '',
    billFooter: '',
    taxPercentage: 5
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/settings`, { headers });
      setFormData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`${API_URL}/api/settings`, formData, { headers });
      setFormData(data);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Error updating settings');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SettingsIcon size={32} color="var(--primary)" />
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>System Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure store details and billing parameters</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Store Profile */}
        <section className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>Store Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Store Name</label>
              <input 
                type="text" 
                value={formData.storeName || ''}
                onChange={e => setFormData({...formData, storeName: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tax Percentage (%)</label>
              <div style={{ position: 'relative' }}>
                <Calculator size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="number" 
                  value={formData.taxPercentage || 0}
                  onChange={e => setFormData({...formData, taxPercentage: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="text" 
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="email" 
                  value={formData.email || ''}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Store Address</label>
            <textarea 
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
              rows="3"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'none' }}
            ></textarea>
          </div>
        </section>

        {/* Invoice Settings */}
        <section className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>Invoice & Billing Reference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bill Header (Shown top of bill)</label>
              <input 
                type="text" 
                value={formData.billHeader || ''}
                placeholder="e.g. Online textile bill reference header"
                onChange={e => setFormData({...formData, billHeader: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bill Footer / T&C (Shown bottom of bill)</label>
              <textarea 
                value={formData.billFooter || ''}
                onChange={e => setFormData({...formData, billFooter: e.target.value})}
                rows="3"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'none' }}
              ></textarea>
            </div>
          </div>
        </section>

        <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem', fontSize: '1rem', marginBottom: '4rem' }}>
          <Save size={18} /> Save & Apply System Configuration
        </button>
      </form>
    </div>
  );
};

export default Settings;
