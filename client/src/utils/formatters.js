export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDimensionsMm(dim) {
  if (!dim) return '';
  const { length, width, height } = dim;
  const inL = (length / 25.4).toFixed(1);
  const inW = (width / 25.4).toFixed(1);
  const inH = (height / 25.4).toFixed(1);
  return `${length} × ${width} × ${height} mm (${inL}″ × ${inW}″ × ${inH}″)`;
}
