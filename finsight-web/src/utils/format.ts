
export const formatMoney = (amount: number, symbol: string = '$', code: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'VND' ? 0 : 2,
      maximumFractionDigits: code === 'VND' ? 0 : 2,
    }).format(amount).replace(/[A-Z]{3}/, symbol);
  } catch (e) {
    // Fallback if code is invalid
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })}`;
  }
};
