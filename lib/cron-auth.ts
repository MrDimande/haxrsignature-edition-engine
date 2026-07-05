export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.EDITION_CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}
