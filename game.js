(() => {
  "use strict";

  // IDs fixos do catálogo. O banco guardará apenas estes IDs e os dados individuais.
  const ITEM_IDS = Object.freeze({
    WHEAT: 100001,
    CARROT: 100002,
    PUMPKIN: 100003,
    GOLDEN_FLOWER: 100004
  });

  const PLANTS = [
    { id: ITEM_IDS.WHEAT, name: "Trigo", timeHours: 6, cost: 0, reward: 1 },
    { id: ITEM_IDS.CARROT, name: "Cenoura", timeHours: 12, cost: 1, reward: 3 },
    { id: ITEM_IDS.PUMPKIN, name: "Abóbora", timeHours: 18, cost: 4, reward: 10 },
    { id: ITEM_IDS.GOLDEN_FLOWER, name: "Flor dourada", timeHours: 24, cost: 10, reward: 20 }
  ];

  // Estado temporário apenas para testar a interface. Será substituído pela integração com o banco.
  const state = { gold: 0, plots: [null, null, null] };
  const plotsElement = document.getElementById("game-plots");
  const goldElement = document.getElementById("game-gold-value");
  const playerIdElement = document.getElementById("game-player-id");
  const inventoryElement = document.getElementById("game-inventory");
  if (!plotsElement || !goldElement || !playerIdElement || !inventoryElement) return;

  function formatRemaining(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
  }

  function render() {
    goldElement.textContent = String(state.gold);
    playerIdElement.textContent = window.SACRIFICIO_AUTH_USER_ID || "Aguardando autenticação";
    plotsElement.replaceChildren();

    state.plots.forEach((plot, index) => {
      const card = document.createElement("article");
      card.className = "game-plot-card";
      const heading = document.createElement("div");
      heading.className = "game-plot-heading";
      const title = document.createElement("strong");
      title.textContent = "Slot " + (index + 1);
      const status = document.createElement("span");
      status.className = "game-plot-status";
      status.textContent = plot ? (Date.now() >= plot.finishesAt ? "PRONTA" : "CRESCENDO") : "VAZIO";
      heading.append(title, status);
      card.appendChild(heading);

      if (!plot) {
        const empty = document.createElement("p");
        empty.className = "game-plot-description";
        empty.textContent = "Este terreno está livre para plantio.";
        card.appendChild(empty);
        const actions = document.createElement("div");
        actions.className = "game-seed-options";
        PLANTS.forEach(plant => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "game-seed-button";
          button.dataset.action = "plant";
          button.dataset.plot = String(index);
          button.dataset.itemId = String(plant.id);
          button.disabled = state.gold < plant.cost;
          button.innerHTML = "<strong>" + plant.name + "</strong><span>" + plant.timeHours + "h · " + plant.cost + " G · +" + plant.reward + " G</span>";
          actions.appendChild(button);
        });
        card.appendChild(actions);
      } else {
        const name = document.createElement("p");
        name.className = "game-plot-plant-name";
        name.textContent = plot.name;
        const timer = document.createElement("p");
        timer.className = "game-plot-timer";
        const ready = Date.now() >= plot.finishesAt;
        timer.textContent = ready ? "Colheita disponível" : "Tempo restante: " + formatRemaining(plot.finishesAt - Date.now());
        card.append(name, timer);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "game-action-button";
        button.dataset.action = "harvest";
        button.dataset.plot = String(index);
        button.disabled = !ready;
        button.textContent = ready ? "Colher · +" + plot.reward + " G" : "Aguardando crescimento";
        card.appendChild(button);
      }
      plotsElement.appendChild(card);
    });
    document.getElementById("game-plot-count").textContent = state.plots.length + " / 3 SLOTS";
    inventoryElement.innerHTML = '<p class="muted">Nenhum item no inventário. As sementes são selecionadas diretamente no plantio neste protótipo.</p>';
  }

  plotsElement.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    const plotIndex = Number(button.dataset.plot);
    if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= state.plots.length) return;

    if (button.dataset.action === "plant" && !state.plots[plotIndex]) {
      const itemId = Number(button.dataset.itemId);
      const plant = PLANTS.find(item => item.id === itemId);
      if (!plant || state.gold < plant.cost) return;
      state.gold -= plant.cost;
      state.plots[plotIndex] = {
        itemId: plant.id,
        name: plant.name,
        reward: plant.reward,
        finishesAt: Date.now() + plant.timeHours * 60 * 60 * 1000
      };
      render();
    }

    if (button.dataset.action === "harvest") {
      const plot = state.plots[plotIndex];
      if (!plot || Date.now() < plot.finishesAt) return;
      state.gold += plot.reward;
      state.plots[plotIndex] = null;
      render();
    }
  });

  window.addEventListener("sacrificio:auth-updated", render);
  window.setInterval(() => {
    if (document.getElementById("view-game")?.classList.contains("active")) render();
  }, 1000);
  render();
})();
