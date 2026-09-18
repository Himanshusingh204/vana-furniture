import React from 'react';

// Shared search input + prev/next pagination bar for admin tables.
export default function TableToolbar({ search, onSearch, placeholder = 'Search…', page, totalPages, totalCount, onPage }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="input-luxury"
        style={{ maxWidth: '280px' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        <span>{totalCount} result{totalCount === 1 ? '' : 's'} &bull; page {page} of {totalPages}</span>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
