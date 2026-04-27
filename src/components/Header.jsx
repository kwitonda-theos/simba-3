import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useBranch } from '../context/BranchContext';
import Icon from './Icon';

export default function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getCartCount, setIsCartOpen, clearCart } = useCart();
  const { isAuthenticated, user, logout, isBranchManager } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { selectedBranch, selectBranch } = useBranch();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
    if (onSearch) onSearch(searchQuery);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleChangeBranch = () => {
    if (window.confirm('Changing branch will clear your current cart. Continue?')) {
      clearCart();
      selectBranch(null);
    }
  };

  return (
    <header className="header" id="site-header">
      <div className="container">
        <div className="header-top">
          <div className="branch-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span><Icon name="mapPin" size={14} style={{ marginRight: '4px' }} /> {selectedBranch ? selectedBranch.name : t('kigali')}</span>
            {selectedBranch && (
              <button 
                onClick={handleChangeBranch}
                className="change-branch-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {t('change')}
              </button>
            )}
          </div>
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
          <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <Icon name={isMobileMenuOpen ? "x" : "menu"} size={24} />
          </div>

          <Link to="/" className="logo" id="logo" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="logo-icon">
              <Icon name="cart" size={20} style={{ color: 'white' }} />
            </div>
            Simba
          </Link>

          <form className="search-container" onSubmit={handleSearch} id="search-form">
            <div className="search-wrapper">
              <div className="ai-badge" style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <Icon name="sparkles" size={18} />
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Ask AI for products... (e.g., 'What's good for breakfast?')"
                value={searchQuery}
                onChange={handleInputChange}
                id="search-input"
                style={{ paddingLeft: '40px' }}
              />
              <button type="submit" className="search-btn" id="search-btn">
                <Icon name="search" size={18} style={{ marginRight: '6px' }} /> <span className="search-btn-text">{t('searchBtn')}</span>
              </button>
            </div>
          </form>

          <div className="header-actions">
            <button
              className="theme-toggle-btn desktop-only"
              onClick={toggleTheme}
              title={t('darkMode')}
              id="theme-toggle"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <div className="user-nav desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <Link to="/login" className="header-action-btn desktop-only" id="login-btn">
                <Icon name="user" size={20} /> <span>{t('login') || 'Login'}</span>
              </Link>
            )}

            <button
              className="header-action-btn"
              onClick={() => setIsCartOpen(true)}
              id="cart-btn"
            >
              <Icon name="cart" size={20} /> <span className="desktop-only">{t('cart')}</span>
              {cartCount > 0 && (
                <span className="cart-badge" key={cartCount}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="lang-switcher">
                <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                <button className={`lang-btn ${language === 'fr' ? 'active' : ''}`} onClick={() => setLanguage('fr')}>FR</button>
                <button className={`lang-btn ${language === 'rw' ? 'active' : ''}`} onClick={() => setLanguage('rw')}>RW</button>
              </div>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            <nav className="mobile-nav">
              <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{t('branch')}:</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{selectedBranch ? selectedBranch.name : t('notSelected')}</span>
                  <button onClick={() => { handleChangeBranch(); setIsMobileMenuOpen(false); }} style={{ color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 600, border: 'none', background: 'none' }}>{t('change')}</button>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="mobile-user-info">
                    <div className="user-avatar">{user.name.charAt(0)}</div>
                    <div>
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                  {!isBranchManager && (
                    <Link to="/my-orders" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                      <Icon name="file" size={20} /> {t('myOrders')}
                    </Link>
                  )}
                  {isBranchManager && (
                    <Link to="/branch-dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                      <Icon name="shield" size={20} /> {t('dashboard')}
                    </Link>
                  )}
                  <button className="mobile-nav-link" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                    <Icon name="logout" size={20} /> {t('logout')}
                  </button>
                </>
              ) : (
                <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  <Icon name="user" size={20} /> {t('login')}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


