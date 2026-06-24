export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  return url.replace(/\/$/, "");
}
