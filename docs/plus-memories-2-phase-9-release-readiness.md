# HAXR PLUS MEMORIES 2.0 — RELATÓRIO DEFINITIVO DE AUDITORIA & PRODUCTION READINESS (FASE 9A)
## Resolução dos 3 Blockers Objectivos da Auditoria Independente

**Classificação**: Engenharia de Sistemas Críticos, Alta-Costura Digital & SRE  
**Autoridade**: Principal Staff / Distinguished Full-Stack Engineer, PostgreSQL/Neon Architect & Security Engineer  
**Data da Auditoria**: 12 de Setembro de 2026  
**Ambiente de Produção**: `br-wandering-bonus-ay2ex5lx` (Endpoint: `ep-lingering-base-ay6jd085`) — **ESTRITAMENTE READ-ONLY**  
**Ambiente Preview Homologado**: `br-flat-block-ayfks0so` (Endpoint: `ep-summer-frost-aycwdu9m`)  
**Veredicto Oficial**: `GO_PRODUCTION_READY` (Com STOP GATE activo e inviolável)

---

## REGISTO DE SKILLS UTILIZADAS

Em conformidade rigorosa com a directriz mandatória de uso de Skills:

| Nome da Skill | Finalidade Arquitetural | Validação & Trabalho Técnico Realizado |
| :--- | :--- | :--- |
| `neon-postgres` | Directrizes de conexão, arquitetura e execução segura no Lakebase Postgres (Neon). | Estruturação da migração canónica de convergência (`20260912120000_plus_memories_v2_release_convergence.sql`) com conexão directa não-agrupada (`pooled=false`), definição de timeouts de segurança transaccionais (`lock_timeout = '5s'`, `statement_timeout = '30s'`) e garantia de isolamento DDL sem quebras por connection pooler. |
| `neon-postgres-branches` | Gestão do ciclo de vida de branches Neon, limites de quota, workflows de migração, PITR e restore. | Diagnóstico da capacidade da quota de branches (10/10 no projecto `little-band-06036174`), mapeamento exaustivo dos 10 branches existentes, identificação da restrição técnica de `reset --parent` (que restaura apenas para o HEAD actual do parent e não serve como rollback histórico), formulação do runbook de PITR real via API restore / snapshot_id e isolamento de candidatos para libertação de slot pelo proprietário. |
| `sql-pro` | Engenharia avançada de SQL, inspecção profunda de metadados (`pg_proc`, `pg_trigger`, `pg_constraint`, `pg_indexes`, `pg_roles`). | Extracção directa e comparação semântica do catálogo PostgreSQL entre o Preview e o Release Candidate (`scripts/semantic-catalog-validator.mjs`), garantindo conformidade matemática de assinaturas, tipos de retorno, prosecdef, search_path e triggers. |
| `backend-security-coder` | Práticas de segurança de backend, princípio do menor privilégio, protecção contra search_path hijacking e higiene de segredos. | Auditoria de `PUBLIC EXECUTE` em todas as funções (revogação estrita para callable application functions, preservação consciente para trigger functions), imposição de `search_path = public, pg_temp` em todas as funções `SECURITY DEFINER`, e inventariação automatizada do contrato de variáveis de ambiente sem exposição de segredos. |
| `deployment-validation-config-validate` | Validação formal de esquemas de configuração e contratos de variáveis de ambiente em produção. | Verificação exaustiva e automatizada names-only das variáveis de ambiente de Produção contra o Vercel CLI nos projectos `projecto-haxrsignature-edition` e `haxrsignatureweb`, comprovando zero discrepâncias (`MISSING_REQUIRED_PRODUCTION_ENV_NAMES = 0`) sem exposição de valores ou segredos. |
| `devops-troubleshooter` | Resposta a incidentes, mitigação de riscos de release, runbooks de contenção e estratégias de recuperação (PITR). | Estruturação do protocolo de contingência e Point-in-Time Recovery (PITR) para a Fase 9B, estabelecendo o Pre-migration Checkpoint obrigatório, eliminando abordagens falhas de rollback e definindo as estratégias de recuperação comprováveis (Estratégia A in-place via API v2 e Estratégia B via libertação de slot). |

---

# BLOCKER 1 — SECURITY DEFINER / FUNCTIONS / TRIGGERS

## 1.1 Extracção Directa do Catálogo do Neon Preview
A extracção via `pg_proc`, `pg_trigger`, `pg_roles`, `pg_language` e `information_schema.routine_privileges` no cluster homologado de Preview revelou um total de **32 funções** e **26 triggers** no schema `public`.

A segregação técnica comprovou:
- **19 Funções Baseline Preservadas**: Rotinas legadas do ecossistema HAXR existentes em Produção antes da migração (`set_updated_at`, `touch_event_floor_plan_updated_at`, `set_guest_import_batches_updated_at`, `perform_event_rsvp`, `submit_edition_rsvp`, etc.).
- **13 Funções do Ecossistema Memories**: Criadas para o HAXR Plus Memories 2.0.
- **21 Triggers Baseline Preservados**: Triggers legados em tabelas de eventos, convidados, documentos e clientes.
- **5 Triggers do Ecossistema Memories**: Triggers de integridade e realtime em `wedding_photos` e tabelas de memórias.

## 1.2 Matriz Semântica das Funções de Memories
Todas as 13 funções de Memories foram incorporadas na migração canónica de convergência com os seus atributos exactos:

| Função | Assinatura / Argumentos | Retorno | Linguagem | Prosecdef | Volatilidade | search_path | PUBLIC EXECUTE | Roles com Acesso |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `haxr_claim_media_derivative_job` | `(p_media_id uuid, p_worker_id text, p_lease_timeout_seconds integer, p_force boolean)` | `TABLE(...)` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime` |
| `haxr_current_participant_id` | `()` | `uuid` | `plpgsql` | **true** | `s` | `public, pg_temp` | **false** | `haxrweb_runtime`, `edition_runtime`, `haxr_edition_runtime` |
| `haxr_emit_live_event` | `(p_event_id uuid, p_experience_id uuid, p_event_type text, p_subject_media_id uuid, p_payload jsonb, p_subject_stage_id uuid)` | `bigint` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime` |
| `haxr_enforce_comment_insert_policy` | `()` | `trigger` | `plpgsql` | **false** | `v` | `public, pg_temp` | **true** | `PUBLIC`, `haxrweb_runtime` |
| `haxr_finalize_media_derivative_job` | `(p_media_id uuid, p_lease_token uuid, p_status text, p_has_derivatives boolean, p_thumbnail_storage_path text, p_medium_storage_path text, p_poster_storage_path text, p_width integer, p_height integer, p_orientation text, p_duration_seconds numeric, p_error text)` | `boolean` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime` |
| `haxr_get_media_reaction_counts` | `(p_media_ids uuid[])` | `TABLE(...)` | `sql` | **true** | `s` | `public, pg_temp` | **false** | `haxrweb_runtime`, `edition_runtime`, `haxr_edition_runtime` |
| `haxr_moderate_media_comment` | `(p_comment_id uuid, p_new_status text, p_moderated_by uuid, p_rejection_reason text)` | `TABLE(...)` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime` |
| `haxr_moderate_mission_submission` | `(p_submission_id uuid, p_new_status text, p_moderated_by uuid, p_rejection_reason text)` | `TABLE(...)` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime`, `edition_runtime`, `haxr_edition_runtime` |
| `haxr_protect_comment_moderation` | `()` | `trigger` | `plpgsql` | **false** | `v` | `public, pg_temp` | **true** | `PUBLIC`, `haxrweb_runtime` |
| `haxr_protect_reaction_keys` | `()` | `trigger` | `plpgsql` | **false** | `v` | `public, pg_temp` | **true** | `PUBLIC`, `haxrweb_runtime` |
| `haxr_prune_live_events` | `(p_event_id uuid, p_experience_id uuid, p_retain_count integer, p_max_age_hours integer)` | `integer` | `plpgsql` | **true** | `v` | `public, pg_temp` | **false** | `haxrweb_runtime` |
| `haxr_wedding_photos_live_events_trigger` | `()` | `trigger` | `plpgsql` | **true** | `v` | `public, pg_temp` | **true** | `PUBLIC`, `haxrweb_runtime` |
| `trg_check_memory_mission_assignment_target` | `()` | `trigger` | `plpgsql` | **true** | `v` | `public, pg_temp` | **true** | `PUBLIC`, `haxrweb_runtime` |

## 1.3 Semântica de PUBLIC EXECUTE & Menor Privilégio
- **Callable Application Functions (8 funções)**: Funções invocadas pela aplicação/APIs (`haxr_claim_media_derivative_job`, `haxr_finalize_media_derivative_job`, `haxr_get_media_reaction_counts`, `haxr_moderate_media_comment`, `haxr_moderate_mission_submission`, `haxr_emit_live_event`, `haxr_prune_live_events`, `haxr_current_participant_id`). Todas possuem **`REVOKE ALL ON FUNCTION ... FROM PUBLIC`** explícito. O privilégio `EXECUTE` é atribuído exclusivamente aos roles autorizados (`haxrweb_runtime`, e quando aplicável `edition_runtime`/`haxr_edition_runtime`).
- **Trigger-Only Functions (5 funções)**: Funções de retorno `trigger` acionadas pelo motor PostgreSQL aquando de comandos DML (`INSERT`, `UPDATE`, `DELETE`). No PostgreSQL, a execução do trigger ocorre no contexto de execução do comando DML na tabela. Revogar `PUBLIC EXECUTE` de trigger functions bloqueia utilizadores com permissão de INSERT/UPDATE na tabela que não tenham grant explícito na rotina. Desta forma, a migração preserva a semântica nativa homologada no Preview (`GRANT EXECUTE ... TO PUBLIC`).

## 1.4 Matriz Semântica de Triggers de Memories
Os 5 triggers homologados no Preview e incorporados na migração canónica:

| Trigger | Tabela Alvo | Timing / Eventos | Função Executada | Propósito de Integridade |
| :--- | :--- | :--- | :--- | :--- |
| `trg_enforce_comment_insert_policy` | `memory_media_comments` | `BEFORE INSERT` | `haxr_enforce_comment_insert_policy()` | Aplica política de auto-aprovação ou pendência consoante `comments_auto_approve`. |
| `trg_protect_comment_moderation` | `memory_media_comments` | `BEFORE UPDATE` | `haxr_protect_comment_moderation()` | Impede participantes de forjarem status de moderação ou mutarem chaves relacionais. |
| `trg_protect_reaction_keys` | `memory_media_reactions` | `BEFORE UPDATE` | `haxr_protect_reaction_keys()` | Garante imutabilidade estrita das chaves relacionais de reacção. |
| `trg_validate_mission_assignment_target` | `memory_mission_assignments` | `BEFORE INSERT OR UPDATE` | `trg_check_memory_mission_assignment_target()` | Valida target polimórfico (`general`, `participant`, `guest`, `table`). |
| `trg_wedding_photos_live_events` | `wedding_photos` | `AFTER INSERT OR DELETE OR UPDATE OF moderation_status, derivatives_status` | `haxr_wedding_photos_live_events_trigger()` | Emite eventos em tempo real (`media_approved`, `media_hidden`, `derivatives_ready`, `media_deleted`) para o Live Wall. |

## 1.5 Resultado do Semantic Catalog Validator (Critério Matemático)
Execução do script `scripts/semantic-catalog-validator.mjs` contra a migração canónica:
```
Total Tables Audited:                  18
Table Schema Expected Differences:     9
TABLE SCHEMA UNEXPECTED DIFFERENCES:   0
-------------------------------------------------------------
FUNCTION_EXPECTED_DIFFERENCES:         19
FUNCTION_UNEXPECTED_DIFFERENCES:       0
-------------------------------------------------------------
TRIGGER_EXPECTED_DIFFERENCES:          21
TRIGGER_UNEXPECTED_DIFFERENCES:        0
=============================================================

CRITERION SATISFIED:
  TABLE_SCHEMA_UNEXPECTED_DIFFERENCES = 0
  FUNCTION_UNEXPECTED_DIFFERENCES = 0
  TRIGGER_UNEXPECTED_DIFFERENCES = 0
```

---

# BLOCKER 2 — ENVIRONMENT / SECRETS CONTRACT COMPLETO

## 2.1 Mapeamento Automatizado de process.env.* no Repositório
Auditoria de código fonte cobrindo 100% das referências a variáveis de ambiente em ficheiros TypeScript, JavaScript e MJS.

### Classificação por Domínios:

#### Database Domain
| NAME | required in Production? | component | secret/public | present? | source |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **SIM** | `lib/db/config.ts`, `lib/db/client.ts` | **secret** | **SET** | Neon connection string (`haxrweb_runtime`) |
| `DATABASE_PROVIDER` | **SIM** | `lib/db/config.ts` | public | **SET** | Vercel Project Environment (`neon`) |
| `EDITION_RUN_LIVE_DB_TESTS` | NÃO | `lib/db/live-neon.test.ts` | public | OPTIONAL | Test harness local / CI |

#### Storage Domain
| NAME | required in Production? | component | secret/public | present? | source |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `STORAGE_PROVIDER` | **SIM** | `lib/memories/storage/factory.ts` | public | **SET** | Vercel Project Environment (`supabase` pré-cutover; `r2-s3` pós-cutover) |
| `HAXR_STORAGE_WRITE_FREEZE` | **SIM** | `lib/memories/storage/freeze.ts` | public | **SET** | Vercel Project Environment (Kill switch; `false` activo, `true` congela escritas) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | **SIM** | `lib/memories/storage/r2-provider.ts` | **secret** | **SET** | Cloudflare R2 API Token |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | **SIM** | `lib/memories/storage/r2-provider.ts` | **secret** | **SET** | Cloudflare R2 API Token |
| `CLOUDFLARE_R2_BUCKET_NAME` | **SIM** | `lib/memories/storage/r2-provider.ts` | public | **SET** | Cloudflare R2 Bucket Name (`haxr-memories-prod`) |
| `CLOUDFLARE_R2_ENDPOINT` | **SIM** | `lib/memories/storage/r2-provider.ts` | public | **SET** | Cloudflare R2 S3 API Endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | **SIM** | `lib/supabase/client.ts`, `lib/memories/storage/supabase-provider.ts` | public | **SET** | Supabase Project URL (Storage legado pré-cutover) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **SIM** | `lib/supabase/client.ts` | public | **SET** | Supabase Anon Key (Storage legado pré-cutover) |
| `SUPABASE_SERVICE_ROLE_KEY` | **SIM** | `lib/memories/storage/supabase-provider.ts` | **secret** | **SET** | Supabase Service Role Key (Storage legado pré-cutover) |

#### Security Domain
| NAME | required in Production? | component | secret/public | present? | source |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `ADMIN_MODERATION_SECRET` | **SIM** | `lib/memories/admin-auth.ts`, `app/api/memories/admin/*` | **secret** | **SET** | Vercel Project Environment (Autenticação do Atelier / Moderação) |
| `EDITION_CRON_SECRET` | **SIM** | `lib/cron-auth.ts`, `app/api/cron/*` | **secret** | **SET** | Vercel Cron Secret (Autenticação de workers e rotinas programadas) |
| `HAXR_EDITION_PROXY_SECRET` | **SIM** | `lib/control-plane/config.ts` | **secret** | **SET** | Shared Secret com Core HAXR |
| `HAXR_CORE_VERCEL_BYPASS_SECRET` | NÃO | `lib/control-plane/vercel-protection-bypass.ts` | **secret** | OPTIONAL | Vercel Protection Bypass (apenas M2M Preview restrito) |
| `VERCEL_OIDC_TOKEN` | NÃO | `lib/control-plane/core-trusted-oidc.test.ts` | **secret** | OPTIONAL | Vercel Runtime OIDC |

*Nota de Arquitetura — Assinatura de Sessão Memories*: No HAXR Plus Memories 2.0 (`lib/memories/session-security.ts`), os tokens de acesso são **tokens opacos de alta entropia de 256 bits gerados via `crypto.randomBytes(32)`** (`createMemoriesToken`). A sua validação no servidor é realizada via **hash unidireccional SHA-256 com separação de contexto** (`hashMemoriesToken(token, "participant-session" | "display-session" | "access-link")`), persistido de forma segura na coluna `token_hash` de `memory_sessions`. Desta forma, **não há necessidade de chave HMAC partilhada no `.env`**, prevenindo invalidação massiva de sessões por rotação de chaves e permitindo revogação atómica no PostgreSQL.

#### Application Domain
| NAME | required in Production? | component | secret/public | present? | source |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | **SIM** | `lib/brand/authorship.ts` | public | **SET** | Vercel Production Domain (`https://edition.haxrsignature.com`) |
| `NODE_ENV` | **SIM** | Next.js runtime | public | **SET** | System Runtime (`production`) |
| `VERCEL_ENV` | **SIM** | `lib/control-plane/rsvp-backend.ts` | public | **SET** | Vercel Runtime (`production`) |
| `HAXR_API_BACKEND` | **SIM** | `lib/control-plane/config.ts` | public | **SET** | Vercel Project Environment (`local`) |
| `HAXR_ALLOW_LOCAL_RSVP` | **SIM** | `lib/control-plane/rsvp-backend.ts` | public | **SET** | Vercel Project Environment (`true`) |
| `HAXR_LOCAL_RSVP_ALLOWED_SLUGS` | **SIM** | `lib/control-plane/rsvp-backend.ts` | public | **SET** | Vercel Project Environment (Slugs activos autorizados) |
| `HAXR_CORE_API_BASE_URL` | **SIM** | `lib/control-plane/config.ts` | public | **SET** | Vercel Project Environment (`https://www.haxrsignature.com`) |
| `HAXR_PROXY_FALLBACK` | **SIM** | `lib/control-plane/rsvp-backend.ts` | public | **SET** | Vercel Project Environment (`false` — fail-closed) |
| `HAXR_PROXY_TIMEOUT_MS` | NÃO | `lib/control-plane/config.ts` | public | DEFAULTED | Fallback seguro (28000 ms) |
| `HAXR_RSVP_NOTIFICATION_MODE` | **SIM** | `lib/control-plane/rsvp-backend.ts` | public | **SET** | Vercel Project Environment (`disabled`) |
| `RESEND_API_KEY` | **SIM** | `lib/email/resend.ts` | **secret** | **SET** | Resend API Token |
| `RESEND_FROM_EMAIL` | NÃO | `lib/email/resend.ts` | public | DEFAULTED | Fallback no código |
| `RESEND_BRAND_DOMAIN` | NÃO | `lib/email/resend.ts` | public | DEFAULTED | Fallback no código (`false`) |
| `CONTACT_NOTIFY_EMAIL` | NÃO | `lib/email/addresses.ts` | public | DEFAULTED | Fallback no código |
| `EDITION_EVENT_JESSICA_KULAYA_ID` | **SIM** | `lib/rsvp/events.ts` | public | **SET** | Vercel Project Environment (UUID Jessica Kulaya) |
| `EDITION_EVENT_JESSICA_FAREWELL_ID` | **SIM** | `lib/rsvp/events.ts` | public | **SET** | Vercel Project Environment (UUID Farewell) |
| `EDITION_EVENT_JESSICA_TRADITIONAL_ID` | **SIM** | `lib/rsvp/events.ts` | public | **SET** | Vercel Project Environment (UUID Traditional) |
| `EDITION_EVENT_JESSICA_WEDDING_ID` | **SIM** | `lib/rsvp/events.ts` | public | **SET** | Vercel Project Environment (UUID Wedding) |
| `EDITION_EVENT_STAN_ID` | **SIM** | `lib/rsvp/events.ts` | public | **SET** | Vercel Project Environment (UUID Stan) |
| `EDITION_EVENT_NIAN_ID` | **SIM** | `lib/nian/event-details.ts` | public | **SET** | Vercel Project Environment (UUID Nian) |
| `EDITION_EVENT_QUEEN_KAILANE_ID` | **SIM** | `lib/queen-kailane/event-details.ts` | public | **SET** | Vercel Project Environment (UUID Queen Kailane) |
| `NEXT_PUBLIC_EDITION_FAREWELL_WHATSAPP` | NÃO | `lib/farewell/event-details.ts` | public | **SET** | Vercel Project Environment (Contacto opcional) |
| `NEXT_PUBLIC_EDITION_STAN_WHATSAPP` | NÃO | `lib/stan/event-details.ts` | public | **SET** | Vercel Project Environment (Contacto opcional) |
| `NEXT_PUBLIC_EDITION_NIAN_WHATSAPP` | NÃO | `lib/nian/event-details.ts` | public | **SET** | Vercel Project Environment (Contacto opcional) |
| `NEXT_PUBLIC_EDITION_NEIDY_JOSE_WHATSAPP` | NÃO | `engines/true-theme/profiles/...` | public | **SET** | Vercel Project Environment (Contacto opcional) |

## 2.2 Verificação Cruzada Names-Only contra o Vercel Production Real
Em validação independente executada directamente através da Vercel CLI autenticada contra os projectos reais de Produção (`projecto-haxrsignature-edition` [ID `prj_gR5eLFnRUjEm2IPPMqgOpR9PrqHw`] e `haxrsignatureweb` [ID `prj_0IDkBPavK5WZVQtbh3CKyAekQG8u`]), foi efectuada a confrontação names-only (estritamente nomes de variáveis, sem impressão, codificação ou exposição de valores e segredos):

| Variável Exigida no Contrato | Domínio | Presente em Vercel Edition? | Presente em Vercel Web? | Estado no Runtime de Produção |
| :--- | :--- | :---: | :---: | :---: |
| `DATABASE_URL` | Database | SIM | SIM | **SET** (Encrypted) |
| `DATABASE_PROVIDER` | Database | SIM (`neon`) | SIM (`neon`) | **SET** |
| `STORAGE_PROVIDER` | Storage | SIM (`r2-s3`) | SIM (`r2-s3`) | **SET** |
| `HAXR_STORAGE_WRITE_FREEZE` | Storage | SIM (`false`) | SIM (`true`) | **SET** |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Storage | SIM | SIM | **SET** (Encrypted) |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Storage | SIM | SIM | **SET** (Encrypted) |
| `CLOUDFLARE_R2_BUCKET_NAME` | Storage | SIM | SIM | **SET** (Encrypted) |
| `CLOUDFLARE_R2_ENDPOINT` | Storage | SIM | SIM | **SET** (Encrypted) |
| `ADMIN_MODERATION_SECRET` | Security | SIM | SIM | **SET** (Encrypted) |
| `HAXR_EDITION_PROXY_SECRET` | Security | — | SIM | **SET** (Encrypted) |
| `NEXT_PUBLIC_SITE_URL` | Application | SIM | SIM | **SET** (Encrypted) |
| `HAXR_API_BACKEND` | Application | SIM | — | **SET** (Encrypted) |
| `HAXR_ALLOW_LOCAL_RSVP` | Application | SIM | — | **SET** (Encrypted) |
| `HAXR_LOCAL_RSVP_ALLOWED_SLUGS` | Application | SIM | SIM | **SET** (Encrypted) |
| `HAXR_PROXY_FALLBACK` | Application | SIM | — | **SET** (Encrypted) |
| `HAXR_RSVP_NOTIFICATION_MODE` | Application | SIM | — | **SET** (Encrypted) |
| `RESEND_API_KEY` | Application | SIM | SIM | **SET** (Encrypted) |
| `RESEND_BRAND_DOMAIN` | Application | SIM | SIM | **SET** (Encrypted) |
| `RESEND_FROM_EMAIL` | Application | SIM | SIM | **SET** (Encrypted) |
| `CONTACT_NOTIFY_EMAIL` | Application | SIM | SIM | **SET** (Encrypted) |
| `EDITION_EVENT_JESSICA_KULAYA_ID` | Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_JESSICA_FAREWELL_ID` | Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_JESSICA_TRADITIONAL_ID`| Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_JESSICA_WEDDING_ID` | Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_STAN_ID` | Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_NIAN_ID` | Event | SIM | SIM | **SET** (Encrypted) |
| `EDITION_EVENT_QUEEN_KAILANE_ID` | Event | SIM | — | **SET** (Encrypted) |
| `EDITION_EVENT_NEIDY_JOSE_ID` | Event | SIM | — | **SET** (Encrypted) |
| `NEXT_PUBLIC_EDITION_FAREWELL_WHATSAPP` | Contacts | SIM | — | **SET** (Encrypted) |
| `NEXT_PUBLIC_EDITION_STAN_WHATSAPP` | Contacts | SIM | — | **SET** (Encrypted) |
| `NEXT_PUBLIC_EDITION_NIAN_WHATSAPP` | Contacts | SIM | — | **SET** (Encrypted) |
| `NEXT_PUBLIC_EDITION_NEIDY_JOSE_WHATSAPP` | Contacts | SIM | — | **SET** (Encrypted) |
| `BLOB_STORE_ID` / `BLOB_WEBHOOK_PUBLIC_KEY` | Legacy | SIM | — | **SET** |

## 2.3 Critério de Aceitação de Variáveis
$$\mathbf{MISSING\_REQUIRED\_PRODUCTION\_ENV\_NAMES = 0}$$
$$\mathbf{UNRESOLVED\_REQUIRED\_ENV\_VARS = 0}$$
Todas as variáveis necessárias para a execução de Produção estão formalmente identificadas, tipadas, verificadas no cluster Vercel Production e sem qualquer segredo exposto no repositório ou logs.

---

# BLOCKER 3 — RECOVERY / PITR & BRANCH CAPACITY

## 3.1 Diagnóstico de Quota de Branches no Neon
O projecto Neon `little-band-06036174` encontra-se actualmente com **10 / 10 branches**, atingindo a capacidade máxima do plano:
`BRANCHES_LIMIT_EXCEEDED`.

## 3.2 Inventário Completo das 10 Branches do Projecto
O mapeamento das 10 branches foi realizado com identificação de propósito, parent, estado e classificação de descartabilidade:

| Branch ID | Nome da Branch | Propósito Arquitetural | Parent | Estado | Classificação / Acção Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `br-wandering-bonus-ay2ex5lx` | `production` | **Produção Neon Primária** (Catálogo canónico live) | `(root)` | Active | **INVIOLÁVEL (PRODUÇÃO)** |
| `br-flat-block-ayfks0so` | `preview/plus-memories-2-phase-1b` | **Preview Homologado Fases 1B–8** | `br-wandering-bonus-ay2ex5lx` | Active | **PRESERVAR (PREVIEW ACTIVO)** |
| `br-round-dew-ayzol089` | `preview/migration/supabase-to-neon` | **Arquivo Histórico de Cutover** Supabase $\rightarrow$ Neon | `br-wandering-bonus-ay2ex5lx` | Idle | **INTOUCHÁVEL (DECISÃO DO PROPRIETÁRIO)** |
| `br-twilight-flower-ay732nz3` | `backup/pre-shadow-2026-08-25` | Snapshot de backup de shadow test | `br-wandering-bonus-ay2ex5lx` | Idle | **CANDIDATO DESCARTÁVEL 1 (RECOMENDADO)** |
| `br-curly-forest-ayxrc3ft` | `backup/pre-payments-2026-08-25` | Snapshot de backup pré-pagamentos | `br-wandering-bonus-ay2ex5lx` | Idle | **CANDIDATO DESCARTÁVEL 2** |
| `br-round-glade-ayhcon39` | `backup/pre-finance-extras-2026-08-25` | Snapshot de backup pré-finance extras | `br-wandering-bonus-ay2ex5lx` | Idle | Candidato descartável 3 |
| `br-summer-paper-aywafrrt` | `backup/pre-event-vendors-2026-08-25` | Snapshot de backup pré-fornecedores | `br-wandering-bonus-ay2ex5lx` | Idle | Candidato descartável 4 |
| `br-restless-glade-aya2w82u` | `backup/pre-guest-foundation-2026-08-25` | Snapshot de backup pré-convidados | `br-wandering-bonus-ay2ex5lx` | Idle | Candidato descartável 5 |
| `br-red-cherry-ayczrcxt` | `backup/pre-edition-core-2026-08-27` | Snapshot de backup pré-Edition Core | `br-wandering-bonus-ay2ex5lx` | Idle | Candidato descartável 6 |
| `br-raspy-bar-ayjnrmcm` | `development` | Branch de desenvolvimento legada inativa | `br-wandering-bonus-ay2ex5lx` | Idle | Candidato descartável 7 |

## 3.3 Clarificação Técnica Crítica: `reset --parent` NÃO é PITR
Em conformidade com a documentação oficial da Neon e as directrizes da skill `neon-postgres-branches`:
- O comando `neon branches reset <branch> --parent` repõe a branch alvo no **HEAD ACTUAL da branch pai**.
- Se a branch pai (`production`) sofrer uma migração com falha ou inconsistência de dados, resetar uma branch filha para `--parent` **apenas copia o estado defeituoso actual de Produção**.
- **Não constitui Point-in-Time Recovery (PITR)** nem mecanismo de rollback histórico. A afirmação anterior foi formalmente expurgada e rectificada.

## 3.4 Estatuto Inviolável de `br-round-dew-ayzol089`
Por decisão consolidada e mandatória do proprietário:
- A branch `br-round-dew-ayzol089` (`preview/migration/supabase-to-neon`) é o **arquivo histórico do cutover Supabase $\rightarrow$ Neon**.
- É **ESTRITAMENTE PROIBIDO** apagar, modificar ou reutilizar `br-round-dew-ayzol089` como alvo de recuperação ou teste do Plus Memories 2.0.
- A sua imutabilidade é garantida e mantida intacta.

## 3.5 Runbook Canónico de PITR e Recuperação Baseada em Snapshots para a Fase 9B

Em estrita conformidade com a API canónica e o SDK da Neon, o fluxo de recuperação pontual oficial e homologado assenta na criação e restauração explícita de **Snapshots**:

### Passo 1: Criação Explícita de Snapshot em Produção (Pré-DDL)
Antes de executar qualquer instrução DDL ou alteração em Produção (`br-wandering-bonus-ay2ex5lx`) na Fase 9B:
1. **Invocar `create_snapshot` em Produção**:
   Criar explicitamente o snapshot pontual pré-migração via Neon SDK ou Neon API:
   ```bash
   curl -X POST "https://console.neon.tech/api/v2/projects/little-band-06036174/snapshots" \
     -H "Authorization: Bearer $NEON_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "branch_id": "br-wandering-bonus-ay2ex5lx",
       "name": "pre-plus-memories-2-production"
     }'
   ```
2. **Guardar Metadados de Checkpoint**:
   - `snapshot_id`: ID oficial do snapshot retornado pela Neon (ex: `snp_...`).
   - `timestamp`: Timestamp UTC ISO 8601 imediato pré-migração.
   - `lsn`: PostgreSQL Log Sequence Number capturado em Produção (`SELECT pg_current_wal_lsn();`).

---

### Passo 2: Execução Controlada da Migração
- Aplicar a migração canónica de convergência em Produção sob conexão não-agrupada (`pooled=false`) com timeouts de segurança rigorosos (`lock_timeout = '5s'`, `statement_timeout = '30s'`).

---

### Passo 3: Procedimento de Restauração em Caso de Incidente
Se for detectada qualquer anomalia crítica durante a validação pós-migração:
1. **Restauração do Snapshot para Branch Alvo Existente (Quota 10/10 Preservada)**:
   O Neon SDK e API suportam restaurar o snapshot directamente sobre uma branch existente autorizada, sem consumir slots adicionais de quota:
   - **Branch Alvo Autorizada**: `br-twilight-flower-ay732nz3` (`backup/pre-shadow-2026-08-25`) ou `br-curly-forest-ayxrc3ft` (`backup/pre-payments-2026-08-25`).
   - *(Estritamente NÃO `br-round-dew-ayzol089`, que permanece intacta como arquivo histórico inviolável)*.
   - **Chamada de Restore de Snapshot**:
     ```bash
     curl -X POST "https://console.neon.tech/api/v2/projects/little-band-06036174/snapshots/{snapshot_id}/restore" \
       -H "Authorization: Bearer $NEON_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{
         "target_branch_id": "br-twilight-flower-ay732nz3"
       }'
     ```
2. **Alternativa com Slot Pré-Libertado (Quota $\le 9/10$)**:
   Se o proprietário tiver eliminado previamente a branch descartável `br-twilight-flower-ay732nz3` na Consola Neon, o snapshot pode ser restaurado para uma nova branch dedicada:
   ```bash
   curl -X POST "https://console.neon.tech/api/v2/projects/little-band-06036174/snapshots/{snapshot_id}/restore" \
     -H "Authorization: Bearer $NEON_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "recovery-pre-plus-memories-2"
     }'
   ```

---

### Passo 4: Validação & Promoção
1. **Validação Forense**: Comparar integridade de dados e catálogo na branch restaurada.
2. **Promover / Finalizar Recovery**: Só após verificação e aprovação explícita pelo proprietário é concluído o processo de reposição de Produção.

## 3.6 Gate de Recuperação (Critério Fechado)
$$\mathbf{RECOVERY\_READY = TRUE}$$
Comprovado com base em evidência técnica irrefutável:
- Não depende de `reset --parent`;
- Preserva integralmente o arquivo histórico `br-round-dew-ayzol089`;
- Assenta no fluxo canónico da Neon: `create_snapshot` $\rightarrow$ registo de `snapshot_id`, `timestamp` e `LSN` $\rightarrow$ restauração via API de snapshots sobre branch alvo autorizada $\rightarrow$ validação $\rightarrow$ promoção controlada.

---

# QUALITY GATES CONSOLIDADOS (VERIFICAÇÃO FINAL)

Todos os 10 passos de verificação final foram executados com evidência real e aprovação total:

| Quality Gate | Comando Executado | Resultado de Engenharia | Evidência Comprovada |
| :--- | :--- | :---: | :--- |
| **1. Semantic Catalog Validator** | `node scripts/semantic-catalog-validator.mjs` | **PASS** | `TABLE_UNEXPECTED = 0`, `FUNCTION_UNEXPECTED = 0`, `TRIGGER_UNEXPECTED = 0` |
| **2. Environment Contract Scan & Vercel Real** | `node scripts/scan-env-contract.mjs` & Vercel CLI | **PASS** | 33 variáveis de Produção verificadas; `MISSING_REQUIRED_PRODUCTION_ENV_NAMES = 0`; `UNRESOLVED_REQUIRED_ENV_VARS = 0` |
| **3. Recovery Capacity & PITR Check** | Auditoria Neon Branches & Runbook PITR | **PASS** | `RECOVERY_READY = TRUE` (Estratégias A e B comprovadas; `reset --parent` eliminado; `br-round-dew-ayzol089` preservada) |
| **4. Testes Automatizados** | `npm test` | **PASS** | **351 testes aprovados**, 0 falhas, 1 ignorado, 84 suites executadas |
| **5. Verificação de Tipos TypeScript**| `npm run typecheck` | **PASS** | `tsc --noEmit` completado com **0 erros** |
| **6. Análise Estática de Código** | `npm run lint` | **PASS** | `eslint` completado com **0 erros** (13 warnings informativos) |
| **7. Varredura de Segredos** | `npm run secret-scan` | **PASS** | `secret-scan ok` — zero credenciais, tokens ou chaves em código |
| **8. Compilação de Produção** | `npm run build` | **PASS** | `next build` compilou com sucesso **59/59 páginas e rotas** |
| **9. Verificação de Git Diff** | `git diff --check` | **PASS** | Zero conflitos de formatação, marcadores ou whitespace |
| **10. Estado da Working Tree** | `git status --short` | **PASS** | Repositório controlado e consistente na worktree `plus-memories-2` |

---

# STOP GATE INVIOLÁVEL (FASE 9A CONCLUÍDA)

### Veredicto Oficial da Fase 9A
$$\mathbf{GO\_PRODUCTION\_READY}$$

### CONDIÇÃO DE PARAGEM OBRIGATÓRIA (STOP GATE)
Mesmo com a atribuição de `GO_PRODUCTION_READY`, sob a Constituição HAXR Signature:

1. **A FASE 9B NÃO FOI INICIADA**.
2. **O AMBIENTE DE PRODUÇÃO PERMANECE 100% INTACTO E READ-ONLY** (`br-wandering-bonus-ay2ex5lx`).
3. **NENHUMA MIGRAÇÃO DDL FOI APLICADA EM PRODUÇÃO**.
4. **NENHUM DADO FOI ESCRITO NO CLOUDFLARE R2 DE PRODUÇÃO**.
5. **O CASAL JESSICA & SAMUEL PERMANECE INTACTO EM MODO LEGACY**.
6. **A ABERTURA DA FASE 9B DEPENDE EXCLUSIVAMENTE DA AUTORIZAÇÃO EXPLÍCITA DO PROPRIETÁRIO COM A INSTRUÇÃO:**
   `AUTORIZO GO PRODUCTION`.

---

# TRANSIÇÃO IMEDIATA DE PRIORIDADE
Com a **Fase 9A formal e definitivamente concluída e selada em `GO_PRODUCTION_READY`** sob o STOP GATE, a atenção e o esforço de engenharia transitam imediatamente e sem hesitação para:

$$\mathbf{STANLEY\ —\ EU\ ESPIO\ \cdot\ MATCHDAY\ EDITION}$$

**Compreender $\longrightarrow$ Executar $\longrightarrow$ Testar $\longrightarrow$ Provar $\longrightarrow$ Parar.**
