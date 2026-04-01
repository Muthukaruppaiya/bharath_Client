import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  UserPlus,
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/users`, { headers });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'staff' : 'admin';
      await axios.put(`${API_URL}/api/users/${userId}/role`, { role: newRole }, { headers });
      fetchUsers();
    } catch (err) {
      alert('Error updating role');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/api/users/${id}`, { headers });
      fetchUsers();
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/register`, newUserData, { headers });
      setIsModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Staff & User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage team members and dynamic privileges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add New Staff</span>
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {users.map(user => (
          <div key={user._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', border: `2px solid ${user.role === 'admin' ? '#4F46E5' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 700 }}>
                {user.name[0].toUpperCase()}
              </div>
              <span style={{ 
                padding: '0.4rem 0.75rem', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                background: user.role === 'admin' ? '#EEF2FF' : '#F1F5F9',
                color: user.role === 'admin' ? '#4F46E5' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                {user.role === 'admin' ? <ShieldCheck size={14}/> : <Users size={14}/>}
                {user.role.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 style={{ fontWeight: 700 }}>{user.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.email}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-icon" 
                title="Toggle Privilege"
                onClick={() => toggleRole(user._id, user.role)}
                style={{ flex: 1, border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600 }}
              >
                {user.role === 'admin' ? 'Demote to Staff' : 'Promote to Admin'}
              </button>
              <button 
                className="btn btn-icon" 
                onClick={() => deleteUser(user._id)}
                style={{ color: 'var(--danger)', border: '1px solid #FECACA', padding: '0.75rem' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card" style={{ width: '450px', position: 'relative', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontWeight: 700 }}>Add New Team Member</h2>
                <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={24}/></button>
              </div>

              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" required value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Temporary Password</label>
                  <input type="text" required value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Assign Initial Role</label>
                  <select 
                    value={newUserData.role}
                    onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="staff">Billing Staff</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ padding: '1rem', marginTop: '1rem' }}>Create Staff Account <ArrowRight size={18}/></button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
