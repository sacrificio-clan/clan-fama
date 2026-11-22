# Catálogo SACRIFICIO RPG — V1

Fonte de dados: game-catalog.js.

## Conteúdo cadastrado

- 13 plantas-base: quatro iniciais e nove especiais.
- 13 sementes: nove sementes especiais e quatro sementes iniciais.
- 20 peixes em quatro locais, cinco espécies por local.
- Três tipos de isca, com bônus pendentes de balanceamento.
- 19 itens de mineração, incluindo Orichalco, Adamantio, Mytril, Titânio, Cobalto, Paládio e Pavranium.
- Materiais processados, produtos de alquimia, ferramentas, equipamentos e estações.
- Sete tags V1: cinco de raridade e duas de afinidade temporal.
- Descobertas permanentes, receitas e progressão.

## Regra das variantes

Dourada, Cristalizada, Especial, Mística e Celestial não têm IDs de item separados. A identidade é o ID do item-base junto ao array de tags persistido no inventário.

Pavranium (300019) é um item-base especial, não minerável. A receita preparada exige os minérios e gemas cadastrados (IDs 300003–300018) e usa Alquimia + Enchanter. Quantidades e condições finais ainda precisam de balanceamento.

Apenas os quatro cultivos iniciais e suas sementes iniciais são visíveis no começo. Peixes de locais bloqueados e recursos de sistemas futuros permanecem ocultos na interface do jogador, embora estejam definidos no catálogo.
