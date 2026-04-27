import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero" id="hero" style={{ padding: 'clamp(40px, 10vw, 100px) 0' }}>
      <div className="container">
        <div className="hero-content" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <div className="hero-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hero-badge">{t('heroBadge')}</div>
            <h1 className="hero-title" style={{ fontSize: 'clamp(28px, 6vw, 56px)', maxWidth: '800px' }}>{t('heroTitle')}</h1>
            <p className="hero-subtitle" style={{ fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: '600px', margin: '0 auto 32px' }}>{t('heroSubtitle')}</p>
            <Link to="/category/all" className="hero-cta" id="hero-cta">
              {t('heroCta')} →
            </Link>
            <div className="hero-stats" style={{ justifyContent: 'center', width: '100%', gap: 'clamp(20px, 5vw, 60px)' }}>
              <div className="hero-stat">
                <div className="hero-stat-value" style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>789+</div>
                <div className="hero-stat-label">{t('heroProducts')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value" style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>10</div>
                <div className="hero-stat-label">{t('heroCategories')}</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value" style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>24h</div>
                <div className="hero-stat-label">{t('heroDelivery')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
