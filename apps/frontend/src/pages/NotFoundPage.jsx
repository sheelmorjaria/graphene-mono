import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center animate-fadeIn">
          <h1 className="text-7xl font-bold text-cyan-400 uppercase tracking-widest mb-4">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-text-primary uppercase tracking-wider">
            PAGE NOT FOUND
          </h2>
          <p className="mt-4 text-text-secondary">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <div className="mt-8 space-y-4">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-500 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 transition-all duration-200"
            >
              Back to Products
            </Link>
            <div className="block">
              <Link
                to="/"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
