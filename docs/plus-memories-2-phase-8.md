# HAXR PLUS MEMORIES 2.0 — RELATÓRIO TÉCNICO DE ENGENHARIA DA FASE 8
## RECAP EXPERIENCE & PÓS-EVENTO / ALTA-COSTURA DIGITAL

**Worktree**: `C:\project-x\haxrsignature\.codex-worktrees\plus-memories-2`  
**Neon Preview**: `br-flat-block-ayfks0so` (Project: `little-band-06036174`, Endpoint: `ep-summer-frost-aycwdu9m`)  
**Production Parent (Isolada/Intocada)**: `br-wandering-bonus-ay2ex5lx`  
**Estado da Validação**: `PHASE_8_FINAL_STATUS: PASSED (100% CONFORME)`

---

### 1. SUMÁRIO EXECUTIVO & OBJECTIVO DA FASE 8

A Fase 8 implementou a experiência oficial **Pós-Evento / Recap Experience** do ecossistema HAXR Plus Memories 2.0.

Após o término da celebração, o produto transcende a ideia de um mero álbum estático de fotografias. Ele entrega uma narrativa editorial viva e imersiva para reviver o casamento, concebida sob os princípios da Alta-Costura Digital: Preto Noir, Ouro Champanhe, Marfim, tipografia serifada de alta joalharia e total serenidade visual, baseada exclusivamente no Media Core canónico (`wedding_photos`).

A arquitectura cumpre escrupulosamente os **boundaries obrigatórios de engenharia, integridade e segurança**:

1. **Selagem Multi-Tenant na Publicação**: `FOREIGN KEY (experience_id, event_id) REFERENCES memory_experiences(id, event_id) ON DELETE CASCADE`. Impossível associar publicação de um evento a uma experiência de outro (código de erro PostgreSQL `23503`).
2. **Hero com Única Fonte da Verdade**: Hero editorial modelado exclusivamente em `memory_recap_items` com `section = 'hero'`. Um índice parcial único `CREATE UNIQUE INDEX memory_recap_items_single_hero_idx ON memory_recap_items(publication_id) WHERE section = 'hero'` impede fisicamente mais de um hero por publicação (`23505`).
3. **Stage Multi-Tenant Composto e ON DELETE SET NULL (stage_id)**: Itens do Recap vinculam-se a stages via `FOREIGN KEY (stage_id, event_id, experience_id) REFERENCES memory_stages(id, event_id, experience_id) ON DELETE SET NULL (stage_id)`. Se uma stage for removida, apenas `stage_id` é anulado; `event_id` e `experience_id` permanecem intactos, garantindo autoridade estrita de tenant sem quebras de integridade.
4. **Semântica de Projecção Editorial Viva (Opção A)**: `memory_recap_items.media_id` referencia `wedding_photos(id, event_id, experience_id) ON DELETE CASCADE`. Se uma fotografia for eliminada do Media Core, a sua referência no Recap é imediatamente removida em todas as versões. Nenhuma mídia eliminada reaparece no Recap.
5. **Separação entre Versão Editorial e Lock de Concorrência**: `version` representa a iteração editorial visível do Recap. `lock_version` é o contador monotónico de concorrência optimista. Edições de rascunho exigem `expected_lock_version` e retornam `409 Conflict` se outro administrador salvou concorrentemente.
6. **Publication Versioning & State Machine**: Transições estritas `draft -> published -> archived`. Publicações com status `published` são estritamente imutáveis (`400 Bad Request` em caso de tentativa de edição directa). Para novas edições, gera-se um novo draft `v2`. A publicação de `v2` arquiva deterministicamente `v1` e promove `v2` para `published`.
7. **Publicação Idempotente sob Retry**: `publishRecap` promove um rascunho existente. Se ocorrer perda de rede após o COMMIT, um retry com os mesmos parâmetros devolve a publicação já promovida sem criar duplicados (`idempotent: true`).
8. **Paridade com a Publication Policy Canónica**: `isEligibleForRecap` e `isCanonicalPublicMemory` (em `lib/memories/publication.ts`) garantem paridade absoluta de moderação entre Moments, Live Wall e Recap. Mídias ocultadas ou rejeitadas desaparecem instantaneamente do snapshot.
9. **Matriz Estrita de Níveis de Acesso (access_level)**:
   - `guests_only`: Exclusivo para participantes autenticados e autorizados da experiência. Share links ou visitantes anónimos recebem `403 Forbidden`.
   - `share_link_only`: Acesso restrito a detentores de share link válido com escopo `recap:view` scoped a `(event_id, experience_id)`. Participantes sem esse escopo ou acessos anónimos são negados.
   - `public`: Acesso universal anónimo unicamente quando `status = 'published'` E `access_level = 'public'`. Rascunhos permanecem inacessíveis para o público.
10. **Share Token Exchange Server-Side & Cookie Scoped**: URLs de convite/partilha com `?token=...` ou `?code=...` são resolvidas no servidor via `validateAndExchangeRecapToken`, convertidas num cookie HttpOnly de curta duração scoped à experiência (`haxr_recap_share_<event_id>`), com redireccionamento imediato para a URL canónica limpa. Nenhum token sensível permanece exposto na barra de endereços ou vaza em metadados.
11. **Exploradores com Semântica Dinâmica e Autorizativa (Opção A)**: O ranking dos Exploradores é derivado em tempo real do score oficial calculado pelo servidor. Moderações e aprovações subsequentes reflectem-se deterministicamente no pódio, sem dados desactualizados e sem vazar UUIDs de participantes (anonimização estrita).
12. **Privacidade Absoluta de Favoritos**: A secção de Favoritos devolve exclusivamente os itens favoritados pelo próprio participante autenticado. Visitantes via share-link ou visitantes anónimos recebem terminantemente um array vazio (`favorites: []`), garantindo isolamento total entre convidados.
13. **Campos Editoriais em Plaintext & Schema JSON Estrito**: Higienização contra caracteres perigosos de controlo, limites estritos de caracteres (120 no título, 500 em mensagens) e validação de schema JSONB com booleanos autorizados.
14. **Protecção CSRF Administrativa**: Mutações com cookie exigem token CSRF canónico (`403 CSRF_REQUIRED` ou `403 CSRF_INVALID`).
15. **Validação Visual Real em Browser**: Conformidade responsiva sem qualquer overflow horizontal (`scrollWidth <= clientWidth`) comprovada nos 9 viewports padrão (320px a 1440px), respeitando a estética Alta-Costura Digital.

---

### 2. ARQUITECTURA DE DADOS & SCHEMAS RESILIENTES

Migração aplicada no Neon Preview: `supabase/migrations/20260912010000_plus_memories_phase_8_recap.sql`  
Hardening de Stage aplicado: `supabase/migrations/20260912010100_plus_memories_phase_8_stage_set_null.sql`

```text
┌──────────────────────────────────────────────────────────┐
│                   memory_experiences                     │
├──────────────────────────────────────────────────────────┤
│ id (PK)                                                  │
│ event_id (composite key: id, event_id)                   │
└───────────────┬──────────────────────────────────────────┘
                │ 1:N
                ▼
┌──────────────────────────────────────────────────────────┐
│              memory_recap_publications                   │
├──────────────────────────────────────────────────────────┤
│ id uuid (PK)                                             │
│ event_id uuid                                            │
│ experience_id uuid                                       │
│ FOREIGN KEY (experience_id, event_id)                    │
│   REFERENCES memory_experiences(id, event_id)            │
│ version integer NOT NULL DEFAULT 1                       │
│ lock_version integer NOT NULL DEFAULT 1                  │
│ status text NOT NULL ('draft', 'published', 'archived')  │
│ title text NOT NULL DEFAULT 'O Nosso Casamento'          │
│ welcome_message text                                     │
│ closing_message text                                     │
│ access_level text NOT NULL                               │
│   ('guests_only', 'share_link_only', 'public')           │
│ configuration jsonb NOT NULL                             │
│ published_at timestamptz                                 │
│ created_at, updated_at timestamptz                       │
│ INDEX UNIQUE (experience_id) WHERE status = 'published'  │
│ INDEX UNIQUE (experience_id) WHERE status = 'draft'      │
└───────────────┬──────────────────────────────────────────┘
                │ 1:N
                ▼
┌──────────────────────────────────────────────────────────┐
│                 memory_recap_items                       │
├──────────────────────────────────────────────────────────┤
│ id uuid (PK)                                             │
│ publication_id uuid REFERENCES memory_recap_publications │
│ event_id uuid                                            │
│ experience_id uuid                                       │
│ media_id uuid                                            │
│ FOREIGN KEY (media_id, event_id, experience_id)          │
│   REFERENCES wedding_photos(id, event_id, experience_id) │
│   ON DELETE CASCADE                                      │
│ section text NOT NULL ('hero','story','moments',...)     │
│ stage_id uuid NULL                                       │
│ FOREIGN KEY (stage_id, event_id, experience_id)          │
│   REFERENCES memory_stages(id, event_id, experience_id)  │
│   ON DELETE SET NULL (stage_id)                          │
│ position integer NOT NULL DEFAULT 0                      │
│ editorial_caption text                                   │
│ INDEX UNIQUE (publication_id) WHERE section = 'hero'     │
└──────────────────────────────────────────────────────────┘
```

---

### 3. MAPEAMENTO DOS COMPONENTES E ENDPOINTS DA FASE 8

#### 3.1. Bibliotecas de Domínio e Políticas
- `lib/memories/publication.ts`:
  - `isCanonicalPublicMemory(row, slug)`: Validação canónica de conformidade de mídia.
  - `isEligibleForRecap(row, slug)`: Filtro de elegibilidade com garantia de paridade entre Moments, Live Wall e Recap.
- `lib/memories/recap-policy.ts`:
  - Definição canónica de tipos (`RecapPublicationRow`, `RecapSnapshotPayload`, `RecapMediaItem`, etc.).
  - Validações estritas de texto simples (`sanitizePlaintext`, `sanitizeRecapConfiguration`).
  - Matriz de controlo de acesso estrito (`isRecapAccessAuthorized`).
- `lib/memories/recap-store.ts`:
  - `getPublishedRecapSnapshot(context)`: Projecção autoritária do snapshot publicado com batching de URLs assinadas e privacidade de favoritos.
  - `getCurationDraft(options)`: Obtenção de rascunho activo e criação automática de novo draft `v+1` caso a versão actual já esteja publicada.
  - `saveCurationDraft(input)`: Gravação atómica de rascunho com concorrência optimista via `lock_version` (rejeita com `409 Conflict` se desactualizado e `400` se publicado).
  - `publishRecap(input)`: Promoção idempotente de rascunho para `published`, arquivando deterministicamente a versão anterior.
  - `unpublishRecap(input)`: Despublicação graciosa para `archived`.
  - `createRecapShareLink(options)`: Emissão de share link com escopo `recap:view` vinculado ao tenant.
  - `validateAndExchangeRecapToken(options)`: Validação criptográfica de tokens e emissão de sessão scoped temporária.
- `lib/memories/session-security.ts`:
  - `recapShareCookieName(eventId, isSecure)`: Cookie name isolado por evento.
  - `readRecapShareCookie(cookieStore, eventId, isSecure)`: Leitura segura de cookie scoped.
- `lib/memories/gateway.ts`:
  - `resolveRecapAccessContext(request, slug)`: Resolução autoritária no servidor do contexto de acesso via cookie scoped ou sessão de participante autenticado.

#### 3.2. Endpoints de API
- `GET /api/memories/recap?slug=...`: Retorna o snapshot publicado autorizado para o visitante.
- `GET /api/memories/recap/curation?slug=...`: Endpoint administrativo para carregar rascunho e candidatos de curadoria.
- `POST /api/memories/recap/curation`: Endpoint administrativo para salvar alterações editoriais no rascunho (com CSRF e `expectedLockVersion`).
- `POST /api/memories/recap/publish`: Endpoint administrativo para publicação idempotente do Recap (com CSRF).
- `POST /api/memories/recap/unpublish`: Endpoint administrativo para arquivar publicação activa (com CSRF).
- `POST /api/memories/recap/share-link`: Endpoint administrativo para gerar links de partilha com escopo `recap:view`.

#### 3.3. Interface Front-End e Experiência de Utilizador
- `app/[slug]/memorias/recap/page.tsx`: Página do Recap com metadados SEO restritivos (`noindex, nofollow`) e troca no servidor de tokens por cookie scoped com redirect para URL canónica limpa.
- `components/memories/recap/RecapExperienceView.tsx`: Orquestrador principal da narrativa pós-evento.
- `components/memories/recap/RecapHeroSection.tsx`: Hero cinematográfico com tipografia de luxo e fallback gracioso.
- `components/memories/recap/RecapStorySection.tsx`: Linha do tempo editorial agrupada por momentos e fases da celebração (Stages).
- `components/memories/recap/RecapMomentsSection.tsx`: Destaques da curadoria dos anfitriões em grelha equilibrada.
- `components/memories/recap/RecapMissionsSection.tsx`: Mídia resultante das missões Eu Espio com créditos discretos.
- `components/memories/recap/RecapExplorersSection.tsx`: Pódio dos convidados mais participativos, estritamente anonimizado.
- `components/memories/recap/RecapFavoritesSection.tsx`: Colecção de fotografias privadas favoritadas exclusivamente pelo convidado conectado.
- `components/memories/recap/RecapSocialSection.tsx`: Destaques sociais com comentários aprovados e contadores de reacções.
- `components/memories/recap/RecapClosingSection.tsx`: Mensagem de encerramento e agradecimento dos noivos aos convidados.
- `components/memories/recap/RecapMediaLightbox.tsx`: Visualizador imersivo em ecrã inteiro com suporte a teclado (Esc, setas), reprodução de vídeo e foco acessível.

---

### 4. MATRIZ DE EVIDÊNCIA DE TESTES (50 ASSERÇÕES NO PREVIEW)

Bateria executada em `scripts/test-phase-8-preview.mjs`:

| # | Asserção / Hardening / Boundary | Requisito / Comportamento | Resultado |
|---|---------------------------------|---------------------------|:---------:|
| 1 | Baseline Inicial | `SELECT count(*)::int FROM wedding_photos` == 147 | **PASS** (147) |
| 2 | Hardening 1: FK Composta Publication | `Event A + Experience B -> reject` (PostgreSQL `23503`) | **PASS** |
| 3 | Hardening 3: FK Composta Stage | `Item Event A / Experience A + Stage B -> reject` (`23503`) | **PASS** |
| 4 | Boundary 1: Stage SET NULL (stage_id) | `Delete stage -> item.stage_id = NULL` | **PASS** |
| 5 | Boundary 1: Tenant Preservation (event_id) | `Delete stage -> item.event_id` inalterado | **PASS** |
| 6 | Boundary 1: Tenant Preservation (experience_id) | `Delete stage -> item.experience_id` inalterado | **PASS** |
| 7 | Hardening 2: Hero Único | `Segundo item 'hero' na mesma publicação -> reject` (`23505`) | **PASS** |
| 8 | Hardening 4: Cascade de Media | `ON DELETE CASCADE`: Mídia apagada no Core remove item do Recap | **PASS** |
| 9 | Hardening 5: Concorrência Optimista | `saveCurationDraft` avança `lock_version` para 2 | **PASS** |
| 10 | Hardening 5: Detecção de Conflito | `saveCurationDraft` com `expectedLockVersion` desactualizado devolve `409` | **PASS** |
| 11 | Hardening 6 & 7: Promoção de Draft | `publishRecap` promove publicação para `published` | **PASS** |
| 12 | Hardening 6: Idempotência de Publicação | Retry de publicação devolve a mesma versão sem duplicar | **PASS** |
| 13 | Boundary 6: Imutabilidade de Publicado | Tentativa de editar publicação `published` é rejeitada com `400` | **PASS** |
| 14 | Boundary 6: Novo Draft v2 | `getCurationDraft` gera rascunho v2 quando v1 já está publicada | **PASS** |
| 15 | Boundary 6: Gravação de Draft v2 | Edição de v2 avança lock_version mantendo isolamento | **PASS** |
| 16 | Boundary 6: Promoção de v2 | `publishRecap` de v2 promove para `published` | **PASS** |
| 17 | Boundary 6: Arquivamento de v1 | Publicação de v2 transita v1 automaticamente para `archived` | **PASS** |
| 18 | Hardening 9: Moderação Precedente (Aprovação) | Mídia aprovada surge no snapshot publicado | **PASS** |
| 19 | Hardening 9: Moderação Precedente (Rejeição) | Mídia ocultada/rejeitada desaparece imediatamente do Recap | **PASS** |
| 20 | Fallback do Hero | Hero rejeitado activa fallback gracioso sem quebrar renderização | **PASS** |
| 21 | Hardening 10: Criação de Share Link | Emissão de link com escopo `recap:view` vinculada a tenant | **PASS** |
| 22 | Hardening 11: Resolução de Gateway | Gateway resolve escopo `share_link` para token válido | **PASS** |
| 23 | Hardening 10: Isolamento Cross-Tenant | Link da Experiência A1 usado no Evento B é rejeitado para `public` | **PASS** |
| 24 | Boundary 3: Exchange de Token Válido | `validateAndExchangeRecapToken` valida com sucesso | **PASS** |
| 25 | Boundary 3: Rejeição Cross-Tenant | Token da experiência A usado na experiência B é rejeitado | **PASS** |
| 26 | Boundary 3: Rejeição de Revogado | Token revogado devolve `valid = false` | **PASS** |
| 27 | Boundary 3: Rejeição de Expirado | Token expirado devolve `valid = false` | **PASS** |
| 28 | Boundary 3: Cookie Scoped Gateway | Gateway resolve `share_link` exclusivamente via cookie scoped | **PASS** |
| 29 | Hardening 12 & 14: Favoritos do Participante | Participante autenticado (Alice) recebe seus favoritos | **PASS** |
| 30 | Hardening 14: Isolamento de Favoritos | Participante Bruno nunca recebe favoritos de Alice (array vazio) | **PASS** |
| 31 | Hardening 14: Visitante Share Link | Acesso via share link nunca recebe favoritos (array vazio) | **PASS** |
| 32 | Hardening 15: Redacção de Identidade | Exploradores omite estritamente UUIDs de participantes | **PASS** |
| 33 | Hardening 15: Dados do Leaderboard | Ranking inclui pontuações reais e contagem de missões | **PASS** |
| 34 | Boundary 4: Semântica Dinâmica | Score modificado no servidor actualiza dinamicamente o pódio | **PASS** |
| 35 | Hardening 17: Higienização Plaintext | Sanitização remove caracteres perigosos sem quebrar texto | **PASS** |
| 36 | Hardening 17: Limite de Caracteres | Truncagem estrita no limite de 120 caracteres | **PASS** |
| 37 | Hardening 17: Validação de Configuração | Schema JSONB rejeita chaves ou tipos inválidos | **PASS** |
| 38 | Hardening 18: CSRF Obrigatório | Mutação com cookie sem CSRF token rejeitada com `403` | **PASS** |
| 39 | Hardening 18: CSRF Mismatched | Mutação com CSRF token inválido rejeitada com `403` | **PASS** |
| 40 | Boundary 2: Matriz guests_only (Auth) | Convidado autenticado autorizado tem acesso a `guests_only` | **PASS** |
| 41 | Boundary 2: Matriz guests_only (Share Link) | Share link `recap:view` em `guests_only` é terminantemente negado (`403`) | **PASS** |
| 42 | Boundary 2: Matriz guests_only (Anónimo) | Visitante anónimo em `guests_only` é negado (`403`) | **PASS** |
| 43 | Boundary 2: Matriz share_link_only (Com Link) | Visitante com share link válido acede a `share_link_only` | **PASS** |
| 44 | Boundary 2: Matriz share_link_only (Sem Link) | Participante sem share link em `share_link_only` é negado (`403`) | **PASS** |
| 45 | Boundary 2: Matriz share_link_only (Cross-Link) | Share link de outro evento em `share_link_only` é negado (`403`) | **PASS** |
| 46 | Boundary 2: Matriz public (Published) | Visitante anónimo acede a `public` com status `published` | **PASS** |
| 47 | Boundary 2: Matriz public (Draft) | Visitante anónimo em `public` com status `draft` é negado (`404`) | **PASS** |
| 48 | Despublicação Graciosa | `unpublishRecap` arquiva a publicação com sucesso | **PASS** |
| 49 | Snapshot Pós-Despublicação | Leitura após despublicação retorna `404 Not Found` | **PASS** |
| 50 | Baseline Final | `SELECT count(*)::int FROM wedding_photos` == 147 | **PASS** (147) |

---

### 5. VALIDAÇÃO VISUAL REAL MULTI-VIEWPORT (BROWSER REAL)

Validação executada via browser subagent em `http://localhost:3000/jessicasamuelwedding/memorias/recap` nos 9 viewports padrão do mercado:

| Viewport | Resolução (LxA) | scrollWidth | clientWidth | Overflow Horizontal | Status |
|:---------|:---------------:|:-----------:|:-----------:|:-------------------:|:------:|
| Mobile Muito Pequeno | 320 x 568 | 320 px | 320 px | Zero (`0 px`) | **PASS** |
| Android Pequeno | 360 x 800 | 360 px | 360 px | Zero (`0 px`) | **PASS** |
| iPhone Padrão | 375 x 667 | 375 px | 375 px | Zero (`0 px`) | **PASS** |
| iPhone 12/13/14 | 390 x 844 | 390 px | 390 px | Zero (`0 px`) | **PASS** |
| Samsung Galaxy | 412 x 915 | 412 px | 412 px | Zero (`0 px`) | **PASS** |
| iPhone Pro Max | 430 x 932 | 430 px | 430 px | Zero (`0 px`) | **PASS** |
| iPad Portrait | 768 x 1024 | 768 px | 768 px | Zero (`0 px`) | **PASS** |
| iPad Landscape | 1024 x 768 | 1024 px | 1024 px | Zero (`0 px`) | **PASS** |
| Desktop Canónico | 1440 x 900 | 1440 px | 1440 px | Zero (`0 px`) | **PASS** |

#### Inspecção Visual e de Experiência do Utilizador
- **Paleta de Alta-Costura Digital**: Fundo Preto Noir (`#0B0B0B`), detalhes em Ouro Champanhe (`#D4AF37`) e textos em Marfim (`#FAF8F5`).
- **Tipografia Editorial**: `font-serif` em todos os títulos, mensagens e legendas, sem cortes de texto ou quebras deselegantes.
- **Resiliência a Estados**: O estado de cortesia / empty state ("Memória em Preparação") apresenta-se harmonioso, centralizado e com botão de toque acessível.
- **Touch Targets & Foco**: Áreas de toque utilizáveis superiores a 44x44px; foco visível em navegação por teclado.
- **Nota Técnica de Acessibilidade**: `principais critérios de acessibilidade validados` (contraste essencial, navegação por teclado, foco visível e áreas de toque — conformidade total WCAG 2.2 AA exige testes de tecnologia assistiva em contexto real).

---

### 6. QUALITY GATES EXECUTADOS

- **Validação Preview Automatizada**:
  `node --import tsx scripts/test-phase-8-preview.mjs`  
  *Resultado: 50 PASSOU | 0 FALHOU | Baseline 147 mantido*.
- **Suite de Testes Unitários**:
  `npm test`  
  *Resultado: 351 passaram, 0 falharam, 1 skipped (teste herdado)*.
- **Verificação Estrita de Tipos**:
  `npm run typecheck` (`tsc --noEmit`)  
  *Resultado: Zero erros*.
- **Análise Estática de Código**:
  `npm run lint` (`eslint`)  
  *Resultado: Zero erros, zero novos avisos gerados na Fase 8*.
- **Varredura de Segredos**:
  `npm run secret-scan`  
  *Resultado: `secret-scan ok`*.
- **Compilação de Produção Next.js**:
  `npm run build` (`next build`)  
  *Resultado: Compilação concluída com sucesso (todas as 59 rotas estáticas e dinâmicas geradas)*.
- **Higiene do Repositório**:
  `git diff --check`  
  *Resultado: Limpo (zero erros de formatação ou conflitos)*.
- **Preservação de Produção e Infra-estrutura**:
  Neon Production (`br-wandering-bonus-ay2ex5lx`), buckets Cloudflare R2 de produção e Vercel 100% intocados e protegidos.

---

### 7. CONCLUSÃO TÉCNICA

A Fase 8 do HAXR Plus Memories 2.0 foi concluída com rigor de engenharia absoluto. O sistema pós-evento encontra-se selado, seguro, com concorrência optimista blindada, curadoria determinística, integridade relacional `ON DELETE SET NULL (stage_id)` comprovada, matriz estrita de `access_level`, share token exchange com redirect limpo e estética de Alta-Costura Digital validada nos 9 viewports padrão.

**PHASE_8_FINAL_STATUS: PASSED**
