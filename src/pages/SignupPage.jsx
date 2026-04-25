import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

const BRANCHES = [
  "Main Branch",
  "Simba Centenary",
  "Simba Gishushu",
  "Simba Kimironko",
  "Simba Kicukiro",
  "Simba Kigali Height",
  "Simba UTC",
  "Simba Gacuriro",
  "Simba Gikondo",
  "Simba sonatube",
  "Simba Kisimenti",
  "Simba Rebero"
];

export default function SignupPage() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    branch: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let branches = [];
      if (formData.role === 'branch_manager' && formData.branch) {
        // Look up the branch UUID to avoid database type errors in triggers
        const { data: branchData } = await supabase
          .from('branches')
          .select('id')
          .eq('name', formData.branch)
          .maybeSingle();
        
        if (branchData?.id) {
          branches = [branchData.id];
        } else {
          // If UUID not found, don't send the name as a branch ID to avoid DB error
          console.warn('Branch UUID not found for:', formData.branch);
        }
      }

      const { error: signupError } = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        branches: branches,
        metadata: {
          branch_name: formData.role === 'branch_manager' ? formData.branch : null
        }
      });

      if (signupError) {
        setError(signupError);
      } else {
        // Successful signup usually requires email confirmation with Supabase default settings
        alert('Check your email for a confirmation link!');
        navigate('/login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
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
        maxWidth: '500px', 
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
            👋
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {t('createAccount')}
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
            {t('signupSubtitle')}
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
              {t('name')}
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

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
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              {t('role')}
            </label>
            <select
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              <option value="customer">{t('customer')}</option>
              <option value="branch_manager">{t('branchManager')}</option>
            </select>
          </div>

          {formData.role === 'branch_manager' && (
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                {t('selectYourBranch')}
              </label>
              <select
                name="branch"
                className="form-input"
                value={formData.branch}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                <option value="">{t('chooseABranch')}</option>
                {BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch === 'Main Branch' ? t('mainBranch') : branch}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              {t('password')}
            </label>
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
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              {t('passwordRequirement')}
            </p>
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
            {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }} /> : (t('signup') + ' ➜')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          {t('haveAccount')} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>{t('login')}</Link>
        </p>

        <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          {t('termsAgreement')} <a href="#" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('termsOfService')}</a> and <a href="#" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('privacyPolicy')}</a>.
        </div>
      </div>
    </div>
  );
}
