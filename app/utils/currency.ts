export function getCurrencySymbol(currency: "INR" | "USD") {
  return currency === "USD" ? "$" : "₹";
}

export function formatCurrency(
  value: number,
  currency: "INR" | "USD"
) {
  return value.toLocaleString(
    currency === "USD" ? "en-US" : "en-IN"
  );
}