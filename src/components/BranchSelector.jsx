import { useBranch } from '../context/BranchContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';

export default function BranchSelector({ inline = false }) {
  const { branches, selectBranch, loading, selectedBranch } = useBranch();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '20vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const content = (
    <div className={`branch-selector-card ${inline ? 'inline' : ''}`}>
      {!inline && (
        <div className="branch-selector-header">
          <div className="logo" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="logo-text">Simba</span>
            <span className="logo-dot">.</span>
          </div>
          <h2>{t('welcome')}</h2>
          <p>{t('selectBranchWelcome')}</p>
        </div>
      )}

      {inline && (
        <div className="branch-selector-header inline">
          <h3>{t('selectYourBranch')}</h3>
          <p>{t('selectBranchWelcome')}</p>
        </div>
      )}

      <div className="branch-list">
        {branches.map((branch) => (
          <button
            key={branch.id}
            className={`branch-option ${selectedBranch?.id === branch.id ? 'active' : ''}`}
            onClick={() => selectBranch(branch)}
          >
            <div className="branch-info">
              <span className="branch-name">{branch.name}</span>
              {branch.location && <span className="branch-location">{branch.location}</span>}
            </div>
            {selectedBranch?.id === branch.id ? (
              <Icon name="check" size={20} style={{ color: 'var(--accent-gold)' }} />
            ) : (
              <Icon name="chevron-right" size={20} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (inline) {
    return (
      <section className="container branch-selector-inline-section">
        {content}
        <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      </section>
    );
  }

  return (
    <div className="branch-selector-overlay">
      {content}
      <style dangerouslySetInnerHTML={{ __html: overlayStyles + inlineStyles }} />
    </div>
  );
}

const overlayStyles = `
  .branch-selector-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }
`;

const inlineStyles = `
  .branch-selector-card {
    background: var(--bg-secondary);
    width: 100%;
    max-width: 500px;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-light);
  }

  .branch-selector-card.inline {
    max-width: 100%;
    max-height: none;
    box-shadow: none;
    background: var(--bg-card);
    margin-top: -40px;
    position: relative;
    z-index: 10;
    border: 1px solid var(--border-color);
  }

  .branch-selector-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .branch-selector-header.inline {
    text-align: left;
    margin-bottom: 24px;
  }

  .branch-selector-header h2, .branch-selector-header h3 {
    font-size: 1.8rem;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .branch-selector-header p {
    color: var(--text-tertiary);
  }

  .branch-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .branch-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .branch-option:hover {
    border-color: var(--accent-gold);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  .branch-option.active {
    border-color: var(--accent-gold);
    background: var(--primary-glow);
  }

  .branch-name {
    display: block;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1.1rem;
  }

  .branch-location {
    display: block;
    font-size: 0.85rem;
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  .branch-option svg {
    color: var(--text-tertiary);
    transition: transform 0.2s ease;
  }

  .branch-option:hover svg {
    color: var(--accent-gold);
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    .branch-selector-card {
      padding: 24px;
    }
    .branch-list {
      grid-template-columns: 1fr;
    }
  }
`;
