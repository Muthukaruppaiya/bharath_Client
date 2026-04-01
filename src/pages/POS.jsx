import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle2,
  Printer,
  ChevronRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({ storeName: 'Bharath Textiles', taxPercentage: 5 });
  const [cart, setCart] = useState([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [fetchedCustomerId, setFetchedCustomerId] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [adjustment, setAdjustment] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const printRef = useRef();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers }),
        axios.get(`${API_URL}/api/customers`, { headers }),
        axios.get(`${API_URL}/api/settings`, { headers })
      ]);
      setProducts(pRes.data);
      setCustomers(cRes.data);
      setSettings(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => p.stock > 0 && (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )), [products, searchTerm]
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.product === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Cannot add more than available stock');
        return;
      }
      setCart(cart.map(item => 
        item.product === product._id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item
      ));
    } else {
      setCart([...cart, {
        product: product._id,
        name: product.name,
        price: product.saleRate, // Use saleRate
        quantity: 1,
        total: product.saleRate
      }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.product === id) {
        const product = products.find(p => p._id === id);
        const newQty = Math.max(0.1, item.quantity + delta);
        if (newQty > product.stock) {
          alert('Not enough stock');
          return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.product !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * (settings.taxPercentage / 100);
  const total = subtotal + tax + parseFloat(adjustment || 0);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Numbers only
    setCustomerPhone(val);
    
    if (val.length >= 10) {
      const existing = customers.find(c => c.phone === val);
      if (existing) {
        setFetchedCustomerId(existing._id);
        setCustomerName(existing.name);
        setIsNewCustomer(false);
      } else {
        setFetchedCustomerId(null);
        setCustomerName('');
        setIsNewCustomer(true);
      }
    } else {
      setFetchedCustomerId(null);
      setCustomerName('');
      setIsNewCustomer(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    
    let finalCustomerId = fetchedCustomerId;

    try {
      if (isNewCustomer && customerPhone.length >= 10) {
        if (!customerName) return alert('Please enter customer name');
        
        // Create customer inline
        const newCustRes = await axios.post(`${API_URL}/api/customers`, {
          name: customerName,
          phone: customerPhone
        }, { headers });
        
        finalCustomerId = newCustRes.data._id;
      }

      const { data } = await axios.post(`${API_URL}/api/sales`, {
        customerId: finalCustomerId || null,
        items: cart,
        subtotal,
        tax,
        adjustment: parseFloat(adjustment || 0),
        total,
        paymentMethod
      }, { headers });

      setLastInvoice(data);
      setIsSuccessModalOpen(true);
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setFetchedCustomerId(null);
      setIsNewCustomer(false);
      setAdjustment('');
      fetchData(); // Refresh stock
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing sale');
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-bill').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // To restore React state
  };

  const groupedProducts = Object.values(filteredProducts.reduce((acc, p) => {
    if (!acc[p.name]) {
      acc[p.name] = { ...p, variants: [p], totalStock: p.stock };
    } else {
      acc[p.name].variants.push(p);
      acc[p.name].totalStock += p.stock;
    }
    return acc;
  }, {}));

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      {/* Product Selection Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search fabrics, products, SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1rem 1rem 3.5rem', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
          gap: '1rem', 
          overflowY: 'auto',
          paddingBottom: '2rem'
        }}>
          {groupedProducts.map(group => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={group._id} 
              className="card" 
              onClick={() => group.variants.length === 1 && addToCart(group.variants[0])}
              style={{ padding: '1rem', cursor: group.variants.length === 1 ? 'pointer' : 'default', textAlign: 'center', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ 
                height: '80px', 
                background: '#F1F5F9', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <ShoppingBagIcon />
              </div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>{group.name}</h4>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>₹{group.saleRate}</p>
              
              <div style={{ marginTop: 'auto' }}>
                {group.variants.length > 1 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {group.variants.map(v => (
                      <button 
                        key={v._id}
                        onClick={(e) => { e.stopPropagation(); addToCart(v); }}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.target.style.background = 'var(--primary)'; e.target.style.color = 'white'; e.target.style.borderColor = 'var(--primary)'; }}
                        onMouseOut={(e) =>  { e.target.style.background = 'white'; e.target.style.color = 'var(--text-main)'; e.target.style.borderColor = 'var(--border)'; }}
                      >
                        {v.size || 'Err'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{group.totalStock} {group.unit} available</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Billing Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', border: '2px solid var(--primary)', background: '#F8FAFC', overflowY: 'auto' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <ShoppingCart size={22} color="var(--primary)" />
          <span>Current Bill</span>
        </h3>

        {/* Customer Select / Inline CRM */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <User size={16} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Customer Phone</span>
            </div>
            <input 
              type="text"
              placeholder="Enter 10-digit mobile number"
              value={customerPhone}
              onChange={handlePhoneChange}
              maxLength={10}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'white' }}
            />
          </div>
          
          {(isNewCustomer || fetchedCustomerId) && (
            <div className="animate-fade-in">
              <label style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                Customer Name {fetchedCustomerId && <span style={{ color: 'var(--success)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>(Existing)</span>}
              </label>
              <input 
                type="text"
                placeholder="Enter new customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!!fetchedCustomerId}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border)',
                  background: fetchedCustomerId ? '#F1F5F9' : 'white',
                  color: fetchedCustomerId ? 'var(--text-muted)' : 'inherit'
                }}
              />
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
          {cart.map(item => (
            <div key={item.product} style={{ 
              padding: '0.75rem', 
              marginBottom: '0.75rem', 
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{item.price} x {item.quantity}</span>
                   <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>₹{item.total.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', borderRadius: 'var(--radius-md)', padding: '0.2rem' }}>
                  <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.product, -0.5)}><Minus size={12}/></button>
                  <span style={{ minWidth: '35px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 700 }}>{item.quantity}</span>
                  <button className="btn-icon" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.product, 0.5)}><Plus size={12}/></button>
                </div>
                <button className="btn-icon" style={{ color: 'var(--danger)', padding: '0.25rem' }} onClick={() => removeFromCart(item.product)}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>

        {/* Adjustments & Totals */}
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <span>GST ({settings.taxPercentage}%)</span>
            <span>₹{tax.toLocaleString()}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#FEF3C7', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
               Adjustment (+/-)
            </span>
            <input 
              type="number" 
              value={adjustment || ''}
              onChange={(e) => setAdjustment(e.target.value)}
              style={{ width: '80px', padding: '0.25rem', border: '1px solid #F59E0B', borderRadius: '4px', textAlign: 'right', fontWeight: 700 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'Cash', icon: Banknote },
            { id: 'UPI', icon: Smartphone },
            { id: 'Card', icon: CreditCard },
          ].map(m => {
            const Icon = m.icon;
            return (
              <button 
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)',
                  background: paymentMethod === m.id ? '#EEF2FF' : 'white',
                  border: `2px solid ${paymentMethod === m.id ? 'var(--primary)' : 'var(--border)'}`,
                  color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Icon size={20} />
                <span style={{ fontSize: '0.7rem', marginTop: '0.4rem', fontWeight: 600 }}>{m.id}</span>
              </button>
            );
          })}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleCheckout}
          style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', fontWeight: 800 }}
        >
          Generate Invoice
        </button>
      </div>

      {/* Success Modal with Print */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '450px', textAlign: 'center', padding: '2.5rem' }}>
              <CheckCircle2 size={64} color="var(--success)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sale Successful!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Invoice <strong>{lastInvoice?.invoiceNumber}</strong> has been created.</p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                  <Printer size={18} /> Print Bill
                </button>
                <button className="btn" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setIsSuccessModalOpen(false)}>
                  Done
                </button>
              </div>

              {/* Hidden Printable Area */}
              <div id="printable-bill" style={{ display: 'none' }}>
                <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '400px', margin: '0 auto', color: '#000' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0 }}>{settings.storeName}</h2>
                    <p style={{ margin: '5px 0', fontSize: '12px' }}>{settings.address || 'Textile Market, Main Road'}</p>
                    <p style={{ margin: '5px 0', fontSize: '12px' }}>Ph: {settings.phone || '9876543210'}</p>
                    <p style={{ margin: '15px 0', fontWeight: 'bold' }}>{settings.billHeader}</p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
                    <span>Inv: {lastInvoice?.invoiceNumber}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '5px 0' }}>Item</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastInvoice?.items.map((it, i) => (
                        <tr key={i}>
                          <td style={{ padding: '5px 0' }}>{it.product?.name || 'Textile Item'}</td>
                          <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ textAlign: 'right' }}>₹{it.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal</span>
                      <span>₹{lastInvoice?.subtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>GST ({settings.taxPercentage}%)</span>
                      <span>₹{lastInvoice?.tax}</span>
                    </div>
                    {lastInvoice?.adjustment !== 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Adjustment</span>
                        <span>₹{lastInvoice?.adjustment}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '10px' }}>
                      <span>GRAND TOTAL</span>
                      <span>₹{lastInvoice?.total}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #000', paddingTop: '10px', fontSize: '12px' }}>
                    <p>{settings.billFooter}</p>
                    <p style={{ marginTop: '10px' }}>--- Thank You ---</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShoppingBagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

export default POS;
