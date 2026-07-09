export const convertPrice = (usdAmount: number | string, targetCurrency: string) => {
  const amount = typeof usdAmount === "string" ? parseFloat(usdAmount) : usdAmount;
  if (isNaN(amount)) return { amount: 0, symbol: "$", formatted: "$0" };

  const rates: Record<string, number> = {
    USD: 1.0,
    INR: 83.0,
    EUR: 0.92,
    GBP: 0.79,
  };

  const symbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };

  const rate = rates[targetCurrency] || 1.0;
  const symbol = symbols[targetCurrency] || "$";
  const converted = amount * rate;

  return {
    amount: Math.round(converted),
    symbol,
    formatted: `${symbol}${Math.round(converted).toLocaleString()}`,
  };
};
