# SACRIFICIO RPG — preparação do banco (Catálogo V1)

Este documento é um plano para a próxima etapa. **Nenhuma tabela, política RLS ou função do Supabase foi criada nesta atualização.**

## Identidade do jogador

- Usar o UUID original da conta autenticada, auth.users.id, que corresponde ao profiles.id já utilizado pelo painel.
- Não criar um segundo identificador de jogador.
- Todas as tabelas com progresso terão player_id uuid e políticas RLS vinculadas a auth.uid() = player_id.

## Catálogo estático

game-catalog.js é a fonte inicial dos IDs e definições. IDs publicados são permanentes e nunca devem ser reutilizados.

| Faixa | Conteúdo |
|---|---|
| 100000–199999 | Plantas e sementes |
| 200000–299999 | Peixes, locais de pesca e iscas |
| 300000–399999 | Minérios e gemas |
| 400000–499999 | Materiais processados |
| 500000–599999 | Produtos de alquimia |
| 600000–699999 | Ferramentas e equipamentos |
| 700000–799999 | Estações |
| 800000–899999 | Descobertas permanentes |
| 900000–999999 | Receitas |

## Persistência das tags — regra obrigatória

A identidade de uma pilha é: player_id + item_id + tag_ids + instance_id.

- game_inventory.tag_ids deve ser integer[] NOT NULL DEFAULT '{}'.
- Tags são dados persistentes do item, não apenas texto visual.
- Trigo sem tags, Trigo [1] (Dourada), Trigo [5] (Celestial) e Trigo [1,6] (Dourada + Sol) são pilhas distintas.
- Só somar quantidades se item_id, conjunto normalizado de tag_ids e instance_id forem iguais.
- Tags devem ser validadas contra game-catalog.js. O código ordena IDs, remove duplicatas e impede duas tags do mesmo grupo (duas raridades ou duas afinidades) na mesma pilha.
- Equipamentos não empilháveis usam instance_id e instance_data próprios.

Campos recomendados para game_inventory:

| Campo | Tipo sugerido | Uso |
|---|---|---|
| id | bigint identity | Identificador interno da pilha |
| player_id | uuid | UUID original da conta |
| item_id | integer | ID do item-base |
| quantity | bigint | Quantidade daquela pilha |
| tag_ids | integer[] | Tags persistentes daquela pilha |
| instance_id | uuid nullable | Instância única para equipamento não empilhável |
| instance_data | jsonb nullable | Atributos, fortificação e encantamentos individuais |
| created_at | timestamptz | Criação |
| updated_at | timestamptz | Atualização |

Índices únicos sugeridos:
- Pilhas comuns: (player_id, item_id, tag_ids) WHERE instance_id IS NULL.
- Instâncias únicas: (player_id, instance_id) WHERE instance_id IS NOT NULL.

## Tabelas de progresso sugeridas

| Tabela | Campos essenciais |
|---|---|
| game_items | id, item_key, name, category, enabled, definition_version |
| game_tags | id, tag_key, name, tag_group |
| game_profiles | player_id, gold, lifetime_gold_earned |
| game_inventory | player_id, item_id, quantity, tag_ids, instance_id, instance_data |
| game_farms | player_id, slot_count |
| game_plots | player_id, slot_index, plant_item_id, seed_item_id, planted_at, finishes_at |
| game_unlocks | player_id, discovery_id, discovered_at |
| game_pity_counters | player_id, counter_key, failures |
| game_fishing_jobs | player_id, area_id, fish_item_id, bait_item_id, started_at, finishes_at |
| game_stations | player_id, station_id, level, built_at |
| game_crafting_jobs | player_id, recipe_id, input_snapshot, started_at, finishes_at, status |
| game_transactions | player_id, transaction_type, currency_delta, item_delta, reference_id, created_at |

## Tags V1

| ID | Chave | Grupo |
|---:|---|---|
| 1 | DOURADA | raridade |
| 2 | CRISTALIZADA | raridade |
| 3 | ESPECIAL | raridade |
| 4 | MISTICA | raridade |
| 5 | CELESTIAL | raridade |
| 6 | SOL | afinidade |
| 7 | LUA | afinidade |

No máximo uma tag de raridade e uma tag de afinidade temporal por item. Novos grupos poderão ser adicionados.

## Horário, sorteios e progressão

- Raridade é sorteada quando a coleta termina, nunca quando a atividade começa.
- Sol usa 12:00–12:59 e Lua usa 00:00–00:59.
- O fuso oficial ainda precisa ser escolhido antes da implementação no servidor. Não confiar no relógio ou fuso do navegador.
- A minhoca tem chance inicial de 1%, aumenta 1 ponto percentual após cada colheita sem sucesso e é uma descoberta permanente, nunca consumível.
- O contador de falhas da minhoca deve ser persistido.
- Probabilidades de raridade, drops especiais, pesca, mineração e valores das iscas ainda precisam de balanceamento.

## Segurança

- RLS em todas as tabelas individuais: cada jogador só lê seus próprios dados.
- Gold, inventário, tags, plantações, pesca, mineração, crafting, descobertas e horários devem ser validados no servidor por RPC/Edge Function/transação.
- Não confiar em preço, quantidade, hora, raridade, drop ou badge enviados pelo navegador.
- Enchanter e Arena consultam a badge Sacrificio no perfil original do clã; não duplicar essa badge no RPG.
- Nunca apagar plantações que excedam temporariamente a quantidade de slots enquanto perfil e conquistas ainda estiverem carregando.
- game.js prepara hydrateFromDatabase({ plots, inventory, discoveries, gold, slotCount, slotCapacityReady }). Enviar slotCapacityReady=false enquanto as conquistas ainda estão sendo calculadas.
- Quando a capacidade estiver confirmada, slots ocupados acima do limite aparecem como OVER; os registros permanecem no banco. O jogador pode colher uma planta que já estava naquele slot, mas não iniciar novo plantio ali.
- getInventoryRowsForDatabase(playerId) prepara as linhas de inventário com tag_ids incluído em cada registro.

## Estado desta versão

- Catálogo e estrutura de tags no GitHub.
- Interface e protótipo local no GitHub.
- Supabase ainda não foi alterado.
- Pesca, mineração, alquimia, drops raros, tags aleatórias e progresso persistente permanecem desativados até a integração com o banco e validações do servidor.
