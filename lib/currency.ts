export function getCurrencySymbol(currency?: string) {
  if (currency === "USD") return "$";
  return "₹"; // default INR
}