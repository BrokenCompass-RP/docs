export function applicationUrl(path, requestUrl, environment = process.env) {
  const configured = environment.APP_BASE_URL;
  if (environment.NODE_ENV === "production" && !configured) throw new Error("APP_BASE_URL is required in production");
  const base = new URL(configured || requestUrl);
  if (configured && (base.username || base.password || base.pathname !== "/" || base.search || base.hash)) throw new Error("APP_BASE_URL must be an origin");
  if (environment.NODE_ENV === "production" && base.protocol !== "https:") throw new Error("APP_BASE_URL must use HTTPS in production");
  return new URL(path, base);
}
