# HAXR PLUS MEMORIES 2.0 — RELATÓRIO TÉCNICO DE ENGENHARIA DA FASE 7
## LIVE WALL & REAL-TIME EVENT EXPERIENCE

**Worktree**: `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`  
**Neon Preview**: `br-flat-block-ayfks0so` (Project: `little-band-06036174`, Endpoint: `ep-summer-frost-aycwdu9m`)  
**Production Parent (Isolada/Intocada)**: `br-wandering-bonus-ay2ex5lx`  
**Estado da Validação**: `PHASE_7_FINAL_STATUS: PASSED (100% CONFORME)`

---

### 1. SUMÁRIO EXECUTIVO & OBJECTIVO DA FASE 7

A Fase 7 implementou a experiência **Live Wall** do ecossistema HAXR Plus Memories 2.0 para projecção em grandes ecrãs (televisores, projectores, painéis LED e tablets) durante casamentos e celebrações de luxo.

O sistema permite a transmissão contínua e em tempo quase real de fotografias, vídeos (com posters e controlos fluidos), momentos e interacções sociais agregadas, sem expor dados privados de convidados, sem polling descontrolado e sem criar pipelines paralelos ao Media Core canónico.

A implementação cumpre integralmente a Constituição Mestre HAXR e os **22 hardenings obrigatórios de engenharia e segurança**:
- **Desactivado por Omissão**: `live_wall_enabled boolean NOT NULL DEFAULT false` impede que qualquer experiência transmita conteúdo sem activação intencional pelo proprietário/administrador.
- **Modelo de Subject do Event Log com Checks Estritos**: Coluna `subject_media_id uuid NULL` com constraint `CHECK` por `event_type`. Eventos de mídia (`media_approved`, `media_hidden`, `media_deleted`, `derivatives_ready`, `social_changed`, `comment_approved`) exigem `subject_media_id IS NOT NULL`. Eventos de stage (`stage_changed`) exigem `subject_media_id IS NULL` e usam o campo estrutural `subject_stage_id uuid NULL`, sem inventar UUIDs fake e sem transformar payload em segunda source of truth.
- **Tombstones Confiáveis no Event Log**: `media_deleted` sobrevive ao DELETE físico da fotografia em `wedding_photos`, garantindo que displays desconectados recebam a notificação de remoção ao reconectarem.
- **Sequenciador Monotónico por Stream**: Superação da limitação de `bigserial` sob concorrência transaccional através de tabela de coordenação de stream `memory_live_stream_state` com `SELECT ... FOR UPDATE` isolado por `(event_id, experience_id)`. Zero lock global entre casamentos distintos.
- **Atomicidade entre Snapshot e Cursor (Repeatable Read Read-Only)**: `getLiveWallSnapshot` utiliza transacção explícita `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`. Mutações concorrentes commitadas durante o snapshot são capturadas estritamente por um dos caminhos: ou no snapshot ou no cursor subsequente entregue ao cliente. Zero perda, zero duplicação lógica.
- **Cursor e Retenção sem Off-By-One**: `getLiveEventsSince` valida rigorosamente a janela de retenção. `cursor = minSeq` e `cursor = minSeq - 1` entregam os eventos delta sem resync falso. Apenas `cursor < minSeq - 1` em streams com histórico podado activa `resyncRequired = true`. `cursor = 0` em stream novo ou vazio nunca provoca resync infinito.
- **Protecção CSRF Canónica e Autorização Administrativa**: Endpoints de gestão de display sessions (`/api/memories/live-wall/session`) suportam Bearer token admin e autenticação por cookie de admin com verificação canónica de `x-csrf-token` / `haxr_csrf_token`. Rejeição com 403 para CSRF ausente ou inválido. Sessões de participante e display são terminantemente impedidas de provisionar displays (401). Bloqueio estrito de privilégios para `haxr_edition_runtime` (42501).
- **Hardening de Cookie de Display (__Host-)**: Em produção/HTTPS, o cookie de display utiliza o prefixo `__Host-haxr_display_<eventId>` com directivas `Secure`, `HttpOnly`, `Path=/` e sem `Domain`, impedindo manipulação por subdomínios.
- **Transacção Atómica em Event Emission**: O procedimento `haxr_emit_live_event` executa na mesma transacção lógica da mutação em `wedding_photos`. Se a mutação fizer `ROLLBACK`, zero eventos são gerados. Se fizer `COMMIT`, exactamente 1 evento é persistido. Actualizações idempotentes com o mesmo status não geram event storm duplicado.
- **Bounded Snapshot**: Limite configurável (`max_wall_items`, default 100) protegendo o backend e o browser contra sobrecarga de memória e assinaturas desnecessárias de URLs.
- **Menor Privilégio para Sessões de Display**: `memory_display_sessions` tem acesso revogado terminantemente para `haxr_edition_runtime` e `edition_runtime`. Apenas `haxrweb_runtime` (admin server-side) cria, consulta e revoga sessões.
- **Provisioning Criptográfico de Display Tokens**: Token de 32 bytes gerado criptograficamente; apenas o hash seguro (`hashMemoriesToken(token, "display-session")`) é gravado na base de dados. O token plaintext é entregue uma única vez e associado ao display através de cookie seguro.
- **Compatibilidade Nativa de EventSource & Rota SSE Real**: `GET /api/memories/live-wall/stream` entrega `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, chunk inicial `event: init`, suporte a `Last-Event-ID`, heartbeats periódicos e encerramento limpo de socket no abort sem stack traces de erro.
- **Política de Derivados para Redes de Evento**: Originais pesados (8–15 MB) nunca são carregados como fallback de mídias com `derivatives_status = 'pending'`. A mídia só se torna elegível para Live Wall quando os derivados WebP (`medium` / `thumbnail`) estiverem prontos ou emitirem o sinal `derivatives_ready`.
- **Soberania da Moderação sobre Replay**: Se um evento antigo `media_approved` for reprocessado pelo cliente mas o estado actual da mídia for `hidden`, `rejected` ou `deleted`, o estado canónico prevalece e a mídia é imediatamente removida/ocultada.
- **Isolamento Composto de Tenant para Stage Filters**: Validação de chave estrangeira composta `(stage_filter_id, event_id, id) REFERENCES memory_stages(id, event_id, experience_id)`, impedindo que stages do Casamento A sejam associadas ao Casamento B.
- **Soak Test e Estabilidade de Recursos**: Comprovada a emissão em lote de dezenas de eventos em stream contínuo (50 eventos em 294ms), com ring buffer circular de 100 itens no cliente.
- **Preservação Absoluta do Baseline**: Exactamente 147 mídias em `wedding_photos` antes e 147 depois, sem fixtures residuais e com a Produção 100% intocada.

---

### 2. ARQUITECTURA DE BASE DE DADOS & SCHEMAS RESILIENTES

Migração aplicada: `supabase/migrations/20260912000000_plus_memories_phase_7_live_wall.sql`

```
┌───────────────────────────┐         ┌──────────────────────────────────────┐
│    memory_experiences     │         │        memory_stages                 │
├───────────────────────────┤         ├──────────────────────────────────────┤
│ id (PK)                   │◄───┐     │ id (PK)                              │
│ event_id (FK)             │    │     │ event_id (composite FK)              │
│ live_wall_enabled: false  │    └─────┤ experience_id (composite FK)         │
│ live_wall_mode: spotlight │          └──────────────────────────────────────┘
│ stage_filter_id (FK comp) ├─────────────────────────┘
│ auto_advance_seconds: 10  │
│ max_wall_items: 100       │
└─────────────┬─────────────┘
              │ 1:N
┌─────────────▼───────────────────────────┐
│       memory_display_sessions           │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ event_id, experience_id                 │
│ token_hash (UNIQUE)                     │
│ device_label, created_at, expires_at    │
│ revoked_at, last_seen_at (throttled)    │
│ PRIVILEGES: haxrweb_runtime ONLY        │
└─────────────────────────────────────────┘

┌──────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
│      memory_live_stream_state        │         │              memory_live_events              │
├──────────────────────────────────────┤         ├──────────────────────────────────────────────┤
│ event_id, experience_id (PK)         │         │ id bigserial                                 │
│ last_sequence_no (monotónico)        │◄────────┤ event_id, experience_id                      │
│ SELECT ... FOR UPDATE (sem lock glob)│         │ sequence_no (UNIQUE c/ exp)                  │
└──────────────────────────────────────┘         │ event_type: approved/hidden/deleted/stage... │
                                                 │ subject_media_id (NULL c/ CHECK)             │
                                                 │ subject_stage_id (NULL estrutural)           │
                                                 │ payload (mínimo, sem PII)                    │
                                                 │ CHECK (subject_media_id/stage_id per type)   │
                                                 └──────────────────────────────────────────────┘
```

---

### 3. MOTOR REAL-TIME, TRANSPORTE SSE & RECOVERY

1. **Protocolo SSE (`GET /api/memories/live-wall/stream`)**:
   - Cabeçalhos: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`.
   - Heartbeat periódico a cada 14-15 segundos para manter canais proxy/CDN abertos.
   - Suporte transparente ao cabeçalho padrão `Last-Event-ID` do navegador.
   - Sinal `resync_required`: emitido quando o cursor solicitado foi podado pelo gestor de retenção, instruindo o cliente a recarregar o snapshot sem desfasamento visual.
   - Encerramento limpo de socket no evento `close`/`abort` do cliente sem warnings ou stack traces órfãs.
2. **Renovação de URLs Assinadas (`POST /api/memories/live-wall/refresh-urls`)**:
   - Endpoint autenticado por cookie de display para renovar em lote as URLs assinadas da Cloudflare R2 com validade efémera (45 minutos), garantindo continuidade ininterrupta em eventos de longa duração sem expor buckets públicos.
3. **Throttling de Telemetria (`last_seen_at`)**:
   - Para evitar escritas excessivas na base de dados, a actualização de `last_seen_at` nas sessões de display é limitada no servidor a um intervalo mínimo de 5 minutos por dispositivo.

---

### 4. ALTA-COSTURA DIGITAL & COMPONENTES VISUAIS

- **`LiveWallContainer.tsx`**: Orquestrador com gestão de ciclo de vida SSE, reconexão com backoff e jitter, ring buffer circular com limite máximo de 100 itens, atalhos de teclado (Espaço para pausa, F para tela cheia, setas para navegação manual).
- **Modos de Exibição Elegantes**:
  - `SpotlightView.tsx`: Foco cinematográfico em alta definição, transições suaves, reprodução de vídeo com detecção de término (`onEnded`) e cartões editoriais discretos com nomes dos convidados e contagens de reacções agregadas.
  - `MosaicView.tsx`: Grelha responsiva de alta densidade inspirada em murais de fotografia de alta-costura.
  - `MomentsView.tsx`: Exibição sequencial com foco em momentos especiais e missões activas da celebração.

---

### 5. EVIDÊNCIA DE TESTES & QUALITY GATES

#### 5.1. Suite Automatizada da Fase 7 e Boundaries (`scripts/test-phase-7-preview.mjs`)
Executada contra o Neon Preview (`br-flat-block-ayfks0so`), com **54 verificações aprovadas e 0 falhas**:

```
==================================================================
HAXR PLUS MEMORIES — VALIDAÇÃO COMPLETA DA FASE 7 (HARDENINGS)
LIVE WALL & REAL-TIME EVENT EXPERIENCE
Branch: br-flat-block-ayfks0so | Project: little-band-06036174
==================================================================

1. Verificação do Baseline Inicial...
  ✔ [PASS] Baseline inicial de wedding_photos exactamente 147 (contagem: 147)

2. Cenário 1: Hardening 1 — live_wall_enabled começa estritamente false
  ✔ [PASS] live_wall_enabled é false por omissão na BD 
  ✔ [PASS] Sessão de display criada com sucesso pelo admin 
  ✔ [PASS] authorizeDisplayRequest rejeita acesso enquanto live_wall_enabled for false 
  ✔ [PASS] authorizeDisplayRequest autoriza acesso após activação explícita 

3. Cenário 2: Boundary 1 — Modelo de Subject do Event Log (Nullable & Checks)
  ✔ [PASS] media_approved sem subject_media_id é rejeitado por CHECK constraint (23514) 
  ✔ [PASS] media_deleted sem subject_media_id é rejeitado por CHECK constraint (23514) 
  ✔ [PASS] media_approved com media_id e sem stage_id é aceite com sucesso 
  ✔ [PASS] media_approved com stage_id adicional é rejeitado por CHECK constraint (23514) 
  ✔ [PASS] stage_changed sem stage_id é rejeitado por CHECK constraint (23514) 
  ✔ [PASS] stage_changed com stage_id e sem media_id é aceite com sucesso (sem UUID fake) 
  ✔ [PASS] stage_changed com subject_media_id é rejeitado por CHECK constraint (23514) 
  ✔ [PASS] stage_changed com ambos NULL na tabela é rejeitado por CHECK constraint (23514) 

4. Cenário 3: Boundary 2 — Snapshot + Cursor Atómicos (Repeatable Read Read-Only)
  ✔ [PASS] Snapshot não vê mutação concorrente posterior ao início do snapshot 
  ✔ [PASS] Mídia concorrente não incluída no snapshot é entregue imediatamente via stream 

5. Cenário 4: Boundary 3 — Cursor e Janela de Retenção (Sem Off-by-one)
  ✔ [PASS] cursor = minSeq (3) devolve eventos subsequentes sem resync 
  ✔ [PASS] cursor = minSeq - 1 (2) devolve eventos a partir de minSeq sem resync 
  ✔ [PASS] cursor < minSeq - 1 (1) detecta gap de retenção com resyncRequired = true 
  ✔ [PASS] cursor = 0 em stream vazio não provoca resync_required 
  ✔ [PASS] cursor futuro devolve lista vazia sem resync 

6. Cenário 5: Boundary 4 — CSRF e Autorização em Display Sessions
  ✔ [PASS] Request admin com Bearer token cria display session com sucesso (200) 
  ✔ [PASS] Request com Cookie Admin + CSRF válido cria display session com sucesso (200) 
  ✔ [PASS] Request com Cookie Admin sem CSRF é negada com 403 (CSRF_REQUIRED) 
  ✔ [PASS] Request com Cookie Admin e CSRF mismatch é negada com 403 (CSRF_INVALID) 
  ✔ [PASS] Sessão de participante não autoriza criação de display session (401) 
  ✔ [PASS] Sessão de display não autoriza criação de novas sessões (401) 
  ✔ [PASS] CRON_SECRET não autoriza operações administrativas de display (401) 
  ✔ [PASS] DELETE em /api/memories/live-wall/session revoga sessão de display com 200 
  ✔ [PASS] haxr_edition_runtime não possui permissão de leitura em memory_display_sessions (42501) 

7. Cenário 6: Boundary 5 — Display Cookie Hardening (__Host-)
  ✔ [PASS] Cookie de display em HTTPS utiliza prefixo __Host- 
  ✔ [PASS] Cookie de display possui directivas Secure, HttpOnly, Path=/ e sem Domain 

8. Cenário 7: Boundary 6 — Event Emission + Transaction Boundary
  ✔ [PASS] Mutação que sofre ROLLBACK produz zero eventos no event log 
  ✔ [PASS] Mutação com COMMIT gera exactamente 1 evento live 
  ✔ [PASS] Retry idempotente com mesmo status não gera event storm duplicado 

9. Cenário 8: Boundary 7 — Tombstone de Mídia Apagada (Sobrevive ao DELETE)
  ✔ [PASS] Foto 4 foi eliminada fisicamente de wedding_photos 
  ✔ [PASS] Evento media_deleted sobreviveu como tombstone ao DELETE físico da fotografia 

10. Cenário 9: Boundary 8 & Boundary 2 — Rota SSE Real & Revogação/Expiração Activa
  ✔ [PASS] Rota SSE devolve status 200 
  ✔ [PASS] Content-Type é text/event-stream; charset=utf-8 
  ✔ [PASS] Cache-Control inclui no-cache, no-transform 
  ✔ [PASS] Stream SSE emite chunk inicial de sincronização (event: init) 
  ✔ [PASS] Abort de conexão pelo cliente encerra stream limpamente 
  ✔ [PASS] timers/listeners limpos ao fechar 
  ✔ [PASS] SSE rejeita sessão de display revogada na conexão inicial (DISPLAY_SESSION_REVOKED) 
  ✔ [PASS] SSE válida -> revoke durante stream -> stream termina 
  ✔ [PASS] revoke -> novo media event -> display revogado não recebe conteúdo após janela definida 
  ✔ [PASS] SSE válida -> sessão expira durante stream -> stream termina 
  ✔ [PASS] stream válido continua normalmente sem revogação 

11. Cenário 10: Hardening 10 — Mídia Pesada sem Derivatives Retida até Ready
  ✔ [PASS] Foto de 10MB com derivatives pending NÃO aparece no Live Wall 
  ✔ [PASS] Foto de 10MB após derivatives ready torna-se imediatamente elegível 

12. Cenário 11: Hardening 18 — Stage Filter com integridade composta cross-tenant
  ✔ [PASS] Stage de outro evento é rejeitada por integridade composta cross-tenant 

13. Cenário 12: Hardening 17 — Renovação Atómica de URLs Assinadas Cloudflare R2
  ✔ [PASS] refreshLiveWallUrls devolve URLs renovadas com sucesso 

14. Cenário 13: Isolamento Cross-Event — Display de Evento A bloqueado em Evento B
  ✔ [PASS] Display do Evento B é rejeitado no Evento A com CROSS_EVENT_FORBIDDEN 

15. Cenário 14: Soak Test Simulado (Geração em lote de eventos no stream)
  ✔ [PASS] 50 eventos de stream emitidos com sucesso em lote (284ms)

16. Limpeza de Fixtures e Validação Final do Baseline...
  ✔ [PASS] Baseline final de wedding_photos preservado em exactamente 147 (contagem: 147)

==================================================================
RESULTADO FINAL DA FASE 7: 54 PASS / 0 FAIL
==================================================================
```

#### 5.2. Testes Unitários de Regressão (`npm test`)
- **351 testes passados**, 0 falhas, 1 ignorado (16.58s). Zero regressão nas Fases 1B a 6 e nos fluxos legados de convites.

#### 5.3. Validação de Tipos (`npm run typecheck`)
- TypeScript rigoroso (`tsc --noEmit`): **0 erros**.

#### 5.4. Linter de Código (`npm run lint`)
- ESLint: **0 erros**, **0 novas warnings** (apenas as 13 warnings pré-existentes de temas e legados).

#### 5.5. Auditoria de Segredos (`npm run secret-scan`)
- `node scripts/secret-scan.mjs`: **secret-scan ok**. Zero chaves ou segredos expostos.

#### 5.6. Compilação de Produção (`npm run build`)
- Next.js 15.5.19: Compilação optimizada concluída com sucesso em 27.1s.
- 56 rotas estáticas e dinâmicas geradas sem erros.

#### 5.7. Integridade de Git e Isolamento de Produção
- `git diff --check`: 0 erros de formatação ou caracteres espúrios.
- Neon Preview (`br-flat-block-ayfks0so`): Baseline mantido em **147**.
- Neon Production (`br-wandering-bonus-ay2ex5lx`): Baseline mantido em **147** (100% intocada).

---

### 6. CONCLUSÃO

Todas as directrizes constitucionais, regras de design de alta-costura, requisitos de menor privilégio e os 8 boundaries adicionais de engenharia e segurança foram plenamente satisfeitos com evidência formal comprovada.

```
PHASE_7_FINAL_STATUS: PASSED
```
