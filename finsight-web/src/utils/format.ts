
export const formatCurrency = (amount: number, symbol: string = '$', code: string = 'USD') => {
  // Use Intl.NumberFormat for better formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    // If the symbol is custom or not matching the code, we might want to manually prepend/append
    // But for most cases, let's try to use the code's native formatting
  }).format(amount).replace(/[A-Z]{3}/, symbol); // Replace code with symbol if needed
};

// simpler version if the above is too complex
export const formatMoney = (amount: number, symbol: string = '$') => {
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
