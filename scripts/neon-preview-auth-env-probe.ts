const TARGET_BRANCH = "migration/supabase-to-neon";

if (
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === TARGET_BRANCH
) {
  console.log(
    `[auth-env-probe] moderation_secret=${Boolean(process.env.ADMIN_MODERATION_SECRET?.trim())} database_url=${Boolean(process.env.DATABASE_URL?.trim())} oidc=${Boolean(process.env.VERCEL_OIDC_TOKEN?.trim())}`
  );
} else {
  console.log("[auth-env-probe] skipped outside dedicated migration Preview");
}
