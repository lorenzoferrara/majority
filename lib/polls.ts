export function formatPollMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    return month;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex - 1, 1));
}