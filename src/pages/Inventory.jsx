import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  X,
  Upload,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [skuLoading, setSkuLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const skuDebounceRef = useRef(null);

  // Bulk Import State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // New Product State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    purchaseRate: '',
    saleRate: '',
    stock: '',
    unit: 'meters',
    size: '',
    description: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-generate SKU when product name changes (only in Add mode)
  const handleNameChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, name: value }));

    if (isEditMode) return; // Don't auto-generate when editing

    if (skuDebounceRef.current) clearTimeout(skuDebounceRef.current);

    if (!value || value.trim() === '') {
      setFormData(prev => ({ ...prev, name: value, sku: '' }));
      return;
    }

    skuDebounceRef.current = setTimeout(async () => {
      setSkuLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/products/generate-sku?name=${encodeURIComponent(value)}`,
          { headers }
        );
        setFormData(prev => ({ ...prev, sku: res.data.sku }));
      } catch (err) {
        console.error('SKU generation failed', err);
      } finally {
        setSkuLoading(false);
      }
    }, 400);
  }, [isEditMode, headers]);

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/categories`, { headers })
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/api/products/${editId}`, formData, { 
          headers 
        });
      } else {
        // Option 1: Multi-size generation logic
        const sizes = formData.size.split(',').map(s => s.trim()).filter(s => s !== '');
        
        if (sizes.length > 1) {
          // If multiple sizes, create separate products
          const creations = sizes.map(sz => {
            return axios.post(`${API_URL}/api/products`, {
              ...formData,
              size: sz,
              sku: `${formData.sku}-${sz}` // Append size to SKU for uniqueness
            }, { headers });
          });
          await Promise.all(creations);
        } else {
          // Default single creation
          await axios.post(`${API_URL}/api/products`, formData, { 
            headers 
          });
        }
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?._id || product.category,
      purchaseRate: product.purchaseRate,
      saleRate: product.saleRate,
      stock: product.stock,
      unit: product.unit,
      size: product.size || '',
      description: product.description || ''
    });
    setEditId(product._id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await axios.delete(`${API_URL}/api/products/${deleteConfirmId}`, { headers });
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', sku: '', category: '', purchaseRate: '', saleRate: '', stock: '', unit: 'meters', size: '', description: '' });
    setIsEditMode(false);
    setEditId(null);
    setSkuLoading(false);
    if (skuDebounceRef.current) clearTimeout(skuDebounceRef.current);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,sku,categoryName,purchaseRate,saleRate,stock,unit,size,description\nSample Product,SKU-001,Cotton,500,800,50,meters,XL,Sample description";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setBulkResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data } = await axios.post(`${API_URL}/api/products/bulk`, {
            products: results.data
          }, { headers });
          setBulkResults(data);
          fetchData();
        } catch (err) {
          alert(err.response?.data?.message || 'Error during bulk import');
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        alert('Error parsing CSV file');
        setIsImporting(false);
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProducts = Object.values(filteredProducts.reduce((acc, p) => {
    if (!acc[p.name]) {
      acc[p.name] = { ...p, totalStock: p.stock, variants: [p] };
    } else {
      acc[p.name].variants.push(p);
      acc[p.name].totalStock += p.stock;
    }
    return acc;
  }, {}));

  const toggleRow = (name) => {
    setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your textile stock</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: '#EEF2FF', color: 'var(--primary)' }} onClick={() => setIsBulkOpen(true)}>
            <Upload size={20} />
            <span>Bulk Import</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            <span>Add Product</span>
          </button>
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
        <button className="btn btn-icon" title="Filter"><Filter size={18} /></button>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Category</th>
                <th>Purchase</th>
                <th>Sale</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedProducts.map(group => (
                <Fragment key={group.name}>
                  <tr style={{ background: expandedRows[group.name] ? '#F8FAFC' : 'transparent' }}>
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
                          background: '#F1F5F9', 
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <Package size={20} />
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
                    <td>{group.variants.length === 1 ? `₹${group.purchaseRate?.toLocaleString()}` : '-'}</td>
                    <td>{group.variants.length === 1 ? `₹${group.saleRate?.toLocaleString()}` : '-'}</td>
                    <td>
                      <span style={{ 
                        color: group.totalStock < 10 ? 'var(--danger)' : 'inherit',
                        fontWeight: group.totalStock < 10 ? 700 : 400
                      }}>{group.totalStock}</span>
                    </td>
                    <td>{group.unit}</td>
                    <td>{group.variants.length === 1 ? (group.size || '-') : 'Multiple'}</td>
                    <td>
                      {group.variants.length === 1 && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => handleEdit(group)}><Edit2 size={16} /></button>
                          <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(group._id)}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Dropdown Variants */}
                  {expandedRows[group.name] && group.variants.length > 1 && group.variants.map((v, idx) => (
                    <tr key={v._id} style={{ background: '#F8FAFC', borderBottom: idx === group.variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ paddingLeft: '4.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Size: {v.size}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.sku}</p>
                        </div>
                      </td>
                      <td></td>
                      <td>₹{v.purchaseRate?.toLocaleString()}</td>
                      <td>₹{v.saleRate?.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          color: v.stock < 10 ? 'var(--danger)' : 'inherit',
                          fontWeight: v.stock < 10 ? 700 : 400
                        }}>{v.stock}</span>
                      </td>
                      <td></td>
                      <td></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon" onClick={() => handleEdit(v)}><Edit2 size={14} /></button>
                          <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(v._id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {groupedProducts.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No products found. Start by adding one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Bulk Import */}
      <AnimatePresence>
        {isBulkOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bulk Import Products</h2>
                <button className="btn-icon" onClick={() => { setIsBulkOpen(false); setBulkResults(null); }}><X size={20} /></button>
              </div>

              {!bulkResults ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>1. First, download the sample template</p>
                    <button className="btn" style={{ border: '1px solid var(--border)', margin: '0 auto', background: 'white' }} onClick={handleDownloadTemplate}>Download Template (CSV)</button>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: '#EEF2FF', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>2. Upload your filled CSV file</p>
                    <input type="file" accept=".csv" onChange={handleFileUpload} disabled={isImporting} style={{ display: 'block', margin: '0 auto' }} />
                    {isImporting && <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600 }}>Importing data, please wait...</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, padding: '1rem', background: '#ECFDF5', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <h3 style={{ fontSize: '2rem', color: 'var(--success)' }}>{bulkResults.successCount}</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Imported Successfully</p>
                    </div>
                    <div style={{ flex: 1, padding: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <h3 style={{ fontSize: '2rem', color: 'var(--danger)' }}>{bulkResults.errorCount}</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Failed Rows</p>
                    </div>
                  </div>

                  {bulkResults.errors && bulkResults.errors.length > 0 && (
                    <div style={{ border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <div style={{ background: '#FEF2F2', padding: '0.75rem', borderBottom: '1px solid var(--danger)' }}>
                         <h4 style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.875rem' }}>Error Details</h4>
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                        {bulkResults.errors.map((err, i) => (
                          <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #fee2e2', fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>Row {err.row}</span> | 
                            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>SKU: {err.sku}</span> | 
                            <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>{err.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => { setIsBulkOpen(false); setBulkResults(null); }}>Done</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Custom Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 105, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card" style={{ width: '400px', textAlign: 'center' }}>
              <div style={{ background: '#FEF2F2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--danger)' }}>
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Delete Product?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to permanently delete this product? This action cannot be undone.</p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Add Product */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
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
                width: 'min(500px, 100%)', 
                background: 'white', 
                zIndex: 101, 
                padding: '2rem',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontWeight: 700 }}>{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="btn btn-icon" onClick={handleCloseModal}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Product Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Pant, Shirt, Saree"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>
                      SKU Code
                      {!isEditMode && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.65rem',
                          background: skuLoading ? '#FEF9C3' : '#ECFDF5',
                          color: skuLoading ? '#854D0E' : '#065F46',
                          padding: '2px 7px',
                          borderRadius: '999px',
                          fontWeight: 600,
                          verticalAlign: 'middle',
                          transition: 'all 0.3s'
                        }}>
                          {skuLoading ? '⏳ Generating...' : '✦ Auto'}
                        </span>
                      )}
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder={skuLoading ? 'Generating SKU...' : 'e.g. P001'}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${skuLoading ? '#FCD34D' : 'var(--border)'}`,
                        background: skuLoading ? '#FFFBEB' : 'white',
                        transition: 'all 0.3s',
                        fontWeight: formData.sku ? 600 : 400,
                        letterSpacing: formData.sku ? '0.05em' : 'normal'
                      }}
                    />
                    {!isEditMode && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Auto-filled · you can still edit</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Category</label>
                    <select 
                      required
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Purchase Rate (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.purchaseRate || ''}
                      onChange={(e) => setFormData({...formData, purchaseRate: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Sale Rate (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.saleRate || ''}
                      onChange={(e) => setFormData({...formData, saleRate: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Stock</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.stock || ''}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Unit</label>
                    <select 
                      value={formData.unit || 'meters'}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    >
                      <option value="meters">Meters</option>
                      <option value="pieces">Pieces</option>
                      <option value="rolls">Rolls</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Size</label>
                    <input 
                      type="text" 
                      placeholder="e.g. S, M, L (comma separated)"
                      value={formData.size || ''}
                      onChange={(e) => setFormData({...formData, size: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                    />
                    {!isEditMode && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Use commas to create multiple items</p>}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.4rem' }}>Description</label>
                  <textarea 
                    rows="3"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', resize: 'none' }}
                  ></textarea>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-icon" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={handleCloseModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                    {isEditMode ? 'Save Changes' : 'Save Product'}
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

export default Inventory;
