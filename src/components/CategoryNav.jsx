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
            {getCategoryIcon(cat)} {cat}
          </Link>
        </li>
      ))}
    </>
  );

  return (
    <nav className="category-nav" id="category-nav">
      <div className="container">
        <div className="category-scroll-wrapper">
          <ul className="category-nav-list marquee-anim">
            {renderNavItems('group1')}
          </ul>
          <ul className="category-nav-list marquee-anim" aria-hidden="true">
            {renderNavItems('group2')}
          </ul>
        </div>
      </div>
    </nav>
  );
}
