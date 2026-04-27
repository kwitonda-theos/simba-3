import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranch } from '../context/BranchContext';
import { supabase } from '../lib/supabase';
import { formatPrice, generateOrderNumber } from '../utils/helpers';
import Icon from '../components/Icon';

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { selectedBranch: contextBranch } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    pickupBranch: contextBranch?.name || '',
    pickupTime: '',
    notes: '',
    paymentMethod: 'momo_mtn',
    momoNumber: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [branches, setBranches] = useState([]);
  const [userFlags, setUserFlags] = useState(0);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch branches
      const { data: bData } = await supabase.from('branches').select('*');
      
      // 2. Fetch ratings
      const { data: rData } = await supabase.from('branch_reviews').select('branch_id, rating');
      
      const ratingMap = (rData || []).reduce((acc, r) => {
        if (!acc[r.branch_id]) acc[r.branch_id] = { sum: 0, count: 0 };
        acc[r.branch_id].sum += r.rating;
        acc[r.branch_id].count += 1;
        return acc;
      }, {});

      if (bData) {
        setBranches(bData.map(b => ({
          ...b,
          avgRating: ratingMap[b.id] ? (ratingMap[b.id].sum / ratingMap[b.id].count).toFixed(1) : null,
          reviewCount: ratingMap[b.id] ? ratingMap[b.id].count : 0
        })));
      }

      // 3. Fetch user flags
      if (user) {
        const { data: pData } = await supabase.from('profiles').select('no_show_flags').eq('id', user.id).maybeSingle();
        setUserFlags(pData?.no_show_flags || 0);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (contextBranch && !formData.pickupBranch) {
      setFormData(prev => ({ ...prev, pickupBranch: contextBranch.name }));
    }
  }, [contextBranch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const total = getCartTotal();
  const depositAmount = userFlags >= 2 ? 2000 : 500;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const targetBranch = contextBranch || branches.find(b => b.name === formData.pickupBranch);
    
    if (!targetBranch || !formData.pickupTime) {
      alert('Please select a pickup branch and time.');
      return;
    }

    setIsProcessing(true);

    try {
      const number = generateOrderNumber();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: 'customer'
        });
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: number,
          customer_id: user.id,
          branch_id: targetBranch.id,
          total_amount: total + depositAmount,
          deposit_amount: depositAmount,
          pickup_time: formData.pickupTime,
          status: 'pending',
          contact_phone: formData.phone,
          delivery_address: `Pickup at ${targetBranch.name}`,
          delivery_notes: formData.notes,
          payment_method: formData.paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = [];
      
      for (const item of cart) {
        orderItems.push({
          order_id: orderData.id,
          product_id: item.id,
          quantity: item.quantity,
          price_at_purchase: item.price
        });

        const { data: invItem } = await supabase
          .from('inventory')
          .select('id, stock_quantity')
          .eq('branch_id', targetBranch.id)
          .eq('product_id', item.id)
          .maybeSingle();

        if (invItem) {
          const newStock = Math.max(0, invItem.stock_quantity - item.quantity);
          await supabase
            .from('inventory')
            .update({ stock_quantity: newStock })
            .eq('id', invItem.id);
        }
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(number);
      setOrderPlaced(true);
      setIsProcessing(false);
      clearCart();
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('Failed to place order: ' + err.message);
      setIsProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)', padding: '60px', borderRadius: '32px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--accent-emerald)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '40px' }}>
            <Icon name="check" size={40} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>{t('orderConfirmed')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', lineHeight: 1.6 }}>{t('orderConfirmedText')}</p>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '20px', marginBottom: '40px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{t('orderNumber')}</span>
              <span style={{ fontWeight: 700 }}>#{orderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>{t('pickupBranch')}</span>
              <span style={{ fontWeight: 700 }}>{formData.pickupBranch}</span>
            </div>
          </div>

          <Link to="/" className="btn-primary" style={{ padding: '16px 40px', display: 'inline-block' }}>{t('backToHome')}</Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', 
    padding: '14px 18px', 
    borderRadius: '14px', 
    border: '1.5px solid var(--border-color)', 
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s',
  };

  return (
    <div className="checkout-page" style={{ paddingTop: '120px', paddingBottom: '100px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <div className="container">
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>{t('checkout')}</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Please provide your pickup details and pay the deposit.</p>
        </div>

        <form onSubmit={handleSubmit} className="checkout-grid">
          <div className="checkout-main">
            <div className="checkout-form-section" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
              <div className="checkout-section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('deliveryInfo')}</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('firstName')}</label>
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={inputStyle} className="checkout-input" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('lastName')}</label>
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={inputStyle} className="checkout-input" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('email')}</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} className="checkout-input" />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('phone')}</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="07X XXX XXXX" style={inputStyle} className="checkout-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('pickupBranch')}</label>
                  <select 
                    required 
                    name="pickupBranch" 
                    value={formData.pickupBranch} 
                    onChange={handleChange} 
                    style={inputStyle} 
                    className="checkout-input"
                    disabled={!!contextBranch}
                  >
                    {!contextBranch && <option value="">{t('selectBranchForPickup')}</option>}
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name} {branch.avgRating ? `(⭐ ${branch.avgRating})` : ''}
                      </option>
                    ))}
                  </select>
                  {contextBranch && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Pickup is restricted to the branch you shopped at.</p>}
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('pickupTime')}</label>
                  <input required type="datetime-local" name="pickupTime" value={formData.pickupTime} onChange={handleChange} min={new Date().toISOString().slice(0, 16)} style={inputStyle} className="checkout-input" />
                </div>
              </div>
            </div>

            {userFlags >= 2 && (
              <div style={{ 
                padding: '24px', 
                background: 'rgba(239, 68, 68, 0.08)', 
                borderRadius: '24px', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                marginBottom: '32px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                color: 'var(--accent-red)'
              }}>
                <div style={{ width: '56px', height: '56px', background: 'var(--accent-red)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  <Icon name="shield" size={28} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '18px' }}>{t('highDepositWarning')}</h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--accent-red)', opacity: 0.8, lineHeight: 1.5 }}>
                    Security deposit increased to 2,000 RWF due to previous no-shows.
                  </p>
                </div>
              </div>
            )}

            <div style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, var(--primary-glow) 0%, rgba(255, 107, 0, 0.05) 100%)', 
              borderRadius: '24px', 
              border: '1px solid rgba(255, 107, 0, 0.2)',
              marginBottom: '40px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Icon name="shield" size={28} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '18px' }}>{t('depositAmount')}: {depositAmount} RWF</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('depositInfo')}</p>
              </div>
            </div>

            <div className="checkout-form-section" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
              <div className="checkout-section-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>2</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('paymentMethod')}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: `2px solid ${formData.paymentMethod === 'momo_mtn' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: formData.paymentMethod === 'momo_mtn' ? 'var(--primary-glow)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="paymentMethod" value="momo_mtn" checked={formData.paymentMethod === 'momo_mtn'} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{t('momoMTN')}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t('momoMTNDesc')}</div>
                  </div>
                  <Icon name="smartphone" size={24} />
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  border: `2px solid ${formData.paymentMethod === 'momo_airtel' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: formData.paymentMethod === 'momo_airtel' ? 'var(--primary-glow)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="paymentMethod" value="momo_airtel" checked={formData.paymentMethod === 'momo_airtel'} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{t('momoAirtel')}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{t('momoAirtelDesc')}</div>
                  </div>
                  <Icon name="smartphone" size={24} />
                </label>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('momoNumber')}</label>
                <input required type="tel" name="momoNumber" value={formData.momoNumber} onChange={handleChange} placeholder="07X XXX XXXX" style={inputStyle} className="checkout-input" />
              </div>
            </div>
          </div>

          <aside className="checkout-sidebar">
            <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>{t('orderSummary')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-light)' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.quantity}x {item.name}</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)} RWF</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('subtotal')}</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(total)} RWF</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{t('depositAmount')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{depositAmount} RWF</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-light)', fontSize: '18px' }}>
                  <span style={{ fontWeight: 800 }}>{t('total')}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(total + depositAmount)} RWF</span>
                </div>
              </div>

              <button type="submit" disabled={isProcessing} style={{ 
                width: '100%', 
                padding: '18px', 
                background: 'var(--primary)', 
                color: 'white', 
                borderRadius: '16px', 
                fontWeight: 800, 
                fontSize: '16px',
                boxShadow: '0 10px 15px -3px rgba(255, 107, 0, 0.3)',
                transition: 'all 0.2s',
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}>
                {isProcessing ? t('processing') : t('placeOrder')}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
