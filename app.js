const STORAGE_KEY = "pulse-roleplay-state";
const DATA_URL = "./characters.json";
const FALLBACK_ENDPOINTS = [
  "https://gen.pollinations.ai/v1/chat/completions",
  "https://gen.pollinations.ai/openai",
  "https://text.pollinations.ai/openai",
];

const BASE_SYSTEM_PROMPT = `You are the narrator of the scene, not the character. Narrate what the characters do, say, notice, and feel around me without ever taking control of my decisions, thoughts, dialogue, or actions.

Intro: I am Syie, 24-5'9", muscular with refined precision rather than bulk. Every movement is controlled, efficient. A sharp jawline, intense eyes-observant, unreadable. Strength is evident, but restraint defines me. Beneath composure lies quiet conflict I never display.

Rules to be followed -

* Never control my decisions, thoughts, or actions
* Narration only; I remain fully autonomous
* Strict 50-word maximum per response
* Use vivid, sensory detail without excess
* Characters must be realistic, flawed, reactive
* Maintain tension, subtext, and slow pacing
* Use Indian names, settings, and grounded behavior

Scenario:`;

let characters = [];

const state = loadState();

const keyScreen = document.getElementById("keyScreen");
const discoverScreen = document.getElementById("discoverScreen");
const chatScreen = document.getElementById("chatScreen");
const keyForm = document.getElementById("keyForm");
const apiKeyInput = document.getElementById("apiKeyInput");
const searchInput = document.getElementById("searchInput");
const characterGrid = document.getElementById("characterGrid");
const characterCardTemplate = document.getElementById("characterCardTemplate");
const backButton = document.getElementById("backButton");
const characterHero = document.getElementById("characterHero");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");
const openSettingsButton = document.getElementById("openSettingsButton");
const chatSettingsButton = document.getElementById("chatSettingsButton");
const resetChatButton = document.getElementById("resetChatButton");
const settingsDialog = document.getElementById("settingsDialog");
const resetDialog = document.getElementById("resetDialog");
const settingsApiKeyInput = document.getElementById("settingsApiKeyInput");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const clearKeyButton = document.getElementById("clearKeyButton");
const confirmResetButton = document.getElementById("confirmResetButton");

bootstrapApp();

keyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.apiKey = apiKeyInput.value.trim();
  saveState();
  showScreen("discover");
});

backButton.addEventListener("click", () => showScreen("discover"));

if (searchInput) {
  searchInput.addEventListener("input", () =>
    renderCharacterGrid(searchInput.value),
  );
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  const outgoingText = text || "Continue";
  const shouldShowUserBubble = Boolean(text);

  if (!state.activeCharacterId) {
    return;
  }

  const conversation = getConversation(state.activeCharacterId);
  const character = getCharacterById(state.activeCharacterId);

  if (!character) {
    return;
  }

  conversation.push({
    role: "user",
    content: outgoingText,
    hidden: !shouldShowUserBubble,
  });
  chatInput.value = "";
  renderMessages(character, conversation);
  saveState();

  try {
    setChatPending(true);
    const reply = await generateCharacterReply(
      state.activeCharacterId,
      conversation,
    );
    conversation.push({ role: "assistant", content: reply });
  } catch (error) {
    conversation.push({
      role: "system",
      content:
        error.message ||
        "The reply could not be generated with the current API settings.",
    });
  } finally {
    setChatPending(false);
    renderMessages(character, conversation);
    saveState();
  }
});

openSettingsButton.addEventListener("click", () => {
  settingsApiKeyInput.value = state.apiKey || "";
  settingsDialog.showModal();
});

if (chatSettingsButton) {
  chatSettingsButton.addEventListener("click", () => {
    settingsApiKeyInput.value = state.apiKey || "";
    settingsDialog.showModal();
  });
}

if (resetChatButton) {
  resetChatButton.addEventListener("click", () => {
    if (!state.activeCharacterId) {
      return;
    }
    resetDialog.showModal();
  });
}

if (confirmResetButton) {
  confirmResetButton.addEventListener("click", () => {
    if (!state.activeCharacterId) {
      return;
    }

    const character = getCharacterById(state.activeCharacterId);
    if (!character) {
      return;
    }

    state.conversations[state.activeCharacterId] = [];
    ensureStarterConversation(character);
    saveState();
    renderMessages(character, getConversation(state.activeCharacterId));
    resetDialog.close();
  });
}

saveSettingsButton.addEventListener("click", () => {
  state.apiKey = settingsApiKeyInput.value.trim();
  apiKeyInput.value = state.apiKey;
  saveState();
  settingsDialog.close();
  if (!state.apiKey) {
    showScreen("key");
  }
});

clearKeyButton.addEventListener("click", () => {
  state.apiKey = "";
  state.activeCharacterId = null;
  apiKeyInput.value = "";
  settingsApiKeyInput.value = "";
  saveState();
  settingsDialog.close();
  showScreen("key");
});

async function bootstrapApp() {
  try {
    characters = await loadCharacters();
    renderCharacterGrid();
    restoreApp();
  } catch (error) {
    console.error(error);
    characterGrid.innerHTML = `
      <div class="col-span-full rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-sm leading-6 text-red-100">
        Unable to load <code>characters.json</code>. Start the app from a local server and make sure the file is present.
      </div>
    `;
    showScreen("discover");
  }
}

async function loadCharacters() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to load ${DATA_URL} with status ${response.status}.`,
    );
  }

  const data = await response.json();
  const loadedCharacters = Array.isArray(data) ? data : data.characters;

  if (!Array.isArray(loadedCharacters)) {
    throw new Error("characters.json must contain a characters array.");
  }

  return loadedCharacters;
}

function loadState() {
  try {
    return (
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        apiKey: "",
        activeCharacterId: null,
        conversations: {},
      }
    );
  } catch (error) {
    return { apiKey: "", activeCharacterId: null, conversations: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreApp() {
  apiKeyInput.value = state.apiKey || "";

  if (!state.apiKey) {
    showScreen("key");
    return;
  }

  if (state.activeCharacterId) {
    openCharacter(state.activeCharacterId);
    return;
  }

  showScreen("discover");
}

function renderCharacterGrid(query = "") {
  characterGrid.innerHTML = "";

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCharacters = characters.filter((character) => {
    if (!normalizedQuery) {
      return true;
    }

    return [character.name, character.badge, character.story]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });

  filteredCharacters.forEach((character) => {
    const fragment = characterCardTemplate.content.cloneNode(true);
    const button = fragment.querySelector("button");
    const art = fragment.querySelector("div");
    const badge = fragment.querySelector("span");
    const title = fragment.querySelector("h3");
    const story = fragment.querySelector("p");

    art.style.backgroundImage = `linear-gradient(180deg, rgba(7,12,26,0.04), rgba(7,12,26,0.3)), url("${character.art}")`;
    badge.textContent = character.badge;
    title.textContent = character.name;
    story.textContent = character.story;

    button.addEventListener("click", () => openCharacter(character.id));
    characterGrid.appendChild(fragment);
  });
}

function openCharacter(characterId) {
  const character = getCharacterById(characterId);

  if (!character) {
    return;
  }

  state.activeCharacterId = characterId;
  ensureStarterConversation(character);
  saveState();

  characterHero.innerHTML = `
    <div class="h-[40px] w-[40px] rounded-full bg-cover bg-center shrink-0" style="background-image: url('${character.art}')"></div>
    <div class="min-w-0">
      <h2 class="mb-1 truncate text-sm font-semibold">${character.name}</h2>
      <p class="truncate text-xs text-muted">${character.badge}</p>
    </div>
  `;

  renderMessages(character, getConversation(characterId));
  showScreen("chat");
}

function ensureStarterConversation(character) {
  const conversation = getConversation(character.id);

  if (conversation.length > 0) {
    return;
  }

  conversation.push({ role: "assistant", content: character.opener });
}

function getConversation(characterId) {
  if (!state.conversations[characterId]) {
    state.conversations[characterId] = [];
  }

  return state.conversations[characterId];
}

function getCharacterById(characterId) {
  return characters.find((item) => item.id === characterId);
}

function renderMessages(character, messages) {
  chatMessages.innerHTML = "";

  const storyBlock = document.createElement("div");
  storyBlock.className =
    "max-w-full rounded-2xl bg-white/5 px-4 py-3 text-sm leading-7 text-muted";
  storyBlock.textContent = character.story;
  chatMessages.appendChild(storyBlock);

  messages.forEach((message) => {
    if (message.role === "system" || message.hidden) {
      return;
    }

    const bubble = document.createElement("div");
    bubble.className =
      message.role === "assistant"
        ? "max-w-[min(72%,680px)] justify-self-start rounded-2xl bg-white/6 px-4 py-3 italic leading-7"
        : "max-w-[min(72%,680px)] justify-self-end rounded-2xl bg-gradient-to-r from-accent/95 to-accentStrong/95 px-4 py-3 leading-7 text-[#16110a]";
    bubble.textContent = message.content;
    chatMessages.appendChild(bubble);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showScreen(screenName) {
  keyScreen.classList.toggle("hidden", screenName !== "key");
  keyScreen.classList.toggle("block", screenName === "key");
  discoverScreen.classList.toggle("hidden", screenName !== "discover");
  discoverScreen.classList.toggle("block", screenName === "discover");
  chatScreen.classList.toggle("hidden", screenName !== "chat");
  chatScreen.classList.toggle("block", screenName === "chat");
}

function setChatPending(isPending) {
  chatInput.disabled = isPending;
  sendButton.disabled = isPending;
  sendButton.innerHTML = isPending ? "..." : "&#10148;";
}

async function generateCharacterReply(characterId, conversation) {
  if (!state.apiKey) {
    throw new Error("Add your Pollinations API key before starting a chat.");
  }

  const character = getCharacterById(characterId);
  const messages = [
    { role: "system", content: `${BASE_SYSTEM_PROMPT} ${character.story}` },
    ...conversation
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content })),
  ];

  let lastError = new Error("No compatible Pollinations endpoint responded.");

  for (const endpoint of FALLBACK_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.apiKey}`,
        },
        body: JSON.stringify({
          model: "openai",
          messages,
          temperature: 0.9,
          private: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Request failed at ${new URL(endpoint).host} with status ${response.status}.`,
        );
      }

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.message ||
        data?.output;

      if (!content) {
        throw new Error(
          `The API responded from ${new URL(endpoint).host} without chat text.`,
        );
      }

      return content.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
