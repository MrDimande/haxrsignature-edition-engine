# HAXR PLUS MEMORIES 2.0 — RELATÓRIO TÉCNICO DE ENGENHARIA DA FASE 6
## OFFLINE RESILIENCE & RELIABLE UPLOAD QUEUE

**Worktree**: `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`  
**Neon Preview**: `br-flat-block-ayfks0so` (Project: `little-band-06036174`, Endpoint: `ep-summer-frost-aycwdu9m`)  
**Production Parent (Isolada/Intocada)**: `br-wandering-bonus-ay2ex5lx`  
**Estado da Validação**: `PHASE_6_FINAL_STATUS: PASSED (100% CONFORME)`

---

### 1. SUMÁRIO EXECUTIVO & OBJECTIVO DA FASE 6

A Fase 6 introduziu no ecossistema HAXR Plus Memories 2.0 um motor robusto de resiliência offline e fila de upload segura, garantindo que convidados em redes móveis instáveis ou intermitentes durante casamentos e celebrações consigam capturar mídias sem qualquer perda de dados, duplicação de fotografias ou inflação indevida de pontuação em missões.

A arquitectura respeita integralmente a Constituição Mestre HAXR e os 16 hardenings mandatórios de produto e segurança:
- **Zero Duplicações**: Idempotência multi-camada ancorada no servidor com UUID v4 gerado no cliente (`crypto.randomUUID()`).
- **Isolamento Estrito**: Semântica de tenant nativa via índices parciais sem UUID zero artificial.
- **Resiliência a Quedas (Crash Recovery)**: A base de dados é a única fonte da verdade (`derivatives_status = 'pending'`), reconciliando missões e processamento de derivados em background mesmo em cenários de crash do processo entre o commit relacional e o envio da resposta.
- **Coordenação Multi-Aba Resiliente**: Locks concorrentes via Web Locks API primária com fallback transaccional em IndexedDB (sem confiar em localStorage para exclusão mútua).
- **Higiene Rígida de Privacidade e Quotas**: Zero credenciais no storage local, isolamento estrito por participante e tratamento gracioso de `QuotaExceededError`.

---

### 2. ARQUITECTURA DE DADOS & DEFESAS DE SCHEMA

#### 2.1. Invariantes de Schema para `client_upload_id`
A migração `supabase/migrations/20260911240000_plus_memories_phase_6_idempotency.sql` foi aplicada com sucesso na branch de preview Neon:
- **Coluna UUID**: `client_upload_id uuid NULL` em `photo_upload_intents` e `wedding_photos`.
- **Índices Parciais de Unicidade**:
  ```sql
  CREATE UNIQUE INDEX photo_upload_intents_client_upload_id_idx
    ON photo_upload_intents (event_id, experience_id, participant_id, client_upload_id)
    WHERE client_upload_id IS NOT NULL;

  CREATE UNIQUE INDEX wedding_photos_client_upload_id_idx
    ON wedding_photos (event_id, experience_id, participant_id, client_upload_id)
    WHERE client_upload_id IS NOT NULL;
  ```
- **Check Constraints de Integridade (Session Mode Exclusivo)**:
  ```sql
  ALTER TABLE photo_upload_intents
    ADD CONSTRAINT photo_upload_intents_client_upload_id_session_invariant
      CHECK (client_upload_id IS NULL OR (event_id IS NOT NULL AND experience_id IS NOT NULL AND participant_id IS NOT NULL));

  ALTER TABLE wedding_photos
    ADD CONSTRAINT wedding_photos_client_upload_id_session_invariant
      CHECK (client_upload_id IS NULL OR (event_id IS NOT NULL AND experience_id IS NOT NULL AND participant_id IS NOT NULL));
  ```
- **Compatibilidade Integral com Fluxo Legacy**: O fluxo de Jessica & Samuel permanece 100% suportado com `client_upload_id IS NULL`, respeitando a unicidade semântica real sem enfraquecimento por `NULL`.

---

### 3. IMPLEMENTAÇÃO DOS 16 HARDENINGS MANDATÓRIOS

1. **`client_upload_id` é UUID**:
   - Browser gera via `crypto.randomUUID()`.
   - Servidor valida rigorosamente formato UUID v4 (`UUID_V4_REGEX`) antes de qualquer operação de base de dados.
2. **Índices Parciais Sem `COALESCE(... zero UUID ...)`**:
   - `UNIQUE(event_id, experience_id, participant_id, client_upload_id) WHERE client_upload_id IS NOT NULL`.
   - Semântica de tenant verdadeira ancorada no contexto autenticado do Gateway.
3. **Idempotência Exclusiva para Session Mode**:
   - Rotas de upload exigem contexto de sessão para associar `client_upload_id`.
   - Rota legacy Jessica & Samuel preservada sem alterações semânticas.
4. **Criação Atómica de Intent (`INSERT ... ON CONFLICT DO NOTHING`)**:
   - Protecção física contra requests concorrentes. Resolução convergente via `findUploadIntentByClientIdempotency`.
5. **Intent Expirado com Renovação Segura**:
   - Renova data de expiração preservando o mesmo `photoId` e `storagePath` determinístico após revalidação segura da sessão actual.
6. **Autoridade Server-Side do `client_upload_id` em `wedding_photos`**:
   - No momento do complete, o valor gravado em `wedding_photos.client_upload_id` provém exclusivamente do registo do intent no servidor, ignorando qualquer payload adulterado no complete.
7. **Reconciliação de Side-Effects após Crash**:
   - Em caso de repetição de complete (replay), o servidor reconcilia idempotentemente submissões de missões pendentes (`submitMissionPhoto`).
   - Mídia é persistida como `derivatives_status = 'pending'`, permitindo que o worker / reconciliador em lote (`processPendingDerivativesBatch`) recupere o job sem depender de eventos exclusivamente em memória.
8. **Multi-Tab Resiliente sem `localStorage` como Lock Forte**:
   - Utilização primária de `navigator.locks.request`.
   - Fallback com claim/lease persistente em IndexedDB com transacção `readwrite` e expiração de 30 segundos com auto-reclaim.
9. **Ownership Local e Isolamento por Participante**:
   - Fila particionada localmente por `participantId`. Se o utilizador alternar para outro participante (A -> B), os itens de A entram em `authentication_required` e nunca são despachados em nome de B.
10. **Sessão Expirada vs Revogada**:
    - Sessão expirada preserva blob e entra em estado de pausa aguardando reautenticação.
    - Sessão revogada cancela o item e executa limpeza local de blobs conforme a política de privacidade.
11. **Zero Credenciais em Armazenamento Local**:
    - IndexedDB armazena apenas metadados e o `Blob` local. Nenhum token de sessão, chave R2 ou URL pré-assinado persistido.
12. **Tratamento de Quota de Armazenamento**:
    - Captura expressa de `QuotaExceededError`. Itens que não cabem no IndexedDB são rejeitados com aviso claro ao utilizador em vez de fingir persistência em fila.
13. **`navigator.onLine` apenas como Sinal Auxiliar de UX**:
    - A autoridade para retry reside estritamente nas respostas e falhas de rede HTTP/R2.
14. **Backoff Diferenciado (Retryable vs Terminal)**:
    - Retries com jitter exponencial para erros transitórios (5xx, timeouts, 429 com `Retry-After`).
    - Erros terminais (MIME inválido, payload corrompido, 400) marcam falha definitiva sem loops infinitos.
15. **Missão Expirada Offline**:
    - Foto é acolhida no álbum normalmente, mas a submissão de missão e pontuação são honestamente recusadas pelo servidor sem apagar a mídia legitimamente capturada.
16. **Matriz de Testes Automatizada Completa**:
    - Cobertura integral de todos os cenários no script `scripts/test-phase-6-preview.mjs`.

---

### 4. AUDITORIA & FECHAMENTO DOS 5 BOUNDARIES CRÍTICOS

#### Boundary 1: Auditoria de `queryWithRetry` & Recuperação de Resposta de Commit Perdida
- **Causa Raiz & Guardrails**: `queryWithRetry` em `lib/db/neon-provider.ts` foi auditada e documentada para ser permitida estritamente em leituras idempotentes e statements comprovadamente sem side-effects duplicáveis. Operações de mutação complexas como `completePhotoUploadTransaction` nunca utilizam retries cegos de conexão.
- **Mecanismo de Recuperação**: O recovery de conexões caídas após `COMMIT` relacional ocorre exclusivamente através do contrato de idempotência server-side (`client_upload_id`), garantindo que repetições ou replays convergem para exactamente 1 registo em `wedding_photos`, zero submissões duplicadas de missão e zero enfileiramento redundante de jobs de derivativos (`replayed: true` desativa chamadas repetidas a `enqueueDerivativeJob`).

#### Boundary 2: Semântica Temporal Durável no Complete + Mission (Caso A vs Caso B)
- **Caso A (Upload offline até depois do fim)**: O upload permaneceu desconectado até após o término da missão. O servidor acolhe a fotografia no álbum do evento com sucesso, mas rejeita honestamente a pontuação da missão (`0 pontos`).
- **Caso B (Complete server-side antes do término + Crash do processo antes do side-effect de missão)**: O servidor validou e persistiu o upload em `wedding_photos` legitimamente dentro da janela da missão. Em caso de crash do processo antes de invocar `submitMissionPhoto`, o replay subsequente (mesmo ocorrendo após `ends_at`) utiliza a marca temporal autoritária durável da fotografia (`photo.created_at`) e NÃO o relógio arbitrário do momento do replay ou `capturedAt` do browser. O convidado recebe a sua pontuação devida sem sofrer penalização por falhas transitórias internas.
- **Replay Múltiplo**: Idempotência convergente com garantia de exactamente uma submissão e uma pontuação.

#### Boundary 3: Protecção de Lease IndexedDB sob Upload Longo e Throttling Multi-Tab
- **Coordenação Concorrente**: Implementado `leaseToken` (UUID gerado a cada claim) associado a `leaseExpiresAt` (TTL de 30 segundos) e `leaseOwnerTabId`.
- **Prevenção de Corrupção por Abas Suspensa**: Qualquer actualização ou finalização local de estado na fila exige correspondência estrita com `expectedLeaseToken`. Se a Aba A sofrer throttling em segundo plano durante um upload longo (>30s) e a Aba B assumir legitimamente o item via reclaim, o retorno tardio da Aba A é expressamente bloqueado de regredir ou corromper o estado local estabelecido pela Aba B.
- **Convergência Server-Side**: Ambas as abas ao contactarem o endpoint de complete convergem para exactamente um registo canónico no servidor.

#### Boundary 4: Conflito no UNIQUE de `wedding_photos` com `mediaId` Artificial
- **Tratamento de Colisão (23505)**: No método `completePhotoUploadTransaction`, a inserção é protegida por `SAVEPOINT before_insert_photo`. Em cenários de colisão no índice único parcial `wedding_photos_client_upload_id_idx` causada por concorrência ou tentativas artificiais com `mediaId` distinto, a transacção executa `ROLLBACK TO SAVEPOINT`, consulta o `id` canónico pré-existente e faz o merge seguro do intent sem violar o índice único de `photo_upload_intents_completed_media_uidx`.
- **Invariante de Resposta**: O sistema NUNCA devolve ao cliente um `photoId` artificial ou não persistido; converge deterministicamente para o `mediaId` canónico persistido com `replayed: true`.

#### Boundary 5: Autoridade da Fila e Prevenção de Escalada de Privilégios (Zero Authority Escalation)
- **Metadados Locais vs Autoridade do Servidor**: O campo `participantId` mantido na fila IndexedDB actua estritamente como metadado de particionamento de interface local. O Gateway e o Session Policy derivam `event_id`, `experience_id` e `participant_id` exclusivamente da sessão criptograficamente verificada (cookie HTTP-only assinado).
- **Tentativas de Forja ou Invasão**: Qualquer tentativa de adulterar o payload com `participantId` divergente é ignorada na gravação do intent, e tentativas de completar intents de terceiros são terminantemente barradas com o erro `OWNERSHIP_MISMATCH`.

---

### 5. RESULTADOS DOS QUALITY GATES

| Quality Gate | Comando | Resultado | Evidência |
| :--- | :--- | :--- | :--- |
| **Preview Integration Suite** | `node --import tsx scripts/test-phase-6-preview.mjs` | **PASSED** | 75 / 75 asserções aprovadas (0 falhas) |
| **Unit Tests Suite** | `npm test` | **PASSED** | 351 / 351 testes aprovados (0 falhas) |
| **Type Integrity** | `npm run typecheck` | **PASSED** | 0 erros TypeScript (`tsc --noEmit`) |
| **Code Linting** | `npm run lint` | **PASSED** | 0 erros (zero warnings novas da Fase 6) |
| **Secret Scan** | `npm run secret-scan` | **PASSED** | `secret-scan ok` |
| **Production Build** | `npm run build` | **PASSED** | 53 páginas estáticas e dinâmicas compiladas com sucesso em Next.js |
| **Whitespace & Git Checks**| `git diff --check` | **PASSED** | 0 erros de formatação |
| **Integridade de Baseline** | `wedding_photos count` | **PASSED** | 147 antes / 147 depois (exactamente preservado) |
| **Isolamento de Produção** | `br-wandering-bonus-ay2ex5lx` | **PASSED** | Zero alterações em produção (100% intocada) |

---

### 6. CONCLUSÃO & DECLARAÇÃO OFICIAL

Todos os 5 boundaries de resiliência distribuída, semântica temporal durável, integridade de concorrência local, reconciliação de colisões únicas e autoridade de segurança foram comprovados com 75 testes automatizados de ponta a ponta no banco Neon Preview autorizado.

`PHASE_6_FINAL_STATUS: PASSED`

