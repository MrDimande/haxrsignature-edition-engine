# PLUS MEMORIES — ESTADO ACTUAL

Data: 10 de Setembro de 2026. Fase 0: auditoria de código local, anterior à implementação.

## Âmbito e autoridade

- O proprietário confirmou nesta tarefa que a evolução funcional deve ocorrer em `MrDimande/haxrsignature-edition-engine`.
- Base inspeccionada: `main`, commit `4ffd3da`, checkout original `C:/project-x/projecto_haxrsignature`, sem alterações locais à data da leitura. Este SHA não foi confirmado como deployment actual.
- Implementação isolada em `C:/project-x/haxrsignature/.codex-worktrees/plus-memories-2`, branch `codex/plus-memories-2-foundation`.
- `haxrsignatureweb`, commit local `d6885b5`, contém marketing, Guest Management e serviços de Memories sem ligação às rotas dos convidados. Os três ficheiros previamente modificados nesse checkout ficam preservados.
- Auditoria baseada em código, testes, migrations e referências Git locais. Nenhuma consulta a dados pessoais, credenciais, base de dados ou storage remoto. Os relatórios de migração de Setembro e os resultados de Preview de Agosto são evidência histórica; não comprovam o estado remoto actual.

## Arquitectura real

```text
haxrsignatureweb: marketing / eventos / convidados / RSVP / mesas
                   ↑ proxy RSVP com autenticação de serviço
Edition Engine: InvitationConfig + resolveSlug
    └── /[slug]/memorias
          ├── perfil traditional-memories
          └── perfil plus-memories
                  ↓ Route Handlers /api/memories/*
            Memories config / upload / gallery / leaderboard / export
                  ├── EditionDatabaseProvider → pg / Neon
                  └── MemoriesStorageProvider → R2 (S3)
```

Next.js 15.5.19, React 19, TypeScript estrito, Tailwind 4, Motion/Framer Motion, Node Test Runner + tsx. `pg`, SDK S3 e JSZip já existem. Preservar os providers e os Route Handlers. O código mantém adapters Supabase e defaults legados: a selecção efectiva depende do ambiente; o README por si só não prova ausência de dependência em runtime.

## Inventário funcional e gap para 2.0

| Área | Estado encontrado e evidência | Gap / reutilização |
| --- | --- | --- |
| Rotas de convidados | `app/[slug]/memorias/page.tsx`: resolução canónica, convite activo, feature flag, selecção de perfil | Reutilizar URLs e temas; acrescentar autorização real para eventos privados |
| Upload | `app/api/memories/{upload-intent,complete}/route.ts`, `lib/memories/upload.ts` | Fluxo real de duas fases; ainda sem sessão de participante verificada |
| Galeria | `app/api/memories/route.ts`, `lib/memories/gallery.ts` | Limite de 100, sem cursor; erros de BD tratados como álbum vazio; falta vincular caminho assinado ao evento |
| Moderação | `app/api/memories/moderate/route.ts` | Apenas aprovar/rejeitar; autorização pode ser omitida; sem actor/audit log nem painel operacional |
| Export | `app/api/memories/export-zip/route.ts`, `lib/memories/export.ts` | ZIP síncrono de até 1000 objectos, sem autenticação; sem jobs, selecção/favoritos/etapas ou controlo de volume em bytes |
| Identidade | `plus-memorias-identity.ts`: UUID em localStorage por slug; nome/opt-in local | Não é sessão, prova de posse de convite nem vínculo `guest_id`; cliente pode escolher outro UUID |
| Eu Espio | `plus-memorias-challenges.ts`, `lib/memories/config.ts` | 12 desafios fixos, IDs `01`–`12`; sem banco de missões, elegibilidade, atribuições, pontos variáveis ou horários |
| Explorador | `lib/memories/leaderboard.ts`, API `/leaderboard` | Backend real, restrito a admin; conta desafios únicos. Desempate: quantidade, hora da enésima conclusão, total de uploads, nome. Preservar esta regra até decisão explícita |
| Progresso | API `/progress`, `replaceCompletedChallenges` | Servidor substitui snapshot local; preservar. Endpoint confia no UUID enviado; sem posse da identidade |
| Offline | `plus-memorias-offline-queue.ts`, `PlusMemoriasExperience.tsx` | IndexedDB conserva blob e metadata; processa toda a fila sem filtro por evento nem exclusão mútua entre tabs; não garante ausência de perda/duplicação |
| Media | `lib/memories/config.ts`, storage R2 | Fotos 25 MiB, vídeos 100 MiB; JPEG/PNG/WebP/HEIC/HEIF, MP4/MOV/WebM; legenda 200 e nome 80 caracteres. Estes são limites existentes, não novos limites comerciais |
| Validação | `lib/memories/upload.ts`, `photo-wall/validation.ts` | Tamanho real via HEAD e prefixo de 512 bytes para magic bytes; upload directo PUT; preservar leitura limitada. Assinatura não equivale a descodificação/antivírus |
| Captura/galeria | `PlusMemoriasCaptureModal.tsx`, `PlusMemoriasLiveGallery.tsx` e equivalentes tradicionais | Câmara, selecção individual, preview, compressão Canvas e download individual. Falta multi-upload, cancelamento efectivo, progresso em bytes, tratamento consistente de erro e acessibilidade completa dos modais |
| Momentos | Lightbox de foto/vídeo existente | Não encontrei viewer sequencial com barras, hold/swipe, auto-avanço ou estado visto persistido na base actual |
| Etapas / QR / voz | Existem na branch local `codex/plus-memories-product-engine` (`b2ffe46`), ausentes de `main` | `phases.ts`, `share-links.ts`, `projects.ts`, `qr.ts`, `voice.ts`, `/plusmemories/[shortCode]`, APIs admin e quatro migrations. Reconciliar com Neon/R2; não reaplicar a branch inteira nem duplicar estes conceitos |
| Social privado | Pesquisa em `app`, `lib`, `data`, `engines`, migrations e branch anterior | Não encontrei implementação de reacções, comentários, favoritos, story views, achievements ou recap nesta base; não é prova de ausência noutros repositórios/branches |
| Admin | APIs dispersas; guard comum existente na branch anterior | Reutilizar `requireMemoriesAdmin` da branch anterior; evoluir depois para actores/papéis e escopo por evento |
| SEO | Metadata de memórias `noindex/nofollow`, sitemap vazio; robots bloqueia motores comuns e permite bots de preview | Preservar previews dos convites; bloquear indexação das respostas de media. `noindex` não é autorização |

## Modelo de dados e fontes de verdade

- `data/invitations.ts` e `lib/engine` identificam eventos por slug canónico e aliases. A configuração Memories local não resolve `event_id` do Core.
- `wedding_photos`: `id`, `invitation_slug`, `storage_path`, MIME/tamanho, nome, legenda, desafio, mesa, participante, estado e datas. Reutilizar esta tabela de media.
- `photo_upload_intents`: ID UUID, slug, bucket, caminho único, MIME, tamanho declarado, estado, expiração e consumo. Consumo condicional por ID + slug + bucket + estado + validade em `lib/db/neon-provider.ts`.
- `api_rate_limits` / `check_api_rate_limit`: janelas persistentes; chave composta por aplicação, domínio, slug, acção e hash de IP+user-agent. Fallback em memória não fornece garantia distribuída e Wi-Fi/dispositivos semelhantes podem partilhar chave.
- `supabase/migrations/20260702231600_photo_upload_intents.sql`: PK/unique, índices de expiração/evento e RLS/revogação de acesso directo. Contém limites históricos de 5 MiB e apenas três MIME; não descreve sozinho o schema que suporta hoje vídeos de 100 MiB.
- `20260807000000_memories_challenge_and_table.sql`: campos opcionais com constraints de tamanho e índices por slug/desafio e slug/mesa.
- `20260815000000_add_participant_id_to_wedding_photos.sql`: UUID opcional e índice por slug/participante; não existe FK de convidado nesta migration.
- A branch anterior acrescenta `memory_experiences`, ShareLinks, etapas e voz. Antes de nova migration é necessário reconciliar o catálogo real de Preview, histórico de migrations e vínculo ao evento do Core.
- O Core já gere eventos/convidados/mesas (`src/lib/events`, `src/lib/guests`, `src/lib/events/floor-plan`). O proxy RSVP Edition existe em `lib/control-plane/rsvp-proxy.ts`, mas não devolve uma sessão de convidado reutilizável por Memories.
- `tableId` de Memories vem de `?mesa=` e de listas do perfil; não é um assignment autorizado do Guest Management. Não criar uma segunda lista canónica de mesas nem confiar nesse valor para elegibilidade.

## Problemas prioritários

1. **P0 — moderação sem credencial:** a condição anterior só rejeita um segredo errado quando este é fornecido. Omiti-lo permite alcançar a actualização. O fallback literal também é inadequado. Evidência: handler `/moderate`.
2. **P1 — pending na galeria/export:** ambos os adapters usam `moderation_status != rejected`, embora `MEMORIES_DEFAULTS.moderationRequired` seja `true`. Pendentes recebem URLs assinadas e entram em ZIP.
3. **P1 — export sem guarda:** `/export-zip` é invocável apenas com slug e pode carregar grande volume no servidor.
4. **P1 — isolamento incompleto:** queries filtram slug, mas galeria/export assinam `storage_path` sem comprovar o prefixo do evento. Slug conhecido não prova autorização do participante.
5. **P1 — identidade manipulável:** UUID local e metadata de conclusão são fornecidos pelo browser. Falta sessão HttpOnly revogável e ligação entre sessão, intent e participante.
6. **P1 — retry de conclusão:** intent é consumido antes do HEAD/prefixo/INSERT; falha transitória posterior impede retry e pode deixar objecto órfão. Necessita desenho transaccional/estado de processamento, sem fingir que consumo único equivale a idempotência de resultado.
7. **P2 — divergência da documentação:** README afirma Bearer em moderação/export e menciona `HAXR_MEMORIES_ADMIN_TOKEN`; handlers não usam esse nome. Corrigir a documentação para o contrato implementado com `ADMIN_MODERATION_SECRET`.
8. **P2 — validação operacional:** `npm test` não inclui todos os testes `lib/memories/*.test.ts`; `lib/db/live-neon.test.ts` pode escrever no rate limiter de Produção ao encontrar DATABASE_URL. Executar esta auditoria sem ficheiros de ambiente/credenciais e distinguir testes simulados de PostgreSQL real.
9. **P2 — dívida restante:** tipos `any`, erros de BD mascarados, TLS do pool sem verificação de certificado, ZIP síncrono, ausência de thumbnails/posters e pipeline de remoção de EXIF para originais não optimizados. Sem prova de desempenho ou permissões remotas nesta tarefa.

## Primeira implementação segura — Fase 1A

Reutilizar o guard administrativo da branch anterior, com Bearer obrigatório e comparação criptográfica; proteger moderação, classificação e export antes de consultar dependências. Validar payload de moderação, manter filtro por evento e falhar quando nenhuma linha for actualizada. Restringir a leitura de convidados a media aprovada e validar o caminho por evento antes de emitir URL/ZIP. Respeitar o controlo de galeria na configuração. Reportar indisponibilidade como erro e acrescentar cabeçalhos privados/noindex. Integrar testes de segurança e os testes Memories omitidos no comando da suite.

Ficheiros previstos: `lib/memories/admin-auth.ts`, rotas de Memories, `lib/memories/gallery.ts`, `export.ts`, `publication.ts`, `lib/db/{types,neon-provider,supabase-provider}.ts`, configuração, componentes de galeria, testes, `package.json` e documentação. Reutilizar `storage/path-security.ts` sem alterar o seu contrato. Sem migrations nesta contenção: não se altera schema, nem se cria arquitectura paralela.

Risco funcional intencional: pedidos administrativos sem Bearer passam a ser recusados; media pendente deixa de aparecer no álbum e no ZIP. São correcções do contrato de privacidade/moderação já declarado. O ranking provisório mantém a regra de pontuação existente e fica restrito a admin.

Validação: reproduzir primeiro os acessos indevidos com dependências simuladas; verificar zero chamadas a BD/storage antes de autorização, isolamento de slugs e caminhos, estados de moderação, formatos inválidos e erros. Executar lint, typecheck, testes, build e secret scan. Não declarar E2E real, RLS, concorrência distribuída ou QA de dispositivos a partir de testes locais.

## Fases seguintes e decisões materiais

1. Fase 1B: reconciliar experiências/ShareLinks da branch anterior com Neon e eventos Core; sessão revogável e autorização por evento em todas as rotas; catálogo de Preview e migrations não destrutivas.
2. Fases 2–3: media optimizada, etapas/timezone, metadados mínimos e viewer de Momentos sobre a mesma media.
3. Fases 4–6: reacções/comentários/favoritos, assignments e submissões idempotentes, pontos no servidor, classificação e conquistas.
4. Fases 7–9: administração, export jobs/recap e QA funcional/visual/performance.

Decisões do proprietário antes de activar capacidades: downloads/originais por plano, retenção, comentários por plano, exposição de nomes/ranking, repetição de missões e acesso dos eventos antigos. A página comercial do Core confirma Collection até 50 convidados, Couture até 150, Signature acima de 150, mas permite configuração à medida; não converter automaticamente estes textos em quotas técnicas. Sessões e configuração podem ser construídas com capacidades explícitas, sem inventar preços ou direitos comerciais.

Preservar: URLs/aliases existentes, perfis Traditional e Stan, RSVP, presentes, regras actuais do Explorador, reconciliação substitutiva do progresso, providers Neon/R2 e arquivo Supabase. Nenhum push, merge, deploy, canário ou mutação remota integra esta fase local.

O resultado da primeira implementação e os gates executados estão no [relatório da Fase 1A](plus-memories-2-phase-1a.md). Esta auditoria conserva a descrição da base anterior às correcções.
