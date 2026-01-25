import PropTypes from 'prop-types';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Calculate items display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show around current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    // Add pages around current page
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Remove duplicates and sort
    const uniqueRange = [...new Set(range)].sort((a, b) => a - b);

    // Add ellipsis where needed
    let prev = 0;
    for (const page of uniqueRange) {
      if (page - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      prev = page;
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border-subtle"
      aria-label="Pagination Navigation"
    >
      {/* Items count display */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="font-mono text-sm text-text-secondary">
          Showing <span className="text-cyan-400 font-semibold">{startItem}-{endItem}</span> of <span className="text-cyan-400 font-semibold">{totalItems}</span> results
        </span>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className={`
            px-3 py-2 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg transition-all duration-200
            ${currentPage === 1
              ? 'text-text-dim cursor-not-allowed bg-bg-elevated border border-border-subtle'
              : 'text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated hover:border-border-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 border border-border-subtle'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm text-text-muted font-mono">
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                aria-label={isCurrentPage ? `Page ${page}, current page` : `Go to page ${page}`}
                aria-current={isCurrentPage ? 'page' : undefined}
                className={`
                  min-w-[2.5rem] px-3 py-2 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isCurrentPage
                    ? 'bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent shadow-glow-cyan'
                    : 'text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated border border-border-subtle'
                  }
                `}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile: Simple page indicator */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg border border-border-subtle">
          <span className="font-mono text-xs text-text-muted uppercase">Page</span>
          <span className="font-display font-bold text-sm text-cyan-400">{currentPage}</span>
          <span className="font-mono text-xs text-text-muted">of {totalPages}</span>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className={`
            px-3 py-2 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg transition-all duration-200
            ${currentPage === totalPages
              ? 'text-text-dim cursor-not-allowed bg-bg-elevated border border-border-subtle'
              : 'text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated hover:border-border-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 border border-border-subtle'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
};

export default Pagination;
