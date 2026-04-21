import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/helpers';

export default function BranchDashboard({ products, categories }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [filterCategory, setFilterCategory] = useState(null);
  
  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: categories[0] || '',
    price: '',
    stock: '',
    unit: 'pcs',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'
  });

  // Load orders and inventory
  useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('simba-orders') || '[]');
    setOrders(allOrders);

    const savedInventory = JSON.parse(localStorage.getItem('simba-inventory') || '[]');
    if (savedInventory.length === 0) {
      const initialInventory = products.map(p => ({
        ...p,
        stock: Math.floor(Math.random() * 50) + 10
      }));
      setInventory(initialInventory);
      localStorage.setItem('simba-inventory', JSON.stringify(initialInventory));
    } else {
      setInventory(savedInventory);
    }
  }, [products]);

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('simba-orders', JSON.stringify(updatedOrders));
  };

  const updateStock = (productId, newStock) => {
    const updatedInventory = inventory.map(p => 
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    );
    setInventory(updatedInventory);
    localStorage.setItem('simba-inventory', JSON.stringify(updatedInventory));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const productToAdd = {
      ...newProduct,
      id: Date.now(),
      price: parseInt(newProduct.price),
      stock: parseInt(newProduct.stock),
      inStock: parseInt(newProduct.stock) > 0
    };

    const updatedInventory = [productToAdd, ...inventory];
    setInventory(updatedInventory);
    localStorage.setItem('simba-inventory', JSON.stringify(updatedInventory));
    
    setNewProduct({
      name: '',
      category: categories[0] || '',
      price: '',
      stock: '',
      unit: 'pcs',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'
    });
    setShowAddModal(false);
  };

  const navItems = [
    { id: 'orders', label: 'Orders', icon: '📝' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'var(--bg-secondary)',
      marginTop: 'calc(-1 * var(--header-height))',
      position: 'relative',
      zIndex: 100
    }}>
      {/* Sidebar Navigation */}
      <aside style={{ 
        width: '280px', 
        background: 'var(--bg-card)', 
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '20px' }}>S</div>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Simba Manager</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
            {user.branch || 'Main Branch'}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 16px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'inventory') setFilterCategory(null);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                marginBottom: '4px',
                fontWeight: 600,
                fontSize: '15px',
                transition: 'all 0.2s',
                color: activeTab === item.id ? 'var(--primary)' : 'var(--text-secondary)',
                background: activeTab === item.id ? 'var(--primary-glow)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button 
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center', gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '15px',
              color: 'var(--accent-red)',
              background: 'rgba(239, 68, 68, 0.05)',
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px clamp(20px, 5vw, 60px)', overflowY: 'auto' }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '16px' }}>
              Welcome back, <strong>{user.name}</strong>.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Current Date</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </header>

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700 }}>Recent Transactions</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>ID</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--primary)' }}>#{order.orderNumber}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{order.email}</div>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: 700 }}>{formatPrice(order.total)} RWF</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          background: order.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-glow)',
                          color: order.status === 'Completed' ? 'var(--accent-emerald)' : order.status === 'Cancelled' ? 'var(--accent-red)' : 'var(--primary)'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Ready">Ready</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Content */}
        {activeTab === 'inventory' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontWeight: 700 }}>
                  Stock Management 
                  {filterCategory && <span style={{ marginLeft: '12px', fontSize: '14px', padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '20px' }}>{filterCategory}</span>}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {filterCategory && (
                  <button 
                    onClick={() => setFilterCategory(null)}
                    style={{ padding: '10px 20px', background: 'var(--bg-secondary)', borderRadius: '12px', fontWeight: 600, fontSize: '14px' }}
                  >Clear Filter</button>
                )}
                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 700, fontSize: '14px' }}
                >+ Add Product</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Price</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Stock</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory
                    .filter(p => !filterCategory || p.category === filterCategory)
                    .map(product => (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img src={product.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} />
                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{product.category}</td>
                        <td style={{ padding: '20px 24px', fontWeight: 600 }}>{formatPrice(product.price)}</td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                              onClick={() => updateStock(product.id, product.stock - 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}
                            >−</button>
                            <input 
                              type="number" 
                              value={product.stock}
                              onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                              style={{ 
                                width: '50px', 
                                padding: '6px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)', 
                                textAlign: 'center',
                                fontWeight: 700,
                                background: 'transparent'
                              }}
                            />
                            <button 
                              onClick={() => updateStock(product.id, product.stock + 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}
                            >+</button>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <button style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>Save</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Content */}
        {activeTab === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {categories.map(category => (
              <div 
                key={category} 
                onClick={() => {
                  setFilterCategory(category);
                  setActiveTab('inventory');
                }}
                style={{ 
                  padding: '32px', 
                  background: 'var(--bg-card)', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📁</div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{category}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '24px' }}>
                  {inventory.filter(p => p.category === category).length} products available.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>View Inventory</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➜</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 20, 38, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            width: '100%', 
            maxWidth: '600px', 
            borderRadius: '28px', 
            padding: '40px', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-color)',
            animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <style>{`
              @keyframes modalSlideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>Add New Product</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Fill in the details to list a new item in your branch.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.target.style.background = 'var(--border-color)'}
                onMouseOut={(e) => e.target.style.background = 'var(--bg-secondary)'}
              >✕</button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Image Preview */}
                <div style={{ flex: '0 0 120px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Preview</label>
                  <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {newProduct.image ? (
                      <img src={newProduct.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>🖼️</span>
                    )}
                  </div>
                </div>
                
                {/* Basic Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} 
                      placeholder="e.g. Premium Avocado"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Image URL</label>
                    <input 
                      type="text" 
                      value={newProduct.image}
                      onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} 
                      placeholder="Paste image link here..."
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unit</label>
                  <input 
                    type="text" 
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="e.g. 500g, 1L, pcs"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Price (RWF)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      required
                      type="number" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Initial Stock</label>
                  <input 
                    required
                    type="number" 
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '14px', fontWeight: 700, transition: 'all 0.2s' }}
                >Cancel</button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: 'white', borderRadius: '14px', fontWeight: 700, fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(255, 107, 0, 0.3)', transition: 'all 0.2s' }}
                >Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
