import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError);
      } else {
        setMessage('Check your email for a password reset link!');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
            🔑
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {t('forgotPassword')}
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
            Enter your email to receive a password reset link
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

        {message && (
          <div style={{ 
            background: 'var(--accent-emerald-glow)', 
            color: 'var(--accent-emerald)', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="name@example.com"
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
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Back to <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
