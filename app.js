const STORAGE_KEY = "pulse-roleplay-state";
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

const CHARACTERS = [
  {
    id: "anaya",
    name: "Anaya",
    badge: "Wife comfort",
    story:
      "It is late evening at home. The lights are soft, dinner is still warm, and Anaya has been waiting to finally sit beside you on the couch. She knows your moods, notices the little things, and wants to make tonight feel safe, romantic, and close.",
    opener:
      "The front door clicks shut. Warm lamplight pools across the room as Anaya looks up from the couch, her expression softening with quiet relief. She shifts, making space beside her, fingers brushing the cushion while the smell of dinner still hangs in the air.",
    art: "https://image.pollinations.ai/prompt/beautiful%20indian%20wife%20at%20home%20warm%20romantic%20cinematic%20portrait?width=900&height=1200&nologo=true",
  },
  {
    id: "riya",
    name: "Riya",
    badge: "Ex girlfriend",
    story:
      "A sudden rainstorm traps you and Riya under the same cafe awning after months apart. The breakup never really cooled down. There are old feelings, unresolved words, and that dangerous kind of eye contact neither of you has forgotten.",
    opener:
      "Rain drums hard against the street as Riya turns toward you beneath the narrow awning. Water clings to the loose strands of her hair. A crooked half-smile appears, but it does nothing to hide the tension in her jaw or the old ache flickering behind her eyes.",
    art: "https://image.pollinations.ai/prompt/stylish%20young%20woman%20in%20rainy%20cafe%20romantic%20cinematic%20portrait?width=900&height=1200&nologo=true",
  },
  {
    id: "meera",
    name: "Meera",
    badge: "Best friend crush",
    story:
      "Movie night is winding down, but neither of you wants the moment to end. The room is quiet, your shoulders keep brushing, and Meera keeps smiling like she is trying not to reveal something her heart has already decided.",
    opener:
      "The credits roll in a muted glow across the room. Meera stays close, her shoulder barely touching yours before pulling back and finding its way near again. She watches the screen for a beat too long, then glances over, breath catching around words she has delayed all night.",
    art: "https://image.pollinations.ai/prompt/cute%20young%20woman%20at%20movie%20night%20cozy%20romantic%20portrait?width=900&height=1200&nologo=true",
  },
  {
    id: "sana",
    name: "Sana",
    badge: "Newly married",
    story:
      "Your first weeks of marriage still feel unreal in the best way. The apartment is half-unpacked, the air smells like tea and fresh sheets, and Sana keeps finding reasons to hold your hand while dreaming out loud about the life you will build together.",
    opener:
      "Steam rises from the tea between you as Sana looks around the half-unpacked apartment with a smile too soft to hide. Her fingers linger near yours on the table, tracing absent circles on the wood, as if trying to memorize this unfinished, intimate version of home.",
    art: "https://image.pollinations.ai/prompt/newlywed%20woman%20at%20home%20cozy%20romantic%20cinematic%20portrait?width=900&height=1200&nologo=true",
  },
  {
    id: "tara",
    name: "Tara",
    badge: "Office romance",
    story:
      "The office floor is empty, city lights are glowing through the glass walls, and Tara lingers by your desk with that familiar half-smile. What started as harmless banter now feels a little too charged to call accidental.",
    opener:
      "The office has gone still except for the low hum of air-conditioning and the city lights beyond the glass. Tara pauses beside your desk, one hand resting on the chair back, her familiar half-smile edged with something more deliberate tonight.",
    art: "https://image.pollinations.ai/prompt/elegant%20office%20woman%20at%20night%20city%20lights%20romantic%20portrait?width=900&height=1200&nologo=true",
  },
  {
    id: "nisha",
    name: "Nisha",
    badge: "Childhood love",
    story:
      "The neighborhood festival is glowing with warm lights and old memories. Nisha has come back after years away, and walking beside you again feels too easy, too familiar, and maybe a little dangerous for two hearts pretending not to hope.",
    opener:
      "Festival lights blur gold across the evening as Nisha falls into step beside you with the kind of ease that belongs to old years, not distant ones. She studies you for a quiet moment, recognition and something deeper settling slowly into her expression.",
    art: "https://image.pollinations.ai/prompt/beautiful%20woman%20at%20festival%20lights%20nostalgic%20romantic%20portrait?width=900&height=1200&nologo=true",
  },
];

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
const settingsApiKeyInput = document.getElementById("settingsApiKeyInput");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const clearKeyButton = document.getElementById("clearKeyButton");

renderCharacterGrid();
restoreApp();

keyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.apiKey = apiKeyInput.value.trim();
  saveState();
  showScreen("discover");
});

backButton.addEventListener("click", () => showScreen("discover"));

if (searchInput) {
  searchInput.addEventListener("input", () => renderCharacterGrid(searchInput.value));
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
  const character = CHARACTERS.find((item) => item.id === state.activeCharacterId);
  conversation.push({ role: "user", content: outgoingText, hidden: !shouldShowUserBubble });
  chatInput.value = "";
  renderMessages(character, conversation);
  saveState();

  try {
    setChatPending(true);
    const reply = await generateCharacterReply(state.activeCharacterId, conversation);
    conversation.push({ role: "assistant", content: reply });
  } catch (error) {
    conversation.push({
      role: "system",
      content: error.message || "The reply could not be generated with the current API settings.",
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

    const character = CHARACTERS.find((item) => item.id === state.activeCharacterId);
    state.conversations[state.activeCharacterId] = [];
    ensureStarterConversation(character);
    saveState();
    renderMessages(character, getConversation(state.activeCharacterId));
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

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      apiKey: "",
      activeCharacterId: null,
      conversations: {},
    };
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
  const filteredCharacters = CHARACTERS.filter((character) => {
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
    const button = fragment.querySelector(".character-card");
    const art = fragment.querySelector(".character-card__art");
    const badge = fragment.querySelector(".character-card__badge");
    const title = fragment.querySelector("h3");
    const story = fragment.querySelector(".character-card__story");

    art.style.backgroundImage = `linear-gradient(180deg, rgba(7,12,26,0.04), rgba(7,12,26,0.3)), url("${character.art}")`;
    badge.textContent = character.badge;
    title.textContent = character.name;
    story.textContent = character.story;

    button.addEventListener("click", () => openCharacter(character.id));
    characterGrid.appendChild(fragment);
  });
}

function openCharacter(characterId) {
  const character = CHARACTERS.find((item) => item.id === characterId);
  if (!character) {
    return;
  }

  state.activeCharacterId = characterId;
  ensureStarterConversation(character);
  saveState();

  characterHero.innerHTML = `
    <div class="chat-hero__avatar" style="background-image: url('${character.art}')"></div>
    <div class="chat-hero__content">
      <h2 class="chat-hero__name">${character.name}</h2>
      <p class="chat-hero__meta">${character.badge}</p>
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

function renderMessages(character, messages) {
  chatMessages.innerHTML = "";

  const storyBlock = document.createElement("div");
  storyBlock.className = "message story";
  storyBlock.textContent = character.story;
  chatMessages.appendChild(storyBlock);

  messages.forEach((message) => {
    if (message.role === "system") {
      return;
    }

    if (message.hidden) {
      return;
    }

    const bubble = document.createElement("div");
    bubble.className = `message ${message.role}`;
    bubble.textContent = message.content;
    chatMessages.appendChild(bubble);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showScreen(screenName) {
  keyScreen.classList.toggle("active", screenName === "key");
  discoverScreen.classList.toggle("active", screenName === "discover");
  chatScreen.classList.toggle("active", screenName === "chat");
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

  const character = CHARACTERS.find((item) => item.id === characterId);
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
        throw new Error(`Request failed at ${new URL(endpoint).host} with status ${response.status}.`);
      }

      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.message ||
        data?.output;

      if (!content) {
        throw new Error(`The API responded from ${new URL(endpoint).host} without chat text.`);
      }

      return content.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
