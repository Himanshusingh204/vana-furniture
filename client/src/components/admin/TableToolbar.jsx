import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

// Shared search input + prev/next pagination bar for admin tables.
export default function TableToolbar({ search, onSearch, placeholder = 'Search…', page, totalPages, totalCount, onPage }) {
  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar-search">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="input-luxury"
          aria-label={placeholder}
        />
      </div>
      <div className="admin-toolbar-pagination">
        <span className="admin-num">{totalCount} result{totalCount === 1 ? '' : 's'} &bull; page {page} of {totalPages}</span>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
