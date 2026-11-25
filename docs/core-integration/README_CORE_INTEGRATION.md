# HAXR Core — Baby Aylla Gift Registry — Instruções de Aplicação (Fase C.3)

**Autor:** Antigravity (Principal Full-Stack Architect)
**Destino:** Repositório HAXR Core (`MrDimande/haxrsignatureweb.git`)
**Branch Alvo:** `feat/baby-aylla-core-integration` (a criar em worktree isolado)
**Estado Actual:** Pronto para integração após autorização expressa.

---

## 1. Modificações Necessárias no HAXR Core

### A. Registo do Evento Baby Aylla em `src/lib/edition/registry.ts`

Acrescentar o binding do evento e aliases:

```typescript
// Em LEGACY_SLUG_REDIRECTS:
aylla: "babyaylla",
"the-bow-collection": "babyaylla",
"dior-collection-rosa": "babyaylla",

// Em SLUG_BINDINGS:
babyaylla: {
  slug: "babyaylla",
  adminEventName: "Edition · Aniversário · Baby Aylla",
  clientName: "Baby Aylla",
  envVar: "EDITION_EVENT_AYLLA_ID",
},
```

### B. Migração PostgreSQL

Copiar `docs/migration-candidates/core-neon/20261122_baby_aylla_gift_registry_phase_c3_forward.sql` para:
`database/migrations/20261122120000_baby_aylla_gift_registry_phase_c3.sql`

### C. Módulos de Serviço e Rotas

Copiar `lib/aylla/gifts/core-adapter/` para:
`src/lib/edition/gifts/aylla/`

Montar os endpoints da API App Router:

- `src/app/api/v1/edition/gifts/aylla/challenge/route.ts`
- `src/app/api/v1/edition/gifts/aylla/verify/route.ts`
- `src/app/api/v1/edition/gifts/aylla/reserve/route.ts`
- `src/app/api/v1/edition/gifts/aylla/cancel/route.ts`

---

## 2. Variáveis de Ambiente no Core (`.env.production` / Vercel Core)

```env
# ID canónico do evento Baby Aylla na base de dados Neon
EDITION_EVENT_AYLLA_ID="a0f6b5a9-4d8c-4501-81b6-52929fa9da38"

# Segredo de servidor para hash HMAC-SHA256 de desafios e sessões
AYLLA_GUEST_IDENTITY_PEPPER="[GERAR_TOKEN_ALEATÓRIO_CRIPTO_64_CHARS]"
```

---

## 3. Procedimento de Aplicação Segura

1. Obter autorização formal da equipa técnica.
2. Criar worktree dedicado no Core:
   `git worktree add C:\project-x\core-baby-aylla-wt -b feat/baby-aylla-core-integration`
3. Aplicar os ficheiros e migração na branch efémera da Neon (`br-icy-butterfly-b4lw52nv`).
4. Executar os testes E2E com utilizadores sintéticos no laboratório isolado.
5. Manter `AYLLA_GIFTS_CONFIG.enabled = false` até autorização de go-live.
