import React, { useState, useEffect, useRef, Fragment } from 'react';
import axios from 'axios';
import {
  Package,
  Search,
  Edit2,
  X,
  Globe,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Upload,
  Trash2,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import API_URL from '../config/api';

const OnlineCatalog = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    isOnline: false,
    description: '',
    images: [],
    gender: 'Unisex'
  });
  const [expandedRows, setExpandedRows] = useState({});
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, { headers });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    // Migrate old imageUrl to images array if needed
    let images = product.images || [];
    if (images.length === 0 && product.imageUrl) {
      images = [product.imageUrl];
    }
    setFormData({
      isOnline: product.isOnline || false,
      description: product.description || '',
      images: images,
      gender: product.gender || 'Unisex'
    });
    setIsModalOpen(true);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadFormData = new FormData();
    files.forEach(file => uploadFormData.append('images', file));

    try {
      const res = await axios.post(`${API_URL}/api/upload`, uploadFormData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.data.imageUrls]
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingProduct,
        category: editingProduct.category?._id || editingProduct.category,
        isOnline: formData.isOnline,
        description: formData.description,
        images: formData.images,
        imageUrl: formData.images.length > 0 ? formData.images[0] : '',
        gender: formData.gender
      };

      await axios.put(`${API_URL}/api/products/${editingProduct._id}`, payload, {
        headers
      });

      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating product');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProducts = Object.values(filteredProducts.reduce((acc, p) => {
    if (!acc[p.name]) {
      acc[p.name] = { ...p, variants: [p], totalStock: p.stock };
    } else {
      acc[p.name].variants.push(p);
      acc[p.name].totalStock += p.stock;
    }
    return acc;
  }, {}));

  const toggleRow = (name) => {
    setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    if (product.imageUrl) return product.imageUrl;
    return null;
  };

  return (
    <div className="animate-fade-in">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>E-Commerce Sync</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage products displayed on your online store</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
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

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Images</th>
                <th>Online Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map(group => {
                const img = getProductImage(group);
                return (
                  <Fragment key={group.name}>
                    <tr style={{ background: expandedRows[group.name] ? '#F8FAFC' : 'transparent', opacity: group.totalStock <= 0 ? 0.6 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          {group.variants.length > 1 ? (
                            <button
                              onClick={() => toggleRow(group.name)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                            >
                              {expandedRows[group.name] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          ) : <div style={{ width: '18px' }} />}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: img ? `url(${API_URL}${img}) center/cover` : '#F1F5F9',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: img ? 'transparent' : 'var(--primary)',
                            border: '1px solid var(--border)'
                          }}>
                            {!img && <Package size={20} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600 }}>{group.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {group.variants.length > 1 ? `${group.variants.length} Variants` : group.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#EEF2FF',
                          color: 'var(--primary)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>{group.category?.name || 'N/A'}</span>
                      </td>
                      <td>{group.variants.length === 1 ? `₹${group.saleRate?.toLocaleString()}` : '-'}</td>
                      <td>
                        <span style={{
                          color: group.totalStock < 10 ? 'var(--danger)' : 'inherit',
                          fontWeight: group.totalStock < 10 ? 700 : 400
                        }}>{group.totalStock}</span>
                      </td>
                      <td>
                        {(() => {
                          const count = (group.images?.length || 0) || (group.imageUrl ? 1 : 0);
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '0.25rem 0.6rem',
                              background: count > 0 ? '#EFF6FF' : '#F1F5F9',
                              color: count > 0 ? '#3B82F6' : '#64748B',
                              borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                            }}>
                              <ImageIcon size={12} /> {count} {count === 1 ? 'Image' : 'Images'}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {group.variants.length === 1 ? (group.isOnline ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.6rem', background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <Globe size={12} /> Live Online
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.6rem', background: '#F1F5F9', color: '#64748B', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <EyeOff size={12} /> Hidden
                          </span>
                        )) : 'Multiple Status'}
                      </td>
                      <td>
                        {group.variants.length === 1 && (
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => handleEdit(group)}>
                            <Edit2 size={14} style={{ marginRight: '4px' }} /> Sync Details
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Variants */}
                    {expandedRows[group.name] && group.variants.length > 1 && group.variants.map((v, idx) => (
                      <tr key={v._id} style={{ background: '#F8FAFC', borderBottom: idx === group.variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ paddingLeft: '4.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Size: {v.size}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.sku}</p>
                          </div>
                        </td>
                        <td></td>
                        <td>₹{v.saleRate?.toLocaleString()}</td>
                        <td>
                          <span style={{
                            color: v.stock < 10 ? 'var(--danger)' : 'inherit',
                            fontWeight: v.stock < 10 ? 700 : 400
                          }}>{v.stock}</span>
                        </td>
                        <td>
                          {(() => {
                            const count = (v.images?.length || 0) || (v.imageUrl ? 1 : 0);
                            return (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '0.25rem 0.6rem',
                                background: count > 0 ? '#EFF6FF' : '#F1F5F9',
                                color: count > 0 ? '#3B82F6' : '#64748B',
                                borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                              }}>
                                <ImageIcon size={12} /> {count}
                              </span>
                            );
                          })()}
                        </td>
                        <td>
                          {v.isOnline ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.6rem', background: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <Globe size={12} /> Live Online
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.25rem 0.6rem', background: '#F1F5F9', color: '#64748B', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                              <EyeOff size={12} /> Hidden
                            </span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleEdit(v)}>
                            <Edit2 size={12} style={{ marginRight: '4px' }} /> Sync Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products found in inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Edit Online Details */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(520px, 100%)',
                background: 'white',
                zIndex: 101,
                padding: '2rem',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontWeight: 700 }}>E-Commerce Details</h2>
                <button className="btn btn-icon" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 600 }}>{editingProduct?.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>SKU: {editingProduct?.sku}</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Toggle Online */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Show Online Store</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Make this product visible to customers online</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isOnline}
                      onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: formData.isOnline ? '#10B981' : '#CBD5E1',
                      transition: '.4s',
                      borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: formData.isOnline ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Online Description</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the product features, material, and tips for your online customers..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'vertical' }}
                  ></textarea>
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Target Gender</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Helps suggest this product to the right customers</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Male', 'Female', 'Unisex'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        style={{
                          flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)',
                          border: `2px solid ${formData.gender === g ? 'var(--primary)' : 'var(--border)'}`,
                          background: formData.gender === g ? 'var(--primary-light)' : 'white',
                          color: formData.gender === g ? 'var(--primary)' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit'
                        }}
                      >{g}</button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Product Images</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Upload images from your device. You can add up to 10 images. First image will be the cover.
                  </p>

                  {/* Image Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    {formData.images.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        background: '#F8FAFC'
                      }}>
                        <img
                          src={img.startsWith('http') ? img : `${API_URL}${img}`}
                          alt={`Product ${index + 1}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239,68,68,0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                          }}
                        >
                          <X size={14} />
                        </button>
                        {index === 0 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontSize: '0.6rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>COVER</span>
                        )}
                      </div>
                    ))}

                    {/* Add Image Button */}
                    {formData.images.length < 10 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          paddingTop: '100%',
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          border: '2px dashed var(--border)',
                          cursor: 'pointer',
                          background: '#FAFAFA',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          color: 'var(--text-muted)'
                        }}>
                          {uploading ? (
                            <span style={{ fontSize: '0.75rem' }}>Uploading...</span>
                          ) : (
                            <>
                              <Plus size={24} />
                              <span style={{ fontSize: '0.7rem' }}>Add Image</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formData.images.length}/10 images added. Supported: JPG, PNG, GIF, WebP (max 5MB each)
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-icon" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Save Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineCatalog;
