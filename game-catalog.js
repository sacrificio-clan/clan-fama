(() => {
  "use strict";

  // Catálogo central V1. IDs publicados nunca devem ser reutilizados.
  const TAGS = [
    { id: 1, key: "DOURADA", name: "Dourada", group: "rarity" },
    { id: 2, key: "CRISTALIZADA", name: "Cristalizada", group: "rarity" },
    { id: 3, key: "ESPECIAL", name: "Especial", group: "rarity" },
    { id: 4, key: "MISTICA", name: "Mística", group: "rarity" },
    { id: 5, key: "CELESTIAL", name: "Celestial", group: "rarity" },
    { id: 6, key: "SOL", name: "Sol", group: "affinity" },
    { id: 7, key: "LUA", name: "Lua", group: "affinity" }
  ];
  const tagById = new Map(TAGS.map(tag => [tag.id, tag]));
  const TAG_RULES = Object.freeze({
    rollMoment: "collection_completion",
    rarityTagIds: [1, 2, 3, 4, 5],
    affinityTagIds: [6, 7],
    affinityWindows: [
      { tagId: 6, start: "12:00", end: "12:59" },
      { tagId: 7, start: "00:00", end: "00:59" }
    ],
    timeZone: null,
    timeZoneNote: "Definir o fuso oficial do jogo no servidor antes de ativar tags de horário."
  });

  const items = [];
  function add(id, key, name, category, source, options = {}) {
    items.push({
      id, key, name, category, source,
      stackable: options.stackable !== false,
      taggable: Boolean(options.taggable),
      visibleAtStart: Boolean(options.visibleAtStart),
      unlockKey: options.unlockKey || null,
      areaId: options.areaId || null,
      note: options.note || "",
      ...options
    });
  }

  // Plantas-base: variantes são tags, nunca IDs diferentes.
  add(100001, "farm.wheat", "Trigo", "plant", "Fazenda", { taggable: true, visibleAtStart: true, growthHours: 6, seedItemId: 101010, seedCost: 0, goldReward: 1, starter: true });
  add(100002, "farm.carrot", "Cenoura", "plant", "Fazenda", { taggable: true, visibleAtStart: true, growthHours: 12, seedItemId: 101011, seedCost: 1, goldReward: 3, starter: true });
  add(100003, "farm.pumpkin", "Abóbora", "plant", "Fazenda", { taggable: true, visibleAtStart: true, growthHours: 18, seedItemId: 101012, seedCost: 4, goldReward: 10, starter: true });
  add(100004, "farm.flower", "Flor", "plant", "Fazenda", { taggable: true, visibleAtStart: true, growthHours: 24, seedItemId: 101013, seedCost: 10, goldReward: 20, starter: true });

  // Nove plantas especiais: três descobertas pela mineração, três pela pesca e três pela alquimia.
  const specialPlants = [
    [100101, "plant.geode_flower", "Flor de Geodo", 101001, "mining", 24, "Cristais e alquimia"],
    [100102, "plant.lantern_mushroom", "Cogumelo-Lanterna", 101002, "mining", 18, "Esporos e extratos luminosos"],
    [100103, "plant.ironroot", "Raiz Ferrífera", 101003, "mining", 30, "Alquimia e fortificação"],
    [100104, "plant.lantern_algae", "Alga-Lanterna", 101004, "fishing", 18, "Essências aquáticas"],
    [100105, "plant.tidal_lotus", "Lótus das Marés", 101005, "fishing", 24, "Misturas ligadas à água e à Lua"],
    [100106, "plant.coral_flower", "Flor de Coral", 101006, "fishing", 30, "Materiais especiais"],
    [100107, "plant.mandrake", "Mandrágora", 101007, "alchemy", 24, "Raízes para poções"],
    [100108, "plant.prismatic_flower", "Flor Prismática", 101008, "alchemy", 30, "Concentração de propriedades mágicas"],
    [100109, "plant.ethereal_orchid", "Orquídea Etérea", 101009, "alchemy", 36, "Essências e encantamentos"]
  ];
  for (const [id, key, name, seedItemId, source, growthHours, note] of specialPlants) {
    const unlockKey = source === "mining" ? "OLD_PICKAXE_FOUND" : source === "fishing" ? "WORM_FOUND" : "ALCHEMY_SET_I";
    add(id, key, name, "plant", source === "mining" ? "Drop especial da mineração" : source === "fishing" ? "Drop especial da pesca" : "Receita de alquimia", {
      taggable: true, visibleAtStart: false, unlockKey, growthHours, seedItemId, seedCost: null, goldReward: null, note
    });
  }

  const seeds = [
    [101001, "seed.geode", "Semente de Geodo", "Mineração"],
    [101002, "seed.luminous_spore", "Esporo Luminescente", "Mineração"],
    [101003, "seed.ironroot", "Semente de Raiz Ferrífera", "Mineração"],
    [101004, "seed.lantern_algae", "Semente de Alga-Lanterna", "Pesca"],
    [101005, "seed.tidal_lotus", "Semente de Lótus das Marés", "Pesca"],
    [101006, "seed.live_coral", "Semente de Coral Vivo", "Pesca"],
    [101007, "seed.mandrake", "Semente de Mandrágora", "Alquimia"],
    [101008, "seed.prismatic", "Semente Prismática", "Alquimia"],
    [101009, "seed.ethereal", "Semente Etérea", "Alquimia"],
    [101010, "seed.wheat", "Semente de Trigo", "Loja inicial"],
    [101011, "seed.carrot", "Semente de Cenoura", "Loja inicial"],
    [101012, "seed.pumpkin", "Semente de Abóbora", "Loja inicial"],
    [101013, "seed.flower", "Semente de Flor", "Loja inicial"]
  ];
  for (const [id, key, name, source] of seeds) {
    add(id, key, name, "seed", source, {
      visibleAtStart: source === "Loja inicial",
      note: source === "Loja inicial" ? "Semente inicial da fazenda." : "Semente especial; método preparado, mas ainda não ativo."
    });
  }

  // Pesca: 20 espécies, cinco por local.
  const fish = [
    ["Tilápia", 210001], ["Carpa", 210001], ["Bagre", 210001], ["Truta", 210001], ["Peixe-lua", 210001],
    ["Salmão", 210002], ["Enguia", 210002], ["Piranha", 210002], ["Esturjão", 210002], ["Peixe-cascudo", 210002],
    ["Peixe-cego", 210003], ["Axolote", 210003], ["Peixe Translúcido", 210003], ["Enguia de Caverna", 210003], ["Peixe-Fóssil", 210003],
    ["Atum", 210004], ["Peixe-espada", 210004], ["Tubarão", 210004], ["Peixe-Abissal", 210004], ["Peixe Ancestral", 210004]
  ];
  fish.forEach(([name, areaId], index) => {
    const id = 200001 + index;
    add(id, "fish.species_" + String(index + 1).padStart(2, "0"), name, "fish", "Pesca", {
      taggable: true, areaId, visibleAtStart: false, unlockKey: "FISHING_AREA_" + (areaId - 210000),
      note: "O jogador escolhe a espécie antes da pescaria; tags são definidas quando a captura termina."
    });
  });

  const FISHING_AREAS = [
    { id: 210001, key: "LAKE", name: "Lago Sereno", fishIds: [200001, 200002, 200003, 200004, 200005], unlockKey: "WORM_FOUND" },
    { id: 210002, key: "RIVER", name: "Rio Antigo", fishIds: [200006, 200007, 200008, 200009, 200010], unlockKey: "FISHING_AREA_2" },
    { id: 210003, key: "CAVE", name: "Caverna Submersa", fishIds: [200011, 200012, 200013, 200014, 200015], unlockKey: "FISHING_AREA_3" },
    { id: 210004, key: "OCEAN", name: "Oceano Profundo", fishIds: [200016, 200017, 200018, 200019, 200020], unlockKey: "FISHING_AREA_4" }
  ];

  const BAITS = [
    { id: 220001, key: "BAIT_BASIC", name: "Isca Simples", luckBonus: null, timeReductionPercent: null, valuesPending: true },
    { id: 220002, key: "BAIT_REINFORCED", name: "Isca Reforçada", luckBonus: null, timeReductionPercent: null, valuesPending: true },
    { id: 220003, key: "BAIT_MYSTIC", name: "Isca Mística", luckBonus: null, timeReductionPercent: null, valuesPending: true }
  ];
  BAITS.forEach(bait => add(bait.id, "bait." + bait.key.toLowerCase(), bait.name, "bait", "Pesca", {
    visibleAtStart: false, unlockKey: "WORM_FOUND", note: "Aumenta Luck e reduz o tempo de pesca; valores aguardam balanceamento."
  }));

  const FISHING_RULES = Object.freeze({
    targetSelection: true,
    baitOptional: true,
    rarityRollMoment: "fishing_completion",
    baseFishingTimeMinutes: null,
    timeBalancePending: true,
    specialSeedDropIds: [101004, 101005, 101006]
  });

  const minerals = [
    ["Pedra", "ore.stone"], ["Carvão", "ore.coal"], ["Cobre", "ore.copper"], ["Ferro", "ore.iron"],
    ["Prata", "ore.silver"], ["Ouro", "ore.gold"], ["Cristal", "ore.crystal"], ["Quartzo", "ore.quartz"],
    ["Rubi", "ore.ruby"], ["Safira", "ore.sapphire"], ["Ametista", "ore.amethyst"], ["Diamante", "ore.diamond"],
    ["Orichalco", "ore.orichalco"], ["Adamantio", "ore.adamantio"], ["Mytril", "ore.mytril"],
    ["Titânio", "ore.titanium"], ["Cobalto", "ore.cobalt"], ["Paládio", "ore.palladium"], ["Pavranium", "ore.pavranium"]
  ];
  minerals.forEach(([name, key], index) => {
    const id = 300001 + index;
    const isPavranium = id === 300019;
    add(id, key, name, "ore", isPavranium ? "Alquimia + encantamento" : "Mineração", {
      taggable: !isPavranium,
      visibleAtStart: false,
      unlockKey: isPavranium ? "ENCHANTER_BUILT" : "OLD_PICKAXE_FOUND",
      minable: !isPavranium,
      note: isPavranium ? "Não pode ser minerado. Produção exclusiva por alquimia e encantamento, usando todos os minérios e gemas cadastrados." : "Minério ou gema; pode receber tags quando coletado."
    });
  });

  const processedMaterials = [
    [400001, "material.refined_glass", "Vidro Refinado", "Processamento"],
    [400002, "material.copper_ingot", "Lingote de Cobre", "Forja"],
    [400003, "material.iron_ingot", "Lingote de Ferro", "Forja"],
    [400004, "material.silver_ingot", "Lingote de Prata", "Forja"],
    [400005, "material.gold_ingot", "Lingote de Ouro", "Forja"],
    [400006, "material.steel", "Aço", "Forja"],
    [400007, "material.refined_crystal", "Cristal Refinado", "Solidificador"],
    [400008, "material.metal_parts", "Peças Metálicas", "Forja"],
    [400009, "material.nails", "Pregos", "Forja"],
    [400010, "material.metal_chain", "Corrente Metálica", "Forja"],
    [400011, "material.reinforced_alloy", "Liga Reforçada", "Forja"],
    [400012, "material.solidified_crystal", "Cristal Solidificado", "Solidificador"],
    [400013, "material.raw_glass", "Vidro Bruto", "Coleta com Pá", "SHOVEL_AND_GLASS"],
    [400051, "material.common_scale", "Escama Comum", "Extração alquímica"],
    [400052, "material.rare_scale", "Escama Rara", "Extração alquímica"],
    [400053, "material.abyssal_scale", "Escama Abissal", "Extração alquímica"],
    [400054, "material.fish_bone", "Osso de Peixe", "Extração alquímica"],
    [400055, "material.fish_oil", "Óleo de Peixe", "Extração alquímica"],
    [400056, "material.pearl", "Pérola", "Extração alquímica"],
    [400057, "material.rare_pearl", "Pérola Rara", "Extração alquímica"],
    [400101, "material.plant_fiber", "Fibra Vegetal", "Extração alquímica"],
    [400102, "material.medicinal_root", "Raiz Medicinal", "Extração alquímica"],
    [400103, "material.special_pollen", "Pólen Especial", "Extração alquímica"],
    [400104, "material.luminous_spores", "Esporos Luminosos", "Extração alquímica"]
  ];
  processedMaterials.forEach(([id, key, name, source, explicitUnlockKey]) => add(id, key, name, "material", source, {
    visibleAtStart: false,
    unlockKey: explicitUnlockKey || (source === "Extração alquímica" ? "ALCHEMY_SET_I" : "ANCIENT_FURNACE_FOUND"),
    taggable: true,
    note: source === "Coleta com Pá" ? "Material bruto coletado após fabricar a pá." : "Material processado; regras de herança de tags serão definidas por receita."
  }));

  const alchemyItems = [
    [500001, "alchemy.plant_extract", "Extrato Vegetal"],
    [500002, "alchemy.fish_essence", "Essência de Peixe"],
    [500003, "alchemy.mineral_essence", "Essência Mineral"],
    [500004, "alchemy.healing_potion", "Poção de Cura"],
    [500005, "alchemy.mining_potion", "Poção de Mineração"],
    [500006, "alchemy.fishing_potion", "Poção de Pesca"],
    [500007, "alchemy.growth_essence", "Essência de Crescimento"],
    [500008, "alchemy.enchantment_catalyst", "Catalisador de Encantamento"]
  ];
  alchemyItems.forEach(([id, key, name]) => add(id, key, name, "alchemy", "Alquimia", {
    visibleAtStart: false, unlockKey: "ALCHEMY_SET_I", note: "Produto de receita; regras de saída e herança de tags serão configuradas por receita."
  }));

  const tools = [
    [600001, "tool.old_pickaxe", "Picareta Velha", "Pesca"],
    [600002, "tool.basic_pickaxe", "Picareta Básica", "Forja"],
    [600003, "tool.basic_axe", "Machado Básico", "Forja"],
    [600004, "tool.basic_shovel", "Pá Básica", "Forja"]
  ];
  tools.forEach(([id, key, name, source]) => add(id, key, name, "tool", source, {
    stackable: false, visibleAtStart: false,
    unlockKey: source === "Pesca" ? "WORM_FOUND" : "ANCIENT_FURNACE_FOUND",
    note: "Equipamento individual; não acumula em pilhas comuns."
  }));

  const equipment = [
    [600101, "equipment.basic_helmet", "Capacete Básico"],
    [600102, "equipment.basic_chest", "Peitoral Básico"],
    [600103, "equipment.basic_legs", "Calças Básicas"],
    [600104, "equipment.basic_boots", "Botas Básicas"],
    [600201, "equipment.basic_weapon", "Arma Básica"],
    [600202, "equipment.basic_sword", "Espada Básica"]
  ];
  equipment.forEach(([id, key, name]) => add(id, key, name, "equipment", "Craft", {
    stackable: false, visibleAtStart: false, unlockKey: "ANCIENT_FURNACE_FOUND",
    note: "Equipamento individual com atributos, fortificação e encantamentos próprios."
  }));

  const STATIONS = [
    { id: 700001, key: "ANCIENT_FURNACE", name: "Fornalha Antiga", buildable: false, unlockKey: "ANCIENT_FURNACE_FOUND" },
    { id: 700002, key: "ANVIL", name: "Bigorna", buildable: true, unlockKey: "ANCIENT_FURNACE_FOUND" },
    { id: 700003, key: "ALCHEMY_SET_I", name: "Conjunto de Alquimia I", buildable: true, unlockKey: "SHOVEL_AND_GLASS" },
    { id: 700004, key: "ALCHEMY_SET_II", name: "Conjunto de Alquimia II", buildable: true, unlockKey: "ALCHEMY_SET_I" },
    { id: 700005, key: "SOLIDIFIER", name: "Solidificador", buildable: true, unlockKey: "ALCHEMY_SET_II" },
    { id: 700006, key: "ENCHANTER", name: "Enchanter", buildable: true, unlockKey: "SACRIFICIO_BADGE" },
    { id: 700007, key: "ARENA", name: "Arena", buildable: true, unlockKey: "SACRIFICIO_BADGE" }
  ];

  const DISCOVERIES = [
    { id: 800001, key: "WORM_FOUND", name: "Minhoca encontrada", permanent: true, unlocks: "Pesca" },
    { id: 800002, key: "OLD_PICKAXE_FOUND", name: "Picareta Velha encontrada", permanent: true, unlocks: "Mineração" },
    { id: 800003, key: "ANCIENT_FURNACE_FOUND", name: "Fornalha Antiga encontrada", permanent: true, unlocks: "Forja" },
    { id: 800004, key: "ALCHEMY_SET_I", name: "Primeiro conjunto de alquimia", permanent: true, unlocks: "Alquimia" },
    { id: 800005, key: "ALCHEMY_SET_II", name: "Conjunto de alquimia aprimorado", permanent: true, unlocks: "Alquimia avançada" },
    { id: 800006, key: "SOLIDIFIER_BUILT", name: "Solidificador construído", permanent: true, unlocks: "Solidificação" },
    { id: 800007, key: "ENCHANTER_BUILT", name: "Enchanter construído", permanent: true, unlocks: "Encantamentos" },
    { id: 800008, key: "ARENA_BUILT", name: "Arena construída", permanent: true, unlocks: "PvP" },
    { id: 800009, key: "FISHING_AREA_2", name: "Rio Antigo descoberto", permanent: true, unlocks: "Segundo local de pesca" },
    { id: 800010, key: "FISHING_AREA_3", name: "Caverna Submersa descoberta", permanent: true, unlocks: "Terceiro local de pesca" },
    { id: 800011, key: "FISHING_AREA_4", name: "Oceano Profundo descoberto", permanent: true, unlocks: "Quarto local de pesca" },
    { id: 800012, key: "SHOVEL_AND_GLASS", name: "Pá e primeiro vidro coletado", permanent: true, unlocks: "Conjunto de alquimia I" }
  ];

  const MINING_SEED_DROPS = Object.freeze({
    seedItemIds: [101001, 101002, 101003],
    source: "mining_special_drop",
    chance: null,
    chanceBalancePending: true
  });
  const FISHING_SEED_DROPS = Object.freeze({
    seedItemIds: [101004, 101005, 101006],
    source: "fishing_special_drop",
    chance: null,
    chanceBalancePending: true
  });

  const WORM_PITY = Object.freeze({
    discoveryId: 800001,
    baseChancePercent: 1,
    increasePerFailedHarvestPercent: 1,
    maximumChancePercent: 100,
    incrementAfterFailure: true,
    resetFailuresOnSuccess: true,
    consumable: false,
    storedAsPermanentDiscovery: true
  });

  const RECIPES = [
    { id: 900001, key: "SMELT_COPPER", name: "Fundir Cobre", status: "planned", stationId: 700001 },
    { id: 900002, key: "SMELT_IRON", name: "Fundir Ferro", status: "planned", stationId: 700001 },
    { id: 900003, key: "SMELT_SILVER", name: "Fundir Prata", status: "planned", stationId: 700001 },
    { id: 900004, key: "SMELT_GOLD", name: "Fundir Ouro", status: "planned", stationId: 700001 },
    { id: 900005, key: "CRAFT_ANVIL", name: "Fabricar Bigorna", status: "planned", stationId: 700001 },
    { id: 900006, key: "CRAFT_AXE", name: "Fabricar Machado", status: "planned", stationId: 700002 },
    { id: 900007, key: "CRAFT_SHOVEL", name: "Fabricar Pá", status: "planned", stationId: 700002 },
    { id: 900008, key: "CRAFT_ALCHEMY_I", name: "Criar Conjunto de Alquimia I", status: "planned", stationId: 700002 },
    { id: 900009, key: "UPGRADE_ALCHEMY_II", name: "Aprimorar Conjunto de Alquimia", status: "planned", stationId: 700003 },
    { id: 900010, key: "CRAFT_SOLIDIFIER", name: "Construir Solidificador", status: "planned", stationId: 700004 },
    { id: 900011, key: "MAKE_ENCHANTMENT_CATALYST", name: "Produzir Catalisador de Encantamento", status: "planned", stationId: 700004 },
    { id: 900012, key: "CRAFT_ENCHANTER", name: "Construir Enchanter", status: "planned", requiresBadgeKey: "SACRIFICIO", materialsPending: true },
    { id: 900013, key: "CRAFT_ARENA", name: "Construir Arena", status: "planned", requiresBadgeKey: "SACRIFICIO", materialsPending: true },
    { id: 900101, key: "MAKE_MANDRAKE_SEED", name: "Produzir Semente de Mandrágora", status: "draft", outputItemId: 101007, stationId: 700003, ingredientsPending: true },
    { id: 900102, key: "MAKE_PRISMATIC_SEED", name: "Produzir Semente Prismática", status: "draft", outputItemId: 101008, stationId: 700004, ingredientsPending: true },
    { id: 900103, key: "MAKE_ETHEREAL_SEED", name: "Produzir Semente Etérea", status: "draft", outputItemId: 101009, stationId: 700004, ingredientsPending: true },
    {
      id: 900120, key: "MAKE_PAVRANIUM", name: "Produzir Pavranium", status: "draft",
      outputItemId: 300019, stationIds: [700004, 700006],
      inputItemIds: [...Array.from({ length: 16 }, (_, index) => 300003 + index), 500008],
      requiresBadgeKey: "SACRIFICIO", ingredientsPending: true,
      note: "Exige os minérios e gemas cadastrados, combinados por alquimia e encantamento. Não pode ser minerado."
    }
  ];

  const PROGRESSION = [
    { order: 1, name: "Fazenda", description: "Plantar e colher. A minhoca pode aparecer em uma colheita.", unlockKey: "FARM" },
    { order: 2, name: "Pesca", description: "Encontrar a minhoca desbloqueia a pesca permanentemente; ela não é consumida.", unlockKey: "WORM_FOUND" },
    { order: 3, name: "Mineração", description: "Durante a pesca, encontrar a Picareta Velha para abrir a mina.", unlockKey: "OLD_PICKAXE_FOUND" },
    { order: 4, name: "Fornalha e forja", description: "Encontrar a Fornalha Antiga; fundir minérios e fabricar a primeira bigorna e o machado.", unlockKey: "ANCIENT_FURNACE_FOUND" },
    { order: 5, name: "Vidro", description: "Fabricar a pá e utilizá-la para coletar vidro.", unlockKey: "SHOVEL_AND_GLASS" },
    { order: 6, name: "Alquimia", description: "Criar o primeiro conjunto de alquimia e depois aprimorá-lo.", unlockKey: "ALCHEMY_SET_I" },
    { order: 7, name: "Solidificador", description: "Construir a estação após aprimorar o conjunto de alquimia.", unlockKey: "SOLIDIFIER_BUILT" },
    { order: 8, name: "Enchanter e Arena", description: "Exigem a badge Sacrificio original do perfil do clã; o Enchanter usa catalisador feito na alquimia.", unlockKey: "SACRIFICIO_BADGE", externalBadge: true }
  ];

  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error("ID de item duplicado: " + item.id);
    ids.add(item.id);
  }
  const itemById = new Map(items.map(item => [item.id, item]));
  const tagGroups = new Map([["rarity", new Set([1, 2, 3, 4, 5])], ["affinity", new Set([6, 7])]]);

  function normalizeTagIds(tagIds = []) {
    if (!Array.isArray(tagIds)) throw new TypeError("tag_ids deve ser um array.");
    const normalized = [...new Set(tagIds.map(Number))].sort((a, b) => a - b);
    const seenGroups = new Set();
    for (const id of normalized) {
      const tag = tagById.get(id);
      if (!tag) throw new Error("Tag desconhecida: " + id);
      if (seenGroups.has(tag.group)) throw new Error("Uma pilha não pode ter duas tags do grupo " + tag.group + ".");
      seenGroups.add(tag.group);
    }
    return normalized;
  }

  function stackKey(itemId, tagIds = [], instanceId = null) {
    const id = Number(itemId);
    if (!itemById.has(id)) throw new Error("Item inexistente no catálogo: " + id);
    const tags = normalizeTagIds(tagIds);
    return String(id) + "|" + tags.join(",") + "|" + (instanceId || "STACK");
  }

  function makeInventoryStack(itemId, quantity = 1, tagIds = [], instanceId = null) {
    const item = itemById.get(Number(itemId));
    if (!item) throw new Error("Item inexistente no catálogo: " + itemId);
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Quantidade inválida.");
    const tags = normalizeTagIds(tagIds);
    if (tags.length && !item.taggable) throw new Error(item.name + " não aceita tags.");
    if (!item.stackable && !instanceId) throw new Error(item.name + " exige instance_id próprio.");
    return {
      item_id: item.id,
      quantity: amount,
      tag_ids: tags,
      instance_id: instanceId || null,
      stack_key: stackKey(item.id, tags, instanceId)
    };
  }

  // Não fragmenta nem mistura variantes: só soma a mesma combinação exata de ID + tags + instância.
  function mergeInventoryStacks(rows = []) {
    const merged = new Map();
    for (const row of rows) {
      const stack = makeInventoryStack(row.item_id, row.quantity, row.tag_ids || [], row.instance_id || null);
      const existing = merged.get(stack.stack_key);
      if (existing) existing.quantity += stack.quantity;
      else merged.set(stack.stack_key, stack);
    }
    return [...merged.values()];
  }

  function addInventoryStack(rows, itemId, quantity = 1, tagIds = [], instanceId = null) {
    return mergeInventoryStacks([
      ...(Array.isArray(rows) ? rows : []),
      makeInventoryStack(itemId, quantity, tagIds, instanceId)
    ]);
  }

  // Payload de gravação futuro. tag_ids é dado persistente obrigatório, não apenas decoração da interface.
  function toDatabaseInventoryRow(playerId, stack) {
    if (!playerId) throw new Error("player_id (UUID original da conta) é obrigatório.");
    const normalized = makeInventoryStack(stack.item_id, stack.quantity, stack.tag_ids || [], stack.instance_id || null);
    return {
      player_id: String(playerId),
      item_id: normalized.item_id,
      quantity: normalized.quantity,
      tag_ids: normalized.tag_ids,
      instance_id: normalized.instance_id
    };
  }

  function tagNames(tagIds = []) {
    return normalizeTagIds(tagIds).map(id => tagById.get(id).name);
  }

  function isVisibleToPlayer(item, context = {}) {
    if (item.visibleAtStart) return true;
    if ((context.ownedItemIds || []).includes(item.id)) return true;
    const discoveries = new Set(context.discoveryKeys || []);
    if (item.areaId) return (context.unlockedFishingAreaIds || []).includes(item.areaId);
    if (item.unlockKey && discoveries.has(item.unlockKey)) return true;
    if (item.unlockKey === "MINING" && discoveries.has("OLD_PICKAXE_FOUND")) return true;
    if (item.unlockKey === "ALCHEMY" && discoveries.has("ALCHEMY_SET_I")) return true;
    if (item.unlockKey === "FORGE" && discoveries.has("ANCIENT_FURNACE_FOUND")) return true;
    return false;
  }

  window.SACRIFICIO_GAME_CATALOG = {
    version: 1,
    items,
    tags: TAGS,
    fishingAreas: FISHING_AREAS,
    fishingRules: FISHING_RULES,
    tagRules: TAG_RULES,
    baits: BAITS,
    miningSeedDrops: MINING_SEED_DROPS,
    fishingSeedDrops: FISHING_SEED_DROPS,
    wormPity: WORM_PITY,
    stations: STATIONS,
    discoveries: DISCOVERIES,
    recipes: RECIPES,
    progression: PROGRESSION,
    minerals: items.filter(item => item.category === "ore"),
    starterPlants: items.filter(item => item.category === "plant" && item.starter),
    getItem: id => itemById.get(Number(id)) || null,
    getTag: id => tagById.get(Number(id)) || null,
    normalizeTagIds,
    tagNames,
    stackKey,
    makeInventoryStack,
    mergeInventoryStacks,
    addInventoryStack,
    toDatabaseInventoryRow,
    isVisibleToPlayer
  };
})();
