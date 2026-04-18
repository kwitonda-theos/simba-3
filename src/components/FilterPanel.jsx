import { useLanguage } from '../context/LanguageContext';

export default function FilterPanel({
  categories,
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onClear,
  showMobile,
  onCloseMobile,
  categoryCounts,
}) {
  const { t } = useLanguage();

  const handleCategoryToggle = (cat) => {
    if (selectedCategories.includes(cat)) {
      onCategoryChange(selectedCategories.filter(c => c !== cat));
    } else {
      onCategoryChange([...selectedCategories, cat]);
    }
  };

  return (
    <aside className={`filter-panel ${showMobile ? 'show-mobile' : ''}`} id="filter-panel">
      <button className="filter-close-mobile" onClick={onCloseMobile}>✕</button>

      <div className="filter-section">
        <h3 className="filter-title">{t('priceRange')}</h3>
        <div className="filter-range">
          <input
            type="number"
            className="filter-input"
            placeholder={t('minPrice')}
            value={priceRange[0] || ''}
            onChange={(e) => onPriceChange([e.target.value ? Number(e.target.value) : 0, priceRange[1]])}
            id="filter-min-price"
          />
          <span>—</span>
          <input
            type="number"
            className="filter-input"
            placeholder={t('maxPrice')}
            value={priceRange[1] || ''}
            onChange={(e) => onPriceChange([priceRange[0], e.target.value ? Number(e.target.value) : Infinity])}
            id="filter-max-price"
          />
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">{t('categories')}</h3>
        <div className="filter-checkbox-list">
          {categories.map(cat => (
            <label key={cat} className="filter-checkbox">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryToggle(cat)}
              />
              <span>{cat}</span>
              {categoryCounts && (
                <span className="filter-checkbox-count">{categoryCounts[cat] || 0}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        className="add-to-cart-btn"
        onClick={onClear}
        style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
        id="clear-filters"
      >
        {t('clearFilters')}
      </button>
    </aside>
  );
}
