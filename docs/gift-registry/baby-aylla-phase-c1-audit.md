# Baby Aylla — Fase C.1 — Auditoria do Motor de Reservas

Data da auditoria: 22 de Novembro de 2026. Âmbito: revisão local e leitura da branch Neon isolada. Não foi aplicado SQL, criado dado sintético, efectuado push, merge, deployment ou alteração de produção.

## Base verificada

- Edition branch/commit: `feat/baby-aylla-gift-registry-phase-c` / `b10dd6e` como base da auditoria.
- PR #46 e PR #48: não modificadas.
- Neon: projecto `gentle-firefly-70094226`, branch `br-icy-butterfly-b4lw52nv`, database `neondb`.
- A branch Neon permanece `ready`, não-default e isolada.

## Ficheiros e contratos analisados

- `data/gifts/baby-aylla.ts`, `lib/aylla/gifts/config.ts` e `lib/aylla/gifts/eligibility.ts`.
- `lib/aylla/gifts/reservations.ts` e `lib/invitations/baby-aylla-gift-reservations.test.ts`.
- Candidatas SQL das Fases B/C e `database/README.md` do HAXR Core.
- Esquema Neon de `events`, `guests`, `checkins` e `guest_audit_log`; papéis, ACLs e funções sensíveis.

## Evidência confirmada

| Controlo | Resultado |
| --- | --- |
| 52 candidatos | Aprovados pela família, todos `enabled: false`, sem quantidade aprovada. |
| Superfície pública | Continua com catálogo vazio e reserva fechada. |
| `edition_runtime` | Existe; `NOLOGIN`, `NOINHERIT`, sem superpoderes, sem privilégios directos nas seis tabelas nem `EXECUTE` nas funções sensíveis. |
| Funções sensíveis | `PUBLIC` e `edition_runtime` não possuem `EXECUTE` sobre RSVP/check-in no laboratório. |
| Estruturas Gift Registry | Não existem no laboratório: nem legado `edition_gift_reservations`, nem as tabelas candidatas Fase C. |
| Mecanismo de hash | `hashtextextended(text,bigint)` existe no laboratório. |

## Problemas encontrados e correcções

### P1 — idempotência aceitava intenção diferente

O planeador local devolvia uma reserva anterior apenas pela chave, mesmo que uma repetição maliciosa alterasse artigo ou quantidade. Foi corrigido: a chave só é idempotente quando `eventId`, convidado, artigo e quantidade representam a operação original; caso contrário devolve `idempotency_conflict`. O teste de regressão reproduz e valida a correcção.

### P1 — SQL concorrente não serializava a mesma chave entre artigos

A candidata consultava a chave antes de bloquear o inventário. Dois pedidos com a mesma chave e artigos distintos podiam chegar ao `UNIQUE` e receber erro em vez da resposta idempotente/controlada. A candidata agora toma um bloqueio transaccional derivado de evento, convidado e chave antes da consulta; também rejeita explicitamente uma intenção diferente.

### P2 — relatório C anterior estava desactualizado sobre o papel

O relatório afirmava que `edition_runtime` estava ausente. A leitura actual confirma que existe com uma fundação restritiva. O relatório foi corrigido; não foram concedidos privilégios.

### P2 — candidata não deve amarrar o laboratório ao UUID de produção

Fixar o `event_id` de produção na tabela impediria ensaios sintéticos numa branch isolada. A isolação é assegurada pela chave composta do inventário, pela validação do convidado no mesmo evento e pela sessão de servidor; o UUID canónico permanece obrigatório na configuração Edition de produção.

## Riscos e bloqueios restantes

1. A sessão `VerifiedAyllaGiftSession` é ainda um contrato puro. Não existe adaptador servidor que prove emissão, cookie HttpOnly/Secure/SameSite, expiração, CSRF e desafio de controlo de contacto. RSVP confirmado não é autenticação.
2. A candidata contém apenas a criação de reserva. Não há função Core autorizada para transições administrativas/cancelamento, nem integração com a sessão administrativa existente.
3. Não há RLS nem grants prontos porque não foi identificada a identidade de ligação que pode assumir `edition_runtime`. A candidata não deve receber grants fictícios.
4. Sem quantidades, especificações e validações de segurança aprovadas, os 52 artigos não podem receber inventário operativo.

## Matriz de privilégios proposta

| Principal | Acesso proposto | Limite |
| --- | --- | --- |
| Migrador Core (direct URL) | DDL apenas na branch autorizada | Nunca runtime da aplicação. |
| Ligação Edition/Core identificada | Apenas função de reserva depois de autenticação de servidor comprovada | Sem acesso directo a tabelas. |
| `edition_runtime` | Papel sem login e sem privilégios até existir o adaptador Core | Não tornar LOGIN/superutilizador. |
| Convidado/browser | Nenhuma ligação à Neon, nenhuma tabela/RPC directa | Só rotas servidor validadas. |
| Admin Core autenticado | Futura função de transição/auditoria, via autorização Core existente | Sem parâmetro `admin` confiado ao browser. |
| `PUBLIC` | Nenhuma permissão nas novas funções/tabelas | `REVOKE ALL` explícito na migração. |

## Procedimento de dry-run autorizado apenas após GO explícito

1. Reconfirmar projecto, branch, expiração, `neondb` e que a ligação é directa, não `-pooler`.
2. Confirmar que o executor é o migrador Core, não `edition_runtime` nem `neondb_owner` usado como runtime.
3. Registar checksum SHA-256 da candidata revista e executar as consultas de preflight abaixo.
4. Executar a candidata exactamente como está; ela abre transacção e termina em `ROLLBACK`. Não inserir inventário, convidados ou reservas.
5. Verificar que as três tabelas e a função não permanecem após o rollback.
6. Apenas após autorização separada: converter a candidata numa migração forward-only no repositório Core, definir RLS/grants e executar dados sintéticos descartáveis.

```sql
SELECT current_database(), current_user, current_setting('transaction_read_only');
SELECT to_regrole('edition_runtime'), to_regclass('public.events'), to_regclass('public.guests');
SELECT c.relname, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('edition_gift_inventory', 'edition_gift_reservations_v2', 'edition_gift_reservation_audit_v2');
SELECT p.proname, has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'reserve_baby_aylla_gift';
```

## Reversão

O `ROLLBACK` da candidata só prova que um ensaio transaccional não persiste objectos. Não é reversão de uma migração forward-only já aplicada. A migração Core futura precisa de plano de reversão próprio, revisão de dependências e proibição de `DROP` quando existirem reservas/auditorias.

## Decisão

**NO-GO para aplicar SQL ou testar reservas na Neon.** O motor está mais sólido localmente e o dry-run está preparado, mas faltam a identidade servidor-convidado comprovada, a integração autorizada no Core e a política RLS/grants baseada no principal real.
