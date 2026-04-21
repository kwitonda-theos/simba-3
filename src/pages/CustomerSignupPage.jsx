import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function CustomerSignupPage() {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    signup({
      name: formData.name,
      email: formData.email,
      role: 'customer',
    });
    navigate('/');
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
            🛒
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Customer Sign Up
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>
            Start your fresh shopping journey with Simba
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              Password
            </label>
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
            Sign Up as Customer ➜
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
