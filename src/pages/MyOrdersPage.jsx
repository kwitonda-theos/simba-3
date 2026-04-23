import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/helpers';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          branches (name),
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map Supabase data to frontend format
      const formattedOrders = (data || []).map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        date: order.created_at,
        total: order.total_amount,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        customerName: user.name,
        pickupBranch: order.branches?.name || 'Main Branch',
        items: order.order_items.map(item => ({
          name: item.products?.name,
          image: item.products?.image_url,
          quantity: item.quantity,
          price: item.price_at_purchase
        }))
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (window.confirm(t('confirmCancel'))) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', orderId);

        if (error) throw error;
        
        // Refresh orders
        fetchOrders();
      } catch (err) {
        alert('Failed to cancel order: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '60vh' }}>
      <div className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link to="/">{t('home')}</Link>
        <span className="breadcrumb-separator">›</span>
        <span>{t('myOrders')}</span>
      </div>

      <h1 className="section-title" style={{ marginBottom: '32px' }}>{t('myOrders')}</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>📦</div>
          <h3>{t('noOrders')}</h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>{t('noOrdersText')}</p>
          <Link to="/" className="hero-cta" style={{ display: 'inline-flex' }}>
            {t('startShopping')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ 
              background: 'var(--bg-card)', 
              borderRadius: '20px', 
              border: '1px solid var(--border-color)', 
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ 
                padding: '20px 24px', 
                background: 'var(--bg-secondary)', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('orderPlacedOn')}</div>
                    <div style={{ fontWeight: 600 }}>{new Date(order.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('total')}</div>
                    <div style={{ fontWeight: 600 }}>{formatPrice(order.total)} RWF</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('shipTo')}</div>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('branch')}</div>
                    <div style={{ fontWeight: 600 }}>{order.pickupBranch === 'Main Branch' ? t('mainBranch') : (order.pickupBranch || t('mainBranch'))}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', textAlign: 'right' }}>{t('orderNumber')} # {order.orderNumber}</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', textAlign: 'right' }}>{order.status}</div>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{t('items')}: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)} RWF</div>
                    </div>
                  ))}
                </div>

                {order.status === 'Pending' && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => cancelOrder(order.id)}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--accent-red)', 
                        color: 'var(--accent-red)', 
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.target.style.background = 'var(--accent-red)'; e.target.style.color = 'white'; }}
                      onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--accent-red)'; }}
                    >
                      {t('cancelOrder')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
