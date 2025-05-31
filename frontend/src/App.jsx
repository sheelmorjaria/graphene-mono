import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import ProductListPage from './pages/ProductListPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SearchBar from './components/SearchBar';
import './App.css';

const Header = () => {
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
            <ul className="flex space-x-6">
              <li>
                <Link 
                  to="/products" 
                  className="hover:text-blue-300 transition-colors"
                >
                  Products
                </Link>
              </li>
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
      <AppRoutes />
    </Router>
  );
}

export default App;