export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatPercent = (value) => {
  if (value == null || isNaN(value)) return '0.00%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export const formatLargeNumber = (num) => {
  if (num == null || isNaN(num)) return '0'
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`
  return `${sign}${abs}`
}

export const getPnLColor = (value) => (value >= 0 ? 'profit' : 'loss')

export const getSignalColor = (signal) => {
  switch (signal?.toUpperCase()) {
    case 'BUY':   return '#10B981'
    case 'SELL':  return '#EF4444'
    case 'HOLD':  return '#F59E0B'
    case 'WATCH': return '#3B82F6'
    default:      return '#6B7280'
  }
}
