# Runbook: Preview Supabase Migration Execution

This document details the operational guidelines, security configuration, and rollback policies for applying database schema changes to the **Preview** Supabase instance of the HAXR Signature Edition system.

---

## A. Purpose and Scope

The purpose of this operations runbook is to define a secure, auditable, and non-credential-exposing mechanism to execute migrations in the Preview environment. Opcionalmente, o workflow executa migrações commitadas e validadas comparando o estado do histórico.

---

## B. Environment Exclusion Policy

> [!WARNING]
> **PREVIEW ONLY — PRODUCTION STRICTLY EXCLUDED**
> Under no circumstances does this pipeline or runbook apply to, interact with, or reference the Production environment. All production migrations must be executed via the central Core production CI/CD infrastructure, completely separated from the Edition repository workspace.

---

## C. Required Human GitHub Configuration

An authorized repository administrator must configure the GitHub Environment manually before this workflow can execute.

### Secret Minimisation Policy

This control plane uses a **linkless, direct-connection** transport model:

```text
supabase migration list --db-url "$SUPABASE_DB_URL"
supabase db push --db-url "$SUPABASE_DB_URL"
```

**Required (exactly one Environment secret):**

| Name | Scope | Purpose |
|------|-------|---------|
| `SUPABASE_DB_URL` | GitHub Environment `supabase-preview-migrations` only | PostgreSQL connection string for the Preview database |

**Required (exactly one Environment variable):**

| Name | Value | Purpose |
|------|-------|---------|
| `SUPABASE_TARGET_TIER` | `preview` (literal) | Fail-closed guard before any remote apply |

**Explicitly forbidden — do not configure:**

| Name | Reason |
|------|--------|
| `SUPABASE_ACCESS_TOKEN` | Not used; removed from this pipeline by design |
| Repository-level database secrets | Violates environment isolation |
| `supabase login` | Not required for `--db-url` transport |
| `supabase link` | Not required; linkless model only |

### Configuration Steps
1. Navigate to **GitHub Repository ➔ Settings ➔ Environments**.
2. Click **New Environment** and name it exactly:
   `supabase-preview-migrations`
3. Configure **Required Reviewers**:
   - Add at least one DevOps / Lead Database Engineer as a mandatory approver.
4. Configure **Deployment Branches**:
   - Restrict execution to approved branch patterns (e.g., `main` or specific release branches).
5. Add the following **Environment Secret** (never use repository-level secrets or variables):
   * `SUPABASE_DB_URL`: The full PostgreSQL connection string to the Preview database instance.
6. Add the following **Environment Variable** (under Environment Variables tab):
   * `SUPABASE_TARGET_TIER`: Set exactly to the literal value `preview`.
7. Confirm **`SUPABASE_ACCESS_TOKEN` is not configured** anywhere in this repository or environment.

> [!CAUTION]
> **SECRET PROTECTION RULE**
> `SUPABASE_DB_URL` is strictly Preview-only and contains sensitive database access parameters. It must never be stored in repository code, environment files, GitHub variables, execution logs, pipeline artifacts, or developer local machines. The workflow passes it only through quoted expansion: `--db-url "$SUPABASE_DB_URL"`. Shell tracing (`set -x`) is disabled in all steps that handle this secret.

---

## D. How to Dispatch

The workflow is located under the Actions tab as **Supabase Preview Migrations Control Plane** and can only be triggered via `workflow_dispatch`.

1. Select the branch containing the migration (e.g., `codex/p2c-durable-upload-intents`).
2. Input the required **Change Ticket Identifier** (e.g., `TICKET-2026`).
3. Select the **Execution Mode**:
   - **`validate` (Default)**: Runs all local quality gates and checksum checks. Does not touch remote databases.
   - **`apply`**: Runs all quality gates, triggers the human approval block, and pushes pending migrations if approved.

---

## E. Exact Approval Gate Sequence

The execution proceeds through a strict chronological gate pattern:

```
[Workflow Triggered]
         │
         ▼
[Preflight Job Executes] ──► Checks out commit, verifies migration checksum, runs npm test, build, lint
         │
         ▼ (Passes)
[Human Approval Requested] ──► GitHub halts workflow. Designated reviewer evaluates Change Ticket & logs
         │
         ▼ (Approved)
[Environment Secrets Injected] ──► Runner decrypts SUPABASE_DB_URL into step env (never logged)
         │
         ▼
[Environment Safety Check] ──► Fail closed unless vars.SUPABASE_TARGET_TIER == 'preview'
         │
         ▼ (Passes)
[Supabase CLI Setup] ──► supabase/setup-cli@v2, pinned version 1.192.5 (not latest)
         │
         ▼
[Pre-Apply Migration History] ──► supabase migration list --db-url (history divergence check)
         │
         ▼ (Passes)
[Migration Apply (supabase db push)] ──► Single db push via --db-url (no retries)
         │
         ▼
[Post-Apply Verification] ──► Confirms target migration ID in remote migration history, emits audit log
```

---

## F. Migration History Semantics

> [!IMPORTANT]
> **MIGRATION HISTORY VS. SCHEMA DRIFT**
>
> `supabase migration list --db-url "$SUPABASE_DB_URL"` compares **local and remote migration-history timestamps**. It detects **migration-history divergence** — whether migrations recorded on the remote database are missing locally, or vice-versa.
>
> **It does NOT prove that the remote schema has no manual or out-of-band changes.** A successful migration-history check is **not** a full schema-drift audit. Manual modifications to tables, columns, indexes, or policies in the remote database that do not correspond to migration files will not be detected by this check.

---

## G. Failure Behaviour

* **No Automatic Repair**: If any step in the pipeline fails, the workflow immediately fails closed. No automatic repair operations are attempted.
* **No Automatic Retry**: The pipeline will not auto-retry database operations. An engineer must inspect the run logs and remote database state.
* **No Database Reset**: The pipeline never executes destructive actions like `supabase db reset` or `supabase db pull`.
* **State Recovery**: If a migration fails halfway, PostgreSQL transaction controls roll back the failed statements. The operator must investigate the remote schema list (`supabase migration list`) to identify issues before dispatching a new workflow run.

---

## H. Rollback Policy

> [!IMPORTANT]
> **NO DESTRUCTIVE ROLLBACKS**
> Automated schema rollbacks or down-migrations are strictly forbidden. If a migration is successfully applied but found to be buggy, remediation must be performed exclusively via a new, reviewed, and versioned **forward-only** migration script that patches the schema structure or configuration.

---

## I. Infrastructure Security Rules

1. **No Local .env File Usage**: Database connection URLs or access credentials must never be written to or read from local `.env` or `.env.local` files for remote migration.
2. **Dashboard SQL Editor Forbidden**: Manual DDL execution inside the Supabase console dashboard SQL editor is prohibited.
3. **No Developer Machine Pushes**: Manual execution of `supabase db push` or direct connections to the preview database from developer machines are forbidden. All modifications must go through this GHA Control Plane.
4. **No Environment Approval Bypass**: Administrative bypass of environment restrictions is strictly audited.
5. **No Forbidden Commands**: The use of `supabase login`, `supabase link`, `supabase db reset`, `supabase db pull`, `supabase db diff`, `supabase db seed`, or `supabase migration repair` is strictly prohibited in this pipeline.
6. **No Access Token**: `SUPABASE_ACCESS_TOKEN` must not be added to this workflow or environment. The linkless `--db-url` model does not require it.
7. **Pinned CLI Version**: The workflow installs Supabase CLI via `supabase/setup-cli@v2` with an explicit fixed version (`1.192.5`). Do not change to `latest`.

---

## J. Owner First-Run Checklist

When executing this control plane workflow for the first time, perform these checks:

- [ ] Confirm the GitHub Environment `supabase-preview-migrations` exists.
- [ ] Confirm the environment secret `SUPABASE_DB_URL` is populated with the correct Preview value.
- [ ] Confirm the environment variable `SUPABASE_TARGET_TIER` is set to `preview`.
- [ ] Confirm `SUPABASE_ACCESS_TOKEN` is **not** configured in this environment or repository.
- [ ] Verify that branch protection rules permit GHA runners to read repository code.
- [ ] Select `validate` mode and run the workflow. Confirm the `preflight` job passes and the `apply` job is skipped.
- [ ] Select `apply` mode and run the workflow. Verify the workflow stops and requests reviewer authorization.
- [ ] Confirm the reviewer approves, the secrets are injected, and the migration `20260702231600_photo_upload_intents` is marked as applied.
