import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice, generateImageUrl, getCategoryIcon } from '../utils/helpers';
import ProductGrid from '../components/ProductGrid';

export default function ProductPage({ products }) {
  const { productId } = useParams();
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const product = useMemo(() => {
    return products.find(p => p.id === Number(productId));
  }, [products, productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 8);
  }, [products, product]);

  if (!product) {
    return (
      <div className="container">
        <div className="no-results" style={{ padding: '80px 0' }}>
          <div className="no-results-icon">😕</div>
          <h3 className="no-results-title">Product not found</h3>
          <Link to="/" className="hero-cta" style={{ marginTop: '16px', display: 'inline-flex' }}>
            {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  const inCart = isInCart(product.id);
  const quantity = getItemQuantity(product.id);
  const imgSrc = imageError ? generateImageUrl(product) : product.image;

  const handleAddToCart = () => {
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div id="product-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">{t('home')}</Link>
          <span className="breadcrumb-separator">›</span>
          <Link to={`/category/${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span className="breadcrumb-separator">›</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail">
          <div className="product-detail-grid">
            <div className="product-detail-image">
              <img
                src={imgSrc}
                alt={product.name}
                onError={() => setImageError(true)}
              />
            </div>
            <div className="product-detail-info">
              <span className="product-detail-category">
                {getCategoryIcon(product.category)} {product.category}
              </span>
              <h1 className="product-detail-name">{product.name}</h1>
              <div className="product-detail-price">
                {formatPrice(product.price)} <small>RWF</small>
              </div>

              <div className="product-detail-meta">
                <div className="product-meta-item">
                  <div className="product-meta-icon">📦</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('unit')}</div>
                    <div>{product.unit}</div>
                  </div>
                </div>
                <div className="product-meta-item">
                  <div className="product-meta-icon">
                    {product.inStock ? '✅' : '❌'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('availability')}</div>
                    <div style={{ color: product.inStock ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                      {product.inStock ? t('inStock') : t('outOfStock')}
                    </div>
                  </div>
                </div>
                <div className="product-meta-item">
                  <div className="product-meta-icon">🏷️</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('category')}</div>
                    <div>{product.category}</div>
                  </div>
                </div>
              </div>

              <div className="product-detail-actions">
                {inCart ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div className="quantity-controls" style={{ transform: 'scale(1.3)', transformOrigin: 'left' }}>
                      <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                      <span className="qty-value">{quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                    </div>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '14px' }}>
                      ✅ {t('added')}
                    </span>
                  </div>
                ) : (
                  <button
                    className={`btn-primary-lg ${justAdded ? 'added' : ''}`}
                    onClick={handleAddToCart}
                    id="product-add-cart"
                    style={justAdded ? { background: 'var(--accent-emerald)' } : {}}
                  >
                    {justAdded ? '✓ ' + t('added') : '🛒 ' + t('addToCart')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <ProductGrid
            products={relatedProducts}
            title={t('relatedProducts')}
            showCount={false}
          />
        )}
      </div>
    </div>
  );
}
