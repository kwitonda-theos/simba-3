import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/helpers';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
  } = useCart();
  const { t } = useLanguage();

  const total = getCartTotal();
  const count = getCartCount();
  const deliveryFee = total >= 50000 ? 0 : 2000;

  return (
    <>
      <div
        className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
        id="cart-overlay"
      />
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`} id="cart-drawer">
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            {t('shoppingCart')} ({count} {t('items')})
          </h2>
          <button
            className="cart-drawer-close"
            onClick={() => setIsCartOpen(false)}
            id="cart-close"
          >✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <p className="empty-cart-text">{t('emptyCart')}</p>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>{t('emptyCartText')}</p>
            <button
              className="add-to-cart-btn"
              onClick={() => setIsCartOpen(false)}
            >
              {t('continueShopping')}
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item" id={`cart-item-${item.id}`}>
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">{formatPrice(item.price)} RWF</p>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                      >{t('remove')}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer-footer">
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
              <Link
                to="/checkout"
                className="checkout-btn"
                onClick={() => setIsCartOpen(false)}
                id="checkout-btn"
              >
                {t('proceedCheckout')} →
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
