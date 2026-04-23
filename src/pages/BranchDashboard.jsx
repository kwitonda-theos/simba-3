import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/helpers';

export default function BranchDashboard({ products: initialProducts, categories }) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const branchId = user?.user_metadata?.branches?.[0] || user?.primary_branch_id;

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Orders for this branch
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          profiles:customer_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (branchId) {
        // If it's a UUID, use it, otherwise we might need to find by name
        ordersQuery = ordersQuery.eq('branch_id', branchId);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // 2. Fetch Inventory
      let inventoryQuery = supabase
        .from('inventory')
        .select(`
          *,
          products (*)
        `);
      
      if (branchId) {
        inventoryQuery = inventoryQuery.eq('branch_id', branchId);
      }

      const { data: invData, error: invError } = await inventoryQuery;
      if (invError) throw invError;
      
      setInventory((invData || []).map(item => ({
        ...item.products,
        stock: item.stock_quantity,
        inventory_id: item.id
      })));

    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus.toLowerCase() })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus.toLowerCase() } : o));
    } catch (err) {
      alert('Failed to update order: ' + err.message);
    }
  };

  const updateStock = async (inventoryId, productId, newStock) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq('id', inventoryId);

      if (error) throw error;
      
      setInventory(inventory.map(p => 
        p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
      ));
    } catch (err) {
      alert('Failed to update stock: ' + err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // 1. Create Product
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          category: newProduct.category,
          price: parseInt(newProduct.price),
          unit: newProduct.unit,
          image_url: newProduct.image
        })
        .select()
        .single();

      if (prodError) throw prodError;

      // 2. Link to Inventory if branch exists
      if (branchId) {
        const { error: invError } = await supabase
          .from('inventory')
          .insert({
            branch_id: branchId,
            product_id: prodData.id,
            stock_quantity: parseInt(newProduct.stock)
          });
        if (invError) throw invError;
      }

      fetchDashboardData();
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add product: ' + err.message);
    }
  };

  const navItems = [
    { id: 'orders', label: t('orders'), icon: '📝' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'categories', label: t('categories'), icon: '🏷️' },
    { id: 'analytics', label: t('analytics'), icon: '📊' },
  ];

  const getStatusLabel = (status) => {
    if (!status) return t('pending');
    switch(status.toLowerCase()) {
      case 'pending': return t('pending');
      case 'processing': return t('processing');
      case 'ready': return t('ready');
      case 'completed': return t('completed');
      case 'cancelled': return t('cancelled');
      default: return status;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: 'var(--bg-secondary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

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
             Manager Dashboard
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
            <span>🚪</span> {t('logout')}
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
              {t('welcomeBackManager')}, <strong>{user?.name}</strong>.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{t('currentDate')}</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{new Date().toLocaleDateString(language === 'en' ? 'en-GB' : (language === 'fr' ? 'fr-FR' : 'rw-RW'), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </header>

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700 }}>{t('recentTransactions')}</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('id')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('customer')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('amount')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('status')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--primary)' }}>#{order.order_number}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{order.profiles?.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{order.contact_phone}</div>
                      </td>
                      <td style={{ padding: '20px 24px', fontWeight: 700 }}>{formatPrice(order.total_amount)} RWF</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          background: order.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : order.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-glow)',
                          color: order.status === 'completed' ? 'var(--accent-emerald)' : order.status === 'cancelled' ? 'var(--accent-red)' : 'var(--primary)'
                        }}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer' }}
                        >
                          <option value="pending">{t('pending')}</option>
                          <option value="processing">{t('processing')}</option>
                          <option value="ready">{t('ready')}</option>
                          <option value="completed">{t('completed')}</option>
                          <option value="cancelled">{t('cancelled')}</option>
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
                  {t('stockManagement')} 
                  {filterCategory && <span style={{ marginLeft: '12px', fontSize: '14px', padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '20px' }}>{t(filterCategory)}</span>}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {filterCategory && (
                  <button 
                    onClick={() => setFilterCategory(null)}
                    style={{ padding: '10px 20px', background: 'var(--bg-secondary)', borderRadius: '12px', fontWeight: 600, fontSize: '14px' }}
                  >{t('clearFilter')}</button>
                )}
                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '12px', fontWeight: 700, fontSize: '14px' }}
                >+ {t('addProduct')}</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('product')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('category')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('price')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('stock')}</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory
                    .filter(p => !filterCategory || p.category === filterCategory)
                    .map(product => (
                      <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img src={product.image_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', background: 'var(--bg-tertiary)' }} />
                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{t(product.category)}</td>
                        <td style={{ padding: '20px 24px', fontWeight: 600 }}>{formatPrice(product.price)}</td>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                              onClick={() => updateStock(product.inventory_id, product.id, product.stock - 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}
                            >−</button>
                            <input 
                              type="number" 
                              value={product.stock}
                              onChange={(e) => updateStock(product.inventory_id, product.id, parseInt(e.target.value) || 0)}
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
                              onClick={() => updateStock(product.inventory_id, product.id, product.stock + 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}
                            >+</button>
                          </div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <button style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>{t('save')}</button>
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
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{t(category)}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '24px' }}>
                  {inventory.filter(p => p.category === category).length} {t('productsAvailable')}.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t('viewInventory')}</span>
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
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{t('addNewProduct')}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>{t('fillDetails')}</p>
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('preview')}</label>
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('productName')}</label>
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
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('imageUrl')}</label>
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('category')}</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{t(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('unit')}</label>
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('price')} (RWF)</label>
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('initialStock')}</label>
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
                >{t('cancel')}</button>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '14px', background: 'var(--primary)', color: 'white', borderRadius: '14px', fontWeight: 700, fontSize: '16px', boxShadow: '0 10px 15px -3px rgba(255, 107, 0, 0.3)', transition: 'all 0.2s' }}
                >{t('createProduct')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
