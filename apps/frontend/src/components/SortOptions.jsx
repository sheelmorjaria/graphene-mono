import PropTypes from 'prop-types';

const SortOptions = ({ currentSort, onSortChange }) => {
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name A-Z' }
  ];

  const handleSortChange = (event) => {
    onSortChange(event.target.value);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={handleSortChange}
        aria-label="Sort products"
        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

SortOptions.propTypes = {
  currentSort: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired
};

export default SortOptions;