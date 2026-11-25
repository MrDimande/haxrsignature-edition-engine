# Baby Aylla Gift Registry Fase B

## Estado editorial

Foram organizados 52 artigos candidatos em sete categorias. No código de galeria editorial (`data/gifts/baby-aylla.ts`), os 52 temas exibidos na pré-visualização estética estão em `familyApproval: pending`, `approvedByFamily: true` (inclusão visual na galeria de inspiração), `suggestedQuantity: null`, `approvedQuantity: null` e `enabled: false`. No inventário operacional em base de dados (`public.edition_gift_inventory`), todos os 52 itens permanecem com `family_approved = false`, `enabled = false`, `approved_quantity = NULL`, `specifications_complete = false` e `child_safety_validated = false` até aprovação familiar formal.
Nenhum item está activado operacionalmente ou pode ser reservado em produção.

## Pontos que exigem decisão da família

| Tema | Artigos afectados | Decisão necessária |
| --- | --- | --- |
| Segurança e supervisão | Cama, iluminação, brinquedos, cadeira de alimentação, escorrega, água e piscina | Confirmar certificação, adequação à idade, instalação e supervisão. Cobertores e mantinhas não devem ser tratados como roupa de cama solta incompatível com sono seguro. |
| Dimensões | Tapetes, candeeiro, quadros, cestos, trocador, mesa de actividades, escorrega, tenda, mesa de água, piscina e cadeira | Confirmar o espaço disponível antes de escolher o modelo. |
| Tamanhos e cores | Vestidos, conjuntos, pijamas, sapatos e sandálias | Indicar tamanhos, numeração, cores e materiais. Não foi inventada qualquer medida. |
| Personalização | Decoração com nome, cofrinho Mana Dior, caixa personalizada e presente comemorativo | Confirmar grafia final, texto, acabamento e se a referência “Mana Dior” pode aparecer publicamente. |
| Sobreposição | Caixa de recordações e caixa de recordações personalizada | Manter ambas como candidatas distintas até a família decidir se quer as duas ou prefere uma delas. |
| Referências visuais | Todos os 52 artigos | Fotografias, marcas, fornecedores e preços permanecem pendentes. |

## Recomendações de curadoria

- O Cantinho dos Sonhos da Aylla mantém prioridade elevada por apoiar a composição do quarto.
- Brinquedos devem ser confirmados para a faixa etária e sem peças pequenas destacáveis.
- Artigos de água, movimento e altura exigem supervisão adulta e confirmação de requisitos de segurança.
- Não foi incluído qualquer andador tradicional com rodas.
- Nenhuma quantidade foi sugerida: essa definição depende do espaço, preferências familiares e itens já adquiridos.

## Próxima decisão

Depois da aprovação familiar, a próxima fase deve mapear apenas os itens
aprovados para um inventário privado, validar o esquema e as roles na branch
Neon autorizada e só então propor a activação pública em revisão separada.
