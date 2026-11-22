# Baby Aylla — HAXR Gift Registry — Fase C

## Estado

Preparação técnica local concluída. Convite, catálogo público e reservas permanecem inactivos.

## Evidência do laboratório Neon (somente leitura)

- Projecto: `gentle-firefly-70094226` — HAXR-Signature-Preview-Portfolio.
- Branch: `br-icy-butterfly-b4lw52nv` — `canary/baby-aylla-rsvp-qr-20261121`.
- Estado observado: `ready`, não-default, expira `2026-11-28T18:00:00Z`.
- Esquema: `public.events`, `public.guests`, `public.checkins`, `public.guest_audit_log`.
- Papel observado: `edition_runtime` existe como fundação restritiva, sem login, herança, superpoderes ou privilégios directos nas tabelas/funções existentes.
- Nenhuma escrita, migração, RSVP, reserva ou check-in foi executado.

## Protecções

- Os 52 candidatos aprovados têm `approvedByFamily: true`, mas todos ficam `enabled: false` e sem quantidade definida.
- A rota pública continua a devolver lista vazia; a rota de reserva continua a devolver `403 GIFT_REGISTRY_CLOSED` antes de consumir identidade do browser.
- A elegibilidade exige RSVP confirmado, sessão verificada e associação servidor-convidado-evento. Nome, email, telefone, QR e IDs do browser não são prova de identidade.
- Transições permitidas: `reserved → purchased → delivered` e `reserved → cancelled`.
- O planeador local cobre idempotência e disponibilidade. A candidata SQL usa bloqueio de inventário antes do cálculo e inserção.

## Migração candidata

`docs/migration-candidates/core-neon/20261122_baby_aylla_gift_reservations_phase_c.sql` é uma proposta destinada ao futuro pipeline `database/migrations/` do HAXR Core. Termina em `ROLLBACK`; não deve ser executada pelo Edition Engine.

## Dependências bloqueadoras

1. Definir e validar a identidade de ligação do Edition que pode assumir ou invocar o papel mínimo `edition_runtime`; o papel actual não tem login nem permissões.
2. Criar a migração forward-only no HAXR Core com RLS e grants para os papéis reais.
3. Confirmar o emissor, cookie e expiração da sessão de identidade no servidor; RSVP não é autenticação.
4. A família deve definir quantidades, tamanhos, cores, especificações, imagens e validações de segurança. Nada foi assumido.
5. Obter autorização separada para migrar apenas o laboratório e testar com dados sintéticos removíveis.

## Recomendação

**NO-GO** para publicação ou reservas reais. A preparação está pronta para revisão, mas não há identidade de servidor comprovada nem preflight de permissões Neon.
