# Baby Aylla — Fase C.2 — Identidade, Privilégios e Autorização

Data: 22 de Novembro de 2026. Âmbito: implementação e testes exclusivamente locais. Não houve escrita na Neon, RSVP, reserva, push, deploy, merge ou activação do convite.

## Arquitectura decidida

O Edition nunca recebe um `guestId`, `eventId`, nome, contacto ou QR como prova de acesso. O browser só apresenta um contacto para pedir um desafio e, depois de verificado, guarda uma cookie opaca `sessionId.secret`. O servidor Core calcula os verificadores HMAC, consome o desafio atomicamente, persiste apenas hashes e valida de novo o RSVP, o evento e o estado do convidado antes de cada reserva.

O fluxo é `contacto -> resposta genérica -> desafio de uso único -> sessão curta -> Core revalida -> função de reserva -> auditoria`. Um contacto ausente ou inelegível recebe exactamente `verification_pending`; não há enumeração. Sem contacto adequado, o Core deve manter `verification_required` e encaminhar para validação humana documentada, temporária e auditada; não existe bypass persistente.

Cookie proposta: `HttpOnly`, `Secure` apenas em HTTPS, `SameSite=Lax`, host-only, `Path=/`, 20 minutos e revogação servidor. Mutações futuras exigem também Origin igual ao Host e token CSRF ligado à sessão. A rota actual mantém `403 GIFT_REGISTRY_CLOSED` porque `enabled: false` e `babyaylla` continua `draft`.

## Fronteiras e contratos

- Edition: interface e proxy servidor-a-servidor; nunca reserva localmente durante indisponibilidade do Core.
- Core: única autoridade para resolver sessão, elegibilidade, inventário, transacção e auditoria.
- Browser: não tem ligação Neon, RPC, actor administrativo nem identificador de convidado confiável.
- Administração: a sessão admin Core e a permissão persistida para o evento são ambas obrigatórias. A existência de login não basta.

`lib/aylla/gifts/core-contract.ts` fixa os resultados públicos: `verification_required`, `access_denied`, `registry_closed`, `item_unavailable`, `quantity_unconfirmed`, `reservation_confirmed`, `session_expired` e `service_unavailable`.

## Menor privilégio PostgreSQL

A opção seleccionada é B: `edition_runtime` permanece `NOLOGIN`/`NOINHERIT` e uma futura ligação dedicada do Core, criada fora do SQL versionado com segredo server-only, recebe apenas associação a esse papel. Não deve usar `neondb_owner`, `BYPASSRLS` ou permissões directas em tabelas. O papel recebe somente `EXECUTE` na função verificada, depois de revisão Core; `PUBLIC` não recebe permissões.

O candidato C.2 em `docs/migration-candidates/core-neon/20261122_baby_aylla_gift_identity_phase_c2.sql`:

- cria desafios e sessões sem códigos/segredos em claro;
- activa RLS nas tabelas da Gift Registry;
- revoga acesso a `PUBLIC`;
- propõe `reserve_baby_aylla_gift_verified`, `SECURITY DEFINER`, com `search_path` fixo e sem `guestId`/`eventId` como parâmetros;
- termina em `ROLLBACK` e não é uma migração Core aplicável.

Não foi criado SQL administrativo executável: a identidade administrativa e a matriz de permissões por evento devem ser obtidas da autoridade Core canónica, ainda não integrada neste worktree. Criar uma RPC que aceite `actor_id` violaria o requisito de confiança.

## Ameaças e controlos

| Ameaça | Controlo | Risco residual |
| --- | --- | --- |
| Enumeração de convidados | Resultado genérico e nenhum envio para inelegíveis | Rate limit por contacto/IP deve ser implementado no Core |
| Reutilização/brute force | HMAC, expiração curta, consumo atómico e máximo de 5 tentativas | Entrega do canal ainda depende de fornecedor aprovado |
| Cookie roubada | HttpOnly, Secure, SameSite, expiração e revogação | XSS/endpoint comprometido continua relevante |
| CSRF | SameSite + Origin/Host + token por sessão para mutações | A rota Core deve aplicar ambos antes de activação |
| Forja de IDs | IDs não entram no contrato público; sessão determina convidado/evento | Adapter Core ainda por implementar |
| SQL injection/RLS bypass | parâmetros tipados, função com `search_path` fixo, sem `PUBLIC` | grants reais devem ser validados num laboratório autorizado |
| Admin de outro evento | guarda de sessão activa e permissão explícita do evento | A fonte Core de event grants ainda precisa de integração |

## Estado do laboratório e decisão

O último estado conhecido do laboratório isolado é `gentle-firefly-70094226` / `br-icy-butterfly-b4lw52nv`, `ready`, com expiração em 28-11-2026 18:00 UTC. Não foi consultado nem alterado nesta fase para evitar confundir preparação local com validação real.

**NO-GO** para activar, aplicar SQL, testar reservas na Neon ou publicar. Faltam: adapter Core persistente, canal de contacto aprovado, rate limit, credenciais de runtime dedicadas, matriz de admin por evento e ensaio autorizado em laboratório.

## Plano exacto para C.3 (só após autorização)

1. Criar worktree Core limpo e confirmar a fonte canónica de grants administrativos e migrações.
2. Rever a candidata C.1+C.2 com DBA; converter para uma única migração forward-only em `database/migrations/`, sem `ROLLBACK`.
3. Provisionar fora do repositório a ligação dedicada `NOINHERIT`; validar ACL/RLS e ausência de `PUBLIC` numa Neon branch descartável.
4. Implementar endpoints Core server-only: desafio, confirmação, sessão, reserva e transição administrativa, com rate limiting, Origin/CSRF e auditoria.
5. Executar testes mutáveis apenas com convidados/evento sintéticos, confirmar limpeza exacta e validar concorrência, revogação, cross-event e admin cross-event.
6. Só depois de revisão independente, realizar Preview E2E. Produção, `draft -> active`, artigos e reservas exigem autorização distinta.
