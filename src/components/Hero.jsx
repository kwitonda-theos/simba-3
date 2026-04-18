import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero" id="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">{t('heroBadge')}</div>
            <h1 className="hero-title">{t('heroTitle')}</h1>
            <p className="hero-subtitle">{t('heroSubtitle')}</p>
            <Link to="/category/all" className="hero-cta" id="hero-cta">
              {t('heroCta')} →
            </Link>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">552+</div>
                <div className="hero-stat-label">{t('heroProducts')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">9</div>
                <div className="hero-stat-label">{t('heroCategories')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">24h</div>
                <div className="hero-stat-label">{t('heroDelivery')}</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-grid">
              <div className="hero-image-card">🛒</div>
              <div className="hero-image-card">🥑</div>
              <div className="hero-image-card">🧴</div>
              <div className="hero-image-card">🍷</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
