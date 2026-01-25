import PropTypes from 'prop-types';

const SortOptions = ({ currentSort, onSortChange }) => {
  const sortOptions = [
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' }
  ];

  const handleSortChange = (event) => {
    onSortChange(event.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort-select" className="flex items-center gap-2 text-sm font-heading font-semibold uppercase tracking-wider text-text-secondary">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0v6m4-6v6m0 0l6-6m-6 6v-6m6 6V9" />
        </svg>
        Sort
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={currentSort}
          onChange={handleSortChange}
          aria-label="Sort products"
          className="appearance-none bg-bg-elevated text-text-primary border border-border-subtle px-4 py-2 pr-10 font-mono text-sm rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-0 hover:border-border-strong transition-all duration-200 cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

SortOptions.propTypes = {
  currentSort: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired
};

export default SortOptions;
