export function safeNext(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  const path = value.split("?")[0] ?? value;
  if (path === "/login" || path === "/signup") return fallback;
  return value;
}
