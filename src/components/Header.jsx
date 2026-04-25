import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

export default function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartCount, setIsCartOpen } = useCart();
  const { isAuthenticated, user, logout, isBranchManager } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (onSearch) onSearch(searchQuery);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="header" id="site-header">
      <div className="container">
        <div className="header-top">
          <span><Icon name="mapPin" size={14} style={{ marginRight: '4px' }} /> {t('kigali')} | {t('freeDelivery')}</span>
          <div className="header-top-actions">
            <div className="lang-switcher" id="language-switcher">
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                id="lang-en"
              >EN</button>
              <button
                className={`lang-btn ${language === 'fr' ? 'active' : ''}`}
                onClick={() => setLanguage('fr')}
                id="lang-fr"
              >FR</button>
              <button
                className={`lang-btn ${language === 'rw' ? 'active' : ''}`}
                onClick={() => setLanguage('rw')}
                id="lang-rw"
              >RW</button>
            </div>
          </div>
        </div>

        <div className="header-main">
          <Link to="/" className="logo" id="logo">
            <div className="logo-icon">
              <Icon name="cart" size={20} style={{ color: 'white' }} />
            </div>
            Simba
          </Link>

          <form className="search-container" onSubmit={handleSearch} id="search-form">
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder={t('search')}
                value={searchQuery}
                onChange={handleInputChange}
                id="search-input"
              />
              <button type="submit" className="search-btn" id="search-btn">
                <Icon name="search" size={18} style={{ marginRight: '6px' }} /> {t('searchBtn')}
              </button>
            </div>
          </form>

          <div className="header-actions">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={t('darkMode')}
              id="theme-toggle"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <div className="user-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{t('hi')}, {user.name}</span>
                  {!isBranchManager && (
                    <Link to="/my-orders" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>{t('myOrders')}</Link>
                  )}
                </div>
                <button
                  className="header-action-btn"
                  onClick={() => logout()}
                  title={t('logout')}
                >
                  <Icon name="logout" size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="header-action-btn" id="login-btn">
                <Icon name="user" size={20} /> <span>{t('login') || 'Login'}</span>
              </Link>
            )}

            <button
              className="header-action-btn"
              onClick={() => setIsCartOpen(true)}
              id="cart-btn"
            >
              <Icon name="cart" size={20} /> <span>{t('cart')}</span>
              {cartCount > 0 && (
                <span className="cart-badge" key={cartCount}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
