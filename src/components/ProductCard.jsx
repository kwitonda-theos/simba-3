import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, generateImageUrl } from '../utils/helpers';
import Icon from './Icon';

export default function ProductCard({ product }) {
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  const inCart = isInCart(product.id);
  const quantity = getItemQuantity(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantity - 1);
  };

  const imgSrc = imageError ? generateImageUrl(product) : product.image;

  return (
    <Link to={`/product/${product.id}`} className="product-card" id={`product-${product.id}`} style={{ borderRadius: '20px' }}>
      <div className="product-card-image" style={{ aspectRatio: '1.1' }}>
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {product.inStock && (
          <span className="product-card-badge" style={{ padding: '4px 8px', fontSize: '10px' }}>
            {t('inStock')}
          </span>
        )}
      </div>
      <div className="product-card-body" style={{ padding: '12px' }}>
        <span className="product-card-category" style={{ fontSize: '10px', padding: '3px 8px', marginBottom: '4px' }}>{t(product.category)}</span>
        <h3 className="product-card-name" style={{ fontSize: '14px', minHeight: '2.8em', marginBottom: '8px' }}>{product.name}</h3>
        <span className="product-card-unit" style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>{product.unit}</span>
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="product-card-price" style={{ fontSize: '16px' }}>{formatPrice(product.price)}</span>
            <span className="product-card-price-currency" style={{ fontSize: '10px' }}> RWF</span>
          </div>
          
          {inCart ? (
            <div className="quantity-controls quantity-controls--card" style={{ width: '100%', justifyContent: 'space-between', padding: '4px' }}>
              <button type="button" className="qty-btn" onClick={handleDecrement} style={{ width: '28px', height: '28px' }} aria-label="Decrease quantity"><Icon name="minus" size={12} /></button>
              <span className="qty-value" style={{ fontSize: '13px' }}>{quantity}</span>
              <button type="button" className="qty-btn" onClick={handleIncrement} style={{ width: '28px', height: '28px' }} aria-label="Increase quantity"><Icon name="plus" size={12} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="quantity-controls quantity-controls--card" style={{ width: '100%', justifyContent: 'space-between', padding: '4px' }}>
                <button type="button" className="qty-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedQty(Math.max(1, selectedQty - 1)); }} style={{ width: '28px', height: '28px' }} aria-label="Decrease selected quantity"><Icon name="minus" size={12} /></button>
                <span className="qty-value" style={{ fontSize: '13px' }}>{selectedQty}</span>
                <button type="button" className="qty-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedQty(selectedQty + 1); }} style={{ width: '28px', height: '28px' }} aria-label="Increase selected quantity"><Icon name="plus" size={12} /></button>
              </div>
              <button
                className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
                onClick={handleAddToCart}
                id={`add-cart-${product.id}`}
                style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '12px' }}
              >
                {justAdded ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />} 
                <span style={{ marginLeft: '4px' }}>{justAdded ? t('added') : t('addToCart')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
