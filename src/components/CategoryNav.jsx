import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCategoryIcon } from '../utils/helpers';

export default function CategoryNav({ categories, activeCategory }) {
  const { t } = useLanguage();

  return (
    <nav className="category-nav" id="category-nav">
      <div className="container">
        <ul className="category-nav-list">
          <li>
            <Link
              to="/category/all"
              className={`category-nav-item ${activeCategory === 'all' ? 'active' : ''}`}
              id="cat-nav-all"
            >
              🏪 {t('allCategories')}
            </Link>
          </li>
          {categories.map(cat => (
            <li key={cat}>
              <Link
                to={`/category/${encodeURIComponent(cat)}`}
                className={`category-nav-item ${activeCategory === cat ? 'active' : ''}`}
                id={`cat-nav-${cat.replace(/[^a-zA-Z]/g, '')}`}
              >
                {getCategoryIcon(cat)} {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
