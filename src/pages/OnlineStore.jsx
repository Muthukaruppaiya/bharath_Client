import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Globe,
  Settings,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Megaphone,
  Truck,
  MessageCircle,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Tag,
  Layers,
  Zap,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import API_URL from '../config/api';

const OnlineStore = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeSettings, setStoreSettings] = useState({
    isEnabled: true,
    storeTagline: '',
    announcementBanner: '',
    announcementEnabled: false,
    freeDeliveryEnabled: true,
    minOrderAmount: 0,
    deliveryInfo: '',
    returnPolicy: '',
    contactPhone: '',
    contactEmail: '',
    whatsappNumber: '',
    instagramHandle: '',
    facebookPage: ''
  });

  // Category modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', isOnline: true });

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, oRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/categories`, { headers }),
        axios.get(`${API_URL}/api/online-orders`, { headers }),
        axios.get(`${API_URL}/api/settings`, { headers })
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setOrders(oRes.data);
      if (sRes.data.onlineStore) {
        setStoreSettings(prev => ({ ...prev, ...sRes.data.onlineStore }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const onlineProducts = products.filter(p => p.isOnline);
  const totalOnlineStock = onlineProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockOnline = onlineProducts.filter(p => p.stock < 5);

  // --- Store Settings ---
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/online`, storeSettings, { headers });
      alert('Store settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // --- Category Management ---
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, description: cat.description || '', isOnline: cat.isOnline !== false });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', description: '', isOnline: true });
    }
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await axios.put(`${API_URL}/api/categories/${editingCat._id}`, catForm, { headers });
      } else {
        await axios.post(`${API_URL}/api/categories`, catForm, { headers });
      }
      setIsCatModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleToggleCatOnline = async (cat) => {
    try {
      await axios.put(`${API_URL}/api/categories/${cat._id}`, { isOnline: !cat.isOnline }, { headers });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isOnline: !c.isOnline } : c));
    } catch (err) {
      alert('Failed to update');
    }
  };

  const handleBulkCatToggle = async (isOnline) => {
    if (selectedCategories.length === 0) return;
    try {
      await axios.patch(`${API_URL}/api/categories/bulk-online`, { categoryIds: selectedCategories, isOnline }, { headers });
      setSelectedCategories([]);
      fetchAllData();
    } catch (err) {
      alert('Failed to update categories');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/api/categories/${deleteTarget._id}`, { headers });
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  // --- Product Bulk Operations ---
  const handleToggleProductOnline = async (product) => {
    try {
      await axios.put(`${API_URL}/api/products/${product._id}`, { ...product, category: product.category?._id || product.category, isOnline: !product.isOnline }, { headers });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isOnline: !p.isOnline } : p));
    } catch (err) {
      alert('Failed to update product');
    }
  };

  const handleBulkProductToggle = async (isOnline) => {
    if (selectedProducts.length === 0) return;
    try {
      await axios.patch(`${API_URL}/api/products/bulk-online`, { productIds: selectedProducts, isOnline }, { headers });
      setSelectedProducts([]);
      fetchAllData();
    } catch (err) {
      alert('Failed to update products');
    }
  };

  const toggleProductSelect = (id) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCategorySelect = (id) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.imageUrl) return product.imageUrl;
    return null;
  };

  // Tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading online store data...</div>;

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Online Store Manager</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your e-commerce website from here</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0.4rem 1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem',
            background: storeSettings.isEnabled ? '#ECFDF5' : '#FEF2F2',
            color: storeSettings.isEnabled ? '#059669' : '#DC2626'
          }}>
            <Globe size={14} />
            Store {storeSettings.isEnabled ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', border: 'none', borderRadius: 'var(--radius-md)',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #3B82F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Online Products</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{onlineProducts.length}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of {products.length} total</p>
                </div>
                <Package size={32} color="#3B82F6" opacity={0.3} />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Online Stock</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{totalOnlineStock}</h3>
                  <p style={{ fontSize: '0.75rem', color: lowStockOnline.length > 0 ? '#DC2626' : 'var(--text-muted)' }}>
                    {lowStockOnline.length} low stock items
                  </p>
                </div>
                <Layers size={32} color="#10B981" opacity={0.3} />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Pending Orders</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingOrders.length}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{orders.length} total orders</p>
                </div>
                <ShoppingCart size={32} color="#F59E0B" opacity={0.3} />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Online Revenue</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>₹{totalRevenue.toLocaleString()}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>from delivered orders</p>
                </div>
                <TrendingUp size={32} color="#8B5CF6" opacity={0.3} />
              </div>
            </div>
          </div>

          {/* Alerts */}
          {lowStockOnline.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="#DC2626" />
              <span style={{ color: '#991B1B', fontWeight: 500 }}>
                <strong>{lowStockOnline.length} online products</strong> have stock below 5 units. Consider restocking.
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button onClick={() => setActiveTab('products')} style={{
                padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: '#F8FAFC', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
              }}>
                <Zap size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Manage Products</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Toggle products online/offline</p>
              </button>

              <button onClick={() => setActiveTab('categories')} style={{
                padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: '#F8FAFC', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
              }}>
                <Tag size={24} color="#10B981" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Manage Categories</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Control category visibility</p>
              </button>

              <button onClick={() => setActiveTab('settings')} style={{
                padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: '#F8FAFC', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
              }}>
                <Megaphone size={24} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Store Settings</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Announcements & contact info</p>
              </button>

              <button onClick={() => { setActiveTab('settings'); setStoreSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled })); }} style={{
                padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: storeSettings.isEnabled ? '#FEF2F2' : '#ECFDF5', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s'
              }}>
                {storeSettings.isEnabled ? <EyeOff size={24} color="#DC2626" style={{ marginBottom: '0.5rem' }} /> : <Eye size={24} color="#059669" style={{ marginBottom: '0.5rem' }} />}
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{storeSettings.isEnabled ? 'Disable Store' : 'Enable Store'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{storeSettings.isEnabled ? 'Take your store offline' : 'Go live with your store'}</p>
              </button>
            </div>
          </div>

          {/* Recent Online Orders */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Online Orders</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No online orders yet</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>{order.orderCode}</td>
                        <td>{order.customerName}</td>
                        <td style={{ fontWeight: 700 }}>₹{order.total?.toLocaleString()}</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                            background: order.status === 'Delivered' ? '#D1FAE5' : order.status === 'Pending' ? '#FEF9C3' : '#DBEAFE',
                            color: order.status === 'Delivered' ? '#065F46' : order.status === 'Pending' ? '#854D0E' : '#1D4ED8'
                          }}>{order.status}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== PRODUCTS TAB ===== */}
      {activeTab === 'products' && (
        <div>
          {/* Bulk Actions Bar */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedProducts.length} selected
              </span>
              {selectedProducts.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleBulkProductToggle(true)} className="btn" style={{ background: '#ECFDF5', color: '#059669', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <Eye size={14} /> Go Online
                  </button>
                  <button onClick={() => handleBulkProductToggle(false)} className="btn" style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <EyeOff size={14} /> Take Offline
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { const allIds = products.map(p => p._id); setSelectedProducts(allIds); }} className="btn" style={{ border: '1px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Select All
              </button>
              <button onClick={() => setSelectedProducts([])} className="btn" style={{ border: '1px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Deselect All
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setSelectedProducts(products.map(p => p._id));
                        else setSelectedProducts([]);
                      }} checked={selectedProducts.length === products.length && products.length > 0} />
                    </th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const img = getProductImage(product);
                    return (
                      <tr key={product._id}>
                        <td>
                          <input type="checkbox" checked={selectedProducts.includes(product._id)} onChange={() => toggleProductSelect(product._id)} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                              background: img ? `url(${img.startsWith('http') ? img : `${API_URL}${img}`}) center/cover` : '#F1F5F9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: img ? 'transparent' : 'var(--primary)', border: '1px solid var(--border)'
                            }}>
                              {!img && <Package size={18} />}
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{product.name}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{product.sku}{product.size ? ` · ${product.size}` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ padding: '0.2rem 0.5rem', background: '#EEF2FF', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500 }}>{product.category?.name || 'N/A'}</span></td>
                        <td style={{ fontWeight: 600 }}>₹{product.saleRate?.toLocaleString()}</td>
                        <td>
                          <span style={{ color: product.stock < 5 ? '#DC2626' : product.stock < 10 ? '#F59E0B' : 'inherit', fontWeight: product.stock < 10 ? 700 : 400 }}>
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          {product.isOnline ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.6rem', background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Globe size={11} /> Live
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.6rem', background: '#F1F5F9', color: '#64748B', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <EyeOff size={11} /> Hidden
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleProductOnline(product)}
                            className="btn"
                            style={{
                              padding: '0.3rem 0.7rem', fontSize: '0.75rem', fontWeight: 600,
                              background: product.isOnline ? '#FEF2F2' : '#ECFDF5',
                              color: product.isOnline ? '#DC2626' : '#059669',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            {product.isOnline ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No products found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORIES TAB ===== */}
      {activeTab === 'categories' && (
        <div>
          {/* Actions Bar */}
          <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedCategories.length} selected
              </span>
              {selectedCategories.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleBulkCatToggle(true)} className="btn" style={{ background: '#ECFDF5', color: '#059669', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <Eye size={14} /> Show Online
                  </button>
                  <button onClick={() => handleBulkCatToggle(false)} className="btn" style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <EyeOff size={14} /> Hide Online
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => handleOpenCatModal()} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Category
            </button>
          </div>

          {/* Categories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {categories.map(cat => {
              const productCount = products.filter(p => p.category?._id === cat._id || p.category === cat._id).length;
              const onlineCount = products.filter(p => (p.category?._id === cat._id || p.category === cat._id) && p.isOnline).length;
              return (
                <div key={cat._id} className="card" style={{ position: 'relative', border: selectedCategories.includes(cat._id) ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={() => toggleCategorySelect(cat._id)} />
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                      background: cat.isOnline !== false ? '#ECFDF5' : '#F1F5F9',
                      color: cat.isOnline !== false ? '#059669' : '#64748B'
                    }}>
                      {cat.isOnline !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{cat.name}</h3>
                  {cat.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{cat.description}</p>}

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{productCount}</p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Products</p>
                    </div>
                    <div style={{ background: '#ECFDF5', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, textAlign: 'center' }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{onlineCount}</p>
                      <p style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600 }}>Online</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleToggleCatOnline(cat)} className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', background: cat.isOnline !== false ? '#FEF2F2' : '#ECFDF5', color: cat.isOnline !== false ? '#DC2626' : '#059669', border: 'none' }}>
                      {cat.isOnline !== false ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Show</>}
                    </button>
                    <button onClick={() => handleOpenCatModal(cat)} className="btn" style={{ padding: '0.4rem', border: '1px solid var(--border)' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: 'category', ...cat })} className="btn" style={{ padding: '0.4rem', color: '#DC2626', border: '1px solid #FEE2E2' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Store Toggle */}
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Online Store Status</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enable or disable your online store for customers</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px' }}>
                <input type="checkbox" checked={storeSettings.isEnabled} onChange={(e) => setStoreSettings(prev => ({ ...prev, isEnabled: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: storeSettings.isEnabled ? '#10B981' : '#CBD5E1', transition: '.4s', borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute', height: '22px', width: '22px',
                    left: storeSettings.isEnabled ? '26px' : '3px', bottom: '3px',
                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* Store Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="var(--primary)" /> Store Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Store Tagline</label>
                <input type="text" value={storeSettings.storeTagline} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeTagline: e.target.value }))} placeholder="The Art of Fine Textiles" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  <input type="checkbox" checked={storeSettings.announcementEnabled} onChange={(e) => setStoreSettings(prev => ({ ...prev, announcementEnabled: e.target.checked }))} />
                  Enable Announcement Banner
                </label>
                <input type="text" value={storeSettings.announcementBanner} onChange={(e) => setStoreSettings(prev => ({ ...prev, announcementBanner: e.target.value }))} placeholder="Free shipping on orders above ₹999!" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} color="#10B981" /> Delivery & Returns
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  <input type="checkbox" checked={storeSettings.freeDeliveryEnabled} onChange={(e) => setStoreSettings(prev => ({ ...prev, freeDeliveryEnabled: e.target.checked }))} />
                  Free Delivery
                </label>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Minimum Order Amount (₹)</label>
                <input type="number" value={storeSettings.minOrderAmount} onChange={(e) => setStoreSettings(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Delivery Info</label>
                <input type="text" value={storeSettings.deliveryInfo} onChange={(e) => setStoreSettings(prev => ({ ...prev, deliveryInfo: e.target.value }))} placeholder="Free delivery on all orders" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Return Policy</label>
                <input type="text" value={storeSettings.returnPolicy} onChange={(e) => setStoreSettings(prev => ({ ...prev, returnPolicy: e.target.value }))} placeholder="7 days easy return policy" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} color="#F59E0B" /> Contact Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Phone</label>
                <input type="tel" value={storeSettings.contactPhone} onChange={(e) => setStoreSettings(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+91 98765 43210" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Email</label>
                <input type="email" value={storeSettings.contactEmail} onChange={(e) => setStoreSettings(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="store@example.com" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={18} color="#8B5CF6" /> Social & WhatsApp
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>WhatsApp Number</label>
                <input type="tel" value={storeSettings.whatsappNumber} onChange={(e) => setStoreSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))} placeholder="+91 98765 43210" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Instagram Handle</label>
                <input type="text" value={storeSettings.instagramHandle} onChange={(e) => setStoreSettings(prev => ({ ...prev, instagramHandle: e.target.value }))} placeholder="@bharathtextiles" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Facebook Page URL</label>
                <input type="url" value={storeSettings.facebookPage} onChange={(e) => setStoreSettings(prev => ({ ...prev, facebookPage: e.target.value }))} placeholder="https://facebook.com/bharathtextiles" style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.875rem' }} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ gridColumn: '1 / -1' }}>
            <button onClick={handleSaveSettings} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Category Add/Edit Modal */}
      <AnimatePresence>
        {isCatModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: 'min(450px, 90%)', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 700 }}>{editingCat ? 'Edit Category' : 'Add Category'}</h2>
                <button className="btn-icon" onClick={() => setIsCatModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Category Name</label>
                  <input type="text" required value={catForm.name} onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                  <textarea rows="2" value={catForm.description} onChange={(e) => setCatForm(prev => ({ ...prev, description: e.target.value }))} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'none' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={catForm.isOnline} onChange={(e) => setCatForm(prev => ({ ...prev, isOnline: e.target.checked }))} />
                  Show on Online Store
                </label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsCatModalOpen(false)} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingCat ? 'Save Changes' : 'Add Category'}</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 105, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card" style={{ width: '400px', textAlign: 'center' }}>
              <div style={{ background: '#FEF2F2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} color="#DC2626" />
              </div>
              <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Delete Category?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Delete "{deleteTarget.name}"? Products in this category will not be deleted.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setDeleteTarget(null)} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                <button onClick={handleDeleteCategory} className="btn" style={{ flex: 1, background: '#DC2626', color: 'white' }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineStore;
