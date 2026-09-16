# HAXR PLUS MEMORIES — FASE 1B (CONCLUÍDA)
## Relatório de Engenharia e Validação de Segurança em Neon Preview

Conclusão formal em 11 de Setembro de 2026. A Fase 1B do HAXR Plus Memories encontra-se integralmente implementada, validada e auditada no branch de Preview autorizado.

---

### 1. Identificação do Ambiente Autorizado

- **Projecto Neon**: `HAXR-Business-Suite` (`little-band-06036174`)
- **Região**: `aws-us-east-2` | **PostgreSQL Engine**: 18
- **Branch Preview Autorizado**: `preview/plus-memories-2-phase-1b` (`br-flat-block-ayfks0so`)
- **Parent Production**: `br-wandering-bonus-ay2ex5lx` (preservado a 100% sem qualquer mutação directa)
- **Base de Dados**: `neondb`
- **Base Timestamp Herdada**: `2026-09-11T05:26:37Z`
- **Data de Expiração**: `2026-09-25T18:00:00Z`
- **Worktree Local**: `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2` no branch Git `codex/plus-memories-2-foundation`

---

### 2. Auditoria Inicial de Catálogo (Preview vs Production)

A auditoria em transacção `READ ONLY` com o papel de inspecção no branch Preview confirmou a seguinte baseline antes da migration:
- **Tabelas de Domínio Existentes**: `events`, `client_events`, `guests`, `seats`, `memory_experiences`, `memory_share_links`, `photo_upload_intents`, `wedding_photos`.
- **Estado de Linhas Reais**:
  - `wedding_photos`: 147 fotos legadas (62 pertencentes a `jessicasamuelwedding`, 85 a `jessicaesamueltraditionalwedding`).
  - `memory_experiences`: 2 experiências configuradas com `event_slug` / `invitation_slug`, mas sem coluna directa `event_id`.
  - `photo_upload_intents`: Sem colunas de rastreio de `participant_id`, `session_id`, `event_id` ou receipt `completed_media_id`.
  - `events`: RLS activo com acesso concedido a `haxrweb_runtime`, mas sem privilégio `SELECT` atribuído aos papéis `edition_runtime` e `haxr_edition_runtime`.

---

### 3. Migração DDL Aditiva Aplicada (`supabase/migrations/20260911120000_plus_memories_phase_1b.sql`)

A migração foi executada com sucesso e de forma atómica no branch `br-flat-block-ayfks0so`:

1. **`memory_experiences`**:
   - Adicionadas colunas: `event_id` (FK para `events.id`), `access_mode` (`legacy` | `session`), `visibility`, `uploads_enabled`, `competition_enabled`.
   - Backfill determinístico executado para vincular os eventos operacionais existentes aos registos de experiência.
2. **`memory_share_links`**:
   - Adicionadas colunas: `event_id` (FK), `token_hash` (hash SHA-256 com separação de domínio para access link), `scope_type` (`general`, `guest`, `table`), `scope_guest_id`, `scope_table_id`, `max_uses`, `uses`, `expires_at`, `revoked_at`.
3. **`memory_participants` (Nova Tabela)**:
   - Criada para modelar a identidade funcional no evento, com vínculo a `event_id`, `experience_id`, referência opcional a `guest_id`, `display_name` e `revoked_at`.
4. **`memory_sessions` (Nova Tabela)**:
   - Criada para persistência de sessões com `token_hash` único, vínculo a `participant_id`, `event_id`, `experience_id`, `access_link_id`, `expires_at`, `revoked_at` e `last_seen_at`.
5. **`wedding_photos`**:
   - Adicionada coluna `event_id` (FK para `events.id`) e executado backfill para as 147 fotos legadas (62 de `jessicasamuelwedding` e 85 de `jessicaesamueltraditionalwedding`).
6. **`photo_upload_intents`**:
   - Adicionadas colunas `event_id`, `participant_id`, `session_id`, `completed_media_id` (FK única para `wedding_photos.id`).
   - Constraint de status actualizada para suportar `'completed'` e `'cancelled'`.
   - Constraint `photo_upload_intents_consumed_at_status` actualizada de forma precisa para garantir que `consumed_at` é preenchido nos estados `'consumed'` e `'completed'`, e nulo nos restantes.
7. **Segurança, RLS e Privilégios Runtime**:
   - RLS activado em `memory_experiences`, `memory_share_links`, `memory_participants`, `memory_sessions`, `wedding_photos` e `photo_upload_intents`.
   - Políticas RLS e concessão de privilégios (`SELECT, INSERT, UPDATE, DELETE`) atribuídas aos papéis `haxrweb_runtime`, `haxr_edition_runtime` e `edition_runtime`.
   - Concedido `SELECT ON events` e política de leitura RLS aos papéis `edition_runtime` e `haxr_edition_runtime`, assegurando resolução íntegra de eventos em runtime.

---

### 4. Arquitectura de Código Implementada no Worktree

1. **Gateway Central de Autorização (`lib/memories/gateway.ts`)**:
   - Função canónica `authorizeMemoriesRequest(req, options)`:
     - Detecta modo do evento: se for `legacy`, preserva comportamento aberto não autenticado para uploads e leitura das edições legadas de Jessica & Samuel.
     - Se o evento estiver em modo `session`, exige sessão activa e válida. Falha fechada: uma sessão inválida ou inexistente **nunca faz fallback para legacy**.
     - Validação de integridade de cookies (`__Host-` em HTTPS, prefixo de evento, detecção de cookies duplicados).
     - Protecção rigorosa contra ataques CSRF em mutações (verificação de `origin` permitida).
2. **Armazenamento de Sessões e Troca de Links (`lib/memories/session-store.ts`)**:
   - `resolveMemoriesEvent`: Resolve o evento operacional e configurações da experiência Memories.
   - `findSessionByTokenHash`: Recupera snapshot completo e relações activas do participante, link e evento.
   - `exchangeAccessLink`: Transacção com bloqueio exclusivo (`SELECT ... FOR UPDATE`), verificação de expiração, revogação e limite de utilizações, incrementando o contador e emitindo participante e sessão de forma atómica.
   - Funções de revogação imediata para sessão, participante e access link.
3. **Endpoint de Troca de Sessão (`app/api/memories/session/exchange/route.ts`)**:
   - Troca tokens/códigos curtos de links de acesso por cookies de sessão HttpOnly, seguros e isolados por evento.
4. **Conclusão Transaccional de Uploads com Idempotência (`lib/db/neon-provider.ts`)**:
   - `completePhotoUploadTransaction`:
     - Utiliza uma transacção isolada (`BEGIN ... COMMIT/ROLLBACK`).
     - Executa `SELECT ... FOR UPDATE` no registo de `photo_upload_intents` para serializar pedidos concorrentes.
     - Validação de propriedade: confirma se o intent pertence ao participante/sessão autorizados.
     - Idempotência sob retry: se o intent já se encontra no estado `completed`, devolve imediatamente o `completed_media_id` sem criar registos duplicados na tabela `wedding_photos`.
     - Rollback garantido: caso a inserção da foto falhe, a transacção reverte por completo, mantendo o intent no estado `pending` para tentativas posteriores.
5. **Protecção Integral contra Bypass em Rotas Legadas**:
   - Todas as rotas `/api/wedding-photos`, `/api/wedding-photos/upload-intent` e `/api/wedding-photos/complete` foram protegidas através do gateway `authorizeMemoriesRequest()`, eliminando qualquer superfície de contorno por aliases.

---

### 5. Evidência de Testes e Validação no Preview Neon

A suite automatizada de 14 cenários de integridade, isolamento e concorrência (`scripts/test-phase-1b-preview.mjs`) foi executada directamente contra o branch Preview `br-flat-block-ayfks0so`:

| # | Cenário de Teste | Resultado | Evidência Comprovada |
|---|---|:---:|---|
| 1 | **Session A + Event B** | `PASS` | Sessão do Evento A rejeitada no Evento B (`cross_event`). |
| 2 | **Session A + Media B** | `PASS` | Sessão do Evento A impedida de assinar media do Evento B. |
| 3 | **Intent A + Participant B** | `PASS` | Intent do Participante A rejeitado se tentado por Participante B. |
| 4 | **Revoked Session** | `PASS` | Sessão com timestamp de revogação rejeitada imediatamente (`revoked`). |
| 5 | **Expired Session** | `PASS` | Sessão com prazo ultrapassado rejeitada imediatamente (`expired`). |
| 6 | **Revoked Access Link** | `PASS` | Link revogado rejeita troca por nova sessão e invalida autorizações. |
| 7 | **Invalid Token** | `PASS` | Hash inexistente na base de dados rejeitado com fail-closed. |
| 8 | **Same Intent Twice (Idempotência)** | `PASS` | Múltiplas conclusões do mesmo intent devolvem a mesma media; 1 única foto criada. |
| 9 | **Parallel Completion (Concorrência Real)** | `PASS` | 2 conexões distintas concorrentes com `SELECT FOR UPDATE`: exactamente 1 foto criada e mediaId partilhado. |
| 10 | **Failure During Completion (Rollback)** | `PASS` | Falha propositada de FK provoca rollback; intent permanece intacto como `pending`. |
| 11 | **Retry After Failure** | `PASS` | Tentativa subsequente com parâmetros correctos conclui com sucesso. |
| 12 | **Legacy Event Non-Regression** | `PASS` | Jessica & Samuel mantêm rigorosamente 62 e 85 fotos e modo `legacy`. |
| 13 | **Session Mode + Invalid Session** | `PASS` | Evento em modo `session` com sessão inválida rejeita sem fallback para legacy. |
| 14 | **Roles Runtime Isolation** | `PASS` | Conexões `edition_runtime`, `haxr_edition_runtime` e `haxrweb_runtime` validadas em leitura/escrita e isolamento. |

**Resultado Geral dos Testes Neon**: **14 / 14 PASS (100% de Sucesso)**.

---

### 6. Resultados do Gate de Qualidade Local

Executado no worktree `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`:

1. **Testes Unitários (`npm test`)**:
   - Total: **288 testes** | Passaram: **287** | Falharam: **0** | Ignorados: **1** (teste opt-in de ligação live).
2. **Tipagem TypeScript (`npm run typecheck`)**:
   - **0 erros**. Compilação estrita sem emissão aprovada.
3. **Linter de Código (`npm run lint`)**:
   - **0 erros** (9 avisos existentes de baseline histórica preservados).
4. **Varredura de Segredos (`npm run secret-scan`)**:
   - **Aprovado** (`secret-scan ok`). Nenhum segredo ou credencial exposta.
5. **Compilação de Produção (`npm run build`)**:
   - Compilação concluída com sucesso com `NODE_ENV=production`.
   - **53/53 páginas geradas com sucesso**, incluindo as rotas dinâmicas de sessão, progresso e endpoints Memories.
6. **Integridade Git (`git diff --check`)**:
   - **Aprovado** sem conflitos ou erros de formatação.

---

### 7. Avaliação Factual GO / NO-GO para a Fase 2

- **Critérios de Isolamento**: SATISFEITOS.
- **Transacções e Concorrência**: SATISFEITOS com evidência real no PostgreSQL.
- **Preservação de Legado**: SATISFEITA (zero impacto nos casamentos Jessica & Samuel activos).
- **Decisão**: **GO PARA FASE 2**.
- **Próximos Passos (Fase 2)**:
  - Implementação do Media Core (suporte a áudio e vídeo).
  - Gestão de Etapas e Fases do Evento.
  - Enriquecimento de Metadados e Curadoria Editorial.
  - Módulo HAXR Moments.
