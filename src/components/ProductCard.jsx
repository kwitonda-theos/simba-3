import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, generateImageUrl } from '../utils/helpers';

export default function ProductCard({ product }) {
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = isInCart(product.id);
  const quantity = getItemQuantity(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
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
          <span className="product-card-badge">{t('inStock')}</span>
        )}
      </div>
      <div className="product-card-body">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <span className="product-card-unit">{product.unit}</span>
        <div className="product-card-footer">
          <div>
            <span className="product-card-price">{formatPrice(product.price)}</span>
            <span className="product-card-price-currency"> RWF</span>
          </div>
          {inCart ? (
            <div className="quantity-controls">
              <button className="qty-btn" onClick={handleDecrement}>−</button>
              <span className="qty-value">{quantity}</span>
              <button className="qty-btn" onClick={handleIncrement}>+</button>
            </div>
          ) : (
            <button
              className={`add-to-cart-btn ${justAdded ? 'added' : ''}`}
              onClick={handleAddToCart}
              id={`add-cart-${product.id}`}
            >
              {justAdded ? '✓' : '+'} <span>{justAdded ? t('added') : t('addToCart')}</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
