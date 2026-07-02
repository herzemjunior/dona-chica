const steps = window.DONA_CHICA_STEPS;
const sessionId = window.DONA_CHICA_SESSION_ID || "default";
const firebaseConfig = window.DONA_CHICA_FIREBASE_CONFIG || {};
const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
const isPanel = document.body.classList.contains("panel-page");
const isParticipate = document.body.classList.contains("participate-page");
const WAITING_STEP = -1;
const WARMUP_STEP = 0;
const MAIN_START_INDEX = 1;
const LIVE_TIMEOUT_MS = 30000;
const HEARTBEAT_MS = 10000;
const RAFFLE_STEP = steps.length;
const GOODBYE_STEP = steps.length + 1;

const state = {
  currentStep: WAITING_STEP,
  voteRound: 0,
  responses: {},
  warmup: {},
  participants: {},
  liveParticipants: {},
  raffle: null,
  livePage: 0,
  lastTotal: 0,
  lastParticipantCount: 0,
  lastLiveParticipantCount: 0,
  lastStep: 0,
  panelHasRendered: false,
  usingFirebase: false,
  listenersReady: false
};

const memoryStorage = {};
const pendingVotes = new Set();

let dbApi = null;
let localSaveTimer = null;
let localChannel = null;
let typingTimer = null;
let lastSpeech = "";
let audioContext = null;
let characterMotionTimer = null;
let characterReturnTimer = null;
let donaChicaController = null;
let welcomeTypingTimer = null;
let thinkingIntroTimer = null;
let thinkingIntroStep = null;
let heartbeatTimer = null;
let liveRefreshTimer = null;
let raffleTimer = null;
let livePageTimer = null;
let lastParticipantLoggedStep = null;

const welcomeMessage = "Olá, senhores!\n\nEu sou a Dona Chica.\n\nUma Assistente Virtual desenvolvida com Inteligência Artificial para acompanhar vocês durante esta apresentação.\n\nÉ uma grande alegria estar aqui.\n\nAntes de começarmos nossa conversa, peço que apontem a câmera do celular para o QR Code abaixo e participem das interações ao longo da apresentação.";

boot();

async function boot() {
  await initDataLayer();
  if (isPanel) initPanel();
  if (isParticipate) initParticipant();
}

async function initDataLayer() {
  if (hasFirebaseConfig) {
    try {
      const appModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js");
      const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js");
      const firebaseApp = appModule.initializeApp(firebaseConfig);
      const database = dbModule.getDatabase(firebaseApp);
      const base = `sessions/${sessionId}`;
      dbApi = { ...dbModule, database, base };
      state.usingFirebase = true;
      listenFirebase();
      return;
    } catch (error) {
      console.warn("Firebase indisponível; usando modo demonstração local.", error);
    }
  }

  loadLocalState();
  state.listenersReady = true;
  window.addEventListener("storage", loadLocalState);
  if ("BroadcastChannel" in window) {
    localChannel = new BroadcastChannel("donaChicaLocalSession");
    localChannel.addEventListener("message", loadLocalState);
  }
}

function listenFirebase() {
  const { database, ref, onValue, base } = dbApi;
  onValue(ref(database, `${base}/currentStep`), (snapshot) => {
    state.currentStep = clampStep(snapshot.exists() ? Number(snapshot.val()) : WAITING_STEP);
    renderAll();
  });
  onValue(ref(database, `${base}/voteRound`), (snapshot) => {
    state.voteRound = Number(snapshot.val() || 0);
    renderAll();
  });
  onValue(ref(database, `${base}/responses`), (snapshot) => {
    state.responses = snapshot.val() || {};
    renderAll(true);
  });
  onValue(ref(database, `${base}/warmup/responses`), (snapshot) => {
    state.warmup = snapshot.val() || {};
    renderAll(true);
  });
  onValue(ref(database, `${base}/participants`), (snapshot) => {
    state.participants = snapshot.val() || {};
    renderAll();
  });
  onValue(ref(database, `${base}/liveParticipants`), (snapshot) => {
    state.liveParticipants = snapshot.val() || {};
    renderAll();
  });
  onValue(ref(database, `${base}/raffle`), (snapshot) => {
    state.raffle = snapshot.val() || null;
    renderAll();
  });
  state.listenersReady = true;
}

function loadLocalState() {
  const saved = readLocalJson("donaChicaLocalSession", {});
  state.currentStep = clampStep(saved.currentStep === undefined ? WAITING_STEP : Number(saved.currentStep));
  state.voteRound = Number(saved.voteRound || 0);
  state.responses = saved.responses || {};
  state.warmup = saved.warmup || {};
  state.participants = saved.participants || {};
  state.liveParticipants = saved.liveParticipants || {};
  state.raffle = saved.raffle || null;
  renderAll(true);
}

function readLocalJson(key, fallback) {
  try {
    return JSON.parse(readLocalValue(key) || JSON.stringify(fallback));
  } catch (error) {
    removeLocalValue(key);
    return fallback;
  }
}

function readLocalValue(key) {
  try {
    return window.localStorage?.getItem(key) || memoryStorage[key] || "";
  } catch (error) {
    participantLog("localStorage indisponivel, usando memoria", error);
    return memoryStorage[key] || "";
  }
}

function writeLocalValue(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch (error) {
    participantLog("Falha ao gravar no localStorage, usando memoria", error);
  }
  memoryStorage[key] = value;
}

function removeLocalValue(key) {
  try {
    window.localStorage?.removeItem(key);
  } catch (error) {
    participantLog("Falha ao remover do localStorage", error);
  }
  delete memoryStorage[key];
}

function participantLog(message, detail = "") {
  if (!isParticipate) return;
  console.log(`[Dona Chica /participar] ${message}`, detail);
}

function saveLocalState() {
  clearTimeout(localSaveTimer);
  localSaveTimer = setTimeout(() => {
    writeLocalValue("donaChicaLocalSession", JSON.stringify({
      currentStep: state.currentStep,
      voteRound: state.voteRound,
      responses: state.responses,
      warmup: state.warmup,
      participants: state.participants,
      liveParticipants: state.liveParticipants,
      raffle: state.raffle
    }));
    localChannel?.postMessage({ type: "session-updated" });
    window.dispatchEvent(new Event("storage"));
  }, 20);
}

function initPanel() {
  initWelcomeScreen();
  document.getElementById("prevStep").addEventListener("click", () => setStep(state.currentStep - 1));
  document.getElementById("nextStep").addEventListener("click", () => setStep(state.currentStep + 1));
  document.getElementById("resetStep").addEventListener("click", resetCurrentStep);
  document.getElementById("resetAll").addEventListener("click", resetAll);
  document.getElementById("raffleBook")?.addEventListener("click", raffleBook);
  document.addEventListener("keydown", (event) => {
    unlockAudio();
    const key = event.key.toLowerCase();
    if (key === "n") setStep(state.currentStep + 1);
    if (key === "b") setStep(state.currentStep - 1);
    if (key === "r") resetCurrentStep();
    if (key === "t") resetAll();
  });
  document.addEventListener("click", unlockAudio, { once: true });
  startCharacterPresence();
  liveRefreshTimer = setInterval(() => renderAll(), 5000);
  livePageTimer = setInterval(advanceLiveParticipantsPage, 5200);
  renderAll();
}

function initWelcomeScreen() {
  buildWelcomeQrCode();
  typeWelcomeMessage();
  if (state.currentStep !== WAITING_STEP) {
    document.getElementById("welcomeScreen")?.classList.add("hidden");
  }
  document.getElementById("startPresentation")?.addEventListener("click", async () => {
    unlockAudio();
    await setStep(WARMUP_STEP);
    const welcome = document.getElementById("welcomeScreen");
    welcome?.classList.add("leaving");
    setTimeout(() => {
      welcome?.classList.add("hidden");
      setPanelSpeech(steps[WARMUP_STEP].speech);
      setCharacterState("listening");
    }, 720);
  });
}

function showWelcomeScreen() {
  document.querySelector(".stage")?.classList.remove("goodbye-mode");
  const welcome = document.getElementById("welcomeScreen");
  if (!welcome) return;
  welcome.classList.remove("hidden", "leaving");
  typeWelcomeMessage();
}

function typeWelcomeMessage() {
  const target = document.getElementById("welcomeText");
  if (!target) return;
  clearInterval(welcomeTypingTimer);
  target.textContent = "";
  let index = 0;
  welcomeTypingTimer = setInterval(() => {
    target.textContent = welcomeMessage.slice(0, index);
    index += 3;
    if (index > welcomeMessage.length + 1) {
      target.textContent = welcomeMessage;
      clearInterval(welcomeTypingTimer);
    }
  }, 20);
}

function initParticipant() {
  ensureAnonymousId();
  startLivePresence();
  renderAll();
}

function renderAll(allowPulse = false) {
  if (!steps || !steps.length) return;
  const total = totalInteractions();
  const participantCount = Object.keys(state.participants).length;
  const liveCount = getActiveLiveParticipants().length;
  if (isPanel) {
    renderPanel();
    if (!state.panelHasRendered) {
      state.lastTotal = total;
      state.lastParticipantCount = participantCount;
      state.lastLiveParticipantCount = liveCount;
      state.lastStep = state.currentStep;
      state.panelHasRendered = true;
      return;
    }
    if (state.currentStep !== state.lastStep) {
      animateStepChange();
      notify("Nova conversa aberta");
      playTone(420, 0.04, 0.03);
    }
    if (allowPulse && total > state.lastTotal) {
      pulseLantern();
      notify(total - state.lastTotal === 1 ? "Nova resposta registrada" : `+${total - state.lastTotal} respostas`);
      playTone(660, 0.035, 0.025);
    }
    if (participantCount > state.lastParticipantCount) {
      reactToParticipants(participantCount - state.lastParticipantCount);
    }
    if (liveCount > state.lastLiveParticipantCount) {
      reactToLiveParticipants(liveCount - state.lastLiveParticipantCount, liveCount);
    }
  }
  if (isParticipate) renderParticipant();
  state.lastTotal = total;
  state.lastParticipantCount = participantCount;
  state.lastLiveParticipantCount = liveCount;
  state.lastStep = state.currentStep;
}

function renderPanel() {
  if (state.currentStep === WAITING_STEP) return;
  document.querySelector(".stage")?.classList.toggle("goodbye-mode", state.currentStep === GOODBYE_STEP);
  if (state.currentStep === RAFFLE_STEP) {
    renderRaffleStep();
    return;
  }
  if (state.currentStep === GOODBYE_STEP) {
    renderGoodbyeStep();
    return;
  }
  const step = steps[state.currentStep];
  const dominant = getDominantOption(state.currentStep);
  const speech = dominant ? buildAdaptiveSpeech(step, dominant) : step.speech;
  if (shouldShowThinkingIntro(step)) {
    showThinkingIntro(speech);
  } else {
    setPanelSpeech(speech);
  }
  setText("connectionStatus", state.usingFirebase ? "Ao vivo via Firebase" : "Modo local");
  renderAudienceMood();
  renderOptions("panelOptions", step, false);
  renderChart(step);
  renderLiveParticipants();
}

function renderParticipant() {
  if (lastParticipantLoggedStep !== state.currentStep) {
    participantLog("etapa atual recebida", state.currentStep);
    lastParticipantLoggedStep = state.currentStep;
  }
  if (state.currentStep === WAITING_STEP) {
    renderParticipantWaiting();
    return;
  }
  if (state.currentStep >= RAFFLE_STEP) {
    renderParticipantFinalState();
    return;
  }
  if (!getParticipantName()) {
    renderNameForm();
    return;
  }
  const step = steps[state.currentStep];
  setText("mobileStep", getParticipantStepLabel());
  setText("mobileSpeech", step.participantSpeech || step.speech);
  {
    renderOptions("mobileOptions", step, true);
    const alreadyVoted = hasVoted(state.currentStep);
    const votedMessage = isWarmupStep(step) ? "Resposta enviada. Agora você já sabe como participar ;)" : "✓ A Dona Chica anotou isso. Aguardando a próxima conversa...";
    setText("voteMessage", alreadyVoted ? votedMessage : "");
  }
}

function renderParticipantWaiting() {
  const currentName = getParticipantName();
  if (currentName) markLivePresenceInactive();
  removeLocalValue("donaChicaName");
  setText("mobileStep", "Sala de espera");
  setText("mobileSpeech", "Olá, tudo bem? Aguarde um instante ;)");
  const target = document.getElementById("mobileOptions");
  if (target) {
    target.innerHTML = `
      <div class="waiting-card">
        <img src="../assets/character-states/dona-chica-happy.png" alt="Dona Chica">
        <p>A Dona Chica já já começa a conversa.</p>
      </div>
    `;
  }
  setText("voteMessage", "");
}

function renderNameForm() {
  setText("mobileStep", "Entrada ao vivo");
  setText("mobileSpeech", "Antes de começar, diga seu nome para a Dona Chica:");
  const target = document.getElementById("mobileOptions");
  if (!target) return;
  target.innerHTML = `
    <form id="nameForm" class="name-form">
      <label for="participantName">Seu nome</label>
      <input id="participantName" type="text" inputmode="text" autocomplete="given-name" maxlength="10" placeholder="Ana">
      <div class="form-meta">
        <span id="nameError">Uma palavra, até 10 caracteres.</span>
        <strong id="nameCounter">0/10</strong>
      </div>
      <button id="nameSubmit" type="button" class="form-submit">Entrar na apresentação</button>
    </form>
  `;
  setText("voteMessage", "");
  const form = document.getElementById("nameForm");
  const input = document.getElementById("participantName");
  const counter = document.getElementById("nameCounter");
  const error = document.getElementById("nameError");
  if (!form || !input || !counter || !error) return;
  input.addEventListener("input", () => {
    const normalized = normalizeParticipantName(input.value);
    input.value = normalized;
    counter.textContent = `${normalized.length}/10`;
    error.textContent = normalized ? "Pronto para entrar." : "Digite seu nome em uma palavra.";
    touchLivePresence();
  });
  const submitName = () => {
    const name = normalizeParticipantName(input.value);
    if (!name) {
      error.textContent = "Digite seu nome para entrar.";
      return;
    }
    participantLog("nome enviado", name);
    input.blur();
    document.activeElement?.blur?.();
    const submit = document.getElementById("nameSubmit");
    if (submit) submit.disabled = true;
    saveParticipantName(name);
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitName();
  });
  bindTapAction(document.getElementById("nameSubmit"), submitName);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitName();
    }
  });
}

function renderOptions(targetId, step, clickable) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = "";
  const alreadyVoted = hasVoted(state.currentStep);
  const votedOption = getVotedOption(state.currentStep);
  step.options.forEach((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-button${votedOption === index ? " selected" : ""}`;
    button.textContent = votedOption === index ? `✓ ${label}` : label;
    button.disabled = !clickable || alreadyVoted;
    if (clickable) {
      bindTapAction(button, () => {
        participantLog("botao clicado", { step: step.id, optionIndex: index, label });
        if (!button.disabled) {
          button.classList.add("pressed");
          button.textContent = `✓ ${label}`;
        }
        vote(index);
      });
    }
    target.appendChild(button);
  });
}

function bindTapAction(element, handler) {
  if (!element) return;
  let lastActivation = 0;
  const activate = (event) => {
    if (element.disabled) return;
    const now = Date.now();
    if (now - lastActivation < 650) return;
    lastActivation = now;
    participantLog("toque recebido", event.type);
    handler(event);
  };
  element.addEventListener("click", activate);
  element.addEventListener("touchend", activate, { passive: true });
}

function getParticipantStepLabel() {
  if (isWarmupStep(steps[state.currentStep])) return "Aquecimento";
  return `Pergunta ${getMainStepNumber(state.currentStep)} de ${getMainSteps().length}`;
}

function getMainSteps() {
  return steps.filter((step) => !isWarmupStep(step));
}

function getMainStepNumber(stepIndex) {
  return Math.max(1, steps.slice(0, stepIndex + 1).filter((step) => !isWarmupStep(step)).length);
}

function renderChart(step) {
  const target = document.getElementById("chart");
  if (!target) return;
  const counts = getStepCounts(state.currentStep);
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (step.focusDominantResult && total > 0) {
    renderDominantChart(target, step, counts, total);
    return;
  }
  target.className = "chart apple-chart";
  target.innerHTML = "";
  const max = Math.max(1, ...counts);
  step.options.forEach((label, index) => {
    const percent = total ? Math.round((counts[index] / total) * 100) : 0;
    const isLeader = counts[index] > 0 && counts[index] === max;
    const row = document.createElement("div");
    row.className = `chart-row${isLeader ? " leader" : ""}`;
    row.innerHTML = `
      <div class="chart-label">
        <span>${label}</span>
        <strong>${percent}%</strong>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
      <em>${counts[index]} resposta${counts[index] === 1 ? "" : "s"}</em>
    `;
    target.appendChild(row);
  });
}

function renderDominantChart(target, step, counts, total) {
  const dominant = getDominantOption(state.currentStep);
  const percent = dominant ? Math.round((dominant.count / total) * 100) : 0;
  target.className = "chart apple-chart dominant-chart";
  target.innerHTML = `
    <div class="dominant-result">
      <span>Opinião mais presente</span>
      <strong>${dominant?.label || step.options[0]}</strong>
      <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
      <em>${percent}% · ${dominant?.count || 0} resposta${dominant?.count === 1 ? "" : "s"}</em>
    </div>
  `;
}

function renderAudienceMood() {
  const target = document.getElementById("audienceMood");
  if (!target) return;
  const mood = getAudienceMood();
  target.className = `mood-pill ${mood.tone}`;
  target.innerHTML = `
    <span>${mood.icon}</span>
    <div>
      <small>Humor da Plateia</small>
      <strong>${mood.label}</strong>
    </div>
  `;
}

function getAudienceMood() {
  const interactions = totalInteractions();
  const participantCount = Object.keys(state.participants).length;
  const currentDominant = getDominantOption(state.currentStep);
  const experienceDominant = getDominantByStepId("experiencia-ia");
  const difficultyDominant = getDominantByStepId("dificuldades");
  const educationDominant = getDominantByStepId("ia-educacao");
  const expectationDominant = getDominantByStepId("compromisso-ia-educacao");

  if (expectationDominant?.label === "👩‍🏫 Ensinar os alunos a usar") {
    return { icon: "🌱", label: "Cuidadosa", tone: "careful" };
  }
  if (difficultyDominant && ["Confiar nas respostas", "Medo de uso inadequado"].includes(difficultyDominant.label)) {
    return { icon: "🤔", label: "Reflexiva", tone: "reflective" };
  }
  if (educationDominant?.label === "Uma oportunidade" || experienceDominant?.label === "Uso todos os dias") {
    return { icon: "🚀", label: "Engajada", tone: "engaged" };
  }
  if (interactions >= 40 || participantCount >= 25) {
    return { icon: "🔥", label: "Aquecida", tone: "warm" };
  }
  if (currentDominant && currentDominant.count >= 8) {
    return { icon: "✨", label: "Participativa", tone: "participative" };
  }
  if (experienceDominant?.label === "Nunca usei") {
    return { icon: "😊", label: "Curiosa", tone: "curious" };
  }
  return { icon: "😊", label: "Curiosa", tone: "curious" };
}

function renderLiveParticipants() {
  const target = document.getElementById("liveParticipants");
  if (!target) return;
  const active = getActiveLiveParticipants();
  const pageSize = getLivePageSize();
  const totalPages = Math.max(1, Math.ceil(active.length / pageSize));
  if (state.livePage >= totalPages) state.livePage = 0;
  const visible = active.slice(state.livePage * pageSize, state.livePage * pageSize + pageSize);
  target.innerHTML = "";
  if (active.length) {
    visible.forEach((participant, index) => {
      const chip = document.createElement("span");
      chip.className = "live-chip";
      chip.style.setProperty("--delay", `${Math.min(index * 35, 520)}ms`);
      chip.textContent = participant.name;
      target.appendChild(chip);
    });
  }
  renderRaffleResult();
}

function getLivePageSize() {
  const target = document.getElementById("liveParticipants");
  if (!target) return 42;
  const width = target.clientWidth || 900;
  const height = target.clientHeight || 120;
  const columns = Math.max(4, Math.floor(width / 108));
  const rows = Math.max(1, Math.floor(height / 38));
  return Math.max(12, columns * rows);
}

function advanceLiveParticipantsPage() {
  if (!isPanel) return;
  const total = getActiveLiveParticipants().length;
  const pageSize = getLivePageSize();
  if (total <= pageSize) {
    state.livePage = 0;
    return;
  }
  state.livePage = (state.livePage + 1) % Math.ceil(total / pageSize);
  renderLiveParticipants();
}

function renderRaffleResult() {
  const target = document.getElementById("raffleResult");
  if (!target) return;
  if (!state.raffle?.winner) {
    target.textContent = "";
    target.classList.remove("visible");
    return;
  }
  target.classList.add("visible");
  target.classList.remove("spinning");
  target.innerHTML = `<span>E o livro vai para...</span><strong>${state.raffle.winner}</strong>`;
}

async function vote(optionIndex) {
  const voteKey = getVoteKey(state.currentStep);
  if (hasVoted(state.currentStep) || pendingVotes.has(voteKey)) return;
  pendingVotes.add(voteKey);
  updateLivePresence(true).catch((error) => participantLog("erro no heartbeat antes do voto", error));
  const anonymousId = ensureAnonymousId();
  const selectedLabel = steps[state.currentStep].options[optionIndex];
  participantLog("voto enviado", { step: steps[state.currentStep].id, optionIndex, selectedLabel });
  if (steps[state.currentStep].id === "quem-esta-aqui") {
    writeLocalValue("donaChicaRole", selectedLabel);
  }
  markVoted(state.currentStep, optionIndex);
  setText("voteMessage", isWarmupStep(steps[state.currentStep]) ? "Resposta enviada. Agora você já sabe como participar ;)" : "✓ A Dona Chica anotou isso. Aguardando a próxima conversa...");
  renderParticipant();

  if (state.usingFirebase) {
    try {
      const { database, ref, runTransaction, update, push, serverTimestamp, base } = dbApi;
      const stepId = steps[state.currentStep].id;
      const responsePath = isWarmupStep(steps[state.currentStep]) ? `${base}/warmup/responses/${optionIndex}` : `${base}/responses/${stepId}/${optionIndex}`;
      await runTransaction(ref(database, responsePath), (value) => (value || 0) + 1);
      await update(ref(database, `${base}/participants/${anonymousId}`), { lastSeen: serverTimestamp() });
      await push(ref(database, `${base}/logs`), {
        anonymousId,
        stepId,
        optionIndex,
        createdAt: serverTimestamp()
      });
      participantLog("voto confirmado no Firebase", { step: stepId, optionIndex });
    } catch (error) {
      participantLog("erro ao enviar voto para Firebase", error);
      setText("voteMessage", "Resposta marcada na tela. Verifique sua conexão se a mensagem persistir.");
    } finally {
      pendingVotes.delete(voteKey);
    }
    return;
  }

  const stepId = steps[state.currentStep].id;
  if (isWarmupStep(steps[state.currentStep])) {
    state.warmup[optionIndex] = (state.warmup[optionIndex] || 0) + 1;
  } else {
    state.responses[stepId] = state.responses[stepId] || {};
    state.responses[stepId][optionIndex] = (state.responses[stepId][optionIndex] || 0) + 1;
  }
  state.participants[anonymousId] = { lastSeen: Date.now() };
  saveLocalState();
  renderAll(true);
  pendingVotes.delete(voteKey);
}

async function setStep(nextStep) {
  const next = clampStep(nextStep);
  if (next !== state.currentStep) {
    clearTimeout(thinkingIntroTimer);
    thinkingIntroStep = null;
  }
  state.currentStep = next;
  if (isPanel && state.currentStep === WAITING_STEP) {
    showWelcomeScreen();
  }
  if (state.usingFirebase) {
    const { database, ref, set, base } = dbApi;
    await set(ref(database, `${base}/currentStep`), state.currentStep);
  } else {
    saveLocalState();
    renderAll();
  }
}

async function resetCurrentStep() {
  if (state.currentStep === WAITING_STEP || state.currentStep >= RAFFLE_STEP) return;
  const stepId = steps[state.currentStep].id;
  const nextRound = Date.now();
  if (state.usingFirebase) {
    const { database, ref, remove, set, base } = dbApi;
    if (isWarmupStep(steps[state.currentStep])) {
      await remove(ref(database, `${base}/warmup/responses`));
    } else {
      await remove(ref(database, `${base}/responses/${stepId}`));
    }
    await set(ref(database, `${base}/voteRound`), nextRound);
  } else {
    if (isWarmupStep(steps[state.currentStep])) {
      state.warmup = {};
    } else {
      delete state.responses[stepId];
    }
    state.voteRound = nextRound;
    saveLocalState();
    renderAll();
  }
}

async function resetAll() {
  if (!confirm("Resetar toda a apresentação da Dona Chica?")) return;
  const nextRound = Date.now();
  removeLocalValue("donaChicaRole");
  removeLocalValue("donaChicaName");
  if (state.usingFirebase) {
    const { database, ref, set, base } = dbApi;
    await set(ref(database, base), { currentStep: WAITING_STEP, voteRound: nextRound, responses: {}, warmup: { responses: {} }, participants: {}, liveParticipants: {}, raffle: null, logs: {} });
  } else {
    state.currentStep = WAITING_STEP;
    state.voteRound = nextRound;
    state.responses = {};
    state.warmup = {};
    state.participants = {};
    state.liveParticipants = {};
    state.raffle = null;
    saveLocalState();
    renderAll();
  }
  showWelcomeScreen();
}

function shouldShowThinkingIntro(step) {
  return Boolean(step?.preThinking && state.panelHasRendered && state.currentStep !== state.lastStep && thinkingIntroStep !== state.currentStep);
}

function showThinkingIntro(nextSpeech) {
  const stage = document.querySelector(".stage");
  const analyzing = document.getElementById("analyzing");
  const step = steps[state.currentStep];
  clearTimeout(thinkingIntroTimer);
  thinkingIntroStep = state.currentStep;
  setAnalysisMessage(step.thinkingLabel || "Dona Chica está pensando...", step.thinkingSubtitle || "Preparando uma pergunta de reflexão");
  setCharacterState("thinking");
  stage?.classList.add("thinking");
  analyzing?.classList.add("visible");
  thinkingIntroTimer = setTimeout(() => {
    stage?.classList.remove("thinking");
    analyzing?.classList.remove("visible");
    setPanelSpeech(nextSpeech);
  }, 1200);
}

function buildAdaptiveSpeech(step, dominant) {
  if (isWarmupStep(step)) {
    return step.reactions[dominant.label] || "Teste concluído. Agora vamos começar nossa conversa de verdade.";
  }
  const base = step.reactions[dominant.label] || `${step.title}: a maioria escolheu "${dominant.label}".`;
  const total = getStepCounts(state.currentStep).reduce((sum, count) => sum + count, 0);
  const percent = total ? Math.round((dominant.count / total) * 100) : 0;
  const rule = `${percent}% escolheram "${dominant.label}".`;

  const adaptations = {
    "quem-esta-aqui:Professores": "Então vou conversar com vocês como quem conversa com colegas de profissão.",
    "quem-esta-aqui:Estudantes": "Então vou trazer exemplos diretos, visuais e próximos da rotina de estudo.",
    "experiencia-ia:Nunca usei": "Ótimo. Vou evitar palavras difíceis e começar pelo essencial.",
    "experiencia-ia:Uso todos os dias": "Então posso avançar um pouco mais e mostrar usos práticos, sem ficar só na introdução.",
    "como-aprendem:Livros": "Vou respeitar esse ritmo de leitura e ligar a tecnologia ao estudo com profundidade.",
    "como-aprendem:YouTube/redes sociais": "Entendi. Vou usar mais exemplos visuais e caminhos rápidos de experimentação.",
    "dificuldades:Escrever bons prompts": "Então os comandos vão virar parte central da nossa conversa.",
    "dificuldades:Confiar nas respostas": "Então vamos falar bastante de checagem, fontes e leitura crítica.",
    "ia-educacao:Depende de como usa": "Essa é uma resposta madura. Vamos falar de intenção pedagógica, combinados e responsabilidade.",
  };

  return `${rule} ${adaptations[`${step.id}:${dominant.label}`] || base}`;
}

function getDominantOption(stepIndex) {
  if (!steps[stepIndex]?.options) return null;
  const counts = getStepCounts(stepIndex);
  const max = Math.max(...counts);
  if (max <= 0) return null;
  const optionIndex = counts.findIndex((count) => count === max);
  return { index: optionIndex, label: steps[stepIndex].options[optionIndex], count: max };
}

function getDominantByStepId(stepId) {
  const stepIndex = steps.findIndex((step) => step.id === stepId);
  return stepIndex >= 0 ? getDominantOption(stepIndex) : null;
}

function getStepCounts(stepIndex) {
  if (!steps[stepIndex]?.options) return [];
  if (isWarmupStep(steps[stepIndex])) {
    return steps[stepIndex].options.map((_, index) => Number(state.warmup[index] || 0));
  }
  const stepId = steps[stepIndex].id;
  const raw = state.responses[stepId] || {};
  return steps[stepIndex].options.map((_, index) => Number(raw[index] || 0));
}

function answeredStepCount() {
  return steps.filter((step, index) => {
    if (isWarmupStep(step)) return false;
    return getStepCounts(index).some((count) => count > 0);
  }).length;
}

function totalInteractions() {
  return steps.reduce((sum, step, index) => {
    return sum + getStepCounts(index).reduce((a, b) => a + b, 0);
  }, 0);
}

function isWarmupStep(step) {
  return step?.type === "warmup";
}

function renderRaffleStep() {
  setPanelSpeech("Agora chegou a hora do nosso sorteio! Só participam os nomes que ainda estão conectados ao vivo.");
  setText("connectionStatus", state.usingFirebase ? "Ao vivo via Firebase" : "Modo local");
  renderAudienceMood();
  const options = document.getElementById("panelOptions");
  const chart = document.getElementById("chart");
  if (options) {
    options.innerHTML = `
      <div class="raffle-stage-card">
        <span>Sorteio de livros</span>
        <strong>Participantes ativos concorrem agora</strong>
      </div>
    `;
  }
  if (chart) {
    chart.className = "chart raffle-focus";
    chart.innerHTML = `
      <button id="raffleBookFocus" type="button">Sortear livro</button>
      <p>Use somente os nomes conectados ao vivo.</p>
    `;
    document.getElementById("raffleBookFocus")?.addEventListener("click", raffleBook);
  }
  renderLiveParticipants();
}

function renderGoodbyeStep() {
  setPanelSpeech("Obrigada, foi um prazer estar com vocês :)");
  const options = document.getElementById("panelOptions");
  const chart = document.getElementById("chart");
  if (options) options.innerHTML = "";
  if (chart) {
    chart.className = "chart goodbye-card";
    chart.innerHTML = `<strong>Obrigada, foi um prazer estar com vocês :)</strong>`;
  }
  const live = document.getElementById("liveParticipants");
  if (live) live.innerHTML = "";
  renderRaffleResult();
}

function renderParticipantFinalState() {
  setText("mobileStep", state.currentStep === RAFFLE_STEP ? "Sorteio de livros" : "Encerramento");
  setText("mobileSpeech", state.currentStep === RAFFLE_STEP ? "Acompanhe o sorteio pelo painel." : "Obrigada por participar da conversa com a Dona Chica :)");
  const target = document.getElementById("mobileOptions");
  if (target) target.innerHTML = "";
  setText("voteMessage", "");
}

function normalizeParticipantName(value) {
  const firstWord = String(value || "").trim().match(/^[A-Za-zÀ-ÖØ-öø-ÿ'-]+/)?.[0] || "";
  const clean = firstWord.slice(0, 10).toLowerCase();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

function getParticipantName() {
  return readLocalValue("donaChicaName");
}

async function saveParticipantName(name) {
  const normalized = normalizeParticipantName(name);
  if (!normalized) return;
  writeLocalValue("donaChicaName", normalized);
  setText("voteMessage", "Pronto! A Dona Chica já sabe que você está por aqui ;)");
  participantLog("nome salvo", normalized);
  updateLivePresence(true).catch((error) => {
    participantLog("erro no heartbeat apos nome", error);
    setText("voteMessage", "Nome registrado. Se a conexão oscilar, continue na tela da Dona Chica.");
  });
  setTimeout(() => renderParticipant(), 160);
}

function startLivePresence() {
  ensureAnonymousId();
  clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (isParticipantPageVisible()) {
      updateLivePresence().catch((error) => participantLog("erro no heartbeat", error));
    } else {
      markLivePresenceInactive();
    }
  }, HEARTBEAT_MS);
  ["click", "input", "touchstart", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, touchLivePresence, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (isParticipantPageVisible()) {
      updateLivePresence(true).catch((error) => participantLog("erro ao reativar presenca", error));
    } else {
      markLivePresenceInactive();
    }
  });
  window.addEventListener("pageshow", () => updateLivePresence(true).catch((error) => participantLog("erro ao voltar para pagina", error)));
  window.addEventListener("pagehide", () => markLivePresenceInactive());
  window.addEventListener("beforeunload", () => markLivePresenceInactive());
  updateLivePresence().catch((error) => participantLog("erro no primeiro heartbeat", error));
}

function touchLivePresence() {
  if (!isParticipantPageVisible()) return;
  updateLivePresence().catch((error) => participantLog("erro no toque de presenca", error));
}

function isParticipantPageVisible() {
  if (!isParticipate) return false;
  return document.visibilityState !== "hidden" && !document.hidden;
}

async function updateLivePresence(force = false) {
  if (!isParticipate) return;
  if (!isParticipantPageVisible()) return;
  const name = getParticipantName();
  if (!name) return;
  const anonymousId = ensureAnonymousId();
  const payload = { name, anonymousId, lastSeen: Date.now(), isActive: true };
  if (state.usingFirebase) {
    const { database, ref, set, base } = dbApi;
    await set(ref(database, `${base}/liveParticipants/${anonymousId}`), payload);
    return;
  }
  state.liveParticipants[anonymousId] = payload;
  saveLocalState();
  if (force) renderAll();
}

function markLivePresenceInactive() {
  if (!isParticipate) return;
  const name = getParticipantName();
  if (!name) return;
  const anonymousId = ensureAnonymousId();
  if (state.usingFirebase) {
    const { database, ref, update, base } = dbApi;
    update(ref(database, `${base}/liveParticipants/${anonymousId}`), { isActive: false, lastSeen: Date.now() }).catch(() => {});
    return;
  }
  state.liveParticipants[anonymousId] = { name, anonymousId, lastSeen: Date.now(), isActive: false };
  writeLocalValue("donaChicaLocalSession", JSON.stringify({
    currentStep: state.currentStep,
    voteRound: state.voteRound,
    responses: state.responses,
    warmup: state.warmup,
    participants: state.participants,
    liveParticipants: state.liveParticipants,
    raffle: state.raffle
  }));
}

function getActiveLiveParticipants() {
  const now = Date.now();
  return Object.values(state.liveParticipants || {})
    .filter((participant) => participant?.name && participant.isActive !== false && now - Number(participant.lastSeen || 0) <= LIVE_TIMEOUT_MS)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
}

async function raffleBook() {
  const active = getActiveLiveParticipants();
  if (!active.length) {
    notify("Ainda não há participantes ativos para o sorteio");
    setPanelSpeech("Ainda não vejo nomes ativos suficientes para sortear. Peçam para a plateia permanecer conectada pelo celular.");
    return;
  }
  clearInterval(raffleTimer);
  const result = document.getElementById("raffleResult");
  setPanelSpeech("E o livro vai para...");
  let spins = 0;
  raffleTimer = setInterval(() => {
    const candidate = active[spins % active.length];
    if (result) {
      result.classList.add("visible", "spinning");
      result.innerHTML = `<span>E o livro vai para...</span><strong>${candidate.name}</strong>`;
    }
    spins += 1;
    if (spins >= 18) {
      clearInterval(raffleTimer);
      const winner = active[Math.floor(Math.random() * active.length)].name;
      state.raffle = { winner, timestamp: Date.now() };
      if (state.usingFirebase) {
        const { database, ref, set, base } = dbApi;
        set(ref(database, `${base}/raffle`), state.raffle).catch(() => {});
      } else {
        saveLocalState();
      }
      renderRaffleResult();
      setPanelSpeech(`Parabéns, ${winner}!`);
      setCharacterState("happy", 1200);
    }
  }, 95);
}

function ensureAnonymousId() {
  let id = readLocalValue("donaChicaAnonymousId");
  if (!id) {
    id = `anon-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
    writeLocalValue("donaChicaAnonymousId", id);
  }
  return id;
}

function hasVoted(stepIndex) {
  const votes = readLocalJson("donaChicaVotes", {});
  return Object.prototype.hasOwnProperty.call(votes, getVoteKey(stepIndex));
}

function markVoted(stepIndex, optionIndex) {
  const votes = readLocalJson("donaChicaVotes", {});
  votes[getVoteKey(stepIndex)] = optionIndex;
  writeLocalValue("donaChicaVotes", JSON.stringify(votes));
}

function getVoteKey(stepIndex) {
  return `${state.voteRound}:${steps[stepIndex].id}`;
}

function getVotedOption(stepIndex) {
  const votes = readLocalJson("donaChicaVotes", {});
  const value = votes[getVoteKey(stepIndex)];
  return Number.isInteger(value) ? value : null;
}

function getVotedValue(stepIndex) {
  const votes = readLocalJson("donaChicaVotes", {});
  return votes[getVoteKey(stepIndex)];
}

function getStoredRole() {
  const role = readLocalValue("donaChicaRole");
  if (role) return role;
  const roleStepIndex = steps.findIndex((step) => step.id === "quem-esta-aqui");
  const firstStepValue = getVotedOption(roleStepIndex);
  return Number.isInteger(firstStepValue) ? steps[roleStepIndex].options[firstStepValue] : "";
}

function setPanelSpeech(text) {
  const element = document.getElementById("speechText");
  if (!element || text === lastSpeech) return;
  clearInterval(typingTimer);
  setCharacterState("speaking");
  lastSpeech = text;
  element.textContent = "";
  element.closest(".speech-bubble")?.classList.add("typing");
  let index = 0;
  typingTimer = setInterval(() => {
    element.textContent = text.slice(0, index);
    index += 2;
    if (index > text.length + 1) {
      element.textContent = text;
      clearInterval(typingTimer);
      element.closest(".speech-bubble")?.classList.remove("typing");
      setCharacterState("listening", 2600);
    }
  }, 18);
}

function animateStepChange() {
  const bubble = document.getElementById("speechBubble");
  const stage = document.querySelector(".stage");
  bubble?.classList.remove("step-shift");
  stage?.classList.remove("smiling");
  if (!steps[state.currentStep]?.preThinking) {
    stage?.classList.remove("thinking");
    setCharacterState("thinking");
  }
  requestAnimationFrame(() => {
    bubble?.classList.add("step-shift");
    if (!steps[state.currentStep]?.preThinking) stage?.classList.add("thinking");
  });
  setTimeout(() => {
    if (!steps[state.currentStep]?.preThinking) {
      stage?.classList.remove("thinking");
      setCharacterState("listening");
    }
  }, 1200);
}

function reactToParticipants(delta) {
  if (delta <= 0) return;
  const message = delta >= 20 ? "Nossa! Estamos crescendo rápido!" : delta === 1 ? "Oba! Chegou mais alguém." : `Chegaram mais ${delta} participantes.`;
  notify(message);
}

function reactToLiveParticipants(delta, total) {
  if (delta <= 0) return;
  if (delta >= 12) {
    notify("Já estamos com bastante gente participando.");
    return;
  }
  if (total >= 20) {
    notify("Que bom ver essa sala cheia.");
    return;
  }
  if (total >= 5) {
    notify("Estou acompanhando quem continua comigo nessa conversa.");
    return;
  }
  notify("Continuem conectados para participar do sorteio.");
}

function notify(message) {
  const target = document.getElementById("toastStack");
  if (!target) return;
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = `✓ ${message}`;
  target.prepend(item);
  setTimeout(() => item.remove(), 3600);
}

function setAnalysisMessage(title, subtitle) {
  const analyzing = document.getElementById("analyzing");
  const titleElement = analyzing?.querySelector("strong");
  const subtitleElement = analyzing?.querySelector("em");
  if (titleElement) titleElement.textContent = title;
  if (subtitleElement) subtitleElement.textContent = subtitle;
}

function playTone(frequency, duration, gainValue) {
  if (!isPanel) return;
  try {
    audioContext = audioContext || new AudioContext();
    if (audioContext.state === "suspended") return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.value = gainValue;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Navegadores podem bloquear áudio antes da primeira interação do apresentador.
  }
}

function unlockAudio() {
  try {
    audioContext = audioContext || new AudioContext();
    audioContext.resume();
  } catch (error) {
    // Áudio é apenas um reforço sutil; a experiência visual continua completa sem ele.
  }
}

function startCharacterPresence() {
  if (!isPanel) return;
  donaChicaController = new DonaChicaController("donaChicaCharacter", "donaChicaVideo");
  donaChicaController.start();
  setCharacterState("idle");
  scheduleCharacterMotion();
}

function scheduleCharacterMotion() {
  clearTimeout(characterMotionTimer);
  const delay = 4200 + Math.random() * 5200;
  characterMotionTimer = setTimeout(() => {
    const current = document.getElementById("donaChicaCharacter")?.dataset.characterState;
    if (!["speaking", "thinking", "happy"].includes(current)) {
      const states = ["idle", "listening", "idle"];
      setCharacterState(states[Math.floor(Math.random() * states.length)]);
    }
    scheduleCharacterMotion();
  }, delay);
}

function setCharacterState(nextState, returnAfterMs = 0) {
  donaChicaController?.setState(nextState);
  clearTimeout(characterReturnTimer);
  if (returnAfterMs) {
    characterReturnTimer = setTimeout(() => setCharacterState("idle"), returnAfterMs);
  }
}

class DonaChicaController {
  constructor(frameId, videoId) {
    this.frame = document.getElementById(frameId);
    this.video = document.getElementById(videoId);
    this.state = "idle";
    this.allowedStates = new Set(["idle", "listening", "thinking", "speaking", "happy"]);
  }

  start() {
    if (!this.frame || !this.video) return;
    this.video.muted = true;
    this.video.loop = true;
    this.video.playsInline = true;
    this.video.play().catch(() => {
      // O navegador pode aguardar a primeira interação, mas o vídeo permanece pronto.
    });
    this.setState("idle");
  }

  setState(nextState) {
    if (!this.frame || !this.allowedStates.has(nextState) || this.state === nextState) return;
    this.state = nextState;
    this.frame.dataset.characterState = nextState;
  }
}

function pulseLantern() {
  const stage = document.querySelector(".stage");
  const analyzing = document.getElementById("analyzing");
  const burst = Math.max(1, totalInteractions() - state.lastTotal);
  setAnalysisMessage("Dona Chica está analisando...", "Construindo perfil da plateia");
  setCharacterState("happy");
  stage?.classList.add("response-pulse", "smiling", "thinking");
  analyzing?.classList.add("visible");
  setTimeout(() => stage?.classList.remove("response-pulse", "smiling"), 1300);
  setTimeout(() => {
    stage?.classList.remove("thinking");
    setCharacterState("listening");
  }, 1800);
  setTimeout(() => analyzing?.classList.remove("visible"), 1800);
}

function buildWelcomeQrCode() {
  const url = getAudienceUrl();
  const qr = document.getElementById("welcomeQrCode");
  if (!qr) return;
  qr.innerHTML = "";
  const img = document.createElement("img");
  img.alt = "QR Code para acessar a participação pelo celular";
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${encodeURIComponent(url)}`;
  img.addEventListener("error", () => img.remove());
  qr.appendChild(img);
  setText("welcomeAudienceUrl", url);
  setupAudienceLinkCopy(url);
}

function getAudienceUrl() {
  return new URL("../participar/", window.location.href).href;
}

function setupAudienceLinkCopy(url) {
  const button = document.getElementById("copyAudienceLink");
  if (!button) return;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      fallbackCopyText(url);
    }
    button.textContent = "✓ Link copiado";
    notify("Link da plateia copiado");
    setTimeout(() => {
      button.textContent = "📋 Copiar link da plateia";
    }, 1800);
  });
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function clampStep(value) {
  return Math.max(WAITING_STEP, Math.min(GOODBYE_STEP, Number.isFinite(value) ? value : WAITING_STEP));
}
