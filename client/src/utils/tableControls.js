import { useState, useMemo } from 'react';

const PAGE_SIZE = 20;

// Client-side search + column sort + pagination for admin tables.
// getSearchText(row) -> string blob searched against; getSortValue(row, key) ->
// comparable value for the current sort key (defaults to raw field lookup).
export function useTableControls(rows, { getSearchText, getSortValue, initialSortKey = null, initialSortDir = 'asc', pageSize = PAGE_SIZE } = {}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [page, setPage] = useState(1);

  const list = Array.isArray(rows) ? rows : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    const textOf = getSearchText || ((r) => Object.values(r || {}).join(' '));
    return list.filter((r) => textOf(r).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const valueOf = getSortValue || ((r, key) => r?.[key]);
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = valueOf(a, sortKey);
      const bv = valueOf(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (sortDir === 'desc') copy.reverse();
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortKey, sortDir]);

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
    setPage(1);
  };

  const updateSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const sortIndicator = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  return {
    search,
    setSearch: updateSearch,
    sortKey,
    sortDir,
    toggleSort,
    sortIndicator,
    page: safePage,
    setPage,
    totalPages,
    totalCount,
    pageRows
  };
}

export default useTableControls;
