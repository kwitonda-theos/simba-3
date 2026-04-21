import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import SignupChoicePage from './pages/SignupChoicePage';
import CustomerSignupPage from './pages/CustomerSignupPage';
import BranchManagerSignupPage from './pages/BranchManagerSignupPage';
import BranchDashboard from './pages/BranchDashboard';
import MyOrdersPage from './pages/MyOrdersPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      id="back-to-top"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

function AppContent() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isBranchManager, user } = useAuth();

  useEffect(() => {
    fetch('/simba_products.json')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Loading Simba Supermarket...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Header />
      <CartDrawer />
      <ToastContainer />

      <main>
        {isBranchManager ? (
          <BranchDashboard products={products} categories={categories} />
        ) : (
          <Routes>
            <Route
              path="/"
              element={<HomePage products={products} categories={categories} />}
            />
            <Route
              path="/category/:categoryName"
              element={<CategoryPage products={products} categories={categories} />}
            />
            <Route
              path="/product/:productId"
              element={<ProductPage products={products} />}
            />
            <Route
              path="/checkout"
              element={<CheckoutPage />}
            />
            <Route
              path="/login"
              element={<LoginPage />}
            />
            <Route
              path="/signup"
              element={<SignupChoicePage />}
            />
            <Route
              path="/signup/customer"
              element={<CustomerSignupPage />}
            />
            <Route
              path="/signup/branch-manager"
              element={<BranchManagerSignupPage />}
            />
            <Route
              path="/my-orders"
              element={<MyOrdersPage />}
            />
          </Routes>
        )}
      </main>

      <Footer />
      <BackToTop />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
