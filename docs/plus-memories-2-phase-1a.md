# HAXR PLUS MEMORIES — IMPLEMENTAÇÃO

10 de Setembro de 2026 · Fase 1A: contenção local de autorização e publicação.

Repositório `haxrsignature-edition-engine`, conforme confirmação do proprietário. Branch local `codex/plus-memories-2-foundation`, baseada em `4ffd3da`. Cópia Git isolada em `C:/project-x/haxrsignature/.codex-worktrees/plus-memories-2`. Esta fase não conclui o Plus Memories 2.0 nem certifica uma release.

## 1. Estado encontrado

O runtime dos convidados reside no Edition Engine. Reutiliza `InvitationConfig`, rotas `/[slug]/memorias`, providers de BD/storage, upload directo com intents, desafios e progresso existentes. [Auditoria e matriz de gaps](plus-memories-2-audit.md).

## 2. Problemas encontrados

Omissão de credencial permitia alcançar a moderação; exportação sem autenticação; queries publicavam pendentes apesar de moderação obrigatória; caminhos não eram cruzados com evento/ID antes da assinatura. Falhas de BD pareciam álbum vazio. O primeiro conjunto de regressão reproduziu 13 falhas em 16 casos na implementação anterior, com dependências simuladas.

## 3. Arquitectura utilizada

Route Handlers Next.js → serviços Memories → `EditionDatabaseProvider` e `MemoriesStorageProvider`. Reutilizado o contrato administrativo da branch histórica `codex/plus-memories-product-engine` (`b2ffe46`), sem importar as suas migrations ou o acesso directo Supabase. Mantidos Neon/R2 e adapters legados. Sem nova dependência nem alteração de lockfile.

## 4. Ficheiros alterados

- Autorização e APIs: `lib/memories/admin-auth.ts`; `app/api/memories/route.ts` e rotas `moderate`, `leaderboard`, `export-zip`.
- Publicação/BD: `lib/memories/{publication,gallery,export,config}.ts`, `lib/db/{types,neon-provider,supabase-provider}.ts`, `data/invitations.ts`.
- Interface: `lib/memories/use-gallery.ts`, `PlusMemoriasLiveGallery.tsx` e `MemoriasLiveGallery.tsx` nos perfis existentes. Import de estilos reposto em `MemoriasExperience.tsx` e propriedade `min-height` corrigida em `memorias.css` do perfil tradicional. Apenas codificação de aspas JSX em `MemoriasChallengeGrid`, `MemoriasFooter`, `MemoriasIntro`, `MemoriasProgress` e `MemoriasToast` do perfil `primavera-lobolo`, para resolver erros de lint sem mudar o texto visível.
- Verificação: `lib/memories/security.test.ts`, `lib/db/memories-publication.test.ts`, `lib/db/live-neon.test.ts`, `package.json`.
- Documentação: `README.md`, este relatório e a auditoria.

## 5. Migrations adicionadas

Nenhuma. Sem alteração de schema, RLS, grants, configuração remota, dados ou objectos. Não foi feita reconciliação do catálogo de Preview nem inferido o estado de Produção.

## 6. Funcionalidades implementadas

- Bearer obrigatório para as três operações administrativas; 401 para credencial ausente/inválida, 503 quando o segredo não está configurado.
- Moderação valida JSON, UUID e acção; usa slug canónico e devolve 404 se ID/evento não correspondem.
- Galeria/ZIP só publicam registos aprovados. `publicGalleryEnabled: false` impede leitura e assinatura pela galeria.
- As duas galerias mostram indisponibilidade e permitem tentar novamente. O contador distingue carregamento/erro de zero memórias. Hook partilhado cancela respostas obsoletas ao desmontar/mudar parâmetros.
- Restaurado o stylesheet já existente do perfil tradicional: a captura inicial mostrou títulos escuros sobre fundo escuro, causados pelo import ausente de `memorias.css`. A cor de fundo definida pelo próprio perfil é `#F5EDE4`; não foi criado um tema novo.
- ZIP falha explicitamente quando uma leitura falha; nomes de mesas são sanitizados e nomes de ficheiros incluem o UUID completo para evitar colisão pelo prefixo de oito caracteres.

## 7. Segurança implementada

`requireMemoriesAdmin` aceita exclusivamente Authorization Bearer; sem fallback literal. Comparação com `timingSafeEqual` após validar comprimentos. Guard executado antes de BD/storage. A chave continua administrativa global: não representa papéis ou permissões por evento.

`isPublishedMemoryForEvent` valida estado, slug da linha, caminho canónico, slug do caminho e ID da fotografia antes de assinar. Providers aplicam filtro de aprovação/evento antes do limite; Neon usa parâmetros SQL. Moderação em ambos os adapters exige ID + evento e confirma uma linha actualizada.

Respostas alteradas usam `Cache-Control: no-store` e `X-Robots-Tag: noindex, nofollow`. Logs novos de falha não contêm credenciais, URLs assinadas ou payloads. Testes não carregam ficheiros de ambiente; chamadas de BD/storage/rede dos novos casos são simuladas. O teste live de Neon agora exige `EDITION_RUN_LIVE_DB_TESTS=true`, evitando escrita acidental ao correr a suite normal.

Referências oficiais consultadas: [queries parametrizadas em node-postgres](https://node-postgres.com/features/queries), [timingSafeEqual em Node.js](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b) e [filtros Supabase](https://supabase.com/docs/reference/javascript/using-filters). A utilização local foi verificada no código e nos testes dos adapters instalados.

## 8. Testes executados

- Regressões de rotas: credenciais ausentes/erradas/no JSON/no URL/header legado; serviço sem segredo; payloads inválidos; aprovação/rejeição; moderação cruzada; galeria vazia versus erro; configuração privada; isolamento de linhas/caminhos; ZIP autorizado e falha de leitura; ranking provisório/final autorizado.
- Contratos dos adapters Neon/Supabase: filtros e parâmetros, limite após filtro e moderação de zero linhas. Estes casos não substituem testes contra PostgreSQL real ou RLS.
- `npm test`; `npm run lint -- --format json --output-file .lint-plus-memories.json`; `npm run typecheck -- --incremental false`; `npm run secret-scan`; `npm run build`; `git diff --check`.

## 9. Resultado do lint

Zero erros e nove avisos existentes. Foram corrigidos os 14 erros de aspas JSX em Memories encontrados na primeira execução. Nenhuma regra desactivada para passar a validação.

## 10. Resultado do typecheck

`npm run typecheck -- --incremental false`: aprovado, sem erros. `npm run secret-scan`: aprovado.

## 11. Resultado dos testes

Suite completa: **265 testes, 262 aprovados, 2 falhas, 1 omitido**. Os 23 novos testes de segurança/publicação/adapters passaram. O teste omitido é o canário de BD live, desactivado por opção explícita.

As duas falhas foram reproduzidas no checkout original `C:/project-x/projecto_haxrsignature` em `4ffd3da`, usando o mesmo runner/dependências da cópia isolada, sem alterar os ficheiros originais:

1. `lib/jessica-samuel-wedding/photo-wall-disabled.test.ts:13`: o teste espera Photo Wall desactivado (`false`), mas a configuração actual é `true`.
2. `lib/rsvp/validate-local.test.ts:69`: o teste espera sucesso para o payload mínimo de despedida, mas a validação devolve `false`.

Não foram alteradas regras de RSVP ou activação do Photo Wall para satisfazer estes testes. A suite global permanece vermelha.

## 12. Resultado do build

`npm run build`: aprovado no código final, incluindo a reposição do stylesheet tradicional. Compilação, lint/verificação de tipos, geração de **52/52 páginas** e tracing concluídos. A primeira tentativa falhou no acesso às fontes Google (`EACCES`); foi repetida com acesso de rede autorizado, sem substituir fontes nem desactivar checks.

A rota `/[slug]/memorias` reportou 75,1 kB e 178 kB de First Load JS no output do Next.js. Estes valores descrevem o build local; não são um benchmark de desempenho nem uma comparação antes/depois.

## 13. Testes responsive

Servidor local com `npm run start -- --hostname 127.0.0.1 --port 3108`, build de produção sem credenciais. Navegador Chromium integrado, altura 900 px; medições DOM e capturas visuais. Rotas verificadas: `/jessicasamuelwedding/memorias` e `/jessicaesamueltraditionalwedding/memorias`.

| Largura do viewport | Plus | Tradicional |
| --- | --- | --- |
| 320 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 360 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 375 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 390 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 412 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 430 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 768 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |
| 1440 px | Sem overflow; erro/retry visíveis | Sem overflow; erro/retry visíveis |

Em todas as combinações, o botão mediu 44 px de altura e a página não mostrou `0 memórias captadas` durante indisponibilidade. Capturas finais a 320 e 1440 px confirmaram títulos legíveis e a paleta existente: Plus `rgb(241, 227, 207)`, Tradicional `rgb(245, 237, 228)`. A primeira captura tradicional tinha fundo escuro: serviu de reprodução da falha de import, corrigida e novamente verificada.

No perfil tradicional, Tab avançou do botão para o link do rodapé e Shift+Tab regressou ao botão com outline visível. No Plus, Enter iniciou novo pedido e regressou ao alerta de indisponibilidade. A ausência de BD local produz 503 de forma intencional; a galeria vazia válida e ZIP/ranking bem-sucedidos foram verificados nos testes simulados. O override de viewport foi reposto no fim.

Sem E2E autenticado remoto, dispositivo físico, Safari/Firefox, câmara real, upload/storage real, testes de leitores de ecrã ou prova distribuída nesta fase. Esta matriz valida os estados e layout alterados, não certifica todos os fluxos do produto.

## 14. Problemas que ainda permanecem

- Acesso de convidados continua baseado no slug/UUID local: falta sessão revogável, autorização por evento e vínculo com Guest Management. Cabeçalhos de privacidade e URLs assinadas não garantem confidencialidade de um evento cujo link se conhece. URLs já emitidas podem continuar válidas até à expiração, mesmo após rejeitar uma memória.
- Upload ainda consome intent antes de terminar validação/INSERT; falta idempotência transaccional. Fila offline e concorrência entre tabs precisam de correcção própria.
- ZIP continua síncrono, até 1000 objectos, sem orçamento de bytes/job e sem paginação; não validado sob carga.
- Não foram implementados Momentos, social, assignments, pontos variáveis, conquistas, painel admin, export jobs ou recap 2.0.
- Testes globais falham nos dois pontos acima. Nove avisos de lint e dívida prévia permanecem.
- A aprovação passa a ser requisito efectivo da galeria/ZIP; antes de eventual release é necessário confirmar o processo administrativo e que clientes internos usam o Bearer. Não foram aprovadas memórias existentes automaticamente.
- Sem auditoria actual de RLS/grants/índices, TTL real, media legada, CORS, binding de Preview ou deployment. Nenhuma afirmação de prontidão de Produção.

## 15. Decisões que precisam do proprietário

Downloads de originais por plano; retenção; planos com comentários; exposição de nomes/ranking; repetição de missões; política de acesso e transição de eventos antigos. Não foram inventadas quotas comerciais nem activadas capacidades dependentes destas decisões.

## 16. Próxima fase recomendada

Fase 1B: reconciliar experiências/ShareLinks/etapas da branch histórica com Neon e o evento canónico do Core; desenhar e implementar sessão revogável e autorização por evento; ligar sessão, participante e upload intent; preparar migrations não destrutivas e testes de isolamento. Validar em Preview autorizado antes de release. O próximo passo não é repetir a branch antiga nem duplicar convidados/mesas.

Nesta entrega não houve commit, push, PR, merge, deploy, alteração de ambiente ou mutação remota. Esta tarefa não editou os ficheiros de marketing do Core. Durante a execução, o HEAD desse checkout avançou externamente de `d6885b5` para `15dc87f`; o checkout Edition original manteve-se limpo em `4ffd3da`. A pasta da cópia isolada aparece como não rastreada no checkout Core e não deve ser adicionada a esse repositório.
