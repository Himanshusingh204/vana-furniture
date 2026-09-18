// Shared CSV export helper. Extracted from AdminDashboard.jsx and
// AnalyticsPro.jsx, which implemented this verbatim in two places.
export function exportCsv(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// Alias kept for call sites that used the AnalyticsPro naming.
export const downloadCsv = exportCsv;

export default exportCsv;
