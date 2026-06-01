import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import VerifyEmail from './pages/VerifyEmail';
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
import ContactUsPage from './pages/ContactUsPage';
import CustomerPrivacyPage from './pages/CustomerPrivacyPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import ShippingInformationPage from './pages/ShippingInformationPage';
import FAQPage from './pages/FAQPage';
import FlashServicePage from './pages/FlashServicePage';
import FlashOrderSuccessPage from './pages/FlashOrderSuccessPage';
import AdminFlashOrdersListPage from './pages/AdminFlashOrdersListPage';
import AdminFlashOrderDetailsPage from './pages/AdminFlashOrderDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import SearchBar from './components/SearchBar';
import CartIcon from './components/CartIcon';
import SEOWrapper from './components/SEO/SEOWrapper';
import Footer from './components/Footer';
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
        className="flex items-center gap-2 text-cyan-400 hover:text-matrix-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span className="text-glow">{user?.firstName}</span>
        <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-bg-card backdrop-blur-md rounded-lg shadow-glow-cyan border border-border-cyan overflow-hidden z-50 animate-slideIn">
          <div className="px-4 py-3 text-xs font-mono text-text-muted border-b border-border-subtle bg-bg-elevated">
            {user?.email}
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </Link>
          <Link
            to="/change-password"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Change Password
          </Link>
          <Link
            to="/addresses"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            My Addresses
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Orders
          </Link>
          <Link
            to="/my-account/returns"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
            My Returns
          </Link>
          <Link
            to="/account/privacy"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Data & Privacy
          </Link>
          <Link
            to="/contact-us"
            className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-mono uppercase tracking-wider"
            onClick={() => setIsDropdownOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </Link>
          <div className="border-t border-border-subtle bg-bg-elevated">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-bg-hover transition-all duration-200 font-mono uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-sticky bg-bg-primary/95 backdrop-blur-lg border-b border-border-subtle" role="banner">
      {/* Top accent line with gradient animation */}
      <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-matrix-400 to-cyan-400 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]"></div>

      <div className="container mx-auto px-4 lg:px-6 py-4">
        {/* Mobile layout - Stack vertically */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Top row - Logo and mobile menu button */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-3 group flex-shrink-0"
            >
              <div>
                <h1 className="font-display font-bold text-lg text-text-primary tracking-wider">GRAPHENE</h1>
                <p className="font-mono text-xs text-cyan-400 tracking-[0.2em] uppercase">Security</p>
              </div>
            </Link>

            {/* Mobile menu button - only visible on small screens */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-cyan-400 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute top-1 left-0 right-0 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 top-3' : ''}`}></span>
                <span className={`absolute top-3 left-0 right-0 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`absolute top-5 left-0 right-0 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 top-3' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Search Bar - full width on mobile, limited on desktop */}
          <div className="w-full lg:flex-1 lg:max-w-2xl lg:mx-6">
            <SearchBar
              placeholder="Search devices..."
              className="w-full"
            />
          </div>

          {/* Desktop Navigation - always visible on large screens */}
          <nav className="hidden lg:block flex-shrink-0">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  to="/products"
                  className="text-text-secondary hover:text-cyan-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
                >
                  Products
                </Link>
              </li>

              <li>
                <Link
                  to="/flash-service"
                  className="text-text-secondary hover:text-cyan-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
                >
                  Flashing Service
                </Link>
              </li>

              <li>
                <Link
                  to="/contact-us"
                  className="text-text-secondary hover:text-cyan-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
                >
                  Contact
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
                        className="text-text-secondary hover:text-cyan-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/register"
                        className="btn btn-primary btn-sm"
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
            <nav className="lg:hidden border-t border-border-subtle pt-4 animate-fadeIn">
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Products
                  </Link>
                </li>

                <li>
                  <Link
                    to="/flash-service"
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Flashing Service
                  </Link>
                </li>

                <li>
                  <Link
                    to="/contact-us"
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Us
                  </Link>
                </li>

                <li className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-elevated transition-all duration-200 rounded-lg">
                  <CartIcon />
                  <span className="font-heading font-semibold text-sm uppercase tracking-wider">Cart</span>
                </li>

                {!isLoading && (
                  isAuthenticated ? (
                    <>
                      <li>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          My Orders
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={async () => {
                            const { useLogout } = await import('./contexts/AuthContext');
                            const logout = useLogout();
                            await logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-bg-hover transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/login"
                          className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Login
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/register"
                          className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-semibold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
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
    <div className="min-h-screen flex flex-col">
      <SEOWrapper
        structuredData={homePageStructuredData}
        additionalMeta={[
          { name: 'keywords', content: 'Graphene Security, privacy phone, secure smartphone, Google Pixel' },
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
          
          {/* Email verification page */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* My addresses page */}
          <Route path="/addresses" element={<MyAddressesPage />} />
          
          {/* Data & Privacy page */}
          <Route path="/account/privacy" element={<CustomerPrivacyPage />} />
          
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

          {/* Contact Us page */}
          <Route path="/contact-us" element={<ContactUsPage />} />

          {/* Policy & Information pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/refunds" element={<RefundPolicyPage />} />
          <Route path="/shipping" element={<ShippingInformationPage />} />
          <Route path="/faq" element={<FAQPage />} />

          {/* Flash Service routes */}
          <Route path="/flash-service" element={<FlashServicePage />} />
          <Route path="/flash-order/success" element={<FlashOrderSuccessPage />} />

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
          <Route path="/admin/flash-orders" element={
            <AdminRoute>
              <AdminFlashOrdersListPage />
            </AdminRoute>
          } />
          <Route path="/admin/flash-orders/:id" element={
            <AdminRoute>
              <AdminFlashOrderDetailsPage />
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
      
      <Footer />
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