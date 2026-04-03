export function getCurrencySymbol(currency: "INR" | "USD") {
  return currency === "USD" ? "$" : "₹";
}

export function formatCurrency(
  value: number,
  currency: "INR" | "USD"
) {
  return new Intl.NumberFormat(
    currency === "USD" ? "en-US" : "en-IN",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(value);
}