import { AYLLA_GIFTS_CONFIG } from "./config";

/**
 * Isolated non-production staging test activation gate on Edition.
 * Requires explicit dual opt-in flags and strictly refuses Vercel Production.
 */
export function isAyllaEditionTestActivationEnabled(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const publicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim().toLowerCase();
  const targetEnv = process.env.VERCEL_TARGET_ENV?.trim().toLowerCase();

  if (
    vercelEnv === "production" ||
    publicVercelEnv === "production" ||
    targetEnv === "production"
  ) {
    return false;
  }

  return (
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION === "true" &&
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY === "true"
  );
}

/**
 * Runtime registry availability check for Edition Baby Aylla routes and UI.
 */
export function isAyllaEditionRegistryOperational(): boolean {
  return AYLLA_GIFTS_CONFIG.enabled || isAyllaEditionTestActivationEnabled();
}
