# HAXR PLUS MEMORIES 2.0 — RELATÓRIO TÉCNICO DE ENGENHARIA DA FASE 5
## MEDIA DERIVATIVES PIPELINE, LEASE ENGINE & DELIVERY HARDENING

**Worktree**: `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`  
**Neon Preview**: `br-flat-block-ayfks0so` (Project: `little-band-06036174`)  
**Production Parent (Isolada/Intocada)**: `br-wandering-bonus-ay2ex5lx`  
**Estado da Validação**: `PHASE_5_FINAL_STATUS: PASSED (100% CONFORME)`

---

### 1. WORKER ROLE FINAL & RUNTIME SEPARATION

- **Identidade Operacional**: A identidade operacional de execução do pipeline de derivados é estritamente a role `haxrweb_runtime`.
- **Eliminação de `neondb_owner` em Runtime**: O worker operacional normal não utiliza credenciais nem privilégios de `neondb_owner`. As credenciais de `neondb_owner` são reservadas exclusivamente para migrações DDL e auditorias administrativas.
- **Tabela `wedding_photos` Sem UPDATE Genérico**:
  - `REVOKE UPDATE ON wedding_photos FROM edition_runtime, haxr_edition_runtime, haxrweb_runtime;`
  - A role `haxrweb_runtime` possui apenas permissões `SELECT` e `INSERT` nas colunas de `wedding_photos`, com `UPDATE` circunscrito à coluna legada `challenge_id`. Não tem permissão de UPDATE directo em `derivatives_status`, `has_derivatives`, caminhos de storage, locks ou lease tokens.

---

### 2. GRANTS & GOVERNAÇÃO DE FUNÇÕES CONTROLADAS

O processamento e a finalização de derivados são geridos exclusivamente por funções controladas com privilégios mínimos:

1. **`haxr_claim_media_derivative_job(uuid, text, integer, boolean)`**:
   - `SECURITY DEFINER`
   - `SET search_path = public, pg_temp`
   - `REVOKE ALL ON FUNCTION ... FROM PUBLIC, edition_runtime, haxr_edition_runtime`
   - `GRANT EXECUTE ON FUNCTION ... TO haxrweb_runtime`
   - Atribui atomicamente o job a um worker, gerando um token opaco criptográfico (`v_new_token := gen_random_uuid()`), marcando `derivatives_status = 'processing'` e garantindo `has_derivatives = false`.
   - Rejeita qualquer tentativa de autoridade externa: o contexto do evento/convite é derivado directamente do registo da mídia na base de dados (`v_row.invitation_slug`), nunca de argumentos não confiáveis do chamador.
2. **`haxr_finalize_media_derivative_job(uuid, uuid, text, boolean, ...)`**:
   - `SECURITY DEFINER`
   - `SET search_path = public, pg_temp`
   - `REVOKE ALL ON FUNCTION ... FROM PUBLIC, edition_runtime, haxr_edition_runtime`
   - `GRANT EXECUTE ON FUNCTION ... TO haxrweb_runtime`
   - Exige imperativamente a combinação exacta de `media_id` e `lease_token`.
   - Limpa os bloqueios e o token de lease no momento da conclusão (`derivatives_locked_at = NULL`, `derivatives_locked_by = NULL`, `derivatives_lease_token = NULL`).

---

### 3. INVARIANTES DE VÍDEO READY & CHECK CONSTRAINTS

Foi incorporada e comprovada a invariante de integridade referencial para derivados de vídeo:

- **Constrangimento de Vídeo**:
  ```sql
  ALTER TABLE wedding_photos
    ADD CONSTRAINT wedding_photos_derivatives_video_paths_check CHECK (
      media_type != 'video' OR derivatives_status != 'ready' OR poster_storage_path IS NOT NULL
    );
  ```
- **Invariante Canónica de Derivados**:
  ```sql
  ALTER TABLE wedding_photos
    ADD CONSTRAINT wedding_photos_derivatives_status_invariants CHECK (
      (derivatives_status = 'ready' AND has_derivatives = true) OR
      (derivatives_status != 'ready' AND has_derivatives = false)
    );
  ```
- **Comportamentos Comprovados na BD**:
  - `media_type = 'video'` com `derivatives_status = 'ready'` sem `poster_storage_path` $\longrightarrow$ Violação imediata `23514 (check_violation)`.
  - `video ready` $\longrightarrow$ `has_derivatives = true` obrigatório.
  - `video pending` $\longrightarrow$ `has_derivatives = false` obrigatório.
  - `video failed` $\longrightarrow$ `has_derivatives = false` obrigatório.
  - Vídeo sem extractor FFmpeg nem poster pré-existente finaliza honestamente como `status = 'pending'`, `has_derivatives = false`, preservando fallback transparente para `<video preload="metadata">`.

---

### 4. POSTER FORNECIDO PELO BROWSER & SANITIZAÇÃO SHARP

Para suportar posters gerados no cliente via Canvas sem comprometer a segurança da infra-estrutura:

1. **Rejeição de Metadados e Tipos Fornecidos pelo Cliente**:
   - O servidor não confia no Content-Type ou MIME declarado (`image/jpeg`, etc.).
   - O servidor não aceita o caminho de armazenamento sugerido pelo cliente.
2. **Pipeline de Validação e Transcodificação (`processBrowserVideoPoster`)**:
   - Validação de magic bytes físicos via `sniffMediaFormat` (bytes inválidos ou corrompidos $\longrightarrow$ rejeição imediata com `INVALID_POSTER_BYTES`).
   - Leitura de dimensões e inspecção de metadados sob protecção nativa de limite de pixéis (`50_000_000 px`).
   - Rotação automática via EXIF (`.rotate()`) e remoção integral de metadados privados.
   - Redimensionamento proporcional para `1280x720` sem ampliação artificial (`withoutEnlargement: true`).
   - Transcodificação estrita para WebP com qualidade 85.
   - Geração estrita do caminho de armazenamento canónico determinístico: `${slug}/${mediaId}/poster.webp`.

---

### 5. LEASE OWNERSHIP & RECUPERAÇÃO DE CRASHES

- **Propriedade Criptográfica por Lease Token**:
  - A propriedade do lease não depende de matching frágil de timestamp de milissegundos ou de identificadores reutilizáveis de worker.
  - Cada claim bem-sucedido gera um UUID v4 opaco único (`derivatives_lease_token`).
  - A finalização exige `WHERE id = p_media_id AND derivatives_lease_token = p_lease_token`.
  - Se o Worker A sofrer um crash e o seu lease expirar (300 segundos), o Worker B reclama o job, recebendo um novo token (`token2`).
  - Qualquer tentativa posterior do Worker A de finalizar com `token1` resulta num no-op seguro (`finalized = false`).
  - Apenas o Worker B detentor do `token2` activo consegue finalizar o registo.
- **Clarificação sobre Estado de Processamento**:
  - *Jobs `processing` com lease expirado são recuperáveis por execução subsequente de um worker*. Se nenhum worker voltar a correr, o registo permanece em estado de processamento até à próxima ronda de reconciliação.

---

### 6. TELEMETRIA DE MEMÓRIA & PERFORMANCE REAL (12 MP)

- **Medição Nativa Multi-Dimensão (Sharp / libvips & V8)**:
  - Não é utilizada a métrica isolada `heapUsed` como prova de consumo total, uma vez que a memória nativa alocada pela `libvips` reside fora do heap V8.
  - Telemetria aferida no processamento de fotografia realista de 12 Megapixels (`4000x3000px`, `7.4 MB` JPEG):
    - **Redução de Tamanho**: de `7448 KB` para `273 KB` WebP ($\mathbf{96\%}$ **de economia de largura de banda**).
    - **Tempo de Execução**: `2721 ms`.
    - **RSS**: `~93 MB` ($\Delta \text{RSS} \approx 8\text{ MB}$).
    - **Heap V8**: `~22 MB` ($\Delta \text{Heap} \approx 0\text{ MB}$).
    - **Memória Externa**: `~15 MB` ($\Delta \text{External} \approx 8\text{ MB}$).
  - O limite estrito de `50 Megapixels` (`maxInputPixels`) actua como mitigação primária contra ataques de descompressão (*decompression bombs*).

---

### 7. RESULTADOS DOS TESTES DE PREVIEW (`scripts/test-phase-5-preview.mjs`)

Execução em Neon Preview (`br-flat-block-ayfks0so`):

```
==================================================================
HAXR PLUS MEMORIES — VALIDAÇÃO COMPLETA DA FASE 5
MEDIA DERIVATIVES PIPELINE, LEASE ENGINE & DELIVERY HARDENING
Branch: br-flat-block-ayfks0so | Project: little-band-06036174
==================================================================

--- BASELINE PRE-CHECK: Contagem de Mídias Pré-Teste ---
  ✔ [PASS] Baseline inicial de fotos deve ser exactamente 147 (Contagem: 147)

--- CENÁRIO 1: Worker Role & Governação Estrita de Privilégios ---
  ✔ [PASS] edition_runtime tenta UPDATE has_derivatives -> deny 
  ✔ [PASS] edition_runtime tenta UPDATE derivatives_status -> deny 
  ✔ [PASS] haxr_edition_runtime UPDATE directo -> deny 
  ✔ [PASS] worker role tenta UPDATE genérico directo -> deny 
  ✔ [PASS] edition_runtime EXECUTE claim -> deny 
  ✔ [PASS] haxr_edition_runtime EXECUTE claim -> deny 
  ✔ [PASS] PUBLIC EXECUTE -> deny 
  ✔ [PASS] worker role claim -> success (Token gerado: e2a9f9cd...)
  ✔ [PASS] worker role finalize lease próprio -> success 
  ✔ [PASS] worker role tenta finalizar lease de outro -> no-op/deny 

--- CENÁRIO 2: Invariantes de Estado e Integridade (CHECK) ---
  ✔ [PASS] derivatives_status processing + has_derivatives true -> rejected 
  ✔ [PASS] derivatives_status failed + has_derivatives true -> rejected 
  ✔ [PASS] derivatives_status ready + has_derivatives false -> rejected 
  ✔ [PASS] imagem ready sem thumbnail/medium -> rejected 
  ✔ [PASS] video ready sem poster -> 23514 
  ✔ [PASS] video ready com poster canónico -> success 
  ✔ [PASS] video pending sem poster -> success 
  ✔ [PASS] video failed sem poster -> success 

--- CENÁRIO 3: Worker Lease Token Opaco & Crash Recovery ---
  ✔ [PASS] Worker A claim gera token1 -> Worker B não claim simultaneamente 
  ✔ [PASS] Worker A crash -> lease expira -> Worker B reclaim gera token2 
  ✔ [PASS] Worker A antigo tenta finalizar com token1 expirado -> deny/no-op 
  ✔ [PASS] dois workers -> exactamente um estado final coerente 

--- CENÁRIO 4: Idempotência de Objectos & Storage Resilience ---
  ✔ [PASS] primeira execução de derivados -> success 
  ✔ [PASS] storage write success + DB finalization failure -> retry -> mesmos paths, sem lixo lógico

--- CENÁRIO 5: Validação Real de MIME e Magic Bytes ---
  ✔ [PASS] content_type=image/jpeg + bytes inválidos -> fail 
  ✔ [PASS] content_type=image/jpeg + MP4 bytes -> fail 
  ✔ [PASS] path .jpg + bytes PNG válidos -> transcodificado com sucesso para WebP 

--- CENÁRIO 5B: Poster de Vídeo Fornecido pelo Browser (Canvas Frame) ---
  ✔ [PASS] poster declarado image/jpeg + bytes inválidos -> reject 
  ✔ [PASS] poster com path arbitrário -> ignorado/rejeitado 
  ✔ [PASS] poster válido -> Sharp -> WebP canónico 

--- CENÁRIO 6: Vídeo MP4 & Identificação Honesta do Extractor ---
  ✔ [PASS] MP4 real sem extractor FFmpeg -> fallback transparente documentado
  ✔ [PASS] MP4 com poster de browser -> WebP canónico optimizado e status ready 

--- CENÁRIO 7: Performance Fotográfica Real & Telemetria de Memória (12 MP) ---
  ✔ [PASS] Performance Fotográfica Real: Redução substancial (> 80%) com foto 12MP (Original: 7448KB -> Medium: 273KB (96% redução) | Thumb: 0KB | Tempo: 2721ms | RSS: ~93MB (delta 8MB) | Heap: ~22MB (delta 0MB) | External: ~15MB (delta 8MB) | Limite de 50 MP protege contra decompression bomb)

--- CENÁRIO 8: Legacy Fallback & 147 Fotos Preservadas ---
  ✔ [PASS] legacy fallback -> funciona

--- CENÁRIO 9: Zero Authorization Bypass on Derivative Signing ---
  ✔ [PASS] revoked session -> derivative access deny (Motivo: revoked)

--- LIMPEZA OBRIGATÓRIA DE FIXTURES DE TESTE ---
  ✔ [PASS] Baseline final de fotos deve retornar exactamente a 147 (Contagem final: 147)

==================================================================
RESULTADO DA VALIDAÇÃO FASE 5: 37/37 PASSARAM
==================================================================

PHASE_5_FINAL_STATUS: PASSED (100% CONFORME)
```

---

### 8. QUALITY GATES DO PROJECTO

| Verificação | Comando | Resultado | Evidência |
| :--- | :--- | :--- | :--- |
| **Suite de Integração Fase 5** | `node --import tsx scripts/test-phase-5-preview.mjs` | **PASS** | 37/37 testes passaram |
| **Testes Unitários & Regressão** | `npm test` | **PASS** | 337 testes passaram, 0 falhas, 1 skip legado |
| **Tipagem TypeScript Estrita** | `npm run typecheck` | **PASS** | `tsc --noEmit` concluiu com 0 erros |
| **Linter Estático** | `npm run lint` | **PASS** | `eslint` concluiu com 0 erros |
| **Varredura de Segredos** | `npm run secret-scan` | **PASS** | `secret-scan ok` (0 credenciais expostas) |
| **Compilação de Produção** | `npm run build` | **PASS** | `next build` concluiu em 19.5s gerando 53 páginas estáticas |
| **Formatação Git Whitespace** | `git diff --check` | **PASS** | 0 erros de formatação ou whitespace |
| **Integridade de Base de Dados** | `Baseline 147` | **PASS** | Exactamente 147 fotos antes e depois da bateria de testes |

---

### 9. CLASSIFICAÇÃO DE STORAGE & ESTADO DE PRODUÇÃO

1. **Storage Status**:
   - **Pipeline Sharp local/mock**: **COMPROVADO** (processamento de buffers nativo Sharp, auto-rotação, WebP, sanitização e validação de caminhos canónicos validados com êxito).
   - **R2 provider (`lib/memories/storage/r2-provider.ts`)**: **IMPLEMENTADO** (código auditado e compatível com a API S3 da Cloudflare).
   - **R2 Preview real**: **NÃO COMPROVADO** (não existe bucket isolado de Preview configurado no ambiente de teste).
   - **R2 Production**: **NÃO EXECUTADO** (credenciais e bucket de produção permanecem intocados).
2. **Produção Intacta**:
   - R2 Production: intocado.
   - Base de Dados de Produção (`br-wandering-bonus-ay2ex5lx`): intocada.
   - Vercel, DNS, domínios e segredos de produção: intocados.
   - Baseline do catálogo legado preservado: exactamente 147 fotografias.

---

### 10. RESULTADO

`PHASE_5_FINAL_STATUS: PASSED`
