import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductListPage from './pages/ProductListPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MyProfilePage from './pages/MyProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SearchBar from './components/SearchBar';
import { AuthProvider, useAuth, useLogout } from './contexts/AuthContext';
import './App.css';

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
        className="flex items-center space-x-2 hover:text-blue-300 transition-colors"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span>Welcome, {user?.firstName}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            {user?.email}
          </div>
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/change-password"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Change Password
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

  return (
    <header className="bg-gray-900 text-white shadow-lg" role="banner">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link 
            to="/" 
            className="text-xl font-bold hover:text-blue-300 transition-colors flex-shrink-0"
          >
            GrapheneOS Store
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <SearchBar 
              placeholder="Search products..."
              className="w-full"
            />
          </div>
          
          <nav className="flex-shrink-0">
            <ul className="flex items-center space-x-6">
              <li>
                <Link 
                  to="/products" 
                  className="hover:text-blue-300 transition-colors"
                >
                  Products
                </Link>
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
                        className="hover:text-blue-300 transition-colors"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/register" 
                        className="hover:text-blue-300 transition-colors"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

const NotFoundPage = () => {
  useEffect(() => {
    document.title = 'Page Not Found - GrapheneOS Store';
  }, []);

  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      document.title = 'GrapheneOS Store - Privacy-Focused Smartphones';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;