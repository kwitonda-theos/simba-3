import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryIcon } from '../utils/helpers';

export default function CategoryNav({ categories, activeCategory }) {
  const { t } = useLanguage();

  const renderNavItems = (prefix) => (
    <>
      <li key={`${prefix}-all`}>
        <Link
          to="/category/all"
          className={`category-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
          id={`${prefix}-cat-nav-all`}
        >
          🏪 {t('allCategories')}
        </Link>
      </li>
      {categories.map(cat => (
        <li key={`${prefix}-${cat}`}>
          <Link
            to={`/category/${encodeURIComponent(cat)}`}
            className={`category-nav-item ${activeCategory === cat ? 'active' : ''}`}
            id={`${prefix}-cat-nav-${cat.replace(/[^a-zA-Z]/g, '')}`}
          >
            {getCategoryIcon(cat)} {t(cat)}
          </Link>
        </li>
      ))}
    </>
  );

  return (
    <nav className="category-nav" id="category-nav">
      <div className="container">
        <div className="category-scroll-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <ul className="category-nav-list" style={{ padding: '8px 0', animation: 'none' }}>
            {renderNavItems('group1')}
          </ul>
        </div>
      </div>
      <style>{`
        .category-scroll-wrapper::-webkit-scrollbar {
          display: none;
        }
        .category-nav-list {
          display: flex;
          gap: 12px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .category-nav-item {
          white-space: nowrap;
          padding: 10px 20px;
          background: var(--bg-tertiary);
          border-radius: 999px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .category-nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.25);
        }
      `}</style>
    </nav>
  );
}
