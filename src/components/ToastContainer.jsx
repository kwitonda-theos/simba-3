import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function ToastContainer() {
  const { toasts } = useCart();
  const { t } = useLanguage();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast toast-success">
          <span className="toast-icon">✅</span>
          <span>{t('addedToCart')}</span>
        </div>
      ))}
    </div>
  );
}
