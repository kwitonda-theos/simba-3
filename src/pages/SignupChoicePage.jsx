import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SignupChoicePage() {
  const { t } = useLanguage();

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
        maxWidth: '800px', 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Customer Choice */}
        <Link to="/signup/customer" style={{ 
          background: 'var(--bg-card)', 
          padding: '48px 32px', 
          borderRadius: '24px', 
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🛒</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            I am a Customer
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', lineHeight: '1.6' }}>
            Shop from over 500+ fresh products and get them delivered to your doorstep.
          </p>
          <div style={{ marginTop: '32px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Sign Up as Customer ➜
          </div>
        </Link>

        {/* Branch Manager Choice */}
        <Link to="/signup/branch-manager" style={{ 
          background: 'var(--bg-card)', 
          padding: '48px 32px', 
          borderRadius: '24px', 
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🏢</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            I am a Branch Manager
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', lineHeight: '1.6' }}>
            Manage inventory, track branch performance, and handle customer orders.
          </p>
          <div style={{ marginTop: '32px', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Sign Up as Manager ➜
          </div>
        </Link>
      </div>
    </div>
  );
}
