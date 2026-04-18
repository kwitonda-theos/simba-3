import ProductCard from './ProductCard';
import { useLanguage } from '../context/LanguageContext';

export default function ProductGrid({ products, title, showCount = true }) {
  const { t } = useLanguage();

  return (
    <div className="products-section">
      {title && (
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {showCount && (
            <span className="product-count">
              {products.length} {t('showingProducts')}
            </span>
          )}
        </div>
      )}
      {products.length > 0 ? (
        <div className="product-grid" id="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3 className="no-results-title">{t('noResults')}</h3>
          <p className="no-results-text">{t('noResultsText')}</p>
        </div>
      )}
    </div>
  );
}
