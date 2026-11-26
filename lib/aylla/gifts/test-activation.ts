import { AYLLA_GIFTS_CONFIG } from "./config";

function isVercelProductionEnv(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const publicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV?.trim().toLowerCase();
  const targetEnv = process.env.VERCEL_TARGET_ENV?.trim().toLowerCase();

  return (
    vercelEnv === "production" ||
    publicVercelEnv === "production" ||
    targetEnv === "production"
  );
}

/**
 * Isolated non-production staging test activation gate on Edition.
 * Requires explicit dual opt-in flags and strictly refuses Vercel Production.
 */
export function isAyllaEditionTestActivationEnabled(): boolean {
  if (isVercelProductionEnv()) {
    return false;
  }

  return (
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION === "true" &&
    process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY === "true"
  );
}

/**
 * Non-production staging gate for real Resend OTP integration tests without
 * synthetic OTP delivery or opening Production.
 */
export function isAyllaEditionRealDeliveryStagingEnabled(): boolean {
  if (isVercelProductionEnv()) {
    return false;
  }

  if (process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY === "true") {
    return false;
  }

  return (
    process.env.HAXR_AYLLA_GIFT_STAGING_TEST_ACTIVATION === "true" &&
    process.env.HAXR_AYLLA_GIFT_STAGING_REAL_DELIVERY === "true"
  );
}

/**
 * Runtime registry availability check for Edition Baby Aylla routes and UI.
 */
export function isAyllaEditionRegistryOperational(): boolean {
  return (
    AYLLA_GIFTS_CONFIG.enabled ||
    isAyllaEditionTestActivationEnabled() ||
    isAyllaEditionRealDeliveryStagingEnabled()
  );
}
