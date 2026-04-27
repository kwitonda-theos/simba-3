import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider, useBranch } from './context/BranchContext';
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
import BranchSelector from './components/BranchSelector';

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
  const { selectedBranch } = useBranch();

  const isStaff = useMemo(() => {
    const role = user?.role || user?.user_metadata?.role;
    return role === 'branch_manager' || role === 'branch-manager' || role === 'branch_staff' || role === 'branch-staff';
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      // For staff, we might want to show all products or just branch products.
      // For now, let's keep the logic for branch products if a branch is selected.
      if (!selectedBranch && !isStaff) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching branch products...');

        let query;
        if (selectedBranch) {
          // Fetch products joined with inventory for the selected branch
          query = supabase
            .from('inventory')
            .select(`
              stock_quantity,
              products (*)
            `)
            .eq('branch_id', selectedBranch.id);
        } else {
          // Fallback for staff/admin if no branch selected
          query = supabase.from('products').select('*');
        }

        const { data: invData, error: sbError } = await query;

        if (sbError) throw sbError;

        let mappedProducts = [];
        if (selectedBranch) {
          mappedProducts = invData.map(item => ({
            ...item.products,
            stock: item.stock_quantity,
            inStock: item.stock_quantity > 0,
            image: item.products.image_url || 'https://placehold.co/300x300?text=' + encodeURIComponent(item.products.name)
          }));
        } else {
          mappedProducts = (invData || []).map(p => ({
            ...p,
            stock: 99, // Dummy for staff
            inStock: true,
            image: p.image_url || 'https://placehold.co/300x300?text=' + encodeURIComponent(p.name)
          }));
        }

        setProducts(mappedProducts);
      } catch (err) {
        console.error('Data loading error:', err.message);
        setError('Failed to load products. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedBranch, isStaff]);

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
            <BranchProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </BranchProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

