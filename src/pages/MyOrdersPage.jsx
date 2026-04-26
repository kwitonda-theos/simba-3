import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../utils/helpers';
import Icon from '../components/Icon';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
          branches (id, name),
          order_items (
            *,
            products (name, image_url)
          ),
          branch_reviews (id, rating, comment)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map Supabase data to frontend format
      const formattedOrders = (data || []).map(order => ({
        id: order.id,
        branchId: order.branch_id,
        orderNumber: order.order_number,
        date: order.created_at,
        total: order.total_amount,
        status: order.status,
        pickupTime: order.pickup_time,
        depositAmount: order.deposit_amount,
        displayStatus: getDisplayStatus(order.status),
        customerName: user.name,
        pickupBranch: order.branches?.name || 'Main Branch',
        isReviewed: order.branch_reviews && order.branch_reviews.length > 0,
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert(t('ratingRequired'));
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('branch_reviews')
        .insert({
          order_id: reviewingOrder.id,
          branch_id: reviewingOrder.branchId,
          customer_id: user.id,
          rating,
          comment
        });

      if (error) throw error;
      
      alert(t('reviewSubmitted'));
      setReviewingOrder(null);
      setRating(0);
      setComment('');
      fetchOrders();
    } catch (err) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getDisplayStatus = (status) => {
    if (!status) return t('pending');
    const s = status.toLowerCase();
    switch(s) {
      case 'pending': return t('pending');
      case 'processing': return t('preparing');
      case 'ready': return t('readyForPickup');
      case 'completed': return t('completed');
      case 'cancelled': return t('cancelled');
      default: return status.charAt(0).toUpperCase() + status.slice(1);
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
          <div style={{ width: '80px', height: '80px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Icon name="box" size={40} style={{ opacity: 0.3 }} />
          </div>
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
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: 'clamp(16px, 5vw, 32px)', flexWrap: 'wrap', width: '100%' }}>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('orderPlacedOn')}</div>
                    <div style={{ fontWeight: 600 }}>{new Date(order.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('total')}</div>
                    <div style={{ fontWeight: 600 }}>{formatPrice(order.total)} RWF</div>
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('pickupDetails')}</div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="mapPin" size={14} color="var(--primary)" /> {order.pickupBranch}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {order.pickupTime ? new Date(order.pickupTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'ASAP'}
                    </div>
                  </div>
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#{order.orderNumber}</div>
                  <div style={{ 
                    fontWeight: 700, 
                    color: order.status === 'cancelled' ? 'var(--accent-red)' : 'var(--primary)', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px'
                  }}>
                    {order.displayStatus}
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {order.depositAmount > 0 && (
                  <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--primary-glow)', borderRadius: '12px', border: '1px solid rgba(255, 107, 0, 0.1)', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{t('depositAmount')} Paid:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(order.depositAmount)} RWF</span>
                  </div>
                )}

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

                {order.status === 'pending' && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => cancelOrder(order.id)}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--accent-red)', 
                        color: 'var(--accent-red)', 
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => { e.target.style.background = 'var(--accent-red)'; e.target.style.color = 'white'; }}
                      onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--accent-red)'; }}
                    >
                      {t('cancelOrder')}
                    </button>
                  </div>
                )}

                {order.status === 'completed' && !order.isReviewed && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setReviewingOrder(order)}
                      style={{ 
                        padding: '10px 24px', 
                        borderRadius: '12px', 
                        background: 'var(--primary)', 
                        color: 'white', 
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 107, 0, 0.2)'
                      }}
                    >
                      ⭐ {t('rateExperience')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{t('rateExperience')}</h2>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>How was your pickup at <strong>{reviewingOrder.pickupBranch}</strong>?</p>
            
            <form onSubmit={handleReviewSubmit}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '32px', color: star <= rating ? '#FFD700' : 'var(--border-color)', transition: 'transform 0.1s' }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>{t('leaveComment')}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '120px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setReviewingOrder(null)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', fontWeight: 700 }}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={submittingReview}
                  style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 700, opacity: submittingReview ? 0.7 : 1 }}
                >
                  {submittingReview ? t('processing') : t('submitReview')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
