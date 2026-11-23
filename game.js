(() => {
  "use strict";

  const CATALOG = window.SACRIFICIO_GAME_CATALOG;
  if (!CATALOG) {
    console.error("Catálogo do RPG não carregado.");
    return;
  }

  const state = {
    gold: 0,
    slotCount: 3,
    slotCapacityReady: false,
    plots: [null, null, null],
    inventory: [],
    discoveries: [],
    unlockedFishingAreaIds: [],
    selectedFishingAreaId: 210001,
    selectedFishId: null,
    busy: false,
    devMode: false,
    devRaid: null,
    devOriginalState: null
  };

  let loadVersion = 0;

  const elements = {
    playerId: document.getElementById("game-player-id"),
    gold: document.getElementById("game-gold-value"),
    plotCount: document.getElementById("game-plot-count"),
    plots: document.getElementById("game-plots"),
    inventory: document.getElementById("game-inventory"),
    inventoryCount: document.getElementById("game-inventory-count"),
    catalogCount: document.getElementById("game-catalog-count"),
    catalogList: document.getElementById("game-catalog-list"),
    catalogSearch: document.getElementById("game-catalog-search"),
    catalogCategory: document.getElementById("game-catalog-category"),
    fishing: document.getElementById("game-fishing-content"),
    mining: document.getElementById("game-mining-content"),
    alchemy: document.getElementById("game-alchemy-content"),
    progression: document.getElementById("game-progression-content"),
    saveStatus: document.getElementById("game-save-status")
  };
  if (Object.values(elements).some(element => !element)) return;

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function setStatus(message, isError = false) {
    elements.saveStatus.textContent = message || "";
    elements.saveStatus.classList.toggle("is-error", Boolean(isError));
    elements.saveStatus.classList.toggle("is-success", Boolean(message) && !isError);
  }

  function hasDiscovery(key) {
    return state.devMode || state.discoveries.includes(key);
  }

  function getFishingBadgeCount() {
    return state.devMode ? 6 : Math.max(0, Number(window.SACRIFICIO_FISHING_BADGE_COUNT || 0));
  }

  function effectiveDurationMs(hours) {
    return state.devMode ? 60 * 1000 : hours * 60 * 60 * 1000;
  }

  function setDevMode(enabled) {
    if (enabled && !window.SACRIFICIO_IS_OWNER) return;
    if (Boolean(enabled) === state.devMode) return;
    if (enabled) {
      state.devOriginalState = {
        gold: state.gold,
        slotCount: state.slotCount,
        slotCapacityReady: state.slotCapacityReady,
        plots: state.plots.map(plot => plot ? { ...plot } : null),
        inventory: state.inventory.map(stack => ({ ...stack, tag_ids: [...(stack.tag_ids || [])] })),
        discoveries: [...state.discoveries],
        unlockedFishingAreaIds: [...state.unlockedFishingAreaIds]
      };
      state.devMode = true;
      state.devRaid = null;
      state.gold = 999999;
      state.slotCount = 40;
      state.slotCapacityReady = true;
      state.discoveries = CATALOG.discoveries.map(item => item.key);
      state.unlockedFishingAreaIds = CATALOG.fishingAreas.map(area => area.id);
      document.body.classList.add("game-dev-mode");
      setStatus("MODO DEV ATIVO · alterações apenas nesta sessão; nada será enviado ao Supabase.");
    } else {
      state.devMode = false;
      state.devRaid = null;
      document.body.classList.remove("game-dev-mode");
      const original = state.devOriginalState;
      state.devOriginalState = null;
      if (original) {
        state.gold = original.gold;
        state.slotCount = original.slotCount;
        state.slotCapacityReady = original.slotCapacityReady;
        state.plots = original.plots;
        state.inventory = original.inventory;
        state.discoveries = original.discoveries;
        state.unlockedFishingAreaIds = original.unlockedFishingAreaIds;
      }
      setStatus("Modo Dev encerrado. Estado original restaurado.");
      loadGameState();
    }
    updateDevControls();
    renderAll();
  }

  function updateDevControls() {
    const toolbar = document.getElementById("game-dev-toolbar");
    const toggle = document.getElementById("game-dev-toggle");
    const status = document.getElementById("game-dev-status");
    if (!toolbar || !toggle || !status) return;
    toolbar.hidden = !window.SACRIFICIO_IS_OWNER;
    toggle.setAttribute("aria-pressed", state.devMode ? "true" : "false");
    toggle.textContent = state.devMode ? "Desativar modo Dev" : "Ativar modo Dev";
    status.textContent = state.devMode
      ? "Modo Dev ativo · progresso temporário · timers de 1 minuto"
      : "Modo normal · dados reais · 6 badges de categoria";
  }

  function getUnlockedFishingAreaIds() {
    if (state.devMode) return CATALOG.fishingAreas.map(area => area.id);
    const unlocked = [];
    if (hasDiscovery("WORM_FOUND")) unlocked.push(210001);
    if (hasDiscovery("FISHING_AREA_2")) unlocked.push(210002);
    if (hasDiscovery("FISHING_AREA_3")) unlocked.push(210003);
    if (hasDiscovery("FISHING_AREA_4")) unlocked.push(210004);
    return unlocked;
  }

  function formatRemaining(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
  }

  function showGamePanel(panelName) {
    const allowed = ["farm", "fishing", "mining", "alchemy", "inventory", "catalog", "progress"];
    if (!allowed.includes(panelName)) return;
    document.querySelectorAll("[data-game-tab]").forEach(button => {
      const active = button.dataset.gameTab === panelName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    allowed.forEach(name => {
      const panel = document.getElementById("game-panel-" + name);
      if (!panel) return;
      panel.hidden = name !== panelName;
      panel.classList.toggle("is-active", name === panelName);
    });
    const renderers = {
      farm: renderFarm, fishing: renderFishing, mining: renderMining,
      alchemy: renderAlchemy, inventory: renderInventory,
      catalog: renderCatalog, progress: renderProgression
    };
    renderers[panelName]();
  }

  function renderFarm() {
    elements.gold.textContent = String(state.gold);
    elements.playerId.textContent = window.SACRIFICIO_AUTH_USER_ID || "Aguardando autenticação";
    elements.plotCount.textContent = state.slotCount + " SLOTS ATIVOS · " + state.plots.length + " REGISTRADOS";
    elements.plots.replaceChildren();

    state.plots.forEach((plot, index) => {
      const beyondCapacity = index >= state.slotCount;
      const slotOver = beyondCapacity && state.slotCapacityReady;
      const capacityPending = beyondCapacity && !state.slotCapacityReady;
      const card = makeElement("article", "game-plot-card");
      const heading = makeElement("div", "game-plot-heading");
      const status = slotOver ? "OVER" : capacityPending ? "VERIFICANDO" : plot ? (Date.now() >= plot.finishesAt ? "PRONTA" : "CRESCENDO") : "VAZIO";
      heading.append(
        makeElement("strong", "", "Slot " + (index + 1)),
        makeElement("span", "game-plot-status", status)
      );
      card.appendChild(heading);

      if (!plot) {
        if (slotOver) {
          card.appendChild(makeElement("p", "game-plot-description", "Slot acima da capacidade. Nenhum dado será removido."));
        } else if (capacityPending) {
          card.appendChild(makeElement("p", "game-plot-description", "Aguardando confirmação das conquistas e dos slots."));
        } else {
          card.appendChild(makeElement("p", "game-plot-description", "Escolha uma cultura para plantar neste terreno."));
          const actions = makeElement("div", "game-seed-options");
          CATALOG.starterPlants.forEach(plant => {
            const button = makeElement("button", "game-seed-button");
            button.type = "button";
            button.dataset.action = "plant";
            button.dataset.plot = String(index);
            button.dataset.itemId = String(plant.id);
            button.disabled = state.busy || state.gold < plant.seedCost;
            button.append(
              makeElement("strong", "", plant.name),
              makeElement("span", "", (state.devMode ? "1 min" : plant.growthHours + "h") + " · " + plant.seedCost + " G · +" + plant.goldReward + " G")
            );
            actions.appendChild(button);
          });
          card.appendChild(actions);
        }
      } else {
        const plant = CATALOG.getItem(plot.itemId);
        const ready = Date.now() >= plot.finishesAt;
        card.append(
          makeElement("p", "game-plot-plant-name", plant ? plant.name : "Planta desconhecida"),
          makeElement("p", "game-plot-timer", ready ? "Colheita disponível" : "Tempo restante: " + formatRemaining(plot.finishesAt - Date.now()))
        );
        if (slotOver) card.appendChild(makeElement("p", "game-panel-description", "OVER: a planta foi preservada. Você ainda pode colher o que já estava plantado."));
        const button = makeElement("button", "game-action-button", state.busy ? "SALVANDO..." : ready ? "Colher · +" + plot.goldReward + " G" : "Aguardando crescimento");
        button.type = "button";
        button.dataset.action = "harvest";
        button.dataset.plot = String(index);
        button.disabled = state.busy || !ready;
        card.appendChild(button);
      }
      elements.plots.appendChild(card);
    });
  }

  function renderInventory() {
    elements.inventory.replaceChildren();
    elements.inventoryCount.textContent = state.inventory.length + " PILHAS";
    if (!state.inventory.length) {
      elements.inventory.appendChild(makeElement("p", "", "Seu inventário está vazio."));
      return;
    }

    state.inventory.forEach(stack => {
      const item = CATALOG.getItem(stack.item_id);
      const row = makeElement("div", "game-inventory-row");
      const tagLabels = CATALOG.tagNames(stack.tag_ids);
      row.append(
        makeElement("strong", "", item ? item.name : "Item " + stack.item_id),
        makeElement("b", "", "x" + stack.quantity),
        makeElement("span", "", "ID " + stack.item_id)
      );
      const tags = makeElement("div", "game-tag-list");
      if (!tagLabels.length) tags.appendChild(makeElement("span", "game-tag-chip", "NORMAL"));
      else tagLabels.forEach(tag => tags.appendChild(makeElement("span", "game-tag-chip", tag.toUpperCase())));
      row.appendChild(tags);
      elements.inventory.appendChild(row);
    });
  }

  function renderCatalog() {
    const query = (elements.catalogSearch.value || "").trim().toLocaleLowerCase("pt-BR");
    const category = elements.catalogCategory.value || "all";
    const context = {
      discoveryKeys: state.devMode ? CATALOG.discoveries.map(item => item.key) : state.discoveries,
      unlockedFishingAreaIds: getUnlockedFishingAreaIds(),
      ownedItemIds: state.inventory.map(stack => stack.item_id)
    };
    const visibleItems = CATALOG.items.filter(item => {
      if (!CATALOG.isVisibleToPlayer(item, context)) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!query) return true;
      return item.name.toLocaleLowerCase("pt-BR").includes(query) ||
        String(item.id).includes(query) || item.key.toLowerCase().includes(query);
    });

    elements.catalogCount.textContent = visibleItems.length + " ITENS VISÍVEIS";
    elements.catalogList.replaceChildren();
    if (!visibleItems.length) {
      elements.catalogList.appendChild(makeElement("p", "game-panel-description", "Nenhum item disponível nesta categoria ou busca."));
      return;
    }

    visibleItems.forEach(item => {
      const row = makeElement("div", "game-catalog-item");
      row.appendChild(makeElement("span", "game-catalog-id", item.id));
      const identity = makeElement("div", "game-catalog-name");
      identity.append(
        makeElement("strong", "", item.name),
        makeElement("small", "", item.source + (item.taggable ? " · aceita tags" : ""))
      );
      row.append(identity, makeElement("span", "game-catalog-status", item.taggable ? "VARIÁVEL" : "BASE"));
      elements.catalogList.appendChild(row);
    });
  }

  function renderFishing() {
    elements.fishing.replaceChildren();
    if (state.devMode) {
      const warning = makeElement("div", "game-dev-warning", "MODO DEV: raid de pesca simulada em 1 minuto. A simulação é local e não grava no banco.");
      elements.fishing.appendChild(warning);
    }
    if (!hasDiscovery("WORM_FOUND")) {
      const lock = makeElement("div", "game-future-card");
      lock.append(
        makeElement("small", "", "BLOQUEADO"),
        makeElement("strong", "", "Encontre uma minhoca na fazenda"),
        makeElement("p", "", "A primeira minhoca é uma descoberta permanente. Ela não é consumida e desbloqueia a pesca.")
      );
      elements.fishing.appendChild(lock);
    } else {
      elements.fishing.appendChild(makeElement("p", "game-panel-description", "Cada raid sorteia entre as cinco espécies do lago. A quantidade vem das badges de categoria; iscas afetam somente Luck e a coleta em 00:00 ou 12:00 aplica Luck 2x."));
    }

    const areaList = makeElement("div", "game-fishing-area-list");
    CATALOG.fishingAreas.forEach((area, index) => {
      const unlocked = index === 0 ? hasDiscovery("WORM_FOUND") : hasDiscovery("FISHING_AREA_" + (index + 1));
      const row = makeElement("div", "game-fishing-area");
      const copy = makeElement("div");
      copy.append(
        makeElement("strong", "", unlocked ? area.name : "Local " + (index + 1) + " · Bloqueado"),
        makeElement("p", "", unlocked ? "5 espécies disponíveis neste local." : "Novo local de pesca ainda não descoberto.")
      );
      const button = makeElement("button", "", unlocked ? (state.selectedFishingAreaId === area.id ? "LOCAL ATUAL" : "VER PEIXES") : "BLOQUEADO");
      button.type = "button";
      button.dataset.areaId = String(area.id);
      button.disabled = !unlocked;
      row.append(copy, button);
      areaList.appendChild(row);
    });
    elements.fishing.appendChild(areaList);

    const unlockedAreaIds = getUnlockedFishingAreaIds();
    if (unlockedAreaIds.length) {
      if (!unlockedAreaIds.includes(state.selectedFishingAreaId)) {
        state.selectedFishingAreaId = unlockedAreaIds[0];
        state.selectedFishId = null;
      }
      const selectedArea = CATALOG.fishingAreas.find(area => area.id === state.selectedFishingAreaId);
      const fishCard = makeElement("div", "game-future-card");
      fishCard.appendChild(makeElement("strong", "", selectedArea ? selectedArea.name + " · Espécies disponíveis" : "Peixes disponíveis"));
      const fishList = makeElement("div", "game-future-grid");
      (selectedArea ? selectedArea.fishIds : []).forEach(fishId => {
        const fish = CATALOG.getItem(fishId);
        if (!fish) return;
        const fishRow = makeElement("div", "game-future-card");
        fishRow.append(
          makeElement("strong", "", fish.name),
          makeElement("small", "", "ID " + fish.id + " · TAGS VARIÁVEIS")
        );
        fishRow.appendChild(makeElement("small", "", "Raridade: aguardando definição"));
        fishList.appendChild(fishRow);
      });
      fishCard.appendChild(fishList);
      elements.fishing.appendChild(fishCard);
    }

    const badgeCount = getFishingBadgeCount();
    const raidCard = makeElement("div", "game-fishing-raid");
    raidCard.append(
      makeElement("strong", "", "Expedição de pesca · " + (state.devMode ? "1 minuto (Dev)" : "8 horas")),
      makeElement("p", "", badgeCount + " badges de categoria × 8 horas = " + (badgeCount * 8) + " peixes por raid.")
    );
    if (state.devRaid) {
      const remaining = Math.max(0, state.devRaid.finishesAt - Date.now());
      raidCard.append(
        makeElement("span", "", "Local: " + state.devRaid.areaName),
        makeElement("strong", "game-fishing-raid-timer", remaining > 0 ? formatRemaining(remaining) : "RAID PRONTA PARA COLETAR")
      );
      if (remaining <= 0) {
        const collect = makeElement("button", "game-action-button", "Coletar recompensa de teste");
        collect.type = "button";
        collect.dataset.action = "dev-fishing-collect";
        raidCard.appendChild(collect);
      }
    } else if (state.devMode) {
      const start = makeElement("button", "game-action-button", "Iniciar raid de teste");
      start.type = "button";
      start.dataset.action = "dev-fishing-start";
      raidCard.appendChild(start);
    } else {
      raidCard.appendChild(makeElement("small", "", "A estrutura de pesca está sendo preparada. A coleta oficial será ativada após definir as probabilidades de raridade e concluir as funções seguras do banco."));
    }
    elements.fishing.appendChild(raidCard);

    const baitCard = makeElement("div", "game-future-card");
    baitCard.append(
      makeElement("strong", "", "Iscas · Luck"),
      makeElement("p", "", "A isca altera somente a Luck. Ela não aumenta a quantidade de peixes. Os multiplicadores individuais serão configurados no catálogo.")
    );
    elements.fishing.appendChild(baitCard);
  }

  function renderMining() {
    elements.mining.replaceChildren();
    const unlocked = hasDiscovery("OLD_PICKAXE_FOUND");
    const card = makeElement("div", "game-future-card");
    card.append(
      makeElement("small", "", unlocked ? "DESCOBERTO" : "BLOQUEADO"),
      makeElement("strong", "", unlocked ? "Mineração preparada para integração" : "Encontre a Picareta Velha durante a pesca"),
      makeElement("p", "", "O catálogo inclui pedra, carvão, cobre, ferro, prata, ouro, cristais, gemas, Orichalco, Adamantio, Mytril, Titânio, Cobalto e Paládio. Pavranium não pode ser minerado.")
    );
    elements.mining.appendChild(card);
    if (unlocked) {
      const mineralList = makeElement("div", "game-future-grid");
      CATALOG.minerals.filter(mineral => mineral.id !== 300019).forEach(mineral => {
        const mineralCard = makeElement("div", "game-future-card");
        mineralCard.append(
          makeElement("strong", "", mineral.name),
          makeElement("small", "", "ID " + mineral.id + " · TAGS VARIÁVEIS")
        );
        mineralList.appendChild(mineralCard);
      });
      elements.mining.appendChild(mineralList);
    }
    const seedCard = makeElement("div", "game-future-card");
    seedCard.append(
      makeElement("strong", "", "Drops especiais de sementes"),
      makeElement("p", "", "Flor de Geodo, Cogumelo-Lanterna e Raiz Ferrífera poderão aparecer como drops raros da mineração. Probabilidades ainda não definidas.")
    );
    elements.mining.appendChild(seedCard);
  }

  function renderAlchemy() {
    elements.alchemy.replaceChildren();
    const card = makeElement("div", "game-future-card");
    card.append(
      makeElement("small", "", hasDiscovery("ALCHEMY_SET_I") ? "DESCOBERTO" : "BLOQUEADO"),
      makeElement("strong", "", "Conjunto de Alquimia"),
      makeElement("p", "", "Peixes serão processados para extrair escamas e outros materiais. Plantas e minérios também poderão fornecer extratos e essências.")
    );
    elements.alchemy.appendChild(card);
    const seedCard = makeElement("div", "game-future-card");
    seedCard.append(
      makeElement("strong", "", "Três sementes exclusivas da alquimia"),
      makeElement("p", "", "Mandrágora, Flor Prismática e Orquídea Etérea terão receitas próprias. Ingredientes e quantidades ainda serão definidos.")
    );
    elements.alchemy.appendChild(seedCard);
    const pavranium = makeElement("div", "game-future-card");
    pavranium.append(
      makeElement("small", "", "RECEITA DE ENDGAME · ID 300019"),
      makeElement("strong", "", "Pavranium"),
      makeElement("p", "", "Produção exclusiva por alquimia e encantamento, exigindo os minérios e gemas do catálogo. Não aparece como drop da mineração.")
    );
    elements.alchemy.appendChild(pavranium);
  }

  function renderProgression() {
    elements.progression.replaceChildren();
    const list = makeElement("div", "game-progress-list");
    CATALOG.progression.forEach(step => {
      const completed = step.unlockKey === "FARM" || hasDiscovery(step.unlockKey);
      const row = makeElement("div", "game-progress-step");
      row.appendChild(makeElement("span", "game-progress-number", String(step.order).padStart(2, "0")));
      const text = makeElement("div");
      text.append(
        makeElement("strong", "", step.name),
        makeElement("p", "", step.description)
      );
      row.append(text, makeElement("span", "game-status-pill" + (completed ? " is-available" : ""), completed ? "DESBLOQUEADO" : "FUTURO"));
      list.appendChild(row);
    });
    elements.progression.appendChild(list);
    const badgeNote = makeElement("div", "game-future-card");
    badgeNote.append(
      makeElement("strong", "", "Badge Sacrificio"),
      makeElement("p", "", "Enchanter e Arena devem verificar a badge Sacrificio no perfil original do clã. Não será criada uma cópia independente dessa conquista no RPG.")
    );
    elements.progression.appendChild(badgeNote);
  }

  function hydrateFromDatabase(data = {}) {
    const parsedGold = Number(data.gold);
    state.gold = Number.isSafeInteger(parsedGold) && parsedGold >= 0 ? parsedGold : 0;
    const suppliedSlotCount = Number(data.slot_count ?? data.slotCount);
    state.slotCount = Number.isSafeInteger(suppliedSlotCount) && suppliedSlotCount >= 3 ? suppliedSlotCount : 3;
    state.slotCapacityReady = data.slot_capacity_ready === true || data.slotCapacityReady === true;

    const plotRows = Array.isArray(data.plots) ? data.plots : [];
    const maxSavedIndex = plotRows.reduce((max, row) => {
      const index = Number(row.slot_index ?? row.slotIndex);
      return Number.isInteger(index) && index >= 0 ? Math.max(max, index) : max;
    }, -1);
    state.plots = Array.from({ length: Math.max(3, state.slotCount, maxSavedIndex + 1) }, () => null);
    plotRows.forEach(row => {
      const index = Number(row.slot_index ?? row.slotIndex);
      if (!Number.isInteger(index) || index < 0 || index >= state.plots.length) return;
      const itemId = Number(row.plant_item_id ?? row.itemId);
      const plant = CATALOG.getItem(itemId);
      const rawFinish = row.finishes_at ?? row.finishesAt;
      const finishTime = typeof rawFinish === "number" ? rawFinish : Date.parse(rawFinish);
      if (!plant || !Number.isFinite(finishTime)) return;
      state.plots[index] = {
        itemId,
        seedItemId: Number(row.seed_item_id ?? row.seedItemId ?? plant.seedItemId ?? 0),
        finishesAt: finishTime,
        goldReward: Number(row.gold_reward ?? row.goldReward ?? plant.goldReward ?? 0)
      };
    });

    state.inventory = CATALOG.mergeInventoryStacks(Array.isArray(data.inventory) ? data.inventory : []);
    const discoveryById = new Map(CATALOG.discoveries.map(discovery => [discovery.id, discovery.key]));
    state.discoveries = (Array.isArray(data.discoveries) ? data.discoveries : []).map(entry => {
      const value = typeof entry === "object" && entry !== null ? (entry.discovery_id ?? entry.id ?? entry.key) : entry;
      return typeof value === "number" ? discoveryById.get(value) : String(value);
    }).filter(Boolean);
    state.unlockedFishingAreaIds = getUnlockedFishingAreaIds();
    if (!state.unlockedFishingAreaIds.includes(state.selectedFishingAreaId)) {
      state.selectedFishingAreaId = state.unlockedFishingAreaIds[0] || 210001;
      state.selectedFishId = null;
    }
    renderAll();
  }

  async function loadGameState() {
    const version = ++loadVersion;
    const playerId = window.SACRIFICIO_AUTH_USER_ID;
    const client = window.SACRIFICIO_SUPABASE;
    if (!playerId || !client) {
      state.gold = 0;
      state.plots = [null, null, null];
      state.inventory = [];
      state.discoveries = [];
      state.slotCount = 3;
      state.slotCapacityReady = false;
      renderAll();
      setStatus(playerId ? "Conexão com Supabase indisponível." : "Entre na conta do clã para carregar o jogo.", !playerId);
      return;
    }

    setStatus("Carregando seus dados do Supabase...");
    try {
      const { data, error } = await client.rpc("game_get_state");
      if (error) throw error;
      if (version !== loadVersion || playerId !== window.SACRIFICIO_AUTH_USER_ID) return;
      hydrateFromDatabase(data || {});
      setStatus("Progresso carregado do Supabase.", false);
    } catch (error) {
      if (version !== loadVersion) return;
      console.error("Erro ao carregar o RPG:", error);
      setStatus("Não foi possível carregar: " + (error.message || "erro desconhecido"), true);
    }
  }

  async function runServerAction(action, parameters) {
    const client = window.SACRIFICIO_SUPABASE;
    if (state.devMode) {
      setStatus("Bloqueado: o Modo Dev não pode enviar alterações ao Supabase.", true);
      return null;
    }
    if (!client || !window.SACRIFICIO_AUTH_USER_ID) {
      setStatus("Entre na sua conta antes de jogar.", true);
      return null;
    }
    if (state.busy) return null;

    state.busy = true;
    renderFarm();
    setStatus("Salvando no Supabase...");
    try {
      const { data, error } = await client.rpc(action, parameters);
      if (error) throw error;
      await loadGameState();
      if (action === "game_harvest_plot" && data && data.worm_found) {
        setStatus("Colheita salva! Você encontrou uma minhoca. A pesca foi desbloqueada permanentemente.");
      } else {
        setStatus(action === "game_harvest_plot" ? "Colheita salva no Supabase." : "Plantio salvo no Supabase.");
      }
      return data;
    } catch (error) {
      console.error("Erro na ação do RPG:", error);
      const known = {
        NOT_ENOUGH_GOLD: "Você não tem Gold suficiente.",
        PLOT_ALREADY_OCCUPIED: "Este terreno já está ocupado.",
        PLANT_NOT_READY: "Esta planta ainda está crescendo.",
        PLOT_EMPTY: "Não existe planta neste terreno.",
        PROFILE_NOT_ACTIVE: "Sua conta do clã não está ativa.",
        PLOT_SLOT_NOT_UNLOCKED: "Este slot ainda não foi desbloqueado."
      };
      const message = String(error.message || "");
      const knownKey = Object.keys(known).find(key => message.includes(key));
      setStatus(knownKey ? known[knownKey] : "Falha ao salvar: " + message, true);
      return null;
    } finally {
      state.busy = false;
      renderFarm();
    }
  }

  elements.plots.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const plotIndex = Number(button.dataset.plot);
    if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= state.plots.length) return;

    if (button.dataset.action === "plant" && !state.plots[plotIndex]) {
      const plant = CATALOG.getItem(Number(button.dataset.itemId));
      if (!plant || !plant.starter || plotIndex >= state.slotCount) return;
      if (state.devMode) {
        if (state.gold < plant.seedCost) return;
        state.gold -= plant.seedCost;
        const plantedAt = Date.now();
        state.plots[plotIndex] = {
          itemId: plant.id,
          seedItemId: plant.seedItemId || 0,
          finishesAt: plantedAt + effectiveDurationMs(plant.growthHours),
          goldReward: plant.goldReward
        };
        renderAll();
        setStatus("Plantio de teste iniciado. Timer de 1 minuto; nada foi salvo.");
        return;
      }
      await runServerAction("game_start_planting", {
        p_slot_index: plotIndex,
        p_plant_item_id: plant.id
      });
    }

    if (button.dataset.action === "harvest") {
      const plot = state.plots[plotIndex];
      if (!plot || Date.now() < plot.finishesAt) return;
      if (state.devMode) {
        state.gold += Number(plot.goldReward || 0);
        state.plots[plotIndex] = null;
        renderAll();
        setStatus("Colheita simulada no Modo Dev. Nada foi salvo.");
        return;
      }
      await runServerAction("game_harvest_plot", { p_slot_index: plotIndex });
    }
  });

  elements.fishing.addEventListener("click", event => {
    const devStart = event.target.closest("button[data-action='dev-fishing-start']");
    if (devStart && state.devMode) {
      const area = CATALOG.fishingAreas.find(item => item.id === state.selectedFishingAreaId);
      if (area) {
        state.devRaid = { areaId: area.id, areaName: area.name, startedAt: Date.now(), finishesAt: Date.now() + 60000 };
        renderFishing();
        setStatus("Raid de teste iniciada por 1 minuto. Nada foi salvo.");
      }
      return;
    }
    const devCollect = event.target.closest("button[data-action='dev-fishing-collect']");
    if (devCollect && state.devMode && state.devRaid && Date.now() >= state.devRaid.finishesAt) {
      const area = CATALOG.fishingAreas.find(item => item.id === state.devRaid.areaId);
      const amount = getFishingBadgeCount() * 8;
      const now = new Date();
      const hour = Number(new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo", hour: "2-digit", hourCycle: "h23"
      }).format(now));
      const tagId = hour === 12 ? 6 : hour === 0 ? 7 : null;
      const counts = new Map();
      for (let i = 0; i < amount; i++) {
        const fishId = area.fishIds[Math.floor(Math.random() * area.fishIds.length)];
        const tags = tagId && Math.random() < 0.25 ? [tagId] : [];
        const key = fishId + ":" + tags.join(",");
        const previous = counts.get(key) || 0;
        counts.set(key, previous + 1);
      }
      counts.forEach((quantity, key) => {
        const [itemIdText, tagsText] = key.split(":");
        const itemId = Number(itemIdText);
        const tags = tagsText ? tagsText.split(",").map(Number) : [];
        const existing = state.inventory.find(stack => stack.item_id === itemId &&
          JSON.stringify([...(stack.tag_ids || [])].sort()) === JSON.stringify([...tags].sort()));
        if (existing) existing.quantity += quantity;
        else state.inventory.push({ item_id: itemId, quantity, tag_ids: tags });
      });
      state.devRaid = null;
      renderAll();
      setStatus(amount + " peixes simulados adicionados ao inventário temporário. Nada foi salvo.");
      return;
    }
    const areaButton = event.target.closest("button[data-area-id]");
    if (areaButton && !areaButton.disabled) {
      const areaId = Number(areaButton.dataset.areaId);
      if (getUnlockedFishingAreaIds().includes(areaId)) {
        state.selectedFishingAreaId = areaId;
        state.selectedFishId = null;
        renderFishing();
      }
      return;
    }
  });

  const devToggle = document.getElementById("game-dev-toggle");
  if (devToggle) devToggle.addEventListener("click", () => setDevMode(!state.devMode));

  document.getElementById("game-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-game-tab]");
    if (button) showGamePanel(button.dataset.gameTab);
  });
  elements.catalogSearch.addEventListener("input", renderCatalog);
  elements.catalogCategory.addEventListener("change", renderCatalog);

  window.addEventListener("sacrificio:auth-updated", () => {
    if (!window.SACRIFICIO_IS_OWNER && state.devMode) setDevMode(false);
    updateDevControls();
    loadGameState();
  });

  function renderAll() {
    elements.playerId.textContent = window.SACRIFICIO_AUTH_USER_ID || "Aguardando autenticação";
    elements.gold.textContent = String(state.gold);
    renderFarm();
    renderFishing();
    renderMining();
    renderAlchemy();
    renderInventory();
    renderCatalog();
    renderProgression();
    updateDevControls();
  }

  window.SACRIFICIO_GAME = Object.freeze({
    catalog: CATALOG,
    hydrateFromDatabase,
    loadGameState,
    getInventoryRowsForDatabase: (playerId = window.SACRIFICIO_AUTH_USER_ID) =>
      state.inventory.map(stack => CATALOG.toDatabaseInventoryRow(playerId, stack)),
    getTemporaryState: () => ({
      gold: state.gold,
      slotCount: state.slotCount,
      slotCapacityReady: state.slotCapacityReady,
      plots: state.plots.map(plot => plot ? { ...plot } : null),
      inventory: state.inventory.map(stack => ({ ...stack, tag_ids: [...stack.tag_ids] })),
      discoveries: [...state.discoveries]
    }),
    openPanel: showGamePanel
  });

  window.setInterval(() => {
    if (document.getElementById("game-panel-farm")?.classList.contains("is-active")) renderFarm();
    if (document.getElementById("game-panel-fishing")?.classList.contains("is-active")) renderFishing();
  }, 1000);

  renderAll();
  if (window.SACRIFICIO_AUTH_USER_ID) loadGameState();
})();