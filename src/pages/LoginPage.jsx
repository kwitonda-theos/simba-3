import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      email: formData.email,
      role: 'customer',
      name: formData.email.split('@')[0]
    });
    navigate(from, { replace: true });
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
            {t('welcomeBack') || 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
            {t('loginSubtitle') || 'Please enter your details to sign in'}
          </p>
        </div>

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
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                {t('password') || 'Password'}
              </label>
              <a href="#" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                {t('forgotPassword') || 'Forgot password?'}
              </a>
            </div>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>
          
          <button type="submit" className="hero-cta" style={{ 
            width: '100%', 
            marginTop: '8px', 
            padding: '14px', 
            borderRadius: '12px', 
            fontSize: '16px', 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {t('login') || 'Sign In'} ➜
          </button>
        </form>

        <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: 1 }}></div>
          <span style={{ position: 'relative', zIndex: 2, background: 'var(--bg-card)', padding: '0 12px', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 500 }}>
            {t('orContinueWith') || 'OR CONTINUE WITH'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Google
          </button>
          <button style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Apple
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          {t('noAccount') || "Don't have an account?"} <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('signup') || 'Create Account'}</Link>
        </p>
      </div>
    </div>
  );
}
