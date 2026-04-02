import React, { useState, useEffect, useMemo, Fragment } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Search, 
  Trash2, 
  Plus, 
  Save,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import API_URL from '../config/api';

const Purchase = () => {
  const [products, setProducts] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`, { headers });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]
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

  const addItem = (product) => {
    const existing = purchaseItems.find(item => item.product === product._id);
    if (existing) return;

    setPurchaseItems([...purchaseItems, {
      product: product._id,
      name: product.name,
      sku: product.sku,
      purchaseRate: product.purchaseRate || 0,
      quantity: 1,
      total: product.purchaseRate || 0
    }]);
  };

  const updateItem = (id, field, value) => {
    setPurchaseItems(purchaseItems.map(item => {
      if (item.product === id) {
        const newItem = { ...item, [field]: parseFloat(value) || 0 };
        newItem.total = newItem.purchaseRate * newItem.quantity;
        return newItem;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setPurchaseItems(purchaseItems.filter(item => item.product !== id));
  };

  const subtotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = async () => {
    if (!supplierName || !billNumber || purchaseItems.length === 0) {
      return alert('Required: Supplier, Bill Number, and at least one item');
    }

    try {
      await axios.post(`${API_URL}/api/purchases`, {
        supplierName,
        billNumber,
        items: purchaseItems,
        subtotal,
        total: subtotal
      }, { headers });

      alert('Purchase recorded and stock updated!');
      setPurchaseItems([]);
      setSupplierName('');
      setBillNumber('');
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing purchase');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Search and Select Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Truck /> New Purchase Entry</h2>
        
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search products to add to purchase..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1rem 1rem 3.5rem', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)',
              fontSize: '1rem'
            }}
          />
        </div>

        <div className="card" style={{ flex: 1, padding: 0, overflowY: 'auto' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>
                {groupedProducts.map(group => (
                  <Fragment key={group.name}>
                    <tr style={{ background: expandedRows[group.name] ? '#F8FAFC' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {group.variants.length > 1 ? (
                            <button 
                              onClick={() => toggleRow(group.name)} 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                            >
                              {expandedRows[group.name] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          ) : <div style={{ width: '18px' }} />}
                          {group.name}
                        </div>
                      </td>
                      <td>{group.variants.length > 1 ? `${group.variants.length} Variants` : group.sku}</td>
                      <td>{group.totalStock}</td>
                      <td>
                        {group.variants.length === 1 && (
                          <button className="btn btn-icon" onClick={() => addItem(group.variants[0])}><Plus size={18}/></button>
                        )}
                      </td>
                    </tr>
                    
                    {expandedRows[group.name] && group.variants.length > 1 && group.variants.map((v, idx) => (
                      <tr key={v._id} style={{ background: '#F8FAFC', borderBottom: idx === group.variants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ paddingLeft: '3rem', fontSize: '0.875rem' }}>Size: {v.size}</td>
                        <td style={{ fontSize: '0.875rem' }}>{v.sku}</td>
                        <td style={{ fontSize: '0.875rem' }}>{v.stock}</td>
                        <td>
                          <button className="btn btn-icon" onClick={() => addItem(v)}><Plus size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bill Items Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Supplier Bill Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Supplier Name</label>
            <input 
              type="text" 
              placeholder="e.g. Surat Textiles" 
              value={supplierName || ''}
              onChange={(e) => setSupplierName(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Bill Reference</label>
            <input 
              type="text" 
              placeholder="e.g. ST/442" 
              value={billNumber || ''}
              onChange={(e) => setBillNumber(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {purchaseItems.map(item => (
            <div key={item.product} style={{ 
              padding: '1rem', 
              background: 'white', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '0.75rem', 
              border: '1px solid var(--border)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</span>
                <button className="btn-icon" style={{ padding: 0 }} onClick={() => removeItem(item.product)}><Trash2 size={16} color="var(--danger)"/></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Purchase Rate</label>
                  <input 
                    type="number" 
                    value={item.purchaseRate || ''} 
                    onChange={(e) => updateItem(item.product, 'purchaseRate', e.target.value)}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantity</label>
                  <input 
                    type="number" 
                    value={item.quantity || ''} 
                    onChange={(e) => updateItem(item.product, 'quantity', e.target.value)}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total</label>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>₹{item.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {purchaseItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>
              <FileText size={48} style={{ margin: '0 auto 1rem' }} />
              <p>Add products from the left to start a purchase entry</p>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            <span>Bill Total</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            onClick={handleSavePurchase}
          >
            <Save size={18} /> Record Purchase & Update Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
