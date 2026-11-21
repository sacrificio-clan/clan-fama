(() => {
  "use strict";

  const SUPABASE_URL = "https://twqewrezssynlbzqpptb.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_F6Wn-moqrGolX3EFowLL2Q_FAjLZsPi";

  const clientFactory = window.supabase && window.supabase.createClient;
  const supabaseClient = clientFactory
    ? clientFactory(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    : null;

  const houseOrder = ["conquista", "guerra", "fome", "morte"];
  const houseNames = {
    conquista: "Conquista",
    guerra: "Guerra",
    fome: "Fome",
    morte: "Morte"
  };

  let houses = [];
  let members = [];
  let currentSession = null;
  let currentProfile = null;
  let memberProfileLoadToken = 0;

  const overviewHouses = document.getElementById("overview-houses");
  const membersHouseGrid = document.getElementById("members-house-grid");
  const membersDetailPanel = document.getElementById("members-detail-panel");
  const membersDetailTitle = document.getElementById("members-detail-title");
  const membersDetailCaption = document.getElementById("members-detail-caption");
  const membersSlotList = document.getElementById("members-slot-list");
  const memberProfilePanel = document.getElementById("member-profile-panel");
  const membersBackButton = document.getElementById("members-back-button");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const loginSubmit = document.getElementById("login-submit");

  // Interface language: Portuguese is the default; English preference is saved per browser.
  const LANGUAGE_STORAGE_KEY = "sacrificio-language";
  let currentLanguage = "pt-BR";
  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === "en" || savedLanguage === "pt-BR") currentLanguage = savedLanguage;
  } catch (_) {}

  const translations = {
    "IDIOMA": "LANGUAGE",
    "NAVEGAÇÃO": "NAVIGATION",
    "Navegação principal": "Main navigation",
    "Rotativo": "Rotating member",
    "Visão geral": "Overview",
    "Membros": "Members",
    "Configurações": "Settings",
    "Área pública": "Public area",
    "Entrar": "Log in",
    "Sair": "Log out",
    "SISTEMA DE GERENCIAMENTO": "CLAN MANAGEMENT SYSTEM",
    "Visualização pública": "Public view",
    "BEM-VINDO AO": "WELCOME TO",
    "Painel de organização, casas e integrantes do clã.": "Clan management panel for houses and members.",
    "ESTRUTURA DO CLÃ": "CLAN STRUCTURE",
    "Slots totais": "Total slots",
    "Slots ocupados": "Occupied slots",
    "Estrutura completa": "Full structure",
    "Casas": "Houses",
    "Quatro cavaleiros": "Four horsemen",
    "Slots especiais": "Special slots",
    "Rotativos e especiais": "Rotating and special",
    "Gerentes": "Managers",
    "Uma posição por casa": "One position per house",
    "ORGANIZAÇÃO": "ORGANIZATION",
    "Casas do clã": "Clan houses",
    "Ver todos os slots": "View all slots",
    "VAGAS 41–45": "SLOTS 41–45",
    "Cinco posições reservadas para membros especiais ou rotativos, sob sua administração.": "Five positions reserved for special or rotating members, managed by you.",
    "SLOT 50": "SLOT 50",
    "Proprietário": "Owner",
    "Conta principal do clã.": "Main clan account.",
    "A estrutura do clã e as informações dos membros são carregadas do Supabase.": "Clan structure and member information are loaded from Supabase.",
    "Conquista": "Conquest",
    "Guerra": "War",
    "Fome": "Famine",
    "Morte": "Death",
    "ORGANIZAÇÃO DO CLÃ": "CLAN ORGANIZATION",
    "Membros e slots": "Members and slots",
    "Ficha do integrante": "Member profile",
    "Selecione um membro na lista para visualizar suas informações.": "Select a member from the list to view their information.",
    "Nick do jogo": "In-game name",
    "Conquistas": "Achievements",
    "Pet": "Pet",
    "Relics": "Relics",
    "Gears": "Gears",
    "Runas": "Runes",
    "Suporte": "Support",
    "DPS": "DPS",
    "Espadas": "Swords",
    "Dispositivo": "Device",
    "Habilidade": "Skill",
    "Título": "Title",
    "Lvl 150": "Level 150",
    "Lvl 20+ HP": "Level 20+ HP",
    "Lvl 20+ DMG": "Level 20+ DMG",
    "Lvl 50+ HP": "Level 50+ HP",
    "Lvl 50+ DMG": "Level 50+ DMG",
    "DPS FULL": "FULL DPS",
    "HP FULL": "FULL HP",
    "Celular": "Mobile",
    "NOVATO": "BEGINNER",
    "INTERMEDIÁRIO": "INTERMEDIATE",
    "BOM": "GOOD",
    "PÓS-MOON LORD": "POST-MOON LORD",
    "Área reservada": "Reserved area",
    "Novas funcionalidades poderão ser adicionadas aqui futuramente.": "New features can be added here in the future.",
    "Nenhum Discord informado": "No Discord username provided",
    "Nick não informado": "No in-game name provided",
    "As casas e suas posições podem ser consultadas publicamente.": "Houses and their positions can be viewed publicly.",
    "CASA SELECIONADA": "SELECTED HOUSE",
    "Fechar lista": "Close list",
    "Selecione uma casa para ver as vagas, a fama de cada integrante e a fama total. Fotos opcionais: coloque arquivos PNG na pasta": "Select a house to view its slots, each member's Fame, and the total Fame. Optional photos: add PNG files to the",
    "fotos": "photos",
    ", usando o nome da casa e o número do slot (ex.:": ", using the house name and slot number (e.g.",
    "SOLICITAÇÕES": "REQUESTS",
    "Pedidos de alteração de FAMA enviados pelos membros.": "Fame change requests submitted by members.",
    "Área de acesso restrito": "Restricted area",
    "Entre com sua conta de proprietário ou gerente para consultar as solicitações autorizadas.": "Sign in with an owner or manager account to view authorized requests.",
    "ADMINISTRAÇÃO": "ADMINISTRATION",
    "Gerenciamento de contas, casas, slots e permissões.": "Manage accounts, houses, slots, and permissions.",
    "Somente o proprietário poderá acessar as configurações administrativas.": "Only the owner can access administrative settings.",
    "PAINEL DO CLÃ · VERSÃO INICIAL": "CLAN PANEL · INITIAL VERSION",
    "ACESSO AO CLÃ": "CLAN ACCESS",
    "Fechar": "Close",
    "Entrar no SACRIFICIO": "Sign in to SACRIFICIO",
    "Proprietário e gerentes entram com email. Membros entram com o Nick do jogo.": "Owners and managers sign in with email. Members sign in with their in-game nickname.",
    "Email ou Nick": "Email or nickname",
    "Seu email ou Nick do jogo": "Your email or in-game nickname",
    "Senha": "Password",
    "Sua senha": "Your password",
    "PAINEL DO CLÃ": "CLAN PANEL",
    "CASA DO CLÃ": "CLAN HOUSE",
    "10 vagas + 1 gerente": "10 slots + 1 manager",
    "10 vagas de membros e 1 posição de gerente": "10 member slots and 1 manager position",
    "Rotativos · 5 vagas especiais": "Rotating members · 5 special slots",
    "Minha área": "My area",
    "ÁREA DO PROPRIETÁRIO": "OWNER AREA",
    "Gerente ainda não cadastrado": "Manager not registered yet",
    "Gerente cadastrado": "Manager registered",
    "Gerente": "Manager",
    "Membro": "Member",
    "Especial": "Special",
    "Proprietário do clã": "Clan owner",
    "Vaga disponível": "Slot available",
    "Integrante cadastrado": "Member registered",
    "Conta vinculada": "Account linked",
    "A definir": "To be defined",
    "FOTO": "PHOTO",
    "Ocupado": "Occupied",
    "Disponível": "Available",
    "Fama": "Fame",
    "FAMA": "FAME",
    "Sua FAMA": "Your Fame",
    "Minha FAMA": "My Fame",
    "FAMA global": "Global Fame",
    "FAMA global atual": "Current Global Fame",
    "FAMA acumulada do SACRIFICIO": "SACRIFICIO accumulated Fame",
    "CASA DO CLÃ": "CLAN HOUSE",
    "VAGAS": "SLOTS",
    "CONTAS CADASTRADAS": "REGISTERED ACCOUNTS",
    "Integrantes do clã": "Clan members",
    "CONTROLE DO CLÃ": "CLAN CONTROL",
    "Corrigir FAMA": "Adjust Fame",
    "Corrigir FAMA global": "Adjust Global Fame",
    "NOVO CADASTRO": "NEW ACCOUNT",
    "Criar conta": "Create account",
    "Tipo de conta": "Account type",
    "Escolha primeiro o tipo de conta.": "Choose the account type first.",
    "Nick do jogo": "In-game nickname",
    "Senha inicial": "Initial password",
    "Slot disponível": "Available slot",
    "Selecione uma vaga": "Select a slot",
    "Discord (opcional)": "Discord (optional)",
    "Email do gerente": "Manager email",
    "O email será usado para entrar na conta de gerente.": "This email will be used to sign in to the manager account.",
    "Motivo da correção": "Reason for adjustment",
    "Motivo da correção de FAMA": "Reason for Fame adjustment",
    "Explique o motivo do ajuste": "Explain the reason for the adjustment",
    "Mínimo de 10 caracteres": "At least 10 characters",
    "Novo total global": "New global total",
    "Nova FAMA desejada": "Desired new Fame",
    "Enviar solicitação": "Submit request",
    "Salvar FAMA": "Save Fame",
    "Criar conta e ocupar slot": "Create account and fill slot",
    "ÁREA DO MEMBRO": "MEMBER AREA",
    "Solicitar alteração de FAMA": "Request a Fame change",
    "Você só pode solicitar um valor maior que sua FAMA atual.": "You can only request a value higher than your current Fame.",
    "Sua FAMA atual": "Your current Fame",
    "Solicitações recebidas": "Received requests",
    "Nenhuma solicitação encontrada.": "No requests found.",
    "Ainda não existem membros ou gerentes cadastrados.": "No members or managers have been registered yet.",
    "Integrante sem Nick": "Member without nickname",
    "Sair da conta": "Log out",
    "Conectado": "Signed in",
    "Sessão ativa": "Active session",
    "Acesso confirmado.": "Access confirmed.",
    "Registrando sua solicitação...": "Submitting your request...",
    "Verificando acesso...": "Verifying access...",
    "Enviando cadastro ao Supabase...": "Sending account data to Supabase...",
    "Criando conta...": "Creating account...",
    "Aplicando correção global...": "Applying global adjustment...",
    "Salvando decisão...": "Saving decision...",
    "Selecione um slot disponível.": "Select an available slot.",
    "Informe o email do gerente.": "Enter the manager's email.",
    "Informe um número inteiro válido.": "Enter a valid whole number.",
    "Informe um total inteiro válido e o motivo da correção.": "Enter a valid whole-number total and the reason for the adjustment.",
    "Informe uma FAMA inteira válida e o motivo da correção.": "Enter a valid whole-number Fame value and the reason for the adjustment.",
    "Digite o total correto": "Enter the correct total",
    "Digite o valor atualizado": "Enter the updated value",
    "A nova FAMA precisa ser maior que": "The new Fame must be greater than",
    "A FAMA global do SACRIFICIO será preservada.": "SACRIFICIO's global Fame will be preserved.",
    "A FAMA global também diminuirá pela diferença. Deseja continuar?": "Global Fame will also decrease by the difference. Do you want to continue?",
    "Remover integrante": "Remove member",
    "Remover": "Remove",
    "liberado; a FAMA global foi preservada.": "released; global Fame was preserved.",
    "Solicitação aprovada e FAMA atualizada.": "Request approved and Fame updated.",
    "Solicitação recusada.": "Request rejected.",
    "Solicitação enviada! Sua FAMA atual só será alterada após a aprovação da administração.": "Request submitted! Your current Fame will only change after approval by the administration.",
    "FAMA global atualizada com sucesso.": "Global Fame updated successfully.",
    "Recebidos": "Received",
    "Requests recebidos": "Incoming requests",
    "Novo valor": "New value",
    "Usuário do Discord": "Discord username",
    "Membros podem ocupar os slots 01–45, incluindo as cinco vagas especiais.": "Members can use slots 01–45, including the five special slots.",
    "Gerentes ocupam os slots 46–49 e ficam vinculados à casa correspondente.": "Managers occupy slots 46–49 and are linked to their corresponding house.",
    "Não foi possível carregar o perfil:": "Could not load the profile:",
    "Não foi possível carregar os requests:": "Could not load requests:",
    "Não foi possível carregar seus dados de membro:": "Could not load your member information:",
    "Não foi possível concluir:": "Could not complete:",
    "Não foi possível corrigir a FAMA global:": "Could not adjust Global Fame:",
    "Não foi possível corrigir a FAMA:": "Could not adjust Fame:",
    "Não foi possível enviar.": "Could not submit.",
    "Não foi possível identificar a casa do gerente:": "Could not identify the manager's house:",
    "Supabase JS não foi carregado.": "Supabase JS did not load.",
    "Erro de login:": "Sign-in error:",
    "A conta, Nick, Discord, FAMA individual e requests serão excluídos.": "The account, nickname, Discord tag, individual Fame, and requests will be deleted.",
    "Confirma definir a FAMA global do SACRIFICIO como": "Confirm setting SACRIFICIO's Global Fame to",
    "Você está diminuindo a FAMA de": "You are decreasing the Fame of",
    "este integrante": "this member",
    "registro não encontrado.": "record not found.",
    "A nova FAMA precisa ser maior que": "The new Fame must be greater than",
    "Integrante removido. Slot": "Member removed. Slot",
    "Nova FAMA de": "New Fame for",
    "FAMA de": "Fame of",
    "A FAMA global do SACRIFICIO será preservada.": "SACRIFICIO's global Fame will be preserved.",
    "Conta criada!": "Account created!",
    "foi vinculado ao slot": "was assigned to slot",
    "Não foi possível carregar": "Could not load",
    "Não foi possível carregar as casas. Atualize a página e tente novamente.": "Could not load the houses. Refresh the page and try again.",
    "Não foi possível carregar a biblioteca do Supabase.": "Could not load the Supabase library.",
    "Não foi possível confirmar as permissões desta conta.": "Could not verify this account's permissions.",
    "Esta conta não está ativa ou não possui uma função válida no clã.": "This account is inactive or does not have a valid clan role.",
    "Sua conta não está vinculada a um slot ativo. Procure a administração.": "Your account is not linked to an active slot. Contact the administration.",
    "O cliente Supabase não carregou. Atualize a página e tente novamente.": "The Supabase client did not load. Refresh the page and try again.",
    "Não foi possível entrar. Confira o Nick e a senha.": "Could not sign in. Check your nickname and password.",
    "Não foi possível entrar. Confira o email e a senha.": "Could not sign in. Check your email and password.",
    "Não foi possível criar a conta.": "Could not create the account.",
    "Não foi possível remover o integrante.": "Could not remove the member.",
    "O servidor não confirmou a decisão.": "The server did not confirm the decision.",
    "O servidor não confirmou a remoção.": "The server did not confirm the removal.",
    "O servidor não confirmou o cadastro.": "The server did not confirm the account creation.",
    "Erro inesperado ao criar a conta.": "Unexpected error while creating the account.",
    "Erro ao carregar casas:": "Error loading houses:",
    "Erro ao carregar slots:": "Error loading slots:",
    "Erro ao consultar a FAMA global:": "Error loading Global Fame:",
    "Erro ao consultar gerentes das casas:": "Error loading house managers:",
    "Erro ao corrigir FAMA global:": "Error adjusting Global Fame:",
    "Erro ao corrigir FAMA individual:": "Error adjusting individual Fame:",
    "Erro ao criar conta:": "Error creating account:",
    "Erro ao enviar solicitação de FAMA:": "Error submitting Fame request:",
    "Erro ao iniciar o SACRIFICIO:": "Error starting SACRIFICIO:",
    "Erro ao recuperar sessão:": "Error restoring session:",
    "Erro ao remover integrante:": "Error removing member:",
    "Erro ao sair:": "Error signing out:",
    "Entre com sua conta para acessar esta área.": "Sign in to access this area.",
    "Nenhuma vaga de gerente disponível": "No manager slots available",
    "Nenhuma vaga disponível": "No slots available",
    "Carregando...": "Loading...",
    "FAMA de ": "Fame of ",
    "Ocupado": "Occupied"
  };

  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();

  function translateText(value) {
    if (currentLanguage !== "en" || !value) return value;
    const core = value.trim();
    const start = value.indexOf(core);
    const leading = start < 0 ? value : value.slice(0, start);
    const trailing = start < 0 ? "" : value.slice(start + core.length);
    let translated = Object.prototype.hasOwnProperty.call(translations, core) ? translations[core] : core;

    if (translated.startsWith("10 vagas de membros e 1 posição de gerente · Fama total: ")) {
      translated = "10 member slots and 1 manager position · Total Fame: " + translated.slice("10 vagas de membros e 1 posição de gerente · Fama total: ".length);
    }
    if (translated.startsWith("5 vagas especiais · Fama total: ")) {
      translated = "5 special slots · Total Fame: " + translated.slice("5 vagas especiais · Fama total: ".length);
    }
    if (translated.startsWith("Fama da casa: ")) translated = "House Fame: " + translated.slice("Fama da casa: ".length);
    if (translated.startsWith("Fama dos rotativos: ")) translated = "Rotating members' Fame: " + translated.slice("Fama dos rotativos: ".length);
    if (translated.startsWith("Fama: ")) translated = "Fame: " + translated.slice("Fama: ".length);
    if (translated.startsWith("Fama total: ")) translated = "Total Fame: " + translated.slice("Fama total: ".length);
    if (translated.startsWith("Gerente · slot ")) translated = "Manager · slot " + translated.slice("Gerente · slot ".length);
    if (translated.startsWith("FAMA de ")) translated = "Fame of " + translated.slice("FAMA de ".length);
    if (translated.startsWith("Nova FAMA de ")) translated = "New Fame for " + translated.slice("Nova FAMA de ".length);
    if (translated.startsWith("Você está diminuindo a FAMA de ")) {
      translated = "You are decreasing the Fame of " + translated.slice("Você está diminuindo a FAMA de ".length);
    }
    if (translated.startsWith("Confirma definir a FAMA global do SACRIFICIO como ")) {
      translated = "Confirm setting SACRIFICIO's Global Fame to " + translated.slice("Confirma definir a FAMA global do SACRIFICIO como ".length);
    }
    if (translated.startsWith("A nova FAMA precisa ser maior que ")) {
      translated = "The new Fame must be greater than " + translated.slice("A nova FAMA precisa ser maior que ".length);
    }
    if (translated.startsWith("Conectado · ")) translated = "Signed in · " + translated.slice("Conectado · ".length);
    if (translated.startsWith("Responsável: ")) translated = "Managed by: " + translated.slice("Responsável: ".length);
    if (translated.startsWith("Gerente · ")) translated = "Manager · " + translated.slice("Gerente · ".length);
    if (translated.startsWith("Slot ") && translated.includes(" — ")) {
      const halves = translated.split(" — ");
      const details = halves[1].split(" · ");
      const houseName = translations[details[0]] || details[0];
      const role = details[1] ? (translations[details[1]] || details[1]) : "";
      translated = halves[0] + " — " + houseName + (role ? " · " + role : "");
    } else if (translated.startsWith("Slot ") && translated.includes(" · ")) {
      const parts = translated.split(" · ");
      const role = translations[parts[1]] || parts[1];
      translated = parts[0] + " · " + role;
    }
    const occupiedFiveSuffix = "/5 ocupadas";
    const occupiedFiveIndex = translated.indexOf(occupiedFiveSuffix);
    if (occupiedFiveIndex > 0 && Number.isFinite(Number(translated.slice(0, occupiedFiveIndex)))) {
      translated = translated.slice(0, occupiedFiveIndex) + "/5 occupied";
    }
    if (translated.endsWith(" ocupadas")) translated = translated.slice(0, -" ocupadas".length) + " occupied";
    if (translated.startsWith("Slots ")) translated = translated;

    const availableSuffix = " disponíveis";
    const availableIndex = translated.indexOf(availableSuffix);
    if (availableIndex > 0 && Number.isFinite(Number(translated.slice(0, availableIndex)))) {
      translated = translated.slice(0, availableIndex) + " available";
    }

    const ratioSuffix = "/10 vagas ocupadas";
    const ratioIndex = translated.indexOf(ratioSuffix);
    if (ratioIndex > 0 && Number.isFinite(Number(translated.slice(0, ratioIndex)))) {
      translated = translated.slice(0, ratioIndex) + "/10 slots occupied";
    }
    const positionsSuffix = " posições";
    if (translated.endsWith(positionsSuffix)) translated = translated.slice(0, -positionsSuffix.length) + " positions";
    if (translated.endsWith(" posição")) translated = translated.slice(0, -" posição".length) + " position";

    return leading + translated + trailing;
  }

  function localizeNode(node) {
    // Keep sensitive administration forms in their original Portuguese wording.
    // This also prevents the dynamic language observer from rewriting the account form.
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.parentElement && node.parentElement.closest("[data-no-translate]")) return;
      let state = originalTextNodes.get(node);
      if (!state || node.nodeValue !== state.translated) {
        state = { original: node.nodeValue, translated: null };
        originalTextNodes.set(node, state);
      }
      const next = translateText(state.original);
      state.translated = next;
      if (node.nodeValue !== next) node.nodeValue = next;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.closest("[data-no-translate]")) return;
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (!node.hasAttribute(attribute)) return;
      let map = originalAttributes.get(node);
      if (!map) {
        map = new Map();
        originalAttributes.set(node, map);
      }
      let state = map.get(attribute);
      const current = node.getAttribute(attribute);
      if (!state || current !== state.translated) {
        state = { original: current, translated: null };
        map.set(attribute, state);
      }
      const next = translateText(state.original);
      state.translated = next;
      if (current !== next) node.setAttribute(attribute, next);
    });
    Array.from(node.childNodes).forEach(localizeNode);
  }

  function applyLanguage(language) {
    currentLanguage = language === "en" ? "en" : "pt-BR";
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch (_) {}
    document.documentElement.lang = currentLanguage === "en" ? "en" : "pt-BR";
    localizeNode(document.documentElement);
    const selectedGroup = membersDetailPanel && !membersDetailPanel.hidden
      ? membersDetailPanel.dataset.group
      : null;
    if (members.length) {
      createHouseCards();
      createMembersHouseCards();
      if (selectedGroup) showMembersGroup(selectedGroup);
    }
    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  const languageObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "childList") record.addedNodes.forEach(localizeNode);
      else if (record.type === "characterData") localizeNode(record.target);
      else if (record.type === "attributes") localizeNode(record.target);
    });
  });
  languageObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  });

  function padSlot(number) {
    return String(number).padStart(2, "0");
  }

  function setLoginMessage(message, type) {
    loginStatus.textContent = message || "";
    loginStatus.className = "login-status" + (type ? " " + type : "");
  }

  function houseForSlot(slot) {
    if (slot >= 1 && slot <= 10) return "conquista";
    if (slot >= 11 && slot <= 20) return "guerra";
    if (slot >= 21 && slot <= 30) return "fome";
    if (slot >= 31 && slot <= 40) return "morte";
    if (slot === 46) return "conquista";
    if (slot === 47) return "guerra";
    if (slot === 48) return "fome";
    if (slot === 49) return "morte";
    return null;
  }

  function getSlotInfo(member) {
    const slot = Number(member.slot_number);
    const house = houses.find((item) => item.id === member.house_id);
    if (member.slot_type === "special") return { group: "Rotativos e especiais", role: "Especial" };
    if (member.slot_type === "manager") return { group: house ? house.name : houseNames[houseForSlot(slot)], role: "Gerente" };
    if (member.slot_type === "owner") return { group: "Administração", role: "Proprietário" };
    return { group: house ? house.name : houseNames[houseForSlot(slot)] || "Casa", role: "Membro" };
  }

  function createHouseCards() {
    overviewHouses.replaceChildren();

    houseOrder.forEach((code) => {
      const house = houses.find((item) => item.code === code);
      if (!house) return;

      const houseMembers = members
        .filter((member) => member.house_id === house.id && member.slot_type === "member")
        .sort((a, b) => a.slot_number - b.slot_number);
      const manager = members.find((member) => member.house_id === house.id && member.slot_type === "manager");

      const card = document.createElement("article");
      card.className = "house-card";

      const top = document.createElement("div");
      top.className = "house-card-top";

      const title = document.createElement("h3");
      title.textContent = house.name;

      const range = document.createElement("span");
      range.className = "house-range";
      const firstSlot = houseMembers.length ? houseMembers[0].slot_number : 0;
      const lastSlot = houseMembers.length ? houseMembers[houseMembers.length - 1].slot_number : 0;
      range.textContent = "Slots " + padSlot(firstSlot) + "–" + padSlot(lastSlot);
      top.append(title, range);

      const slots = document.createElement("div");
      slots.className = "slot-preview";

      houseMembers.forEach((member) => {
        const pill = document.createElement("span");
        pill.className = "slot-pill" + (member.is_occupied ? " occupied" : "");
        pill.textContent = padSlot(member.slot_number);
        pill.title = member.is_occupied ? (member.nickname || "Ocupado") : "Disponível";
        slots.appendChild(pill);
      });

      const managerLine = document.createElement("p");
      managerLine.className = "house-manager";
      managerLine.textContent = manager
        ? "Gerente · slot " + padSlot(manager.slot_number) + " · " + (manager.nickname || (manager.is_occupied ? "Conta vinculada" : "A definir"))
        : "Gerente ainda não cadastrado";

      card.append(top, slots, managerLine);
      overviewHouses.appendChild(card);
    });
  }

  function formatFame(value) {
    if (value === null || value === undefined || value === "") return "—";
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? numeric.toLocaleString(currentLanguage === "en" ? "en-US" : "pt-BR", { maximumFractionDigits: 2 })
      : String(value);
  }

  function sumOccupiedFame(records) {
    return records.reduce((total, member) => {
      if (!member || !member.is_occupied) return total;
      const value = Number(member.fame);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function getHouseRoster(code, house) {
    const houseIndex = houseOrder.indexOf(code);
    if (houseIndex < 0) return [];
    const firstSlot = houseIndex * 10 + 1;
    const lastSlot = firstSlot + 9;
    const managerSlot = 46 + houseIndex;

    return members.filter((member) => {
      const slot = Number(member.slot_number);
      if (member.slot_type === "member") {
        return (slot >= firstSlot && slot <= lastSlot) || Boolean(house && member.house_id === house.id);
      }
      if (member.slot_type === "manager") {
        return slot === managerSlot || Boolean(house && member.house_id === house.id);
      }
      return false;
    });
  }

  function createMembersHouseCard(code, title, eyebrow, detail, occupancy, fameText) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "members-house-card";
    card.dataset.group = code;
    card.setAttribute("aria-expanded", "false");

    const label = document.createElement("span");
    label.className = "members-house-eyebrow";
    label.textContent = eyebrow;

    const name = document.createElement("strong");
    name.className = "members-house-name";
    name.textContent = title;

    const description = document.createElement("span");
    description.className = "members-house-detail";
    description.textContent = detail;

    const count = document.createElement("span");
    count.className = "members-house-occupancy";
    count.textContent = occupancy;

    const fame = document.createElement("span");
    fame.className = "members-house-fame";
    fame.textContent = fameText;

    const arrow = document.createElement("span");
    arrow.className = "members-house-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    card.append(label, name, description, count, fame, arrow);
    card.addEventListener("click", () => showMembersGroup(code));
    return card;
  }

  function createMembersHouseCards() {
    if (!membersHouseGrid) return;
    membersHouseGrid.replaceChildren();

    houseOrder.forEach((code, index) => {
      const house = houses.find((item) => item.code === code);
      if (!house) return;

      const houseMembers = members.filter(
        (member) => member.house_id === house.id && member.slot_type === "member"
      );
      const houseFame = sumOccupiedFame(getHouseRoster(code, house));
      const occupied = houseMembers.filter((member) => member.is_occupied).length;
      const card = createMembersHouseCard(
        code,
        house.name || houseNames[code],
        "CASA DO CLÃ",
        "10 vagas + 1 gerente",
        occupied + "/10 vagas ocupadas",
        "Fama da casa: " + formatFame(houseFame)
      );
      card.style.setProperty("--house-outline", ["#041365", "#01080b", "#f1ff00", "#ff0000"][index]);
      membersHouseGrid.appendChild(card);
    });

    const rotatingSlots = members.filter(
      (member) => member.slot_type === "special" && Number(member.slot_number) >= 41 && Number(member.slot_number) <= 45
    );
    const occupiedRotating = rotatingSlots.filter((member) => member.is_occupied).length;
    const rotatingFame = sumOccupiedFame(rotatingSlots);
    const owner = members.find((member) => Number(member.slot_number) === 50);
    const ownerName = owner && owner.nickname ? owner.nickname : "Proprietário do clã";
    const rotatingCard = createMembersHouseCard(
      "rotativos",
      "Minha área",
      "ÁREA DO PROPRIETÁRIO",
      "Rotativos · 5 vagas especiais",
      "Responsável: " + ownerName + " · " + occupiedRotating + "/5 ocupadas",
      "Fama dos rotativos: " + formatFame(rotatingFame)
    );
    rotatingCard.style.setProperty("--house-outline", "#9ca3af");
    membersHouseGrid.appendChild(rotatingCard);
  }

  function createMemberSlotRow(slotNumber, member, roleLabel, photoCode) {
    const occupied = Boolean(member && member.is_occupied);
    const row = document.createElement("article");
    row.className = "members-slot-row" + (roleLabel === "Gerente" ? " is-manager" : "");

    // Segmento 1: foto local da casa e do slot.
    const photo = document.createElement("div");
    photo.className = "members-slot-photo-wrap";

    const placeholder = document.createElement("span");
    placeholder.className = "members-slot-photo-placeholder";
    placeholder.textContent = "FOTO";

    const image = document.createElement("img");
    image.className = "members-slot-photo";
    image.alt = member && member.nickname
      ? "Foto de " + member.nickname
      : "Foto da vaga " + padSlot(slotNumber);
    image.loading = "lazy";
    image.src = "./fotos/" + photoCode + "_" + slotNumber + ".png";
    image.addEventListener("error", () => {
      image.hidden = true;
      placeholder.hidden = false;
    }, { once: true });
    placeholder.hidden = true;
    photo.append(image, placeholder);

    // Segmento 2: nome e identificação do slot.
    const identity = document.createElement("div");
    identity.className = "members-slot-identity";

    const name = document.createElement("strong");
    name.textContent = occupied
      ? (member.nickname || (roleLabel === "Gerente" ? "Gerente cadastrado" : "Integrante cadastrado"))
      : "Vaga disponível";

    const role = document.createElement("span");
    role.textContent = "Slot " + padSlot(slotNumber) + " · " + roleLabel +
      (member && member.slot_label ? " · " + member.slot_label : "");
    identity.append(name, role);

    // Segmento 3: fama em coluna própria, ao lado do nome.
    const fame = document.createElement("div");
    fame.className = "members-slot-fame";

    const fameLabel = document.createElement("span");
    fameLabel.className = "members-slot-fame-label";
    fameLabel.textContent = "FAMA";

    const fameValue = document.createElement("strong");
    fameValue.className = "members-slot-fame-value";
    fameValue.textContent = occupied ? formatFame(member.fame) : "—";
    fame.append(fameLabel, fameValue);

    // Segmento 4: estado da vaga.
    const status = document.createElement("span");
    status.className = "members-slot-status " + (occupied ? "occupied" : "available");
    status.textContent = occupied ? "Ocupado" : "Disponível";

    row.append(photo, identity, fame, status);
    if (occupied) {
      row.classList.add("is-selectable");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Ver ficha de " + (member.nickname || "integrante"));
      const selectMember = () => {
        membersSlotList.querySelectorAll(".members-slot-row.is-selected").forEach((item) => {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
        row.classList.add("is-selected");
        row.setAttribute("aria-pressed", "true");
        showMemberProfile(member, roleLabel, photoCode, slotNumber);
      };
      row.addEventListener("click", selectMember);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectMember(); }
      });
    }
    return row;
  }

  async function showMemberProfile(member, roleLabel, photoCode, slotNumber) {
    if (!memberProfilePanel || !member) return;
    const loadToken = ++memberProfileLoadToken;
    memberProfilePanel.replaceChildren();

    const canEdit = Boolean(currentSession && currentProfile && currentProfile.is_active &&
      (currentProfile.role === "owner" ||
        (currentProfile.role === "manager" && houses.some((house) =>
          house.id === member.house_id && house.manager_profile_id === currentSession.user.id
        ))));

    const heading = document.createElement("div");
    heading.className = "member-profile-heading";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "PERFIL DO CLÃ";
    const title = document.createElement("h4");
    title.textContent = "Ficha do integrante";
    heading.append(eyebrow, title);

    const hero = document.createElement("div");
    hero.className = "member-profile-hero";
    const photoWrap = document.createElement("div");
    photoWrap.className = "member-profile-photo-wrap";
    const photo = document.createElement("img");
    photo.className = "member-profile-photo";
    photo.alt = "Foto de " + (member.nickname || "integrante");
    photo.src = "./fotos/" + photoCode + "_" + slotNumber + ".png";
    photo.addEventListener("error", () => { photo.hidden = true; photoWrap.classList.add("has-no-photo"); photoWrap.textContent = "FOTO"; }, { once: true });
    photoWrap.appendChild(photo);
    const identity = document.createElement("div");
    identity.className = "member-profile-identity";
    const nickname = document.createElement("strong");
    nickname.textContent = member.nickname || "Nick não informado";
    const slot = document.createElement("span");
    slot.textContent = "Slot " + padSlot(slotNumber) + " · " + roleLabel;
    identity.append(nickname, slot);
    hero.append(photoWrap, identity);

    const medalsSection = document.createElement("section");
    medalsSection.className = "member-profile-rewards";
    const medalsTitle = document.createElement("h5");
    medalsTitle.textContent = "Medalhas";
    const medalsList = document.createElement("div");
    medalsList.className = "member-profile-medals";
    medalsSection.append(medalsTitle, medalsList);

    const progressSection = document.createElement("section");
    progressSection.className = "member-profile-progress";
    const progressHeading = document.createElement("div");
    progressHeading.className = "member-profile-progress-heading";
    const progressTitle = document.createElement("h5");
    progressTitle.textContent = "Progresso das conquistas";
    const progressValue = document.createElement("strong");
    progressValue.className = "member-profile-progress-value";
    progressHeading.append(progressTitle, progressValue);
    const progressTrack = document.createElement("div");
    progressTrack.className = "member-profile-progress-track";
    const progressFill = document.createElement("span");
    progressTrack.appendChild(progressFill);
    const progressBreakdown = document.createElement("div");
    progressBreakdown.className = "member-profile-progress-breakdown";
    progressSection.append(progressHeading, progressTrack, progressBreakdown);

    const details = document.createElement("div");
    details.className = "member-profile-fields";
    const gameField = document.createElement("div");
    gameField.className = "member-profile-field";
    const gameLabel = document.createElement("span");
    gameLabel.textContent = "Nick do jogo";
    const gameValue = document.createElement("strong");
    gameValue.textContent = member.nickname || "Não informado";
    gameField.append(gameLabel, gameValue);
    const discordField = document.createElement("div");
    discordField.className = "member-profile-field";
    const discordLabel = document.createElement("span");
    discordLabel.textContent = "Usuário do Discord";
    const discordValue = document.createElement("strong");
    discordValue.textContent = member.discord_tag || "Nenhum Discord informado";
    discordField.append(discordLabel, discordValue);
    details.append(gameField, discordField);

    const workspace = document.createElement("div");
    workspace.className = "member-profile-workspace";

    const notesSection = document.createElement("section");
    notesSection.className = "member-profile-future member-profile-notes";
    const notesTitle = document.createElement("h5");
    notesTitle.textContent = "Notas";
    const notesArea = document.createElement("textarea");
    notesArea.className = "member-profile-notes-area";
    notesArea.setAttribute("aria-label", "Notas públicas do integrante");
    notesArea.placeholder = canEdit ? "Escreva uma nota sobre este integrante..." : "Nenhuma nota cadastrada.";
    notesArea.readOnly = !canEdit;
    notesSection.append(notesTitle, notesArea);

    const checklistSection = document.createElement("section");
    checklistSection.className = "member-profile-future member-profile-checklist";
    const checklistTitle = document.createElement("h5");
    checklistTitle.textContent = "Conquistas";
    const checklistSlots = document.createElement("div");
    checklistSlots.className = "member-profile-checklist-slots";

    const achievementGroups = [
      { title: "Pet", items: ["Lvl 150", "Universal", "Dual Edge", "T6"] },
      { title: "Relics", items: ["Lvl 20+ HP", "Lvl 20+ DMG", "Lvl 50+ HP", "Lvl 50+ DMG"] },
      { title: "Gears", items: ["DPS FULL", "HP FULL", "Rune King", "Void", "ENDGAME"] },
      { title: "Runas", subgroups: [
        { title: "Suporte", items: ["Egg/Protector", "Party", "Silencer", "Poseidon"] },
        { title: "DPS", items: ["Star", "Soul"] }
      ]},
      { title: "Espadas", items: ["SubZero", "Tidesaber", "Darkenfrost", "True Guardian"] },
      { title: "Dispositivo", items: ["PC", "Celular", "Console"] },
      { title: "Habilidade", items: ["NOOB", "NOVATO", "INTERMEDIÁRIO", "BOM", "PRO", "PÓS-MOON LORD"] },
      { title: "Título", items: ["DETERMINED"] }
    ];
    const achievementInputs = new Map();

    function addAchievementRow(label) {
      const row = document.createElement("label");
      row.className = "member-profile-checklist-slot";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "member-profile-achievement-checkbox";
      checkbox.value = label;
      checkbox.checked = false;
      checkbox.disabled = !canEdit;
      const text = document.createElement("span");
      text.className = "member-profile-checklist-label";
      text.textContent = label;
      row.append(checkbox, text);
      checklistSlots.appendChild(row);
      achievementInputs.set(label, checkbox);
      checkbox.addEventListener("change", updateAchievementRewards);
    }

    function updateAchievementRewards() {
      const selected = new Set(
        Array.from(achievementInputs.entries()).filter(([, input]) => input.checked).map(([label]) => label)
      );
      const groupItems = (title) => {
        const group = achievementGroups.find((item) => item.title === title);
        if (!group) return [];
        return group.subgroups
          ? group.subgroups.flatMap((subgroup) => subgroup.items)
          : group.items.slice();
      };
      const categories = [
        { title: "Pet", items: groupItems("Pet"), required: 4, medal: "PET" },
        { title: "Relics", items: groupItems("Relics"), required: 2, medal: "RELICS" },
        { title: "Gears", items: groupItems("Gears"), required: 3, medal: "GEARS" },
        { title: "Runas", items: groupItems("Runas"), required: 6, medal: "RUNAS" },
        { title: "Espadas", items: groupItems("Espadas"), required: 4, medal: "ESPADAS" },
        { title: "Dispositivo", items: groupItems("Dispositivo"), required: 1, medal: "DISPOSITIVO" }
      ];
      const skillItems = groupItems("Habilidade");
      const titleItems = groupItems("Título");
      const skillCount = skillItems.filter((item) => selected.has(item)).length;
      const counts = categories.map((category) => ({
        ...category,
        count: category.items.filter((item) => selected.has(item)).length
      }));
      const baseComplete = counts.every((category) => category.count >= category.required);
      const determined = titleItems.every((item) => selected.has(item));
      const postMoonLord = selected.has("PÓS-MOON LORD");
      const allChecked = achievementGroups.every((group) => {
        const items = group.subgroups
          ? group.subgroups.flatMap((subgroup) => subgroup.items)
          : group.items;
        return items.every((item) => selected.has(item));
      });

      medalsList.replaceChildren();
      const addMedal = (name, special = false) => {
        const medal = document.createElement("span");
        const medalClass = {
          "DETERMINED": "is-determined",
          "SACRIFICIO": "is-sacrificio",
          "APEX": "is-apex"
        }[name];
        medal.className = "member-profile-medal" + (special ? " is-special" : "") +
          (medalClass ? " " + medalClass : "");
        medal.textContent = name;
        medalsList.appendChild(medal);
      };

      // APEX is the secret maximum: every single checkbox must be selected.
      // SACRIFICIO requires every regular category medal, POST-MOON LORD,
      // and DETERMINED; Relics and Gears use their medal thresholds, not 100%.
      const sacrificioUnlocked = baseComplete && postMoonLord && determined;
      if (allChecked) {
        addMedal("APEX", true);
      } else if (sacrificioUnlocked) {
        addMedal("SACRIFICIO", true);
      } else {
        counts.filter((category) => category.count >= category.required)
          .forEach((category) => addMedal(category.medal));
        if (baseComplete) {
          if (postMoonLord) addMedal("PÓS-MOON LORD", true);
          else if (selected.has("PRO")) addMedal("PRO", true);
          else if (selected.has("BOM")) addMedal("BOM");
        }
        if (determined) addMedal("DETERMINED", true);
      }

      const progressRows = [
        ...counts.map((category) => ({
          title: category.title,
          count: category.count,
          total: category.items.length,
          complete: category.count >= category.required,
          required: category.required
        })),
        {
          title: "Habilidade",
          count: skillCount ? 1 : 0,
          total: 1,
          complete: skillCount > 0,
          required: 1
        }
      ];
      const completed = progressRows.filter((item) => item.complete).length;
      const percent = Math.round((completed / progressRows.length) * 100);
      progressValue.textContent = completed + "/" + progressRows.length + " · " + percent + "%";
      progressFill.style.width = percent + "%";
      progressBreakdown.replaceChildren();
      progressRows.forEach((item) => {
        const row = document.createElement("div");
        row.className = "member-profile-progress-row" + (item.complete ? " is-complete" : "");
        const name = document.createElement("span");
        name.textContent = item.title;
        const value = document.createElement("strong");
        value.textContent = item.count + "/" + item.total;
        const requirement = document.createElement("small");
        requirement.textContent = item.complete ? "Completo" : "Meta: " + item.required;
        row.append(name, value, requirement);
        progressBreakdown.appendChild(row);
      });
    }

    achievementGroups.forEach((group) => {
      const groupHeading = document.createElement("h6");
      groupHeading.className = "member-profile-achievement-group";
      groupHeading.textContent = group.title;
      checklistSlots.appendChild(groupHeading);

      if (group.subgroups) {
        group.subgroups.forEach((subgroup) => {
          const subgroupHeading = document.createElement("p");
          subgroupHeading.className = "member-profile-achievement-subgroup";
          subgroupHeading.textContent = subgroup.title;
          checklistSlots.appendChild(subgroupHeading);
          subgroup.items.forEach(addAchievementRow);
        });
      } else {
        group.items.forEach(addAchievementRow);
      }
    });

    const actions = document.createElement("div");
    actions.className = "member-profile-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "primary-button member-profile-save";
    saveButton.textContent = "Salvar alterações";
    saveButton.hidden = !canEdit;
    const feedback = document.createElement("p");
    feedback.className = "member-profile-save-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    if (canEdit) actions.append(saveButton);
    actions.append(feedback);

    saveButton.addEventListener("click", async () => {
      if (!canEdit || !supabaseClient) return;
      saveButton.disabled = true;
      feedback.textContent = "Salvando...";
      feedback.className = "member-profile-save-feedback";
      const selectedAchievements = Array.from(achievementInputs.entries())
        .filter(([, input]) => input.checked)
        .map(([label]) => label);
      const { data, error } = await supabaseClient.rpc("save_member_profile_details", {
        p_member_id: member.id,
        p_notes: notesArea.value,
        p_achievements: selectedAchievements
      });
      saveButton.disabled = false;
      if (error || !data || data.success !== true) {
        console.error("Erro ao salvar ficha do membro:", error || data);
        feedback.textContent = "Não foi possível salvar. " + (error ? error.message : "Verifique as permissões.");
        feedback.className = "member-profile-save-feedback is-error";
        return;
      }
      feedback.textContent = "Alterações salvas.";
      feedback.className = "member-profile-save-feedback is-success";
    });

    checklistSection.append(checklistTitle, checklistSlots);
    workspace.append(notesSection, checklistSection, actions);
    memberProfilePanel.append(heading, hero, medalsSection, progressSection, details, workspace);
    updateAchievementRewards();

    notesArea.value = "Carregando notas...";
    notesArea.disabled = true;
    const { data: profileDetails, error } = await supabaseClient
      .from("member_profile_details")
      .select("notes,achievements")
      .eq("member_id", member.id)
      .maybeSingle();

    if (loadToken !== memberProfileLoadToken) return;
    notesArea.disabled = false;
    if (error) {
      console.error("Não foi possível carregar notas e conquistas:", error);
      notesArea.value = "Não foi possível carregar as notas.";
      notesArea.placeholder = "Erro ao carregar.";
      feedback.textContent = "Não foi possível carregar as conquistas: " + error.message;
      feedback.className = "member-profile-save-feedback is-error";
      saveButton.disabled = true;
      return;
    }
    notesArea.value = profileDetails && profileDetails.notes ? profileDetails.notes : "";
    const savedAchievements = new Set(
      profileDetails && Array.isArray(profileDetails.achievements) ? profileDetails.achievements : []
    );
    achievementInputs.forEach((input, label) => { input.checked = savedAchievements.has(label); });
    updateAchievementRewards();
  }

  function resetMemberProfile() {
    if (!memberProfilePanel) return;
    memberProfilePanel.innerHTML = '<div class="member-profile-empty"><span class="member-profile-empty-icon">◎</span><strong>Ficha do integrante</strong><p>Selecione um membro na lista para visualizar suas informações.</p></div>';
  }

  function showMembersGroup(code) {
    if (!membersDetailPanel || !membersSlotList) return;

    membersSlotList.replaceChildren();
    resetMemberProfile();
    membersDetailPanel.dataset.group = code;

    membersHouseGrid.querySelectorAll(".members-house-card").forEach((card) => {
      const selected = card.dataset.group === code;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-expanded", selected ? "true" : "false");
    });

    if (code === "rotativos") {
      membersDetailTitle.textContent = "Minha área · Rotativos";
      const owner = members.find((member) => Number(member.slot_number) === 50);
      const ownerName = owner && owner.nickname ? owner.nickname : "Proprietário do clã";
      const rotatingSlots = members.filter(
        (item) => item.slot_type === "special" && Number(item.slot_number) >= 41 && Number(item.slot_number) <= 45
      );
      membersDetailCaption.textContent = "5 vagas especiais · Fama total: " + formatFame(sumOccupiedFame(rotatingSlots)) + " · Responsável: " + ownerName;

      for (let slot = 41; slot <= 45; slot += 1) {
        const member = members.find(
          (item) => Number(item.slot_number) === slot && item.slot_type === "special"
        );
        membersSlotList.appendChild(createMemberSlotRow(slot, member, "Rotativo", "rotativos"));
      }
    } else {
      const houseIndex = houseOrder.indexOf(code);
      const house = houses.find((item) => item.code === code);
      const houseName = house && house.name ? house.name : (houseNames[code] || "Casa");
      const firstSlot = houseIndex * 10 + 1;
      const managerSlot = 46 + houseIndex;

      const houseRoster = getHouseRoster(code, house);
      membersDetailTitle.textContent = houseName;
      membersDetailCaption.textContent = "10 vagas de membros e 1 posição de gerente · Fama total: " + formatFame(sumOccupiedFame(houseRoster));

      for (let slot = firstSlot; slot < firstSlot + 10; slot += 1) {
        const member = members.find(
          (item) => Number(item.slot_number) === slot && item.slot_type === "member"
        );
        membersSlotList.appendChild(createMemberSlotRow(slot, member, "Membro", code));
      }

      const manager = members.find(
        (item) => item.slot_type === "manager" &&
          ((house && item.house_id === house.id) || Number(item.slot_number) === managerSlot)
      );
      const actualManagerSlot = manager ? Number(manager.slot_number) : managerSlot;
      membersSlotList.appendChild(createMemberSlotRow(actualManagerSlot, manager, "Gerente", code));
    }

    membersDetailPanel.hidden = false;
  }

  function closeMembersGroup() {
    if (!membersDetailPanel) return;
    membersDetailPanel.hidden = true;
    membersHouseGrid.querySelectorAll(".members-house-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-expanded", "false");
    });
  }

  function updateOverviewStats() {
    const totalSlots = 50;
    // Count occupied positions across the full structure, including managers and the owner.
    const occupiedSlots = members.filter((member) =>
      member && (Boolean(member.is_occupied) || Number(member.slot_number) === 50)
    ).length;
    const availableSlots = Math.max(0, totalSlots - occupiedSlots);

    const occupancyValue = document.getElementById("overview-occupancy-value");
    const availableValue = document.getElementById("overview-available-value");
    const occupancyFill = document.getElementById("overview-occupancy-fill");
    if (occupancyValue) occupancyValue.textContent = occupiedSlots + "/" + totalSlots;
    if (availableValue) availableValue.textContent = availableSlots + " disponíveis";
    if (occupancyFill) occupancyFill.style.width = Math.min(100, (occupiedSlots / totalSlots) * 100) + "%";

    const stats = document.querySelectorAll(".stat-card strong");
    if (stats.length >= 4) {
      stats[1].textContent = String(houses.length).padStart(2, "0");
      stats[2].textContent = String(members.filter((m) => m.slot_type === "special").length).padStart(2, "0");
      stats[3].textContent = String(members.filter((m) => m.slot_type === "manager").length).padStart(2, "0");
    }

    // The owner profile is intentionally independent from Supabase and the 50 clan slots.
    const ownerProfile = window.SACRIFICIO_OWNER_PROFILE || {};
    const ownerName = document.getElementById("owner-profile-name");
    const ownerFame = document.getElementById("owner-profile-fame");
    const ownerPhoto = document.getElementById("owner-profile-photo");
    if (ownerName) ownerName.textContent = ownerProfile.nickname || "Lux_Nihil";
    if (ownerFame) {
      const fame = Number(ownerProfile.fame);
      ownerFame.textContent = Number.isFinite(fame) ? fame.toLocaleString(currentLanguage === "en" ? "en-US" : "pt-BR") : "0";
    }
    if (ownerPhoto && ownerProfile.photo) {
      ownerPhoto.src = ownerProfile.photo;
      ownerPhoto.alt = "Foto de " + (ownerProfile.nickname || "Lux_Nihil");
    }
  }

  async function loadPublicData() {
    if (!supabaseClient) {
      console.error("Supabase JS não foi carregado.");
      return;
    }

    const [houseResult, memberResult] = await Promise.all([
      supabaseClient.from("houses").select("id,code,name,manager_profile_id"),
      supabaseClient.from("members").select("id,slot_number,slot_type,slot_label,house_id,nickname,discord_tag,fame,is_occupied").order("slot_number")
    ]);

    if (houseResult.error) console.error("Erro ao carregar casas:", houseResult.error.message);
    if (memberResult.error) console.error("Erro ao carregar slots:", memberResult.error.message);

    if (!houseResult.error && houseResult.data) houses = houseResult.data;
    if (!memberResult.error && memberResult.data) members = memberResult.data;

    createHouseCards();
    createMembersHouseCards();
    updateOverviewStats();
  }

  function updateAuthButtons() {
    document.querySelectorAll("[data-login]").forEach((button) => {
      button.textContent = currentSession ? "Sair" : "Entrar";
      button.setAttribute("aria-label", currentSession ? "Sair da conta" : "Entrar");
    });

    const publicBadge = document.querySelector(".public-badge");
    if (publicBadge) {
      publicBadge.replaceChildren();
      const dot = document.createElement("span");
      dot.className = "state-dot";
      publicBadge.appendChild(dot);
      const text = document.createElement("span");
      text.textContent = currentSession
        ? "Conectado · " + (currentProfile && currentProfile.display_name ? currentProfile.display_name : currentSession.user.email)
        : "Visualização pública";
      publicBadge.appendChild(text);
    }

    const publicState = document.querySelector(".public-state");
    if (publicState) {
      publicState.replaceChildren();
      const dot = document.createElement("span");
      dot.className = "state-dot";
      publicState.appendChild(dot);
      publicState.appendChild(document.createTextNode(currentSession ? "Sessão ativa" : "Área pública"));
    }

    const requestsLock = document.querySelector('[data-view="requests"] .nav-lock');
    if (requestsLock) requestsLock.hidden = Boolean(currentSession);

    const settingsNav = document.querySelector('[data-view="settings"]');
    if (settingsNav) {
      settingsNav.hidden = Boolean(currentSession && currentProfile && currentProfile.role !== "owner");
      const settingsLock = settingsNav.querySelector(".nav-lock");
      if (settingsLock) settingsLock.hidden = Boolean(currentSession && currentProfile && currentProfile.role === "owner");
    }
  }

  async function loadCurrentProfile() {
    currentProfile = null;
    if (!currentSession || !supabaseClient) {
      updateAuthButtons();
      return;
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("role,display_name,is_active")
      .eq("id", currentSession.user.id)
      .single();

    if (error || !data) {
      console.error("Não foi possível carregar o perfil:", error && error.message);
      await supabaseClient.auth.signOut();
      currentSession = null;
      updateAuthButtons();
      setLoginMessage("Não foi possível confirmar as permissões desta conta.", "error");
      return;
    }

    if (!data.is_active || !["owner", "manager", "member"].includes(data.role)) {
      await supabaseClient.auth.signOut();
      currentSession = null;
      currentProfile = null;
      updateAuthButtons();
      setLoginMessage("Esta conta não está ativa ou não possui uma função válida no clã.", "error");
      return;
    }

    currentProfile = data;
    updateAuthButtons();
  }


  async function showMemberFameRequest(container) {
    const heading = document.createElement("div");
    heading.className = "section-intro";
    heading.innerHTML = '<p class="eyebrow">ÁREA DO MEMBRO</p><h2>Minha FAMA</h2><p class="muted">Aqui você pode solicitar uma atualização da sua FAMA. O valor só muda depois da aprovação da administração.</p>';
    container.appendChild(heading);

    const { data: member, error: memberError } = await supabaseClient
      .from("members")
      .select("id,slot_number,nickname,fame")
      .eq("profile_id", currentSession.user.id)
      .maybeSingle();

    if (memberError || !member) {
      const message = document.createElement("div");
      message.className = "empty-state";
      message.textContent = memberError
        ? "Não foi possível carregar seus dados de membro: " + memberError.message
        : "Sua conta não está vinculada a um slot ativo. Procure a administração.";
      container.appendChild(message);
      return;
    }

    const panel = document.createElement("section");
    panel.className = "admin-section member-request-panel";

    const panelHeading = document.createElement("div");
    panelHeading.className = "admin-section-heading";
    const titleWrap = document.createElement("div");
    titleWrap.innerHTML = '<p class="eyebrow">SEU CADASTRO</p><h3>Solicitar alteração de FAMA</h3>';
    const slotChip = document.createElement("span");
    slotChip.className = "number-chip";
    slotChip.textContent = "Slot " + padSlot(member.slot_number);
    panelHeading.append(titleWrap, slotChip);

    const currentBox = document.createElement("div");
    currentBox.className = "global-fame-current";
    const currentLabel = document.createElement("span");
    currentLabel.textContent = "Sua FAMA atual";
    const currentValue = document.createElement("strong");
    currentValue.textContent = formatFame(member.fame);
    currentBox.append(currentLabel, currentValue);

    const form = document.createElement("form");
    form.className = "admin-form admin-form-nested";
    form.innerHTML = `
      <div class="form-grid">
        <div class="form-field form-field-wide">
          <label for="member-request-fame">Nova FAMA desejada</label>
          <input id="member-request-fame" name="requested_fame" type="text" inputmode="numeric" maxlength="30" pattern="[0-9]+" placeholder="Digite o valor atualizado" required>
          <small>Você só pode solicitar um valor maior que sua FAMA atual.</small>
        </div>
      </div>
      <p id="member-request-status" class="form-feedback" role="status" aria-live="polite"></p>
      <div class="form-actions"><button class="primary-button" type="submit">Enviar solicitação</button></div>
    `;

    const feedback = form.querySelector("#member-request-status");
    const submit = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const requestedText = form.querySelector("#member-request-fame").value.trim();
      if (!/^\d{1,30}$/.test(requestedText)) {
        feedback.textContent = "Informe um número inteiro válido.";
        feedback.className = "form-feedback error";
        return;
      }

      const currentValueBig = BigInt(String(member.fame ?? "0"));
      const requestedValueBig = BigInt(requestedText);
      if (requestedValueBig <= currentValueBig) {
        feedback.textContent = "A nova FAMA precisa ser maior que " + formatFame(member.fame) + ".";
        feedback.className = "form-feedback error";
        return;
      }

      submit.disabled = true;
      submit.textContent = "Enviando...";
      feedback.textContent = "Registrando sua solicitação...";
      feedback.className = "form-feedback";

      const { error } = await supabaseClient
        .from("fame_requests")
        .insert({
          member_id: member.id,
          old_fame: String(member.fame ?? "0"),
          requested_fame: requestedText
        });

      submit.disabled = false;
      submit.textContent = "Enviar solicitação";

      if (error) {
        console.error("Erro ao enviar solicitação de FAMA:", error);
        feedback.textContent = "Não foi possível enviar. " + error.message;
        feedback.className = "form-feedback error";
        return;
      }

      form.reset();
      feedback.textContent = "Solicitação enviada! Sua FAMA atual só será alterada após a aprovação da administração.";
      feedback.className = "form-feedback success";
    });

    panel.append(panelHeading, currentBox, form);
    container.appendChild(panel);
  }

  async function showRequests() {
    const container = document.getElementById("requests-content");
    container.replaceChildren();

    if (currentProfile && currentProfile.role === "member") {
      await showMemberFameRequest(container);
      return;
    }

    const heading = document.createElement("div");
    heading.className = "section-intro";
    heading.innerHTML = '<p class="eyebrow">SOLICITAÇÕES</p><h2>Requests recebidos</h2><p class="muted">Solicitações visíveis para sua conta conforme as permissões do banco.</p>';
    container.appendChild(heading);

    const { data, error } = await supabaseClient
      .from("fame_requests")
      .select("id,member_id,old_fame,requested_fame,status,review_note,created_at,reviewed_at")
      .order("created_at", { ascending: false });

    if (error) {
      const message = document.createElement("div");
      message.className = "empty-state";
      message.textContent = "Não foi possível carregar os requests: " + error.message;
      container.appendChild(message);
      return;
    }

    const visibleRequests = (data || []).filter((request) => request.status !== "rejected");
    if (visibleRequests.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma solicitação encontrada.";
      container.appendChild(empty);
      return;
    }

    let managedHouseIds = new Set();
    if (currentProfile && currentProfile.role === "manager") {
      const { data: managedHouses, error: managedHousesError } = await supabaseClient
        .from("houses")
        .select("id")
        .eq("manager_profile_id", currentSession.user.id);

      if (managedHousesError) {
        console.error("Não foi possível identificar a casa do gerente:", managedHousesError);
      } else {
        managedHouseIds = new Set((managedHouses || []).map((house) => house.id));
      }
    }

    const list = document.createElement("div");
    list.className = "request-list";
    visibleRequests.forEach((request) => {
      const member = members.find((item) => item.id === request.member_id);
      const card = document.createElement("article");
      card.className = "request-card";

      const copy = document.createElement("div");
      copy.className = "request-card-copy";
      const title = document.createElement("h3");
      title.textContent = "Slot " + (member ? padSlot(member.slot_number) : "—") + " · alteração de FAMA";
      const details = document.createElement("p");
      details.textContent = Number(request.old_fame).toLocaleString("pt-BR") + " → " + Number(request.requested_fame).toLocaleString("pt-BR") + " · " + new Date(request.created_at).toLocaleString("pt-BR");
      copy.append(title, details);

      const side = document.createElement("div");
      side.className = "request-card-side";
      const status = document.createElement("span");
      status.className = "request-status";
      status.textContent = request.status === "pending" ? "Pendente" : request.status === "approved" ? "Aprovado" : "Recusado";
      side.appendChild(status);

      const canReview = currentProfile && (
        currentProfile.role === "owner" ||
        (currentProfile.role === "manager" && member && member.house_id && managedHouseIds.has(member.house_id))
      );

      if (request.status === "pending" && canReview) {
        const actions = document.createElement("div");
        actions.className = "request-actions";

        const approveButton = document.createElement("button");
        approveButton.type = "button";
        approveButton.className = "secondary-button";
        approveButton.textContent = "Aprovar";

        const rejectButton = document.createElement("button");
        rejectButton.type = "button";
        rejectButton.className = "danger-button";
        rejectButton.textContent = "Recusar";

        const feedback = document.createElement("p");
        feedback.className = "request-card-feedback";
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");

        async function reviewRequest(decision, button) {
          const isApproval = decision === "approve";
          const actionLabel = isApproval ? "aprovar" : "recusar";
          const confirmation = window.confirm(
            "Deseja " + actionLabel + " a solicitação do slot " +
            (member ? padSlot(member.slot_number) : "—") + "?"
          );
          if (!confirmation) return;

          approveButton.disabled = true;
          rejectButton.disabled = true;
          button.textContent = isApproval ? "Aprovando..." : "Recusando...";
          feedback.textContent = "Salvando decisão...";
          feedback.className = "request-card-feedback";

          const { data: result, error: reviewError } = await supabaseClient.rpc(
            "review_fame_request",
            {
              p_request_id: request.id,
              p_decision: decision
            }
          );

          if (reviewError || !result?.success) {
            const message = reviewError
              ? reviewError.message
              : (result?.error || "O servidor não confirmou a decisão.");
            feedback.textContent = "Não foi possível concluir: " + message;
            feedback.className = "request-card-feedback error";
            approveButton.disabled = false;
            rejectButton.disabled = false;
            approveButton.textContent = "Aprovar";
            rejectButton.textContent = "Recusar";
            return;
          }

          feedback.textContent = isApproval
            ? "Solicitação aprovada e FAMA atualizada."
            : "Solicitação recusada.";
          feedback.className = "request-card-feedback success";
          await loadPublicData();
          await showRequests();
        }

        approveButton.addEventListener("click", () => reviewRequest("approve", approveButton));
        rejectButton.addEventListener("click", () => reviewRequest("reject", rejectButton));
        actions.append(approveButton, rejectButton);
        side.append(actions);
        card.append(copy, side, feedback);
      } else {
        card.append(copy, side);
      }

      list.appendChild(card);
    });
    container.appendChild(list);
  }

  function formatFame(value) {
    try {
      return BigInt(String(value ?? "0")).toLocaleString("pt-BR");
    } catch (_) {
      return String(value ?? "0");
    }
  }

  function setAdminFeedback(message, type) {
    const status = document.getElementById("admin-action-status");
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-feedback" + (type ? " " + type : "");
  }

  async function readFunctionError(error, fallback) {
    let message = fallback;
    try {
      if (error && error.context && typeof error.context.clone === "function") {
        const payload = await error.context.clone().json();
        if (payload && payload.error) message = payload.error;
      } else if (error && error.message) {
        message = error.message;
      }
    } catch (_) {
      if (error && error.message) message = error.message;
    }
    return message;
  }

  async function showSettings() {
    const container = document.getElementById("settings-content");
    container.innerHTML = `
      <section class="settings-summary settings-intro">
        <h3>Administração do SACRIFICIO</h3>
        <p>Criação de contas, controle das vagas, correções de FAMA e remoção de integrantes. Estas ferramentas são exclusivas do proprietário.</p>
      </section>

      <section class="admin-section">
        <div class="admin-section-heading">
          <div><p class="eyebrow">CONTROLE DO CLÃ</p><h3>FAMA global</h3></div>
          <span class="number-chip">Σ</span>
        </div>
        <div class="global-fame-current">
          <span>FAMA acumulada do SACRIFICIO</span>
          <strong id="global-fame-current">Carregando...</strong>
        </div>
        <form id="global-fame-form" class="admin-form admin-form-nested">
          <div class="form-grid">
            <div class="form-field form-field-wide">
              <label for="global-fame-value">Novo total global</label>
              <input id="global-fame-value" name="new_total" type="text" inputmode="numeric" maxlength="30" pattern="[0-9]+" placeholder="Digite o total correto" required>
              <small>Este ajuste altera somente o total global, sem adicionar FAMA a nenhum integrante.</small>
            </div>
            <div class="form-field form-field-wide">
              <label for="global-fame-reason">Motivo da correção</label>
              <input id="global-fame-reason" name="reason" type="text" maxlength="500" placeholder="Explique o motivo do ajuste" required>
            </div>
          </div>
          <div class="form-actions"><button class="primary-button" id="global-fame-submit" type="submit">Corrigir FAMA global</button></div>
        </form>
      </section>

      <section class="admin-section">
        <div class="admin-section-heading">
          <div><p class="eyebrow">CONTAS CADASTRADAS</p><h3>Integrantes do clã</h3></div>
          <span class="number-chip" id="admin-member-total">—</span>
        </div>
        <p class="muted admin-section-description">Você pode corrigir a FAMA individual ou remover qualquer integrante, inclusive gerentes. A FAMA global não será reduzida quando alguém sair.</p>
        <div id="admin-members-list" class="admin-members-list"></div>
      </section>

      <section class="admin-section">
        <details class="create-account-details" open data-no-translate>
          <summary>
            <span><p class="eyebrow">NOVO CADASTRO</p><strong>Criar conta</strong></span>
            <span class="number-chip">+</span>
          </summary>
          <form id="create-account-form" class="admin-form admin-form-nested">
            <div class="form-grid">
              <div class="form-field">
                <label for="create-role">Tipo de conta</label>
                <select id="create-role" name="role" required>
                  <option value="member">Membro</option>
                  <option value="manager">Gerente</option>
                </select>
              </div>
              <div class="form-field">
                <label for="create-nickname">Nick do jogo</label>
                <input id="create-nickname" name="nickname" type="text" minlength="2" maxlength="32" autocomplete="off" placeholder="Ex.: Jogador123" required>
              </div>
              <div class="form-field form-field-wide" id="create-email-field" hidden>
                <label for="create-email">Email do gerente</label>
                <input id="create-email" name="email" type="email" autocomplete="off" placeholder="gerente@email.com">
                <small>O email será usado para entrar na conta de gerente.</small>
              </div>
              <div class="form-field">
                <label for="create-password">Senha inicial</label>
                <input id="create-password" name="password" type="password" minlength="10" autocomplete="new-password" placeholder="Mínimo de 10 caracteres" required>
              </div>
              <div class="form-field">
                <label for="create-discord">Discord (opcional)</label>
                <input id="create-discord" name="discord_tag" type="text" maxlength="100" autocomplete="off" placeholder="Usuário do Discord">
              </div>
              <div class="form-field form-field-wide">
                <label for="create-slot">Slot disponível</label>
                <select id="create-slot" name="slot_number" required></select>
                <small id="create-slot-info">Escolha primeiro o tipo de conta.</small>
              </div>
            </div>
            <div class="admin-form-note">
              <strong>Segurança das credenciais</strong>
              <span>A senha será enviada diretamente à função segura do Supabase Auth. Ela não será gravada em uma tabela nem exibida depois do cadastro.</span>
            </div>
            <p id="create-account-status" class="form-feedback" role="status" aria-live="polite"></p>
            <div class="form-actions">
              <button class="primary-button" id="create-account-submit" type="submit">Criar conta e ocupar slot</button>
            </div>
          </form>
        </details>
      </section>
      <p id="admin-action-status" class="form-feedback" role="status" aria-live="polite"></p>
    `;

    if (!supabaseClient || !currentSession || !currentProfile || currentProfile.role !== "owner") {
      return;
    }

    // FAMA global
    const globalCurrent = document.getElementById("global-fame-current");
    const globalInput = document.getElementById("global-fame-value");
    const globalForm = document.getElementById("global-fame-form");
    const globalSubmit = document.getElementById("global-fame-submit");

    const { data: stats, error: statsError } = await supabaseClient
      .from("clan_stats")
      .select("global_fame")
      .eq("id", 1)
      .maybeSingle();

    if (statsError || !stats) {
      globalCurrent.textContent = "Não foi possível carregar";
      setAdminFeedback("Erro ao consultar a FAMA global: " + (statsError?.message || "registro não encontrado."), "error");
    } else {
      globalCurrent.textContent = formatFame(stats.global_fame);
      globalForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const newTotal = globalInput.value.trim();
        const reason = document.getElementById("global-fame-reason").value.trim();

        if (!/^\d{1,30}$/.test(newTotal) || !reason) {
          setAdminFeedback("Informe um total inteiro válido e o motivo da correção.", "error");
          return;
        }

        if (!window.confirm("Confirma definir a FAMA global do SACRIFICIO como " + formatFame(newTotal) + "? Isso não altera a FAMA individual de ninguém.")) {
          return;
        }

        globalSubmit.disabled = true;
        globalSubmit.textContent = "Salvando...";
        setAdminFeedback("Aplicando correção global...", "");

        const { error } = await supabaseClient.rpc("admin_adjust_global_fame", {
          p_new_total: newTotal,
          p_reason: reason
        });

        globalSubmit.disabled = false;
        globalSubmit.textContent = "Corrigir FAMA global";

        if (error) {
          console.error("Erro ao corrigir FAMA global:", error);
          setAdminFeedback("Não foi possível corrigir a FAMA global: " + error.message, "error");
          return;
        }

        await showSettings();
        setAdminFeedback("FAMA global atualizada com sucesso.", "success");
      });
    }

    // Lista de integrantes ocupados
    const list = document.getElementById("admin-members-list");
    const occupiedMembers = members
      .filter((member) => member.is_occupied && Number(member.slot_number) !== 50)
      .sort((a, b) => a.slot_number - b.slot_number);

    document.getElementById("admin-member-total").textContent = String(occupiedMembers.length);

    if (occupiedMembers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Ainda não existem membros ou gerentes cadastrados.";
      list.appendChild(empty);
    }

    occupiedMembers.forEach((member) => {
      const info = getSlotInfo(member);
      const card = document.createElement("article");
      card.className = "admin-member-card";

      const top = document.createElement("div");
      top.className = "admin-member-top";

      const identity = document.createElement("div");
      identity.className = "admin-member-identity";

      const name = document.createElement("strong");
      name.textContent = member.nickname || "Integrante sem Nick";

      const meta = document.createElement("span");
      meta.textContent = "Slot " + padSlot(member.slot_number) + " · " + info.group + " · " + info.role;

      identity.append(name, meta);

      const fame = document.createElement("span");
      fame.className = "admin-member-fame";
      fame.textContent = formatFame(member.fame) + " FAMA";

      top.append(identity, fame);

      const actions = document.createElement("div");
      actions.className = "admin-member-actions";

      const fameForm = document.createElement("form");
      fameForm.className = "member-fame-form";

      const newFameLabel = document.createElement("label");
      newFameLabel.textContent = "Corrigir FAMA";
      const newFameInput = document.createElement("input");
      newFameInput.type = "text";
      newFameInput.inputMode = "numeric";
      newFameInput.maxLength = 30;
      newFameInput.pattern = "[0-9]+";
      newFameInput.placeholder = "Novo valor";
      newFameInput.value = String(member.fame ?? "0");
      newFameInput.required = true;
      newFameInput.setAttribute("aria-label", "Nova FAMA de " + (member.nickname || "integrante"));
      const reasonInput = document.createElement("input");
      reasonInput.type = "text";
      reasonInput.maxLength = 500;
      reasonInput.placeholder = "Motivo da correção";
      reasonInput.required = true;
      reasonInput.setAttribute("aria-label", "Motivo da correção de FAMA");
      const adjustButton = document.createElement("button");
      adjustButton.type = "submit";
      adjustButton.className = "secondary-button";
      adjustButton.textContent = "Salvar FAMA";

      newFameLabel.appendChild(newFameInput);
      fameForm.append(newFameLabel, reasonInput, adjustButton);

      fameForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const newValue = newFameInput.value.trim();
        const reason = reasonInput.value.trim();

        if (!/^\d{1,30}$/.test(newValue) || !reason) {
          setAdminFeedback("Informe uma FAMA inteira válida e o motivo da correção.", "error");
          return;
        }

        if (BigInt(newValue) < BigInt(String(member.fame || "0"))) {
          const confirmed = window.confirm(
            "Você está diminuindo a FAMA de " + (member.nickname || "este integrante") +
            ". A FAMA global também diminuirá pela diferença. Deseja continuar?"
          );
          if (!confirmed) return;
        }

        adjustButton.disabled = true;
        adjustButton.textContent = "Salvando...";

        const { error } = await supabaseClient.rpc("admin_adjust_member_fame", {
          p_member_id: member.id,
          p_new_fame: newValue,
          p_reason: reason
        });

        if (error) {
          console.error("Erro ao corrigir FAMA individual:", error);
          setAdminFeedback("Não foi possível corrigir a FAMA: " + error.message, "error");
          adjustButton.disabled = false;
          adjustButton.textContent = "Salvar FAMA";
          return;
        }

        await loadPublicData();
        await showSettings();
        setAdminFeedback("FAMA de " + (member.nickname || "integrante") + " corrigida com sucesso.", "success");
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger-button";
      removeButton.textContent = "Remover integrante";
      removeButton.addEventListener("click", async () => {
        const confirmation = window.confirm(
          "Remover " + (member.nickname || "este integrante") +
          " do slot " + padSlot(member.slot_number) + "?\n\n" +
          "A conta, Nick, Discord, FAMA individual e requests serão excluídos. " +
          "A FAMA global do SACRIFICIO será preservada."
        );

        if (!confirmation) return;

        removeButton.disabled = true;
        removeButton.textContent = "Removendo...";

        const { data, error } = await supabaseClient.functions.invoke(
          "remove-clan-member",
          { body: { slot_number: Number(member.slot_number) } }
        );

        if (error || !data?.success) {
          const message = error
            ? await readFunctionError(error, "Não foi possível remover o integrante.")
            : (data?.error || "O servidor não confirmou a remoção.");

          console.error("Erro ao remover integrante:", error || data);
          removeButton.disabled = false;
          removeButton.textContent = "Remover integrante";
          setAdminFeedback(message, "error");
          return;
        }

        await loadPublicData();
        await showSettings();
        setAdminFeedback(
          "Integrante removido. Slot " + padSlot(data.slot_number) +
          " liberado; a FAMA global foi preservada.",
          "success"
        );
      });

      actions.append(fameForm, removeButton);
      card.append(top, actions);
      list.appendChild(card);
    });

    // Cadastro de novas contas
    const { data: houseData, error: houseError } = await supabaseClient
      .from("houses")
      .select("id,code,name,manager_profile_id");

    if (houseError) {
      console.error("Erro ao consultar gerentes das casas:", houseError.message);
      setCreateAccountFeedback("Não foi possível carregar as casas. Atualize a página e tente novamente.", "error");
      return;
    }

    houses = houseData ?? houses;

    const form = document.getElementById("create-account-form");
    const roleSelect = document.getElementById("create-role");
    const slotSelect = document.getElementById("create-slot");
    const emailField = document.getElementById("create-email-field");
    const emailInput = document.getElementById("create-email");
    const slotInfo = document.getElementById("create-slot-info");
    const submitButton = document.getElementById("create-account-submit");

    function refreshAvailableSlots() {
      const role = roleSelect.value;
      const isManager = role === "manager";
      emailField.hidden = !isManager;
      emailInput.required = isManager;

      const available = members
        .filter((member) => {
          if (member.is_occupied) return false;
          if (!isManager) {
            return member.slot_type === "member" || member.slot_type === "special";
          }
          if (member.slot_type !== "manager" || !member.house_id) return false;
          const house = houses.find((item) => item.id === member.house_id);
          return Boolean(house && !house.manager_profile_id);
        })
        .sort((a, b) => a.slot_number - b.slot_number);

      slotSelect.replaceChildren();

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = available.length
        ? "Selecione uma vaga"
        : isManager ? "Nenhuma vaga de gerente disponível" : "Nenhuma vaga disponível";
      slotSelect.appendChild(placeholder);

      available.forEach((member) => {
        const info = getSlotInfo(member);
        const option = document.createElement("option");
        option.value = String(member.slot_number);
        option.textContent =
          "Slot " + padSlot(member.slot_number) + " — " +
          (isManager ? "Gerente · " + info.group : info.group + " · " +
            (member.slot_type === "special" ? "Especial/rotativo" : "Membro"));
        slotSelect.appendChild(option);
      });

      slotSelect.disabled = available.length === 0;
      submitButton.disabled = available.length === 0;
      slotInfo.textContent = isManager
        ? "Gerentes ocupam os slots 46–49 e ficam vinculados à casa correspondente."
        : "Membros podem ocupar os slots 01–45, incluindo as cinco vagas especiais.";
    }

    roleSelect.addEventListener("change", refreshAvailableSlots);
    refreshAvailableSlots();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const role = roleSelect.value;
      const nickname = document.getElementById("create-nickname").value.trim();
      const password = document.getElementById("create-password").value;
      const slotNumber = Number(slotSelect.value);
      const discordTag = document.getElementById("create-discord").value.trim();
      const email = emailInput.value.trim();

      if (!slotNumber) {
        setCreateAccountFeedback("Selecione um slot disponível.", "error");
        return;
      }

      if (role === "manager" && !email) {
        setCreateAccountFeedback("Informe o email do gerente.", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Criando conta...";
      setCreateAccountFeedback("Enviando cadastro ao Supabase...", "");

      try {
        const { data, error } = await supabaseClient.functions.invoke(
          "create-clan-account",
          {
            body: {
              role,
              nickname,
              password,
              slot_number: slotNumber,
              email: role === "manager" ? email : undefined,
              discord_tag: discordTag || null
            }
          }
        );

        if (error) {
          const serverMessage = await readFunctionError(error, "Não foi possível criar a conta.");
          throw new Error(serverMessage);
        }

        if (!data || !data.success) {
          throw new Error(data && data.error ? data.error : "O servidor não confirmou o cadastro.");
        }

        form.reset();
        await loadPublicData();
        await showSettings();

        setCreateAccountFeedback(
          "Conta criada! " + data.account.nickname +
          " foi vinculado ao slot " + padSlot(data.account.slot_number) +
          (data.account.house ? " · " + data.account.house : "") + ".",
          "success"
        );
      } catch (error) {
        console.error("Erro ao criar conta:", error);
        setCreateAccountFeedback(error.message || "Erro inesperado ao criar a conta.", "error");
      } finally {
        const currentButton = document.getElementById("create-account-submit");
        if (currentButton) {
          currentButton.disabled = false;
          currentButton.textContent = "Criar conta e ocupar slot";
        }
      }
    });
  }

  function setCreateAccountFeedback(message, type) {
    const status = document.getElementById("create-account-status");
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-feedback" + (type ? " " + type : "");
  }

  function showView(name) {
    const target = document.getElementById("view-" + name);
    if (!target) return false;

    if ((name === "requests" || name === "settings") && !currentSession) {
      setLoginMessage("Entre com sua conta para acessar esta área.", "");
      if (typeof loginDialog.showModal === "function") loginDialog.showModal();
      return false;
    }

    if (name === "settings" && (!currentProfile || currentProfile.role !== "owner")) {
      return false;
    }

    document.querySelectorAll(".view").forEach((view) => {
      const active = view === target;
      view.classList.toggle("active", active);
      view.hidden = !active;
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      const active = button.dataset.view === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    document.getElementById("page-title").textContent = target.dataset.title || "SACRIFICIO";
    window.history.replaceState(null, "", "#" + (name === "overview" ? "visao-geral" : name));

    if (name === "requests") showRequests();
    if (name === "settings") showSettings();
    return true;
  }

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.go));
  });

  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (currentSession) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error("Erro ao sair:", error.message);
        currentSession = null;
        currentProfile = null;
        updateAuthButtons();
        showView("overview");
      } else if (typeof loginDialog.showModal === "function") {
        setLoginMessage("", "");
        loginDialog.showModal();
      }
    });
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => loginDialog.close());
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      setLoginMessage("O cliente Supabase não carregou. Atualize a página e tente novamente.", "error");
      return;
    }

    const identity = document.getElementById("login-identity").value.trim();
    const password = document.getElementById("login-password").value;
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Entrando...";
    setLoginMessage("Verificando acesso...", "");

    try {
      if (identity.includes("@")) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: identity,
          password
        });
        if (error) throw error;
        currentSession = data.session;
      } else {
        const { data, error } = await supabaseClient.functions.invoke(
          "member-login",
          { body: { nickname: identity, password } }
        );

        if (error) {
          throw new Error(await readFunctionError(error, "Não foi possível entrar. Confira o Nick e a senha."));
        }
        if (!data?.session?.access_token || !data?.session?.refresh_token) {
          throw new Error(data?.error || "Não foi possível entrar. Confira o Nick e a senha.");
        }

        const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        if (sessionError) throw sessionError;
        currentSession = sessionData.session;
      }

      await loadCurrentProfile();

      if (currentSession && currentProfile) {
        setLoginMessage("Acesso confirmado.", "success");
        loginDialog.close();
        loginForm.reset();
        await loadPublicData();
        showView(currentProfile.role === "member" ? "requests" : "overview");
      } else {
        setLoginMessage("Não foi possível confirmar as permissões desta conta.", "error");
      }
    } catch (error) {
      console.error("Erro de login:", error);
      setLoginMessage(
        identity.includes("@")
          ? "Não foi possível entrar. Confira o email e a senha."
          : (error.message || "Não foi possível entrar. Confira o Nick e a senha."),
        "error"
      );
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = "Entrar";
    }
  });

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.language));
  });
  applyLanguage(currentLanguage);

  if (membersBackButton) {
    membersBackButton.addEventListener("click", closeMembersGroup);
  }

  async function init() {
    if (!supabaseClient) {
      setLoginMessage("Não foi possível carregar a biblioteca do Supabase.", "error");
      return;
    }

    await loadPublicData();

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Erro ao recuperar sessão:", error.message);
    currentSession = data && data.session ? data.session : null;
    await loadCurrentProfile();

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      currentSession = session;
      // Defer profile reads until the auth callback releases its internal lock.
      window.setTimeout(() => loadCurrentProfile(), 0);
    });

    const initialHash = window.location.hash.replace("#", "");
    const initialViews = {
      "visao-geral": "overview",
      "members": "members",
      "requests": "requests",
      "settings": "settings"
    };
    if (initialViews[initialHash]) showView(initialViews[initialHash]);
    updateAuthButtons();
  }

  init().catch((error) => {
    console.error("Erro ao iniciar o SACRIFICIO:", error);
  });
})();
