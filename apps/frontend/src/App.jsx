import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import ProductListPage from './pages/ProductListPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MyProfilePage from './pages/MyProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MyAddressesPage from './pages/MyAddressesPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import ReturnHistoryPage from './pages/ReturnHistoryPage';
import ReturnDetailsPage from './pages/ReturnDetailsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrdersListPage from './pages/AdminOrdersListPage';
import AdminOrderDetailsPage from './pages/AdminOrderDetailsPage';
import AdminReturnsListPage from './pages/AdminReturnsListPage';
import AdminReturnDetailsPage from './pages/AdminReturnDetailsPage';
import AdminProductsListPage from './pages/AdminProductsListPage';
import AdminProductFormPage from './pages/AdminProductFormPage';
import AdminCategoriesListPage from './pages/AdminCategoriesListPage';
import AdminCategoryFormPage from './pages/AdminCategoryFormPage';
import AdminUsersListPage from './pages/AdminUsersListPage';
import AdminUserDetailsPage from './pages/AdminUserDetailsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminRoute from './components/AdminRoute';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import BitcoinPaymentPage from './pages/BitcoinPaymentPage';
import MoneroPaymentPage from './pages/MoneroPaymentPage';
import ContactUsPage from './pages/ContactUsPage';
import SearchBar from './components/SearchBar';
import CartIcon from './components/CartIcon';
import SEOWrapper from './components/SEO/SEOWrapper';
import { AuthProvider, useAuth, useLogout } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CheckoutProvider } from './contexts/CheckoutContext';
import { generateOrganizationStructuredData, generateSearchActionStructuredData } from './utils/structuredData';
//import './App.css';
import './index.css'; // Import global styles

const AuthenticatedUserMenu = () => {
  const { user } = useAuth();
  const logout = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };




  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 hover:text-forest-300 transition-colors duration-200"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span>Welcome, {user?.firstName}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-xl border border-border py-1 z-50 animate-slideIn">
          <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
            {user?.email}
          </div>
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/change-password"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            Change Password
          </Link>
          <Link
            to="/addresses"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            My Addresses
          </Link>
          <Link
            to="/orders"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            My Orders
          </Link>
          <Link
            to="/my-account/returns"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            My Returns
          </Link>
          <Link
            to="/contact-us"
            className="block px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(false)}
          >
            Contact Us
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-forest-900 to-forest-800 shadow-xl" role="banner">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile layout - Stack vertically */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Top row - Logo and mobile menu button */}
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center hover:opacity-80 transition-opacity duration-200 flex-shrink-0 px-3 py-1 rounded"
            >
              <img 
                src="/images/logo.png" 
                alt="Graphene Security" 
                className="h-20 w-auto"
              />
            </Link>
            
            {/* Mobile menu button - only visible on small screens */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-forest-900 hover:text-forest-300 p-2"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Search Bar - full width on mobile, limited on desktop */}
          <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-4">
            <SearchBar 
              placeholder="Search products..."
              className="w-full"
            />
          </div>
          
          {/* Desktop Navigation - always visible on large screens */}
          <nav className="hidden lg:block flex-shrink-0">
            <ul className="flex items-center space-x-6">
              <li>
                <Link 
                  to="/products" 
                  className="text-forest-900 px-3 py-1 rounded hover:text-forest-300 transition-colors duration-200"
                >
                  Products
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/contact-us" 
                  className="text-forest-900 px-3 py-1 rounded hover:text-forest-300 transition-colors duration-200"
                >
                  Contact Us
                </Link>
              </li>
              
              <li>
                <CartIcon />
              </li>
              
              {!isLoading && (
                isAuthenticated ? (
                  <li>
                    <AuthenticatedUserMenu />
                  </li>
                ) : (
                  <>
                    <li>
                      <Link 
                        to="/login" 
                        className="text-forest-900 px-3 py-1 rounded hover:text-forest-300 transition-colors duration-200"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/register" 
                        className="text-forest-900 px-3 py-1 rounded hover:text-forest-300 transition-colors duration-200"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )
              )}
            </ul>
          </nav>
          
          {/* Mobile Navigation Menu - toggleable */}
          {isMobileMenuOpen && (
            <nav className="lg:hidden border-t border-forest-700 pt-4">
              <ul className="flex flex-col space-y-2">
                <li>
                  <Link 
                    to="/products" 
                    className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                </li>
                
                <li>
                  <Link 
                    to="/contact-us" 
                    className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                </li>
                
                <li className="flex items-center px-3 py-2">
                  <CartIcon />
                  <span className="ml-2 text-forest-900">Cart</span>
                </li>
                
                {!isLoading && (
                  isAuthenticated ? (
                    <>
                      <li>
                        <Link 
                          to="/profile" 
                          className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/orders" 
                          className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link 
                          to="/login" 
                          className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link 
                          to="/register" 
                          className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </li>
                    </>
                  )
                )}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

const NotFoundPage = () => {
  useEffect(() => {
    document.title = 'Page Not Found - Graphene Security';
  }, []);

  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-forest-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-forest-800 mb-4">Page Not Found</h2>
        <p className="text-forest-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-forest-700 text-white rounded-lg hover:bg-forest-800 transition-all duration-200 transform hover:scale-105 animate-wave"
        >
          Back to Products
        </Link>
      </div>
    </main>
  );
};

// Separate AppRoutes component for easier testing
export const AppRoutes = () => {
  useEffect(() => {
    // Set default page title only once
    // Individual pages will override this as needed
    if (document.title === 'Test' || document.title === '') {
      document.title = 'Graphene Security - Privacy-Focused Smartphones';
    }
  }, []);

  // Combine organization and search action structured data for the home page
  const homePageStructuredData = [
    generateOrganizationStructuredData(),
    generateSearchActionStructuredData()
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-forest-100 flex flex-col">
      <SEOWrapper
        structuredData={homePageStructuredData}
        additionalMeta={[
          { name: 'keywords', content: 'Graphene Security, privacy phone, secure smartphone, Google Pixel, Bitcoin payment, Monero payment' },
          { property: 'og:locale', content: 'en_GB' },
          { name: 'twitter:site', content: '@grapheneos' }
        ]}
      />
      <Header />
      
      <main className="flex-1" role="main">
        <Routes>
          {/* Redirect root to products */}
          <Route path="/" element={<Navigate to="/products" replace />} />
          
          {/* Product list page */}
          <Route path="/products" element={<ProductListPage />} />
          
          {/* Search results page */}
          <Route path="/search" element={<SearchResultsPage />} />
          
          {/* Registration page */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Login page */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Profile page */}
          <Route path="/profile" element={<MyProfilePage />} />
          
          {/* Change password page */}
          <Route path="/change-password" element={<ChangePasswordPage />} />
          
          {/* Forgot password page */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Reset password page */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* My addresses page */}
          <Route path="/addresses" element={<MyAddressesPage />} />
          
          {/* My orders page */}
          <Route path="/orders" element={<MyOrdersPage />} />
          
          {/* Order details page */}
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          
          {/* Return history page */}
          <Route path="/my-account/returns" element={<ReturnHistoryPage />} />
          
          {/* Return details page */}
          <Route path="/my-account/returns/:returnRequestId" element={<ReturnDetailsPage />} />
          
          {/* Cart page */}
          <Route path="/cart" element={<CartPage />} />
          
          {/* Checkout page */}
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Checkout success page (PayPal redirect) */}
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          
          {/* Order confirmation page */}
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          
          {/* Payment pages */}
          <Route path="/payment/bitcoin/:orderId" element={<BitcoinPaymentPage />} />
          <Route path="/payment/monero/:orderId" element={<MoneroPaymentPage />} />
          
          {/* Contact Us page */}
          <Route path="/contact-us" element={<ContactUsPage />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <AdminOrdersListPage />
            </AdminRoute>
          } />
          <Route path="/admin/orders/:orderId" element={
            <AdminRoute>
              <AdminOrderDetailsPage />
            </AdminRoute>
          } />
          <Route path="/admin/returns" element={
            <AdminRoute>
              <AdminReturnsListPage />
            </AdminRoute>
          } />
          <Route path="/admin/returns/:returnRequestId" element={
            <AdminRoute>
              <AdminReturnDetailsPage />
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <AdminProductsListPage />
            </AdminRoute>
          } />
          <Route path="/admin/products/new" element={
            <AdminRoute>
              <AdminProductFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/products/edit/:productId" element={
            <AdminRoute>
              <AdminProductFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <AdminCategoriesListPage />
            </AdminRoute>
          } />
          <Route path="/admin/categories/new" element={
            <AdminRoute>
              <AdminCategoryFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/categories/edit/:categoryId" element={
            <AdminRoute>
              <AdminCategoryFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsersListPage />
            </AdminRoute>
          } />
          <Route path="/admin/users/:userId" element={
            <AdminRoute>
              <AdminUserDetailsPage />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminReportsPage />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          } />
          
          {/* Product details page */}
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <CheckoutProvider>
              <AppRoutes />
            </CheckoutProvider>
          </CartProvider>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;