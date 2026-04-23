import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: loginError } = await login(formData.email, formData.password);
      
      if (loginError) {
        // Provide clear error messages based on Supabase error codes
        if (loginError.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (loginError.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.');
        } else {
          setError(loginError);
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: googleError } = await loginWithGoogle();
    if (googleError) {
      setError(googleError);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - var(--header-height) - 100px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-secondary)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '440px', 
        background: 'var(--bg-card)', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--primary-glow)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            fontSize: '32px'
          }}>
            👤
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {t('welcomeBack')}
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
            {t('loginSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--accent-red-glow)', 
            color: 'var(--accent-red)', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              {t('email')}
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('password')}
              </label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                {t('forgotPassword')}
              </Link>
            </div>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="hero-cta" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '8px', 
              padding: '14px', 
              borderRadius: '12px', 
              fontSize: '16px', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> : (t('login') + ' ➜')}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: 1 }}></div>
          <span style={{ position: 'relative', zIndex: 2, background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
            {t('orContinueWith')}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <button 
            type="button"
            onClick={handleGoogleLogin}
            style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              fontSize: '15px', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              background: 'var(--bg-card)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          {t('noAccount')} <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('signup')}</Link>
        </p>
      </div>
    </div>
  );
}
