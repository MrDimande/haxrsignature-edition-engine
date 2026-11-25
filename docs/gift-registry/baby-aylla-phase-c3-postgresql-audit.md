# HAXR Core — Baby Aylla Gift Registry — Auditoria PostgreSQL & Segurança (Fase C.3)

**Data:** 22 de Novembro de 2026
**Autor:** Antigravity (Principal Full-Stack Architect & Security Engineer)
**Ambiente Alvo:** Neon PostgreSQL — Laboratório Preview: `gentle-firefly-70094226` / `br-icy-butterfly-b4lw52nv`
**Estado de Execução:** Documentação e scripts candidatos preparados. **ZERO execução na base de dados.**

---

## 1. Evolução da Sequência de Migrações (Fases B a C.3)

| Fase | Ficheiro Candidato | Problemas Identificados | Resolução Aplicada na Fase C.3 |
| :--- | :--- | :--- | :--- |
| **Fase B** | `baby-aylla-gift-registry-phase-b.sql` | Dependência da tabela legada `edition_gift_reservations`. Sem isolamento por inventário. | Tabela `edition_gift_inventory` independente criada na Fase C. |
| **Fase C** | `20261122_baby_aylla_gift_reservations_phase_c.sql` | Terminava em `ROLLBACK;`. Sem verificação de identidade de sessão. Sem cancelamento via RPC. | Função com advisory lock mantida; integrada com sessão na Fase C.3. |
| **Fase C.2** | `20261122_baby_aylla_gift_identity_phase_c2.sql` | Terminava em `ROLLBACK;`. Sem script de reversão (`down`). Sem cancelamento de reserva. | Criada migração forward limpa (`BEGIN...COMMIT`), preflight e down script. |
| **Fase C.3** | `20261122_baby_aylla_gift_registry_phase_c3_forward.sql` | **Migração Canónica Consolidada:** 5 tabelas RLS, 3 funções auditadas, grants estritos a `edition_runtime`. |

---

## 2. Comparação do Esquema (Antes vs. Depois)

### Esquema Actual (Antes)
- Tabelas existentes: `public.events`, `public.guests`, `public.edition_gift_reservations` (legado simples).
- Gestão de sessões de convidados: Não existente na base de dados (restringia-se a cookies voláteis ou inexistentes).
- Desafios de verificação: Inexistentes.

### Esquema Proposto (Depois da Fase C.3)
1. **`public.edition_gift_inventory`**:
   - Chave primária composta `(event_id, item_id)`.
   - Controlos de governação: `family_approved`, `enabled`, `approved_quantity`, `specifications_complete`, `child_safety_validated`.
2. **`public.edition_gift_reservations_v2`**:
   - Chave primária UUID `id`.
   - Chave única `(event_id, guest_id, idempotency_key)`.
   - Chave estrangeira composta para `edition_gift_inventory(event_id, item_id)`.
   - Estados estritos: `reserved`, `purchased`, `delivered`, `cancelled`.
3. **`public.edition_gift_reservation_audit_v2`**:
   - Registo imutável com `actor_guest_id` ou `actor_admin_id` (garantido por check constraint `XOR`).
4. **`public.edition_guest_verification_challenges`**:
   - Desafios com `verifier_hash` (HMAC SHA-256), `max_attempts = 5`, `expires_at` e `consumed_at`.
5. **`public.edition_guest_sessions`**:
   - Sessões com `secret_hash`, `expires_at` (20 min) e `revoked_at`.

---

## 3. Matriz de Privilégios por Papel (Least Privilege)

| Objeto PostgreSQL | `PUBLIC` | `edition_runtime` (NOLOGIN) | `haxr_core_runtime` / Admin | `neondb_owner` |
| :--- | :---: | :---: | :---: | :---: |
| Tabela `edition_gift_inventory` | **REVOGADO** | **REVOGADO** | SELECT, UPDATE (via Core) | ALL |
| Tabela `edition_gift_reservations_v2` | **REVOGADO** | **REVOGADO** | SELECT, INSERT, UPDATE | ALL |
| Tabela `edition_gift_reservation_audit_v2` | **REVOGADO** | **REVOGADO** | INSERT, SELECT | ALL |
| Tabela `edition_guest_verification_challenges` | **REVOGADO** | **REVOGADO** | ALL (via Core) | ALL |
| Tabela `edition_guest_sessions` | **REVOGADO** | **REVOGADO** | ALL (via Core) | ALL |
| Função `reserve_baby_aylla_gift` | **REVOGADO** | **REVOGADO** | EXECUTE | ALL |
| Função `reserve_baby_aylla_gift_verified` | **REVOGADO** | **EXECUTE** | EXECUTE | ALL |
| Função `cancel_baby_aylla_gift_verified` | **REVOGADO** | **EXECUTE** | EXECUTE | ALL |

---

## 4. Análise de Segurança das Funções PostgreSQL

1. **`SECURITY DEFINER` e `search_path` Fixo**:
   - Todas as funções públicas possuem explicitamente:
     `SECURITY DEFINER SET search_path = pg_catalog, public`
   - Impede ataques de sequestro de schema por utilizadores temporários.
2. **Advisory Locks (`pg_advisory_xact_lock`)**:
   - `hashtextextended(p_event_id || ':' || p_guest_id || ':' || p_idempotency_key, 0)`
   - Garante serialização estrita mesmo que um cliente malicioso envie múltiplos pedidos simultâneos com a mesma chave ou altere o item no payload de repetição.
3. **Bloqueio de Linha (`FOR UPDATE`) no Inventário**:
   - A linha de inventário correspondente ao artigo é bloqueada antes de somar as quantidades activas (`reserved`, `purchased`, `delivered`).
   - Elimina qualquer possibilidade de "over-booking" / dupla reserva da última unidade disponível.
4. **Verificação de Elegibilidade Contínua**:
   - Reavalia a tabela `public.guests` no momento exacto da execução:
     `status = 'confirmed' AND guest_source = 'edition_rsvp' AND archived_at IS NULL AND deleted_at IS NULL AND is_incorrect = false`.

---

## 5. Roteiro de Aplicação no Laboratório Neon (Quando Autorizado)

1. Conectar via `psql` ou ferramenta autorizada na branch `gentle-firefly-70094226` / `br-icy-butterfly-b4lw52nv`.
2. Executar preflight:
   `\i docs/migration-candidates/core-neon/20261122_baby_aylla_gift_registry_phase_c3_preflight.sql`
   - Confirmar ausência de colisões e presença do papel `edition_runtime`.
3. Executar migração forward:
   `\i docs/migration-candidates/core-neon/20261122_baby_aylla_gift_registry_phase_c3_forward.sql`
4. Executar bateria de testes com utilizadores sintéticos.
5. Em caso de necessidade de reversão:
   `\i docs/migration-candidates/core-neon/20261122_baby_aylla_gift_registry_phase_c3_down.sql`
