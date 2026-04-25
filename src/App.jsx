import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignupChoicePage from './pages/SignupChoicePage';
import CustomerSignupPage from './pages/CustomerSignupPage';
import BranchManagerSignupPage from './pages/BranchManagerSignupPage';
import BranchStaffSignupPage from './pages/BranchStaffSignupPage';
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
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();

  const isStaff = useMemo(() => {
    const role = user?.role || user?.user_metadata?.role;
    console.log('Current User Role:', role);
    return role === 'branch_manager' || role === 'branch-manager' || role === 'branch_staff' || role === 'branch-staff';
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products from Supabase and JSON...');

        // 1. Fetch from Supabase
        const { data: sbData, error: sbError } = await supabase
          .from('products')
          .select('*');

        if (sbError) throw sbError;

        // 2. Fetch from JSON to get inStock info
        const response = await fetch('/simba_products.json');
        const localData = await response.json();
        const jsonProducts = localData.products || [];

        // Create a map for quick lookup
        const inStockMap = jsonProducts.reduce((acc, p) => {
          acc[p.id] = p.inStock;
          return acc;
        }, {});

        if (!sbData || sbData.length === 0) {
          console.warn('No products found in Supabase, using local JSON data.');
          setProducts(jsonProducts.map(p => ({
            ...p,
            image: p.image || 'https://placehold.co/300x300?text=' + encodeURIComponent(p.name)
          })));
        } else {
          // Merge Supabase data with inStock info from JSON
          const mappedProducts = sbData.map(p => ({
            ...p,
            image: p.image_url || 'https://placehold.co/300x300?text=' + encodeURIComponent(p.name),
            inStock: inStockMap[p.id] !== undefined ? inStockMap[p.id] : true // Default to true if not in JSON
          }));
          setProducts(mappedProducts);
          console.log(`Loaded ${mappedProducts.length} products with stock status.`);
        }
      } catch (err) {
        console.error('Data loading error:', err.message);
        try {
          const response = await fetch('/simba_products.json');
          const localData = await response.json();
          setProducts((localData.products || []).map(p => ({
            ...p,
            image: p.image || 'https://placehold.co/300x300?text=' + encodeURIComponent(p.name)
          })));
        } catch (fallbackErr) {
          setError('Failed to load products. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    if (!products.length) return [];
    const cats = [...new Set(products.map(p => p.category))].filter(Boolean);
    return cats.sort();
  }, [products]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ color: 'var(--accent-red)' }}>⚠️ {error}</h2>
        <button onClick={() => window.location.reload()} className="hero-cta">Retry Loading</button>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {authLoading ? 'Authenticating...' : 'Loading Products...'}
          </p>
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
        {isStaff ? (
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
              path="/forgot-password"
              element={<ForgotPasswordPage />}
            />
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
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
              path="/signup/branch-staff"
              element={<BranchStaffSignupPage />}
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
