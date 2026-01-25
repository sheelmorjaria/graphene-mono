import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const SearchBar = ({
  className = '',
  placeholder = 'Search products...',
  onSearch = null
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const searchUrl = `/search?q=${encodeURIComponent(trimmedQuery)}`;
    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      navigate(searchUrl);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      data-testid="product-search"
      className={`relative flex items-center ${className}`}
      onClick={handleContainerClick}
    >
      <form
        onSubmit={handleSubmit}
        role="search"
        className="relative flex items-center w-full group"
      >
        {/* Search Icon */}
        <div className="absolute left-3 pointer-events-none z-10">
          <svg
            className="w-5 h-5 text-text-muted group-focus-within:text-cyan-400 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search products"
          data-testid="search-input"
          className="w-full px-4 py-2.5 pl-10 pr-20 text-text-primary placeholder:text-text-dim bg-bg-elevated border border-border-default rounded-lg focus:outline-none focus:border-cyan-400 focus:shadow-glow-cyan transition-all duration-200 hover:border-border-strong font-mono text-sm"
        />

        {/* Glow effect on focus */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-matrix-400 opacity-0 group-focus-within:opacity-10 pointer-events-none transition-opacity duration-200 blur-sm"></div>

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-12 p-1.5 text-text-muted hover:text-red-400 focus:outline-none transition-colors duration-200 z-10"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 p-2 text-text-muted hover:text-cyan-400 focus:outline-none focus:text-cyan-400 transition-all duration-200 z-10 hover:bg-cyan-subtle rounded"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

SearchBar.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  onSearch: PropTypes.func
};

export default SearchBar;
