(() => {
  "use strict";

  const CATALOG = window.SACRIFICIO_GAME_CATALOG;
  if (!CATALOG) {
    console.error("Catálogo do RPG não carregado.");
    return;
  }

  // Estado temporário de interface. O estado real virá do Supabase após criarmos as tabelas.
  const state = {
    gold: 0,
    plots: [null, null, null],
    inventory: [],
    discoveries: [],
    unlockedFishingAreaIds: [],
    selectedFishingAreaId: 210001,
    selectedFishId: null
  };

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
    progression: document.getElementById("game-progression-content")
  };
  if (Object.values(elements).some(element => !element)) return;

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function hasDiscovery(key) {
    return state.discoveries.includes(key);
  }

  function getUnlockedFishingAreaIds() {
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
      const active = name === panelName;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    const renderers = {
      farm: renderFarm,
      fishing: renderFishing,
      mining: renderMining,
      alchemy: renderAlchemy,
      inventory: renderInventory,
      catalog: renderCatalog,
      progress: renderProgression
    };
    renderers[panelName]();
  }

  function renderFarm() {
    elements.gold.textContent = String(state.gold);
    elements.playerId.textContent = window.SACRIFICIO_AUTH_USER_ID || "Aguardando autenticação";
    elements.plotCount.textContent = state.plots.length + " / 3 SLOTS";
    elements.plots.replaceChildren();

    state.plots.forEach((plot, index) => {
      const card = makeElement("article", "game-plot-card");
      const heading = makeElement("div", "game-plot-heading");
      heading.append(
        makeElement("strong", "", "Slot " + (index + 1)),
        makeElement("span", "game-plot-status", plot ? (Date.now() >= plot.finishesAt ? "PRONTA" : "CRESCENDO") : "VAZIO")
      );
      card.appendChild(heading);

      if (!plot) {
        card.appendChild(makeElement("p", "game-plot-description", "Escolha uma cultura para plantar neste terreno."));
        const actions = makeElement("div", "game-seed-options");
        CATALOG.starterPlants.forEach(plant => {
          const button = makeElement("button", "game-seed-button");
          button.type = "button";
          button.dataset.action = "plant";
          button.dataset.plot = String(index);
          button.dataset.itemId = String(plant.id);
          button.disabled = state.gold < plant.seedCost;
          button.append(
            makeElement("strong", "", plant.name),
            makeElement("span", "", plant.growthHours + "h · " + plant.seedCost + " G · +" + plant.goldReward + " G")
          );
          actions.appendChild(button);
        });
        card.appendChild(actions);
      } else {
        const plant = CATALOG.getItem(plot.itemId);
        const ready = Date.now() >= plot.finishesAt;
        card.append(
          makeElement("p", "game-plot-plant-name", plant ? plant.name : "Planta desconhecida"),
          makeElement("p", "game-plot-timer", ready ? "Colheita disponível" : "Tempo restante: " + formatRemaining(plot.finishesAt - Date.now()))
        );
        const button = makeElement("button", "game-action-button", ready ? "Colher · +" + plot.goldReward + " G" : "Aguardando crescimento");
        button.type = "button";
        button.dataset.action = "harvest";
        button.dataset.plot = String(index);
        button.disabled = !ready;
        card.appendChild(button);
      }
      elements.plots.appendChild(card);
    });
  }

  function renderInventory() {
    elements.inventory.replaceChildren();
    elements.inventoryCount.textContent = state.inventory.length + " PILHAS";
    if (!state.inventory.length) {
      elements.inventory.appendChild(makeElement("p", "", "Seu inventário está vazio neste protótipo."));
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
      discoveryKeys: state.discoveries,
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
    if (!hasDiscovery("WORM_FOUND")) {
      const lock = makeElement("div", "game-future-card");
      lock.append(
        makeElement("small", "", "BLOQUEADO"),
        makeElement("strong", "", "Encontre uma minhoca na fazenda"),
        makeElement("p", "", "A primeira minhoca é uma descoberta permanente. Ela não é consumida e desbloqueia a pesca.")
      );
      elements.fishing.appendChild(lock);
    } else {
      elements.fishing.appendChild(makeElement("p", "game-panel-description", "Escolha uma espécie antes de pescar. É possível pescar sem isca; as iscas aumentam Luck e reduzem o tempo. A captura e as tags serão validadas pelo servidor."));
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
        const selectFish = makeElement("button", "game-action-button", state.selectedFishId === fish.id ? "PEIXE SELECIONADO" : "SELECIONAR PEIXE");
        selectFish.type = "button";
        selectFish.dataset.action = "select-fish";
        selectFish.dataset.fishId = String(fish.id);
        fishRow.appendChild(selectFish);
        fishList.appendChild(fishRow);
      });
      fishCard.appendChild(fishList);
      elements.fishing.appendChild(fishCard);
      if (state.selectedFishId) {
        const selectedFish = CATALOG.getItem(state.selectedFishId);
        elements.fishing.appendChild(makeElement("p", "game-panel-description", "Alvo escolhido: " + (selectedFish ? selectedFish.name : "Peixe") + ". O botão de iniciar a pescaria será ativado após a integração com o banco."));
      }
    }

    const baitCard = makeElement("div", "game-future-card");
    baitCard.append(
      makeElement("strong", "", "Sistema de iscas preparado"),
      makeElement("p", "", "Pesca sem isca permanece possível. Isca Simples, Isca Reforçada e Isca Mística terão bônus de Luck e redução de tempo; os valores serão balanceados antes de ativar a mecânica.")
    );
    elements.fishing.appendChild(baitCard);
  }

  function renderMining() {
    elements.mining.replaceChildren();
    const unlocked = hasDiscovery("OLD_PICKAXE_FOUND");
    const card = makeElement("div", "game-future-card");
    card.append(
      makeElement("small", "", unlocked ? "DESCOBERTO" : "BLOQUEADO"),
      makeElement("strong", "", unlocked ? "Mineração disponível após integração" : "Encontre a Picareta Velha durante a pesca"),
      makeElement("p", "", "O catálogo inclui pedra, carvão, cobre, ferro, prata, ouro, cristais, gemas, Orichalco, Adamantio, Mytril, Titânio, Cobalto e Paládio. Pavranium não pode ser minerado.")
    );
    elements.mining.appendChild(card);

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
      makeElement("p", "", "Produção exclusiva por alquimia e encantamento, exigindo os minérios e gemas do catálogo. Não aparece como drop de mineração.")
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

  elements.fishing.addEventListener("click", event => {
    const areaButton = event.target.closest("button[data-area-id]");
    if (areaButton && !areaButton.disabled) {
      const nextAreaId = Number(areaButton.dataset.areaId);
      if (getUnlockedFishingAreaIds().includes(nextAreaId)) {
        state.selectedFishingAreaId = nextAreaId;
        state.selectedFishId = null;
        renderFishing();
      }
      return;
    }
    const fishButton = event.target.closest("button[data-action='select-fish']");
    if (fishButton) {
      const fishId = Number(fishButton.dataset.fishId);
      const fish = CATALOG.getItem(fishId);
      if (fish && getUnlockedFishingAreaIds().includes(fish.areaId)) {
        state.selectedFishId = fishId;
        renderFishing();
      }
    }
  });

  elements.plots.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const plotIndex = Number(button.dataset.plot);
    if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= state.plots.length) return;

    if (button.dataset.action === "plant" && !state.plots[plotIndex]) {
      const plant = CATALOG.getItem(Number(button.dataset.itemId));
      if (!plant || !plant.starter || state.gold < plant.seedCost) return;
      state.gold -= plant.seedCost;
      state.plots[plotIndex] = {
        itemId: plant.id,
        finishesAt: Date.now() + plant.growthHours * 60 * 60 * 1000,
        goldReward: plant.goldReward
      };
      renderFarm();
    }

    if (button.dataset.action === "harvest") {
      const plot = state.plots[plotIndex];
      if (!plot || Date.now() < plot.finishesAt) return;
      // Não rolar raridade no navegador; o servidor fará o sorteio após a integração.
      state.inventory = CATALOG.addInventoryStack(state.inventory, plot.itemId, 1, []);
      state.gold += plot.goldReward;
      state.plots[plotIndex] = null;
      renderFarm();
      renderInventory();
      renderCatalog();
    }
  });

  document.getElementById("game-tabs").addEventListener("click", event => {
    const button = event.target.closest("[data-game-tab]");
    if (button) showGamePanel(button.dataset.gameTab);
  });
  elements.catalogSearch.addEventListener("input", renderCatalog);
  elements.catalogCategory.addEventListener("change", renderCatalog);

  window.addEventListener("sacrificio:auth-updated", () => {
    elements.playerId.textContent = window.SACRIFICIO_AUTH_USER_ID || "Aguardando autenticação";
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
  }

  // API temporária para a futura integração com o Supabase; não grava nem autoriza ações no servidor.
  window.SACRIFICIO_GAME = Object.freeze({
    catalog: CATALOG,
    getTemporaryState: () => ({
      gold: state.gold,
      plots: state.plots.map(plot => plot ? { ...plot } : null),
      inventory: state.inventory.map(stack => ({ ...stack, tag_ids: [...stack.tag_ids] })),
      discoveries: [...state.discoveries]
    }),
    openPanel: showGamePanel
  });

  window.setInterval(() => {
    if (document.getElementById("game-panel-farm")?.classList.contains("is-active")) renderFarm();
  }, 1000);

  renderAll();
})();
