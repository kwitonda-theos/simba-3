import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, generateOrderNumber } from '../utils/helpers';

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kigali',
    district: '',
    notes: '',
    paymentMethod: 'momo-mtn',
    momoNumber: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const total = getCartTotal();
  const deliveryFee = total >= 50000 ? 0 : 2000;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const number = generateOrderNumber();
      setOrderNumber(number);
      setOrderPlaced(true);
      setIsProcessing(false);
      clearCart();
    }, 2000);
  };

  if (orderPlaced) {
    return (
      <div className="container">
        <div className="confirmation" id="order-confirmation">
          <div className="confirmation-icon">✓</div>
          <h1 className="confirmation-title">{t('orderConfirmed')}</h1>
          <p className="confirmation-text">{t('orderConfirmedText')}</p>
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              {t('orderNumber')}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px' }}>
              {orderNumber}
            </div>
          </div>
          <Link to="/" className="hero-cta" style={{ display: 'inline-flex' }} id="back-home-btn">
            {t('backToHome')} →
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container">
        <div className="confirmation">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <h2>{t('emptyCart')}</h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>{t('emptyCartText')}</p>
          <Link to="/" className="hero-cta" style={{ display: 'inline-flex' }}>
            {t('continueShopping')} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" id="checkout-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">{t('home')}</Link>
          <span className="breadcrumb-separator">›</span>
          <span>{t('checkout')}</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: '24px' }}>{t('checkout')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="checkout-grid">
            <div>
              {/* Delivery Info */}
              <div className="checkout-form-section" style={{ marginBottom: '24px' }}>
                <h2 className="checkout-section-title">
                  <span className="checkout-section-number">1</span>
                  {t('deliveryInfo')}
                </h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t('firstName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      id="input-firstname"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('lastName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      id="input-lastname"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('email')}</label>
                    <input
                      type="email"
                      className="form-input"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      id="input-email"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('phone')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="07X XXX XXXX"
                      id="input-phone"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">{t('address')}</label>
                    <input
                      type="text"
                      className="form-input"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      id="input-address"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('city')}</label>
                    <input
                      type="text"
                      className="form-input"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      id="input-city"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('district')}</label>
                    <select
                      className="form-input"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      id="input-district"
                    >
                      <option value="">Select District</option>
                      <option value="Gasabo">Gasabo</option>
                      <option value="Kicukiro">Kicukiro</option>
                      <option value="Nyarugenge">Nyarugenge</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">{t('notes')}</label>
                    <textarea
                      className="form-input"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t('notesPlaceholder')}
                      id="input-notes"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-form-section">
                <h2 className="checkout-section-title">
                  <span className="checkout-section-number">2</span>
                  {t('paymentMethod')}
                </h2>
                <div className="payment-methods">
                  <div
                    className={`payment-option ${formData.paymentMethod === 'momo-mtn' ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'momo-mtn' }))}
                    id="payment-mtn"
                  >
                    <div className="payment-option-radio" />
                    <div className="payment-option-icon">📱</div>
                    <div className="payment-option-info">
                      <div className="payment-option-name">{t('momoMTN')}</div>
                      <div className="payment-option-desc">{t('momoMTNDesc')}</div>
                    </div>
                    <div style={{
                      background: '#FFCC00',
                      color: '#000',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>MTN</div>
                  </div>

                  <div
                    className={`payment-option ${formData.paymentMethod === 'momo-airtel' ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'momo-airtel' }))}
                    id="payment-airtel"
                  >
                    <div className="payment-option-radio" />
                    <div className="payment-option-icon">📱</div>
                    <div className="payment-option-info">
                      <div className="payment-option-name">{t('momoAirtel')}</div>
                      <div className="payment-option-desc">{t('momoAirtelDesc')}</div>
                    </div>
                    <div style={{
                      background: '#ED1C24',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>Airtel</div>
                  </div>

                  <div
                    className={`payment-option ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                    id="payment-cash"
                  >
                    <div className="payment-option-radio" />
                    <div className="payment-option-icon">💵</div>
                    <div className="payment-option-info">
                      <div className="payment-option-name">{t('cashDelivery')}</div>
                      <div className="payment-option-desc">{t('cashDeliveryDesc')}</div>
                    </div>
                  </div>
                </div>

                {(formData.paymentMethod === 'momo-mtn' || formData.paymentMethod === 'momo-airtel') && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">{t('momoNumber')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      name="momoNumber"
                      value={formData.momoNumber}
                      onChange={handleChange}
                      placeholder={t('momoNumberPlaceholder')}
                      required
                      id="input-momo"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary" id="order-summary">
              <h2 className="order-summary-title">{t('orderSummary')}</h2>

              <div className="order-items">
                {cart.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="order-item-img">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <span className="order-item-name">{item.name}</span>
                    <span className="order-item-qty">×{item.quantity}</span>
                    <span className="order-item-price">{formatPrice(item.price * item.quantity)} RWF</span>
                  </div>
                ))}
              </div>

              <div className="cart-summary-row">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(total)} RWF</span>
              </div>
              <div className="cart-summary-row">
                <span>{t('deliveryFee')}</span>
                <span>{deliveryFee === 0 ? t('free') : `${formatPrice(deliveryFee)} RWF`}</span>
              </div>
              <div className="cart-summary-total">
                <span>{t('total')}</span>
                <span>{formatPrice(total + deliveryFee)} RWF</span>
              </div>

              <button
                type="submit"
                className="checkout-btn"
                disabled={isProcessing}
                id="place-order-btn"
              >
                {isProcessing ? (
                  <>
                    <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    {t('processing')}
                  </>
                ) : (
                  <>🔒 {t('placeOrder')}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
