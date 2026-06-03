
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

export const getCurrencyFractionDigits = (code: string = 'USD'): number => {
  return code === 'VND' ? 0 : 2;
};

export const roundCurrencyAmount = (amount: number, code: string = 'USD'): number => {
  const fractionDigits = getCurrencyFractionDigits(code);
  const precision = 10 ** fractionDigits;
  return Math.round((amount + Number.EPSILON) * precision) / precision;
};

export const formatNumberWithCommas = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

