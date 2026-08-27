# Runbook: Supabase → Neon — Preview First

## Objectivo

Migrar a persistência PostgreSQL do HAXR Signature Edition para Neon sem alterar o comportamento de Production antes da validação completa em Preview.

## Regra principal

> **PREVIEW FIRST — PRODUCTION NÃO É ALTERADA NESTA FASE.**

O branch `main`, Vercel Production, Supabase Production e Neon `production` permanecem fora do cutover até existir evidência de paridade funcional e aprovação explícita.

## Topologia alvo

```text
GitHub
main
└── migration/supabase-to-neon
          │
          ▼
     Vercel Preview
          │
          ▼
Neon preview/migration/supabase-to-neon
```

Production permanece separada:

```text
GitHub main
    │
    ▼
Vercel Production
    │
    ▼
Supabase Production
```

## Neon

Projecto: `HAXR-Business-Suite`

Branches relevantes:

- `production` — branch principal Neon; não receber alterações durante esta fase.
- `preview/migration/supabase-to-neon` — ambiente de migração ligado ao Preview.
- `development` — desenvolvimento.
- `vercel-dev` — integração de desenvolvimento.
- branches `backup/*` — checkpoints preservados.

O antigo branch genérico `preview` foi removido depois de confirmado vazio/obsoleto; não deve ser recriado como substituto do branch dedicado da migração.

### Observação de schema drift

O branch `preview/migration/supabase-to-neon` contém alterações substanciais que ainda não existem em `production`. Ele deve ser tratado como estado de trabalho valioso e **não deve ser resetado**.

Antes de qualquer promoção para `production`:

1. reconciliar o schema do branch Preview com migrations versionadas;
2. validar tabelas, funções, RLS, grants, indexes e extensões;
3. executar testes funcionais no Vercel Preview;
4. verificar paridade dos fluxos críticos;
5. preparar migração forward-only/zero-downtime;
6. obter aprovação explícita antes de qualquer alteração no branch Neon `production`.

## Selector de database

O código mantém Supabase como default fora da migração.

No Vercel Preview, Neon é seleccionado automaticamente apenas quando:

- `VERCEL_ENV=preview`; e
- `VERCEL_GIT_COMMIT_REF=migration/supabase-to-neon`.

Production continua em Supabase enquanto não existir cutover aprovado.

## Contrato de ambiente

O Preview da migração precisa de:

- `DATABASE_URL` — ligação Postgres pooled;
- `DATABASE_URL_UNPOOLED` — ligação directa;
- `ADMIN_MODERATION_SECRET` — credencial server-only obrigatória para a rota de moderação.

### Regra de runtime role

As duas URLs Neon do Preview devem usar o role **`haxr_edition_runtime`**, nunca `neondb_owner` como runtime da aplicação.

O role está codificado em:

`neon/migrations/20260827104500_edition_runtime_least_privilege.sql`

Características verificadas no branch Preview:

- `LOGIN=true`;
- `NOINHERIT`;
- `NOSUPERUSER`;
- `NOCREATEDB`;
- `NOCREATEROLE`;
- `NOREPLICATION`;
- `NOBYPASSRLS`;
- sem `CREATE` no schema `public`;
- sem `USAGE` no schema `auth`;
- sem acesso directo a `events`, finanças, fornecedores e restante Business Suite.

Permissões directas Edition:

- `edition_gift_reservations` — `SELECT`;
- `guests` — `SELECT`, limitado por RLS a `guest_source = 'edition_rsvp'`;
- `photo_upload_intents` — `SELECT`, `INSERT`, `UPDATE`;
- `wedding_photos` — `SELECT`, `INSERT`, `UPDATE`;
- sem `DELETE` directo nestas tabelas.

RPCs permitidos:

- `check_api_rate_limit(text, integer, integer)`;
- `reserve_edition_gift(text, text, text, text)`;
- `submit_edition_rsvp(...)` apenas na assinatura actual de 11 parâmetros.

O overload legado de 8 parâmetros permanece sem `EXECUTE` para o runtime role.

## Auth / moderação

`POST /api/memories/moderate` está fail-closed:

- `ADMIN_MODERATION_SECRET` ausente → HTTP `503`, sem mutação;
- credencial ausente ou inválida → HTTP `401`;
- `Authorization: Bearer <secret>` é o método preferido;
- `secretKey` no body permanece apenas como compatibilidade temporária;
- não existe fallback hardcoded de segredo;
- comparação de segredo usa timing-safe comparison;
- apenas `approve` e `reject` são aceites.

Existe teste permanente para este contrato em:

`lib/jessica-samuel-wedding/moderation-auth.test.ts`

A validação isolada em GitHub Actions passou com TypeScript + testes de autorização verdes.

## Storage

A estratégia de Storage já foi fechada para o Preview da migração:

- Memories uploads → Vercel Blob;
- legacy Photo Wall → Vercel Blob;
- galerias/signed reads → adapter Blob/Supabase;
- ZIP export → metadata Neon + download Vercel Blob;
- comportamento fora da migration Preview mantém fallback Supabase.

Canários end-to-end provaram upload, persistência Neon, leitura/download Blob, ZIP e limpeza sem resíduos.

## Checkpoint actual — 2026-08-27

O último Vercel Preview `READY` contém a correcção fail-closed da moderação e está limpo de probes temporários.

Commits posteriores com testes/migration/documentação não estão a gerar novos deployments porque o Vercel atingiu o limite de builds do plano. O status reportado é **deployment rate limited**, não falha de compilação ou teste.

Não criar commits artificiais para contornar a quota.

## Próximo cutover Preview

Quando a quota de builds estiver novamente disponível:

1. no Vercel, editar variáveis **somente** para Preview + branch `migration/supabase-to-neon`;
2. substituir `DATABASE_URL` pela URL pooled da Neon Preview usando `haxr_edition_runtime`;
3. substituir `DATABASE_URL_UNPOOLED` pela URL direct/unpooled do mesmo role;
4. configurar `ADMIN_MODERATION_SECRET` como Secret server-only forte;
5. confirmar que nenhuma das três alterações foi aplicada a Production ou a outros Preview branches;
6. gerar um novo deployment da migration branch;
7. confirmar deployment `READY` antes de qualquer canário HTTP.

Nunca guardar connection strings ou o segredo de moderação no Git, em logs ou em mensagens de diagnóstico.

## Regressão obrigatória após a troca do role

Executar no Vercel Preview, com dados canário isolados e limpeza integral:

1. **Runtime identity** — confirmar `current_user = haxr_edition_runtime` sem expor URL/credenciais.
2. **Edition RSVP** — create/update controlado, audit esperado e limpeza.
3. **Rate limit** — allowed/allowed/blocked no limite canário e limpeza.
4. **Gifts Rose Elegance** — leitura + reserva transaccional/limpa.
5. **Gifts Stan** — leitura + reserva transaccional/limpa.
6. **Memories upload** — intent → Blob → complete → Neon → signed read → limpeza.
7. **Legacy Photo Wall** — intent/complete/gallery no adapter Preview.
8. **Memories leaderboard/progress** — leitura Neon.
9. **Memories ZIP export** — metadata Neon + download Blob + ZIP byte-validado.
10. **Moderation Auth** — `503` sem configuração não se aplica depois do secret configurado; validar `401` sem/credencial errada e mutação apenas com Bearer correcto em linha QA, seguida de limpeza.
11. remover qualquer rota/script/probe temporário usado na validação.

## Guardrails

- Não executar reset no branch de migração.
- Não aplicar schema diff automaticamente em Neon `production`.
- Não remover variáveis Supabase antes do cutover final.
- Não mudar convites publicados apenas para testar a migração.
- Não guardar connection strings ou secrets no Git.
- Todas as alterações de schema/roles/policies devem tornar-se migrations versionadas.
- Rollback de schema deve ser forward-only; evitar down migrations destrutivas.
- Não usar `neondb_owner` como role permanente da aplicação.

## Gate antes de considerar Production

Só avançar para um plano de Production quando:

- Vercel Preview estiver `READY` no head actual;
- o runtime reportar `haxr_edition_runtime`;
- todos os fluxos acima passarem com limpeza comprovada;
- não existirem probes/workflows/canários temporários no head;
- migration Neon, código e documentação estiverem sincronizados;
- schema/paridade de dados estiverem novamente auditados;
- existir rollback operacional documentado;
- houver aprovação explícita para tocar em Production.
