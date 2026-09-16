# Plus Memories 2.0 — Preview isolado para Fase 1B

## Objectivo

Criar um único branch Neon de teste da baseline actual de Production, sem alterar Production, ligar-lhe apenas uma auditoria de catálogo de leitura e preparar a validação da migration Fase 1B. Este runbook não autoriza a criação do branch, env pull, migration, dados sintéticos, deploy ou push.

## Estado do preflight — 11 de Setembro de 2026

**Bloqueado antes da criação.** O Neon Console do projecto confirmado mostrou `10 / 10 Branches` e o aviso `Branch limit reached. Remove unused branches or upgrade your plan.` Não foi criado qualquer branch, compute, database, ligação ou migration. Production não recebeu alterações desta tarefa.

O escopo autorizado proíbe remover branches existentes e não autoriza upgrade. Não é seguro reutilizar o Preview arquivado como alternativa. Para desbloquear, o proprietário terá de autorizar explicitamente uma destas opções: eliminar um branch nomeado e confirmado como dispensável, aumentar o limite do projecto, ou alterar a estratégia de ambiente. Nenhuma será executada automaticamente.

## Branch proposto

| Campo | Valor proposto |
| --- | --- |
| Projecto | `HAXR-Business-Suite` / `little-band-06036174` |
| Parent | Production `br-wandering-bonus-ay2ex5lx` |
| Nome | `preview/plus-memories-2-phase-1b` |
| Tipo | Normal, não schema-only |
| Expiração | `2026-09-25T18:00:00Z` |
| Conteúdo | Schema e dados existentes de Production, sujeitos às permissões Neon já existentes |

O branch normal é proposto porque esta fase deve validar compatibilidade com links e media legados, FKs, constraints, roles e o comportamento de upload real. Um schema-only branch reduziria a exposição de dados, mas não demonstra a transição nem a idempotência contra a forma efectiva dos registos. O acesso ao branch deve ficar limitado à equipa autorizada; não devem ser extraídos dados nem copiada a connection string para chat, logs ou ficheiros versionados. Neon descreve branches normais como isolados do parent e capazes de incluir schema e dados; expiração é apropriada para ambientes temporários. [Neon branching workflow](https://neon.com/docs/get-started-with-neon/workflow-primer), [Neon branch expiration](https://neon.com/docs/changelog/2025-08-15).

## Sequência autorizável separadamente, após existir capacidade

1. Criar exactamente o branch acima, com parent e expiração confirmados no retorno do Neon.
2. Registar apenas metadados não secretos: ID, nome, parent, estado activo e expiração. Parar se o parent ou o estado não corresponderem.
3. Obter uma ligação do branch sem a imprimir nem gravar em `.env*`; executar `scripts/audit-memories-schema.mjs` em `READ ONLY` contra esse alvo e guardar apenas o output de catálogo permitido.
4. Comparar o catálogo com os adapters e produzir uma migration aditiva candidata. Nenhum DDL é aplicado neste passo.
5. Pedir uma autorização independente antes de aplicar essa migration, inserir dados de teste, configurar Vercel ou alterar qualquer ambiente remoto.

## Gates de validação do catálogo

- Confirmar tabelas `events`, `client_events`, `guests`, `seats`, `memory_experiences`, `memory_share_links`, `photo_upload_intents` e `wedding_photos`.
- Confirmar PKs, FKs, índices, tipos de `experience_id`/`phase_id`/`participant_id`, status do intent e enum/check correspondente.
- Confirmar relacionamento determinístico entre evento operacional, convite, experiência, links, intents e media; não assumir que `event_slug` é único.
- Confirmar grants, RLS, `FORCE ROW LEVEL SECURITY`, policies e funções `SECURITY DEFINER` para `edition_runtime`, `haxr_edition_runtime` e `haxrweb_runtime`.
- Confirmar qual runtime connection usa cada rota Edition. Não assumir que endurecer uma policy para uma role cobre as restantes.
- Parar se a estrutura divergir da baseline relatada, se o target estiver arquivado, se a ligação não for inequivocamente o branch novo, ou se o audit não puder correr como leitura.

## Limites

Não criar ou invalidar links Jessica & Samuel. Ambos continuam `legacy`. Não actualizar `.neon`, `.env`, Vercel, R2 ou Production. Uma migration futura deverá ser aditiva, manter linhas legadas válidas e permitir activar sessões por evento apenas depois de Preview aprovado.
