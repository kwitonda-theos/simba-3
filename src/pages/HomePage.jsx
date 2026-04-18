import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryNav from '../components/CategoryNav';
import ProductGrid from '../components/ProductGrid';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryImage, getCategoryIcon } from '../utils/helpers';

export default function HomePage({ products, categories }) {
  const { t } = useLanguage();

  // Get featured products (random selection, semi-deterministic)
  const featuredProducts = useMemo(() => {
    const shuffled = [...products].sort((a, b) => {
      // Mix of categories, prefer items with interesting prices
      return (a.id * 7 + b.id * 3) % 11 - 5;
    });
    return shuffled.slice(0, 12);
  }, [products]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div id="home-page">
      <CategoryNav categories={categories} activeCategory="" />
      <Hero />

      {/* Category Cards */}
      <section className="container" style={{ paddingTop: '48px' }}>
        <div className="section-header">
          <h2 className="section-title">{t('browseCategories')}</h2>
          <Link to="/category/all" className="hero-cta" style={{ fontSize: '14px', padding: '10px 24px' }}>
            {t('viewAll')} →
          </Link>
        </div>
        <div className="categories-grid" id="categories-grid">
          {categories.map(cat => (
            <Link
              key={cat}
              to={`/category/${encodeURIComponent(cat)}`}
              className="category-card"
              id={`category-card-${cat.replace(/[^a-zA-Z]/g, '')}`}
            >
              <div
                className="category-card-bg"
                style={{ backgroundImage: `url(${getCategoryImage(cat)})` }}
              />
              <div className="category-card-overlay" />
              <div className="category-card-content">
                <div className="category-card-name">
                  {getCategoryIcon(cat)} {cat}
                </div>
                <div className="category-card-count">
                  {categoryCounts[cat] || 0} {t('showingProducts')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container">
        <ProductGrid
          products={featuredProducts}
          title={t('featuredProducts')}
        />
      </section>
    </div>
  );
}
