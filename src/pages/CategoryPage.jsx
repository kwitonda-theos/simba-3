import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';
import ProductGrid from '../components/ProductGrid';
import FilterPanel from '../components/FilterPanel';
import { useLanguage } from '../context/LanguageContext';
import { conversationalSearch } from '../utils/groq';
import Icon from '../components/Icon';

const PRODUCTS_PER_PAGE = 24;

export default function CategoryPage({ products, categories }) {
  const { categoryName } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const searchQuery = searchParams.get('search') || '';
  const decodedCategory = decodeURIComponent(categoryName || 'all');

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [sortBy, setSortBy] = useState('default');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  // AI Search States
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProductIds, setAiProductIds] = useState(null);

  // Intercept Search for AI
  useEffect(() => {
    async function performAiSearch() {
      if (!searchQuery) {
        setAiMessage('');
        setAiProductIds(null);
        return;
      }

      setAiLoading(true);
      setAiMessage('');
      
      try {
        const result = await conversationalSearch(searchQuery, products);
        setAiMessage(result.message);
        setAiProductIds(result.productIds);
      } catch (err) {
        console.error('AI Search failed, falling back to traditional search:', err);
        setAiMessage('');
        setAiProductIds(null);
      } finally {
        setAiLoading(false);
      }
    }

    performAiSearch();
  }, [searchQuery, products]);

  // Category counts across all products
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // AI Filter
    if (aiProductIds && aiProductIds.length > 0) {
      result = result.filter(p => aiProductIds.includes(p.id));
    } else if (searchQuery && !aiLoading) {
      // Fallback to traditional search if AI didn't return IDs or failed
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category from URL
    if (decodedCategory !== 'all') {
      result = result.filter(p => p.category === decodedCategory);
    }

    // Category checkboxes (additional filter within "all")
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Price range
    result = result.filter(p => {
      const min = priceRange[0] || 0;
      const max = priceRange[1] || Infinity;
      return p.price >= min && p.price <= max;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, decodedCategory, selectedCategories, searchQuery, priceRange, sortBy, aiProductIds, aiLoading]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, Infinity]);
    setSortBy('default');
  };

  const pageTitle = decodedCategory === 'all'
    ? (searchQuery ? `"${searchQuery}"` : t('allProducts'))
    : `${t('productsIn')} ${t(decodedCategory)}`;

  return (
    <div id="category-page">
      <CategoryNav categories={categories} activeCategory={decodedCategory} />

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">{t('home')}</Link>
          <span className="breadcrumb-separator">›</span>
          <span>{decodedCategory === 'all' ? t('allProducts') : t(decodedCategory)}</span>
        </div>

        {/* AI Response Section */}
        {searchQuery && (
          <div style={{ 
            marginBottom: '32px', 
            background: 'var(--primary-glow)', 
            padding: '24px', 
            borderRadius: '24px', 
            border: '1px solid rgba(255, 107, 0, 0.2)',
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                background: 'var(--primary)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white'
              }}>
                <Icon name="sparkles" size={18} />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Assistant</span>
            </div>
            
            {aiLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--primary)' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Searching our catalog for you...</p>
              </div>
            ) : (
              <p style={{ 
                margin: 0, 
                fontSize: '18px', 
                lineHeight: 1.6, 
                color: 'var(--text-primary)', 
                fontWeight: 500 
              }}>
                {aiMessage || `I found ${filteredProducts.length} products matching "${searchQuery}".`}
              </p>
            )}
          </div>
        )}

        <div className="section-header">
          <h1 className="section-title">{pageTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="product-count">
              {filteredProducts.length} {t('showingProducts')}
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              id="sort-select"
            >
              <option value="default">{t('sortDefault')}</option>
              <option value="price-asc">{t('sortPriceLow')}</option>
              <option value="price-desc">{t('sortPriceHigh')}</option>
              <option value="name-asc">{t('sortNameAZ')}</option>
              <option value="name-desc">{t('sortNameZA')}</option>
            </select>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <button
          className="filter-toggle-mobile"
          onClick={() => setShowMobileFilter(true)}
          id="filter-toggle-mobile"
        >
          ⚙️ {t('filters')}
        </button>

        <div className={`page-layout ${decodedCategory === 'all' ? 'has-sidebar' : ''}`}>
          {decodedCategory === 'all' && (
            <FilterPanel
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              onClear={handleClearFilters}
              showMobile={showMobileFilter}
              onCloseMobile={() => setShowMobileFilter(false)}
              categoryCounts={categoryCounts}
            />
          )}

          <div className="page-content">
            <ProductGrid products={visibleProducts} showCount={false} />

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button
                  className="hero-cta"
                  style={{ display: 'inline-flex' }}
                  onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                  id="load-more-btn"
                >
                  {t('loadMore')} ({filteredProducts.length - visibleCount} {t('showingProducts')})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
