import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/helpers';
import Icon from '../components/Icon';

export default function BranchDashboard({ products: initialProducts, categories }) {
  const { user, logout, isBranchManager, isBranchStaff } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [branchStaff, setBranchStaff] = useState([]);
  const [newOrderFlash, setNewOrderFlash] = useState(null);
  const [currentBranchIdRef, setCurrentBranchIdRef] = useState(null);
  
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, activeTab]);

  // Realtime subscription for new orders
  useEffect(() => {
    if (!currentBranchIdRef) return;

    const channel = supabase
      .channel('branch-orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `branch_id=eq.${currentBranchIdRef}`
      }, (payload) => {
        console.log('New order received:', payload.new);
        setNewOrderFlash(payload.new.order_number);
        setTimeout(() => setNewOrderFlash(null), 4000);
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `branch_id=eq.${currentBranchIdRef}`
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBranchIdRef]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 0. Fetch User's Branch Info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          primary_branch_id,
          branches:primary_branch_id (id, name)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const currentBranchId = profileData?.primary_branch_id;
      setBranchInfo(profileData?.branches);
      setCurrentBranchIdRef(currentBranchId);
      
      // 0.1 Fetch Branch Staff if Manager
      if (isBranchManager && currentBranchId) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('primary_branch_id', currentBranchId)
          .eq('role', 'branch_staff');
        setBranchStaff(staffData || []);
      }

      // 1. Fetch Orders
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentBranchId) {
        ordersQuery = ordersQuery.eq('branch_id', currentBranchId);
        
        // If Staff, only show assigned orders
        if (isBranchStaff) {
          ordersQuery = ordersQuery.eq('assigned_to', user.id);
        }
      }

      const { data: ordersData, error: ordersError } = await ordersQuery;
      
      if (ordersError) {
        console.error('Orders fetch error:', ordersError);
        throw ordersError;
      }

      if (ordersData && ordersData.length > 0) {
        const customerIds = [...new Set(ordersData.map(o => o.customer_id))].filter(Boolean);
        const staffIds = [...new Set(ordersData.map(o => o.assigned_to))].filter(Boolean);
        const allIds = [...new Set([...customerIds, ...staffIds])];

        if (allIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', allIds);
          
          const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
          
          setOrders(ordersData.map(o => ({
            ...o,
            customerProfile: profileMap[o.customer_id],
            staffProfile: profileMap[o.assigned_to]
          })));
        } else {
          setOrders(ordersData);
        }
      } else {
        setOrders([]);
      }

      // 2. Fetch Inventory
      let inventoryQuery = supabase
        .from('inventory')
        .select(`
          *,
          products (*)
        `);
      
      if (currentBranchId) {
        inventoryQuery = inventoryQuery.eq('branch_id', currentBranchId);
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
      const updateData = { status: newStatus.toLowerCase() };
      // Record pickup timestamp when completing
      if (newStatus.toLowerCase() === 'completed') {
        updateData.picked_up_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
    } catch (err) {
      alert('Failed to update order: ' + err.message);
    }
  };

  const confirmPickup = async (orderId, orderNumber) => {
    if (window.confirm(`Confirm that order #${orderNumber} has been picked up by the customer?`)) {
      await updateOrderStatus(orderId, 'completed');
    }
  };

  const flagCustomer = async (customerId, orderNumber) => {
    if (window.confirm(`Flag customer for order #${orderNumber} as a no-show? This will increase their future deposit requirement.`)) {
      try {
        const { data: profile } = await supabase.from('profiles').select('no_show_flags').eq('id', customerId).single();
        const currentFlags = profile?.no_show_flags || 0;
        
        const { error } = await supabase
          .from('profiles')
          .update({ no_show_flags: currentFlags + 1 })
          .eq('id', customerId);

        if (error) throw error;
        alert(t('customerFlagged'));
      } catch (err) {
        alert('Failed to flag customer: ' + err.message);
      }
    }
  };

  const assignOrder = async (orderId, staffId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_to: staffId || null,
          status: staffId ? 'processing' : 'pending' 
        })
        .eq('id', orderId);

      if (error) throw error;
      
      const selectedStaff = branchStaff.find(s => s.id === staffId);
      
      setOrders(orders.map(o => o.id === orderId ? { 
        ...o, 
        assigned_to: staffId || null,
        status: staffId ? 'processing' : o.status,
        staffProfile: selectedStaff
      } : o));
    } catch (err) {
      alert('Failed to assign order: ' + err.message);
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
      const currentBranchId = branchInfo?.id;
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

      if (currentBranchId) {
        const { error: invError } = await supabase
          .from('inventory')
          .insert({
            branch_id: currentBranchId,
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
    { id: 'orders', label: t('orders'), icon: 'file' },
    { id: 'inventory', label: t('inventory'), icon: 'box' },
    { id: 'categories', label: t('categories'), icon: 'tag' },
    { id: 'analytics', label: t('analytics'), icon: 'chart' },
  ];

  const getStatusLabel = (status) => {
    if (!status) return t('pending');
    const s = status.toLowerCase();
    switch(s) {
      case 'pending': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="file" size={14} /> {t('pending')}</span>;
      case 'processing': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="settings" size={14} /> {t('preparing')}</span>;
      case 'ready': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="truck" size={14} /> {t('readyForPickup')}</span>;
      case 'completed': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="check" size={14} /> {t('completed')}</span>;
      case 'cancelled': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="x" size={14} /> {t('cancelled')}</span>;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '20px' }}>
              <Icon name="shield" size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Simba Admin</span>
          </div>
          <div style={{ 
            background: '#000', 
            color: '#fff', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            fontSize: '11px', 
            fontWeight: 800, 
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            {isBranchManager ? 'Branch Manager' : 'Branch Staff'}
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--primary)', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px',
            background: 'var(--primary-glow)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 107, 0, 0.1)'
          }}>
             <Icon name="mapPin" size={16} /> {branchInfo ? branchInfo.name : 'Main Branch'}
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
              <Icon name={item.icon} size={20} />
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
            <Icon name="logout" size={20} /> {t('logout')}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '16px', margin: 0 }}>
                {t('welcomeBackManager')}, <strong>{user?.name}</strong>
              </p>
              <span style={{ 
                padding: '6px 16px', 
                background: 'var(--primary-glow)', 
                color: 'var(--primary)', 
                borderRadius: '99px',
                fontSize: '14px',
                fontWeight: 700,
                border: '1px solid rgba(255, 107, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Icon name="mapPin" size={14} /> {branchInfo ? branchInfo.name : 'Main Branch'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{t('currentDate')}</div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{new Date().toLocaleDateString(language === 'en' ? 'en-GB' : (language === 'fr' ? 'fr-FR' : 'rw-RW'), { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </header>

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <>
            {/* New Order Flash Notification */}
            {newOrderFlash && (
              <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'flashIn 0.4s ease-out'
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Icon name="bell" size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>🎉 New Order Received!</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Order #{newOrderFlash} just came in</div>
                </div>
              </div>
            )}

            {/* Order Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: t('orders'), value: orders.length, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', icon: 'file' },
                { label: t('pending'), value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: 'clock' },
                { label: t('readyForPickup'), value: orders.filter(o => o.status === 'ready').length, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: 'box' },
                { label: t('completed'), value: orders.filter(o => o.status === 'completed').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'check' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '20px',
                  background: 'var(--bg-card)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: stat.color, flexShrink: 0
                  }}>
                    <Icon name={stat.icon} size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <style>{`
              @keyframes flashIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes pulseGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
                50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
              }
              .order-row:hover {
                background: var(--bg-secondary) !important;
              }
              .confirm-pickup-btn:hover {
                transform: scale(1.03);
                box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35) !important;
              }
              .flag-btn:hover {
                background: rgba(239, 68, 68, 0.12) !important;
              }
            `}</style>

            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon name="file" size={20} />
                  {isBranchManager ? t('recentTransactions') : 'My Assigned Orders'}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {orders.length} {t('orders').toLowerCase()}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('id')}</th>
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('pickupTime')}</th>
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('customer')}</th>
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('amount')}</th>
                      {isBranchManager && <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Assigned To</th>}
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('status')}</th>
                      <th style={{ padding: '14px 24px', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={isBranchManager ? 7 : 6} style={{ padding: '60px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-tertiary)' }}>
                             <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <Icon name="file" size={32} style={{ opacity: 0.2 }} />
                             </div>
                             <div style={{ fontWeight: 600 }}>{isBranchStaff ? 'No orders assigned to you yet.' : 'No orders found for this branch.'}</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => {
                        const statusStyles = {
                          pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' },
                          processing: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' },
                          ready: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' },
                          completed: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' },
                          cancelled: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' },
                        };
                        const sStyle = statusStyles[order.status] || statusStyles.pending;

                        return (
                          <tr key={order.id} className="order-row" style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                            <td style={{ padding: '18px 24px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>#{order.order_number}</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                                {order.pickup_time ? new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                                {order.pickup_time ? new Date(order.pickup_time).toLocaleDateString() : '—'}
                              </div>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px' }}>{order.customerProfile?.full_name || 'Customer'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{order.contact_phone}</div>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{formatPrice(order.total_amount || 0)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)' }}>RWF</span></div>
                            </td>
                            {isBranchManager && (
                              <td style={{ padding: '18px 24px' }}>
                                <select 
                                  value={order.assigned_to || ''} 
                                  onChange={(e) => assignOrder(order.id, e.target.value)}
                                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                >
                                  <option value="">Unassigned</option>
                                  {branchStaff.map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                                  ))}
                                </select>
                              </td>
                            )}
                            <td style={{ padding: '18px 24px' }}>
                              <span style={{ 
                                padding: '6px 14px', 
                                borderRadius: '99px', 
                                fontSize: '12px', 
                                fontWeight: 700,
                                background: sStyle.bg,
                                color: sStyle.color,
                                border: sStyle.border,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap'
                              }}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td style={{ padding: '18px 24px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {isBranchStaff ? (
                                  <>
                                    {order.status === 'processing' && (
                                      <button 
                                        onClick={() => updateOrderStatus(order.id, 'ready')}
                                        style={{ padding: '8px 14px', background: 'var(--primary)', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none' }}
                                      >Mark Ready</button>
                                    )}
                                    {order.status === 'ready' && (
                                      <button 
                                        className="confirm-pickup-btn"
                                        onClick={() => confirmPickup(order.id, order.order_number)}
                                        style={{ padding: '8px 14px', background: 'var(--accent-emerald)', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                                      >✓ Confirm Pickup</button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <select 
                                      value={order.status} 
                                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                      style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                    >
                                      <option value="pending">{t('pending')}</option>
                                      <option value="processing">{t('preparing')}</option>
                                      <option value="ready">{t('readyForPickup')}</option>
                                      <option value="completed">{t('completed')}</option>
                                      <option value="cancelled">{t('cancelled')}</option>
                                    </select>
                                    {order.status === 'ready' && (
                                      <button 
                                        className="confirm-pickup-btn"
                                        onClick={() => confirmPickup(order.id, order.order_number)}
                                        style={{ padding: '8px 14px', background: '#10b981', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', animation: 'pulseGlow 2s infinite' }}
                                      >✓ Confirm Pickup</button>
                                    )}
                                    {order.status === 'ready' && (
                                      <button
                                        className="flag-btn"
                                        onClick={() => flagCustomer(order.customer_id, order.order_number)}
                                        style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(239, 68, 68, 0.15)' }}
                                      >⚑ No-Show</button>
                                    )}
                                    {order.status === 'completed' && order.picked_up_at && (
                                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                                        ✓ {new Date(order.picked_up_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                            >−</button>
                            <input 
                              type="number" 
                              value={product.stock}
                              onChange={(e) => updateStock(product.inventory_id, product.id, parseInt(e.target.value) || 0)}
                              style={{ 
                                width: '55px', 
                                padding: '6px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border-color)', 
                                textAlign: 'center',
                                fontWeight: 700,
                                background: 'transparent',
                                color: product.stock === 0 ? 'var(--accent-red)' : 'inherit'
                              }}
                            />
                            <button 
                              onClick={() => updateStock(product.inventory_id, product.id, product.stock + 1)}
                              style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                            >+</button>
                          </div>
                          {product.stock === 0 && (
                            <div style={{ fontSize: '10px', color: 'var(--accent-red)', fontWeight: 700, marginTop: '4px', textTransform: 'uppercase' }}>{t('outOfStock')}</div>
                          )}
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          {product.stock > 0 ? (
                            <button 
                              onClick={() => updateStock(product.inventory_id, product.id, 0)}
                              style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: '12px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}
                            >
                              Mark out of stock
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 600 }}>No Action</span>
                          )}
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
                <div style={{ marginBottom: '16px', color: 'var(--primary)' }}>
                  <Icon name="tag" size={32} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{t(category)}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '24px' }}>
                  {inventory.filter(p => p.category === category).length} {t('productsAvailable')}.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{t('viewInventory')}</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="arrowRight" size={18} />
                  </div>
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
              >
                <Icon name="x" size={20} />
              </button>
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
                      <Icon name="box" size={32} style={{ opacity: 0.3 }} />
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
