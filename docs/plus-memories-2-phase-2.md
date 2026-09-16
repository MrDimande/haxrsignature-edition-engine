# HAXR PLUS MEMORIES — FASE 2: MEDIA CORE + EVENT STAGES + METADATA + HAXR MOMENTS (HARDENING CONCLUÍDO)

**Data de Validação:** 11 de Setembro de 2026  
**Ambiente Autorizado:** Neon Preview (`br-flat-block-ayfks0so`), Project `little-band-06036174`, Database `neondb`  
**Parent Production:** `br-wandering-bonus-ay2ex5lx` (Estritamente Intocada — Zero Modificações)  
**Worktree:** `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`  
**Branch Git:** `codex/plus-memories-2-foundation`  

---

## 1. RESUMO EXECUTIVO DO HARDENING DA FASE 2

Após auditoria técnica de segurança e integridade relacional, a Fase 2 foi reforçada com garantias no motor PostgreSQL:

1. **Isolamento Relacional Cross-Experience Enforçado na BD (não apenas TypeScript)**:
   - A arquitectura de produto permite que um evento possua múltiplas experiências (ex: casamento civil e lobolo tradicional sob a mesma entidade de evento).
   - Integridade composta estabelecida:
     - `memory_stages`: vinculação estrita via `(experience_id, event_id)` referenciando `memory_experiences(id, event_id)`.
     - `wedding_photos`: FK composta `FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL`.
       *Comprovado em teste real*: Tentar vincular uma foto da Experiência 1 a uma etapa da Experiência 2 (mesmo sob o mesmo evento) é rejeitado pelo PostgreSQL com código `23503`.
     - `memory_media_views`: FKs compostas `(media_id, event_id, experience_id)` e `(participant_id, event_id, experience_id)` tornam impossível a um participante de uma experiência registar ou consultar visualizações de outra experiência.

2. **Prova Conclusiva de RLS do Seen State por Participante**:
   - Como os papéis de runtime `edition_runtime` e `haxr_edition_runtime` são partilhados no pool de ligações, a segregação não é delegada a parâmetros de pedido.
   - O PostgreSQL utiliza a função segura `haxr_current_participant_id()` baseada no parâmetro de transacção `set_config('haxr.current_participant_id', $1, true)`.
   - *Comprovado em teste real*: Com a mesma role `edition_runtime`, um participante autenticado não consegue ler registos de outro participante (0 linhas) e qualquer tentativa de forjar ou inserir visualizações como outro participante é bloqueada pela RLS com erro `42501` (*new row violates row-level security policy*).

3. **Esclarecimento e Auditoria das 147 Fotos Legadas vs 148**:
   - O registo 148 reportado em execuções anteriores foi identificado objectivamente como a fixture temporária `testPhotoB` inserida no Cenário 2 antes da execução do Cenário 6.
   - O script de auditoria foi reestruturado com isolamento estrito e blocos `finally` de limpeza imediata.
   - Tanto o pré-check como o pós-check comprovam que a base de dados do Preview mantém estritamente **147 fotos legadas** (62 de Jessica & Samuel Wedding e 85 do Casamento Tradicional), com 100% de `storage_path`, `event_id` e `experience_id` preenchidos. Zero dados residuais são deixados.

4. **Auditoria Rigorosa de Derivatives e Fallback Legacy**:
   - Distinção formal documentada: os caminhos de derivados (`thumbnail_storage_path`, `poster_storage_path`) e o cálculo de dimensões/orientação/duração estão especificados no domínio e schema, mas o processamento físico assíncrono de derivados (redimensionamento/WebP) permanece como pipeline pendente.
   - Nenhuma linha na base de dados possui `has_derivatives=true` falsamente atribuído.
   - O feed e o visualizador mantêm fallback transparente e comprovado para o ficheiro original assinado no Cloudflare R2.

5. **Flexibilidade e Dinamismo de Stages**:
   - As etapas canónicas (`preparativos`, `cerimonia`, `recepcao`, `festa`, `pos-festa`) constituem apenas a semente/configuração inicial para experiências de casamento.
   - O campo `slug` em `memory_stages` é `TEXT` dinâmico (não um enum rígido).
   - Comprovado em teste que qualquer experiência pode definir etapas personalizadas (ex: `brinde-de-honra-especial`), com resolução determinística correcta.

---

## 2. ARQUITECTURA DDL CONSOLIDADA (MIGRAÇÕES 1B, 2 E 2-HARDENING)

Migrações aplicadas no Preview:
- `supabase/migrations/20260911120000_plus_memories_phase_1b.sql`
- `supabase/migrations/20260911130000_plus_memories_phase_2.sql`
- `supabase/migrations/20260911140000_plus_memories_phase_2_hardening.sql`

### Chaves Forasteiras Compostas e Integridade Relacional
```sql
-- memory_stages
ALTER TABLE memory_stages
  ADD CONSTRAINT memory_stages_experience_event_fkey
  FOREIGN KEY (experience_id, event_id)
  REFERENCES memory_experiences(id, event_id)
  ON DELETE CASCADE;

-- wedding_photos
ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_stage_event_experience_fkey
  FOREIGN KEY (stage_id, event_id, experience_id)
  REFERENCES memory_stages(id, event_id, experience_id)
  ON DELETE SET NULL;

ALTER TABLE wedding_photos
  ADD CONSTRAINT wedding_photos_stage_experience_check
  CHECK (stage_id IS NULL OR experience_id IS NOT NULL);

-- photo_upload_intents
ALTER TABLE photo_upload_intents
  ADD CONSTRAINT photo_upload_intents_stage_event_experience_fkey
  FOREIGN KEY (stage_id, event_id, experience_id)
  REFERENCES memory_stages(id, event_id, experience_id)
  ON DELETE SET NULL;

-- memory_media_views
ALTER TABLE memory_media_views
  ADD CONSTRAINT memory_media_views_media_event_experience_fkey
  FOREIGN KEY (media_id, event_id, experience_id)
  REFERENCES wedding_photos(id, event_id, experience_id)
  ON DELETE CASCADE,
  ADD CONSTRAINT memory_media_views_participant_event_experience_fkey
  FOREIGN KEY (participant_id, event_id, experience_id)
  REFERENCES memory_participants(id, event_id, experience_id)
  ON DELETE CASCADE;
```

### Políticas RLS de Seen State
```sql
CREATE OR REPLACE FUNCTION haxr_current_participant_id() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('haxr.current_participant_id', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE POLICY memory_media_views_admin_policy
  ON memory_media_views
  FOR ALL
  TO haxrweb_runtime
  USING (true)
  WITH CHECK (true);

CREATE POLICY memory_media_views_guest_select_policy
  ON memory_media_views
  FOR SELECT
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id());

CREATE POLICY memory_media_views_guest_insert_policy
  ON memory_media_views
  FOR INSERT
  TO edition_runtime, haxr_edition_runtime
  WITH CHECK (participant_id = haxr_current_participant_id());

CREATE POLICY memory_media_views_guest_update_policy
  ON memory_media_views
  FOR UPDATE
  TO edition_runtime, haxr_edition_runtime
  USING (participant_id = haxr_current_participant_id())
  WITH CHECK (participant_id = haxr_current_participant_id());
```

---

## 3. EVIDÊNCIA DE VALIDAÇÃO AUTOMATIZADA NO PREVIEW NEON

Execução do script de auditoria e hardening:
`node scripts/test-phase-2-preview.mjs`

```text
==================================================================
HAXR PLUS MEMORIES — VALIDAÇÃO COMPLETA & HARDENING DA FASE 2
Branch: br-flat-block-ayfks0so | Project: little-band-06036174
==================================================================

--- BASELINE PRE-CHECK: Contagem de Mídias Pré-Teste ---
  ✔ [PASS] Baseline inicial de fotos legadas deve ser exactamente 147 (Contagem inicial: 147)
Evento A (Jessica & Samuel): 7cec4447-de0d-40a5-8f03-8d7c87acb3f5
Evento B (Segundo evento): de9e7136-987d-487a-a1c7-62988239e503

--- CENÁRIO 1: Restrição de Janela Temporal de Stages ---
  ✔ [PASS] Rejeitar starts_at > ends_at (Código: 23514)

--- CENÁRIO 2: Rejeição Relacional de Stage Cross-Event ---
  ✔ [PASS] Rejeitar associação de Stage do Evento A em Foto do Evento B (Código: 23503)

--- CENÁRIO 3: Rejeição Relacional de Stage Cross-Experience no Mesmo Evento ---
  ✔ [PASS] Experience A1 + Stage A2 -> DB reject (Código: 23503 — Violação de FK Composta (stage_id, event_id, experience_id))

--- CENÁRIO 4: Rejeição Relacional de Media View Cross-Experience ---
  ✔ [PASS] Experience A1 + Media View A2 -> DB reject (Código: 23503 — Violação de FK (media_id, event_id, experience_id))

--- CENÁRIO 5: Prova de RLS do Seen State por Participante (Mesma Role) ---
  ✔ [PASS] Participant A não consegue ler visualizações de Participant B (Linhas devolvidas: 0)
  ✔ [PASS] Participant A usando mesma runtime role tenta view de Participant B -> DENY (Bloqueado por RLS (código 42501))
  ✔ [PASS] Participant A escreve a sua própria visualização legitimamente 

--- CENÁRIO 6: Princípio de Mínimo Privilégio em memory_stages ---
  ✔ [PASS] edition_runtime pode ler memory_stages (Lidos: 3)
  ✔ [PASS] edition_runtime NÃO PODE inserir stages (Permissão negada (42501))
  ✔ [PASS] edition_runtime NÃO PODE apagar stages (Permissão negada (42501))

--- CENÁRIO 7: Idempotência de Seen State por Participante ---
  ✔ [PASS] Upsert idempotente actualiza registo existente sem duplicação 

--- CENÁRIO 8: Stage Personalizado fora dos 5 Defaults ---
  ✔ [PASS] Stage personalizado fora dos 5 defaults -> funciona (Criado com ID: 00cc7c2b-36c5-475b-aec3-6e44e60db108)

--- CENÁRIO 9: Auditoria de Derivatives e Distinção de Paths Previstos vs Objectos Reais ---
  ✔ [PASS] Zero mídias legadas com has_derivatives falsamente atribuído (Paths preenchidos na BD: 0)
  ✔ [PASS] Fallback para ficheiro original garantido para 100% das fotos legadas 

--- CENÁRIO 10: Retorno ao Baseline (147 Mídias Intactas) ---
  ✔ [PASS] Teste Preview executa -> cleanup -> contagem retorna exactamente ao baseline (147) (Total após teste: 147)
  ✔ [PASS] 100% das fotos têm storage_path canónico 
  ✔ [PASS] 100% das fotos têm event_id atribuído 
  ✔ [PASS] 100% das fotos têm experience_id atribuído 
  ✔ [PASS] Classificação de media_type (imagens e vídeos) (Imagens: 122, Vídeos: 25)

==================================================================
RESULTADO FINAL DA VALIDAÇÃO & HARDENING FASE 2: 20/20 PASSARAM
==================================================================
PHASE_2_HARDENING_STATUS: ALL_PASSED (100% CONFORME)
```

---

## 4. QUALITY GATES LOCAIS

| Verificação | Comando | Resultado | Evidência |
|---|---|---|---|
| **Testes Unitários & Integração** | `npm test` | **PASS** | 308 aprovados, 0 falhas, 1 ignorado |
| **TypeScript** | `npm run typecheck` | **PASS** | `tsc --noEmit` sem erros (0 errors) |
| **Linter** | `npm run lint` | **PASS** | 0 erros, avisos normais de `<Image>` Next.js |
| **Varredura de Segredos** | `npm run secret-scan` | **PASS** | `secret-scan ok` |
| **Compilação de Produção** | `npm run build` | **PASS** | 53 rotas estáticas e dinâmicas optimizadas |
| **Formatação Git** | `git diff --check` | **PASS** | 0 avisos ou erros de whitespace |
| **Isolamento de Produção** | Auditoria Neon | **CONFIRMADO** | `br-wandering-bonus-ay2ex5lx` intocada |

---

## 5. DECLARAÇÃO DE STATUS

```text
PHASE_2_FINAL_STATUS: PASSED
```

O marco da Fase 2 (Media Core + Etapas de Evento + Metadados + HAXR Moments) encontra-se rigorosamente endurecido, auditado e aprovado com evidência empírica 100% comprovada no PostgreSQL e na aplicação.
