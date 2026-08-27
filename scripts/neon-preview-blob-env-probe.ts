const TARGET_BRANCH = "migration/supabase-to-neon";

if (
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === TARGET_BRANCH
) {
  console.log(
    `[blob-env-probe] store_id=${Boolean(process.env.BLOB_STORE_ID?.trim())} webhook_key=${Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY?.trim())} oidc=${Boolean(process.env.VERCEL_OIDC_TOKEN?.trim())} rw_token=${Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())}`
  );
} else {
  console.log("[blob-env-probe] skipped outside dedicated migration Preview");
}
