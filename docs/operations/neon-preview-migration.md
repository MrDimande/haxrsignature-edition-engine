# Runbook: Supabase → Neon — Preview First

## Objectivo

Migrar a persistência PostgreSQL do HAXR Signature Edition para Neon sem alterar o comportamento de Production antes da validação completa em Preview.

## Regra principal

> **PREVIEW FIRST — PRODUCTION NÃO É ALTERADA NESTA FASE.**

O branch `main` e o domínio de Production continuam no backend actual até existir evidência de paridade funcional e um cutover aprovado.

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
- `preview` — branch estável de Preview existente.
- `development` — desenvolvimento.
- `vercel-dev` — integração de desenvolvimento.

### Observação de schema drift

O branch `preview/migration/supabase-to-neon` contém alterações substanciais que ainda não existem em `production`. Ele deve ser tratado como estado de trabalho valioso e **não deve ser resetado**.

Antes de qualquer promoção para `production`:

1. reconciliar o schema do branch Preview com migrations versionadas;
2. validar tabelas, funções, RLS, grants, indexes e extensões;
3. executar testes funcionais no Vercel Preview;
4. verificar paridade dos fluxos críticos;
5. preparar migração forward-only/zero-downtime;
6. obter aprovação explícita antes de qualquer alteração no branch Neon `production`.

## Contrato de ambiente

A integração Neon ↔ Vercel deve fornecer, por ambiente/branch:

- `DATABASE_URL` — ligação Postgres pooled para a aplicação;
- `DATABASE_URL_UNPOOLED` — ligação directa para tarefas que a exijam.

Durante a fase de transição, as variáveis Supabase permanecem disponíveis para manter rollback e evitar cutover prematuro.

## Storage

Neon substitui PostgreSQL e pode suportar Auth/Data API, mas não é assumido como substituto directo do Supabase Storage nesta fase. Os fluxos de uploads, Memories e media devem ter uma estratégia de Storage separada antes da remoção total do Supabase.

## Guardrails

- Não executar reset no branch de migração.
- Não aplicar schema diff automaticamente em Neon `production`.
- Não remover variáveis Supabase antes do cutover.
- Não mudar convites publicados apenas para testar a migração.
- Não guardar connection strings ou secrets no Git.
- Todas as alterações de schema devem tornar-se migrations versionadas.
- Rollback de schema deve ser forward-only; evitar down migrations destrutivas.

## Gate de saída da Fase 1

A Fase 1 termina quando:

- a branch Git `migration/supabase-to-neon` gera Vercel Preview;
- o Preview está ligado ao branch Neon correspondente;
- `DATABASE_URL` é injectado apenas no ambiente correcto;
- Production continua sem alteração;
- o schema drift está inventariado e protegido contra perda.
