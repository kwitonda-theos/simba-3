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
    <Link to={`/product/${product.id}`} className="product-card" id={`product-${product.id}`}>
      <div className="product-card-image">
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
        />
        {product.inStock && (
          <span className="product-card-badge">
            {t('inStock')}
          </span>
        )}
      </div>
      <div className="product-card-body">
        <span className="product-card-category">{t(product.category)}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <span className="product-card-unit">{product.unit}</span>
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: '12px' }}>
            <span className="product-card-price">{formatPrice(product.price)}</span>
            <span className="product-card-price-currency"> RWF</span>
          </div>
          
          {inCart ? (
            <div className="quantity-controls quantity-controls--card">
              <button type="button" className="qty-btn" onClick={handleDecrement} aria-label="Decrease quantity"><Icon name="minus" size={12} /></button>
              <span className="qty-value">{quantity}</span>
              <button type="button" className="qty-btn" onClick={handleIncrement} aria-label="Increase quantity"><Icon name="plus" size={12} /></button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="quantity-controls quantity-controls--card">
                <button type="button" className="qty-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedQty(Math.max(1, selectedQty - 1)); }} aria-label="Decrease selected quantity"><Icon name="minus" size={12} /></button>
                <span className="qty-value">{selectedQty}</span>
                <button type="button" className="qty-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedQty(selectedQty + 1); }} aria-label="Increase selected quantity"><Icon name="plus" size={12} /></button>
              </div>
              <button
                className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
                onClick={handleAddToCart}
                id={`add-cart-${product.id}`}
              >
                {justAdded ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />} 
                <span>{justAdded ? t('added') : t('addToCart')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
