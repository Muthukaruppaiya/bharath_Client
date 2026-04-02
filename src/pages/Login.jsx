import { useState } from 'react';
import axios from 'axios';
import { User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import API_URL from '../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#FBBF24', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.1, top: '-10%', left: '-10%' }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: '#EC4899', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.1, bottom: '-5%', right: '-5%' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass"
        style={{
          width: 'min(420px, 90vw)',
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          color: 'white'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bharath Textiles</h1>
          <p style={{ opacity: 0.8 }}>POS & Inventory Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              <input 
                type="email" 
                placeholder="admin@bharath.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              <input 
                type="password" 
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {error && <p style={{ color: '#FCA5A5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: 600 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', opacity: 0.6 }}>
          © 2026 Bharath Textiles Billing System
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
