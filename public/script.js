/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

const $ = (id) => document.getElementById(id);

const socket = io();

let currentUser = null;
let currentRoomCode = null;
let isRoomHost = false;
let selectedAdminUser = null;
let classesData = [];

const ADMIN_PSEUDO = "creator2026";


/* =====================================
   PAGES
===================================== */

const pages = [
  "gameLobby",
  "classesPage",
  "questsPage",
  "friendsPage",
  "rankingPage",
  "settingsPage",
  "adminPage"
];

function hidePages() {
  pages.forEach((pageId) => {
    const page = $(pageId);

    if (page) {
      page.classList.add("hidden");
    }
  });

  const backButton = $("backButton");

  if (backButton) {
    backButton.classList.add("hidden");
  }
}

function openPage(pageId) {
  hidePages();

  const page = $(pageId);

  if (page) {
    page.classList.remove("hidden");
  }

  const backButton = $("backButton");

  if (backButton) {
    backButton.classList.remove("hidden");
  }
}


/* =====================================
   RETOUR
===================================== */

$("backButton")?.addEventListener("click", () => {
  hidePages();
});


/* =====================================
   NAVIGATION
===================================== */

$("playButton")?.addEventListener("click", () => {
  openPage("gameLobby");

  currentRoomCode = null;
  isRoomHost = false;

  $("startGameButton")?.classList.add("hidden");

  loadRooms();
});

$("classesButton")?.addEventListener("click", async () => {
  openPage("classesPage");

  await loadClasses();
});

$("questsButton")?.addEventListener("click", async () => {
  openPage("questsPage");

  await loadQuests();
});

$("friendsButton")?.addEventListener("click", () => {
  openPage("friendsPage");

  if ($("friendResult")) {
    $("friendResult").innerHTML = "";
  }
});

$("rankingButton")?.addEventListener("click", async () => {
  openPage("rankingPage");

  await loadRanking();
});

$("settingsButton")?.addEventListener("click", () => {
  openPage("settingsPage");
});


/* =====================================
   CONNEXION / INSCRIPTION
===================================== */

function showLogin() {
  $("loginForm")?.classList.remove("hidden");
  $("registerForm")?.classList.add("hidden");

  $("loginTab")?.classList.add("active");
  $("registerTab")?.classList.remove("active");

  if ($("authMessage")) {
    $("authMessage").textContent = "";
  }
}

function showRegister() {
  $("registerForm")?.classList.remove("hidden");
  $("loginForm")?.classList.add("hidden");

  $("registerTab")?.classList.add("active");
  $("loginTab")?.classList.remove("active");

  if ($("authMessage")) {
    $("authMessage").textContent = "";
  }
}

$("loginTab")?.addEventListener("click", showLogin);

$("registerTab")?.addEventListener("click", showRegister);


/* =====================================
   INSCRIPTION
===================================== */

$("registerForm")?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const pseudo =
      $("registerPseudo")?.value.trim();

    const email =
      $("registerEmail")?.value.trim();

    const password =
      $("registerPassword")?.value;

    if (!pseudo || !email || !password) {
      $("authMessage").textContent =
        "❌ Remplis tous les champs.";

      return;
    }

    $("authMessage").textContent =
      "⏳ Création du compte...";

    try {
      const response = await fetch(
        "/api/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            pseudo,
            email,
            password
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        $("authMessage").textContent =
          "❌ " +
          (data.message ||
            "Erreur lors de la création.");

        return;
      }

      loginUser(data.user);

    } catch (error) {
      console.error(error);

      $("authMessage").textContent =
        "❌ Impossible de joindre le serveur.";
    }
  }
);


/* =====================================
   CONNEXION
===================================== */

$("loginForm")?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const pseudo =
      $("loginPseudo")?.value.trim();

    const password =
      $("loginPassword")?.value;

    if (!pseudo || !password) {
      $("authMessage").textContent =
        "❌ Remplis tous les champs.";

      return;
    }

    $("authMessage").textContent =
      "⏳ Connexion...";

    try {
      const response = await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            pseudo,
            password
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        $("authMessage").textContent =
          "❌ " +
          (data.message ||
            "Connexion impossible.");

        return;
      }

      loginUser(data.user);

    } catch (error) {
      console.error(error);

      $("authMessage").textContent =
        "❌ Impossible de joindre le serveur.";
    }
  }
);


/* =====================================
   UTILISATEUR
===================================== */

async function refreshSavedAccount(pseudo) {
  try {
    const response = await fetch(
      `/api/profile/${encodeURIComponent(pseudo)}`
    );
    const data = await response.json().catch(()=>({}));
    if (!response.ok || !data.user) {
      // Le localStorage ne doit jamais être considéré comme le compte officiel.
      // Si le serveur ne connaît plus le compte, on demande une vraie reconnexion.
      currentUser = null;
      localStorage.removeItem("lgv7_user");
      socket.emit("userOffline");
      $("menuScreen")?.classList.add("hidden");
      $("authScreen")?.classList.remove("hidden");
      showLogin();
      if ($("authMessage")) {
        $("authMessage").textContent = "❌ Compte non retrouvé sur le serveur. Reconnecte-toi.";
      }
      return false;
    }

    currentUser = data.user;
    saveCurrentUser();
    updateProfile();
    updateAdminButton();
    socket.emit("userOnline", { pseudo: currentUser.pseudo });
    return true;
  } catch (error) {
    console.warn("Impossible de recharger le compte :", error);
  }
  return false;
}

function loginUser(user) {
  if (!user || !user.pseudo) {
    return;
  }

  currentUser = user;

  currentUser.level =
    Number(currentUser.level || 1);

  currentUser.xp =
    Number(currentUser.xp || 0);

  currentUser.coins =
    Number(currentUser.coins || 0);

  currentUser.trophies =
    Number(currentUser.trophies || 0);

  currentUser.classes =
    Array.isArray(currentUser.classes)
      ? currentUser.classes
      : [];

  saveCurrentUser();

  socket.emit("userOnline", {
    pseudo: currentUser.pseudo
  });

  $("authScreen")?.classList.add("hidden");

  $("forgotScreen")?.classList.add("hidden");

  $("menuScreen")?.classList.remove("hidden");

  hidePages();

  updateProfile();
  updateAdminButton();
}

function saveCurrentUser() {
  if (!currentUser) return;

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(currentUser)
  );
}

function updateProfile() {
  if (!currentUser) return;

  if ($("playerName")) {
    $("playerName").textContent =
      currentUser.pseudo || "Joueur";
  }

  if ($("playerTitle")) {
    $("playerTitle").textContent =
      currentUser.title ||
      "Nouveau Villageois";
  }

  if ($("playerGameRole")) {
    if (currentUser.gameRole) {
      $("playerGameRole").textContent = `🎭 Rôle : ${currentUser.gameRole}`;
      $("playerGameRole").classList.remove("hidden");
    } else {
      $("playerGameRole").classList.add("hidden");
    }
  }

  const roleEl = $("playerGameRole");
  if (roleEl) {
    if (myGameRole) {
      roleEl.textContent = `🎭 Rôle dans la partie : ${myGameRole}`;
      roleEl.classList.remove("hidden");
    } else {
      roleEl.textContent = "";
      roleEl.classList.add("hidden");
    }
  }

  if ($("profileIcon")) {
    $("profileIcon").textContent =
      currentUser.icon || "🐺";
  }

  if ($("playerLevel")) {
    $("playerLevel").textContent =
      currentUser.level || 1;
  }

  if ($("playerXp")) {
    $("playerXp").textContent =
      currentUser.xp || 0;
  }

  if ($("playerCoins")) {
    $("playerCoins").textContent =
      currentUser.coins || 0;
  }

  if ($("playerTrophies")) {
    $("playerTrophies").textContent =
      currentUser.trophies || 0;
  }

  const nowBoost=Date.now(), boosts=currentUser.boosts||{};
  const boostBox=$("activeBoosts");
  if(boostBox){
    const active=[];
    [["double_coins_until","🪙 X2 pièces"],["double_xp_until","✨ X2 XP"],["double_trophies_until","🏆 X2 trophées"]].forEach(([key,label])=>{
      const left=Number(boosts[key]||0)-nowBoost;
      if(left>0)active.push(`<span class="boost-badge">${label} — ${Math.ceil(left/60000)} min</span>`);
    });
    boostBox.innerHTML=active.join("");
    boostBox.classList.toggle("hidden",active.length===0);
  }

  updateXpBar();
}

function updateXpBar() {
  if (!currentUser) return;

  const xp =
    Number(currentUser.xp || 0);

  const level =
    Number(currentUser.level || 1);

  const xpForNextLevel =
    Math.max(100, level * 500);

  const percentage =
    Math.min(
      100,
      Math.round(
        (xp / xpForNextLevel) * 100
      )
    );

  if ($("xpProgress")) {
    $("xpProgress").style.width =
      percentage + "%";
  }
}


/* =====================================
   ADMIN
===================================== */

function isAdmin() {
  return Boolean(
    currentUser &&
    currentUser.pseudo &&
    currentUser.pseudo.toLowerCase() ===
      ADMIN_PSEUDO.toLowerCase()
  );
}

function updateAdminButton() {
  const adminButton =
    $("adminButton");

  if (!adminButton) return;

  if (isAdmin()) {
    adminButton.classList.remove("hidden");
  } else {
    adminButton.classList.add("hidden");
  }
}

$("adminButton")?.addEventListener(
  "click",
  () => {
    if (!isAdmin()) {
      alert("❌ Accès refusé.");
      return;
    }

    openPage("adminPage");
  }
);


/* =====================================
   CLASSES
===================================== */

async function loadClasses() {
  const container =
    $("classesList");

  if (!container) return;

  container.textContent =
    "Chargement...";

  try {
    const response =
      await fetch("/api/classes");

    const data =
      await response.json();

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les classes.";

      return;
    }

    classesData =
      Array.isArray(data.classes)
        ? data.classes
        : [];

    renderClasses();

  } catch (error) {
    console.error(error);

    container.textContent =
      "❌ Erreur de connexion.";
  }
}

function getClassEmoji(classId = "") {
  if (classId.startsWith("wolf")) {
    return "🐺";
  }

  if (classId.startsWith("seer")) {
    return "🔮";
  }

  if (classId.startsWith("witch")) {
    return "🧪";
  }


  if (classId.startsWith("premium")) {
    return "💎";
  }

  if (classId.startsWith("admin")) {
    return "👑";
  }

  return "🐺";
}

function renderClasses() {
  const container =
    $("classesList");

  if (!container || !currentUser) {
    return;
  }

  container.innerHTML = "";

  if (!classesData.length) {
    container.textContent =
      "Aucune classe disponible.";

    return;
  }

  classesData.forEach((classe) => {
    const owned =
      currentUser.classes.includes(
        classe.id
      );

    const equipped =
      currentUser.equippedClass ===
      classe.id;

    const card =
      document.createElement("div");

    card.className =
      "class-card" +
      (equipped
        ? " equipped"
        : "");

    const emoji =
      getClassEmoji(classe.id);

    card.innerHTML = `
      <div>
        <h3>
          ${emoji} ${classe.name}
        </h3>

        <p>
          🪙 ${classe.price}
          • 🎲 ${classe.chance}% de chance
        </p>
      </div>

      <button type="button">
        ${
          equipped
            ? "✓ Équipée"
            : owned
              ? "Équiper"
              : "Acheter"
        }
      </button>
    `;

    const button =
      card.querySelector("button");

    if (equipped) {
      button.disabled = true;
    }

    button.addEventListener(
      "click",
      () => {
        if (equipped) return;

        if (owned) {
          equipClass(classe.id);
        } else {
          buyClass(classe.id);
        }
      }
    );

    container.appendChild(card);
  });
}

async function buyClass(classId) {
  if (!currentUser) return;

  try {
    const response =
      await fetch(
        "/api/classes/buy",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            pseudo:
              currentUser.pseudo,

            classId
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        "❌ " +
        (data.message || "Erreur.")
      );

      return;
    }

    if (data.user) {
      currentUser = data.user;

      saveCurrentUser();
      updateProfile();
      renderClasses();
    }

    alert("🎉 Classe achetée !");

  } catch {
    alert("❌ Erreur de connexion.");
  }
}

async function equipClass(classId) {
  if (!currentUser) return;

  try {
    const response =
      await fetch(
        "/api/classes/equip",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            pseudo:
              currentUser.pseudo,

            classId
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        "❌ " +
        (data.message || "Erreur.")
      );

      return;
    }

    if (data.user) {
      currentUser = data.user;

      saveCurrentUser();
      updateProfile();
      renderClasses();
    }

    alert("✅ Classe équipée !");

  } catch {
    alert("❌ Erreur de connexion.");
  }
}


/* =====================================
   QUÊTES
===================================== */

async function loadQuests() {
  const container =
    $("questsList");

  if (!container) return;

  container.textContent =
    "Chargement...";

  try {
    const response =
      await fetch("/api/quests");

    const data =
      await response.json();

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les quêtes.";

      return;
    }

    renderQuests(
      Array.isArray(data.quests)
        ? data.quests
        : []
    );

  } catch {
    container.textContent =
      "❌ Erreur de connexion.";
  }
}

function renderQuests(quests) {
  const container =
    $("questsList");

  if (!container) return;

  container.innerHTML = "";

  if (!quests.length) {
    container.textContent =
      "Aucune quête disponible.";

    return;
  }

  quests.forEach((quest) => {
    const card =
      document.createElement("div");

    card.className =
      "quest-card";

    card.innerHTML = `
      <h3>${quest.title}</h3>

      <p>${quest.description}</p>

      <p>
        ✨ ${quest.xp} XP
        • 🪙 ${quest.coins} pièces
      </p>
    `;

    container.appendChild(card);
  });
}


/* =====================================
   CRÉER UN SALON
===================================== */

$("createRoomButton")?.addEventListener(
  "click",
  async () => {
    if (!currentUser?.pseudo) {
      alert("❌ Tu dois être connecté.");
      return;
    }

    // Vérifie le compte sur le serveur avant de créer le salon.
    const ok = await refreshSavedAccount(currentUser.pseudo);
    if (!ok || !currentUser?.pseudo) return;

    socket.emit("createRoom", { pseudo: currentUser.pseudo });
  }
);

socket.on(
  "roomCreated",
  (room) => {
    currentRoomCode =
      room.code;

    isRoomHost =
      true;

    if ($("joinRoomCode")) {
      $("joinRoomCode").value =
        room.code;
    }

    $("startGameButton")
      ?.classList.remove("hidden");
    $("startGameWithBotsButton")
      ?.classList.remove("hidden");

    renderCurrentRoom(room);

    alert(
      "🎮 Partie créée !\n\n" +
      "Code : " +
      room.code
    );
  }
);


/* =====================================
   REJOINDRE UN SALON
===================================== */

$("joinRoomButton")?.addEventListener(
  "click",
  () => {
    if (!currentUser) {
      alert(
        "❌ Tu dois être connecté."
      );

      return;
    }

    const input =
      $("joinRoomCode");

    const code =
      input.value
        .trim()
        .toUpperCase();

    if (!code) {
      alert(
        "❌ Entre un code."
      );

      return;
    }

    socket.emit(
      "joinRoom",
      {
        code,

        pseudo:
          currentUser.pseudo
      }
    );
  }
);

socket.on(
  "joinedRoom",
  (room) => {
    currentRoomCode =
      room.code;

    isRoomHost =
      room.host ===
      currentUser?.pseudo;

    if (isRoomHost) {
      $("startGameButton")
        ?.classList.remove("hidden");
      $("startGameWithBotsButton")
        ?.classList.remove("hidden");
    } else {
      $("startGameButton")
        ?.classList.add("hidden");
    }

    renderCurrentRoom(room);

    alert(
      "✅ Tu as rejoint la partie !"
    );
  }
);

socket.on(
  "roomUpdated",
  (room) => {
    if (
      currentRoomCode ===
      room.code
    ) {
      renderCurrentRoom(room);

      isRoomHost =
        room.host ===
        currentUser?.pseudo;

      if (isRoomHost) {
        $("startGameButton")
          ?.classList.remove("hidden");
        $("startGameWithBotsButton")
          ?.classList.remove("hidden");
      } else {
        $("startGameButton")
          ?.classList.add("hidden");
        $("startGameWithBotsButton")
          ?.classList.add("hidden");
      }
    }
  }
);

socket.on(
  "roomError",
  (message) => {
    alert("❌ " + message);
  }
);


/* =====================================
   LANCER LA PARTIE
===================================== */

$("startGameButton")?.addEventListener(
  "click",
  () => {
    if (
      !currentUser ||
      !currentRoomCode
    ) {
      alert(
        "❌ Aucune partie sélectionnée."
      );

      return;
    }

    if (!isRoomHost) {
      alert(
        "❌ Seul le créateur peut lancer la partie."
      );

      return;
    }

    socket.emit(
      "startGame",
      {
        code:
          currentRoomCode,

        pseudo:
          currentUser.pseudo
      }
    );
  }
);

$("startGameWithBotsButton")?.addEventListener(
  "click",
  () => {
    if (!currentUser || !currentRoomCode || !isRoomHost) {
      alert("❌ Seul le créateur peut lancer cette partie.");
      return;
    }

    socket.emit("startGameWithBots", {
      code: currentRoomCode,
      pseudo: currentUser.pseudo
    });
  }
);

socket.on(
  "playerSearchStarted",
  ({ duration = 10000 } = {}) => {
    document.body.dataset.lgPhase="search";
    const container = $("roomsList");
    if (!container) return;

    let remaining = Math.ceil(duration / 1000);
    container.innerHTML = `
      <div class="room-card">
        <h2>🔎 Recherche de joueurs...</h2>
        <p>Recherche pendant <strong id="searchCountdown">${remaining}s</strong>.</p>
        <p>Les places manquantes seront complétées par des bots.</p>
      </div>
    `;

    const timer = setInterval(() => {
      remaining--;
      const countdown = $("searchCountdown");
      if (countdown) countdown.textContent = `${Math.max(remaining, 0)}s`;
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
  }
);

socket.on(
  "botLoadingStarted",
  ({ duration = 10000 } = {}) => {
    document.body.dataset.lgPhase="loading";
    const container = $("roomsList");
    if (!container) return;

    let remaining = Math.ceil(duration / 1000);
    container.innerHTML = `
      <div class="room-card">
        <h2>🤖 Préparation des bots...</h2>
        <p>La partie commence dans <strong id="botCountdown">${remaining}s</strong>.</p>
      </div>
    `;

    const timer = setInterval(() => {
      remaining--;
      const countdown = $("botCountdown");
      if (countdown) countdown.textContent = `${Math.max(remaining, 0)}s`;
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
  }
);

socket.on(
  "gameStarted",
  (game) => {
    $("startGameButton")
      ?.classList.add("hidden");
    $("startGameWithBotsButton")
      ?.classList.add("hidden");

    const container =
      $("roomsList");

    if (!container) return;

    container.innerHTML = `
      <div class="room-card">

        <h2>
          🐺 La partie commence !
        </h2>

        <p>
          Les joueurs sont prêts :
        </p>

        <div id="gamePlayers"></div>

      </div>
    `;

    const playersContainer =
      $("gamePlayers");

    const players =
      Array.isArray(game.players)
        ? game.players
        : [];

    players.forEach((entry) => {
      const player = document.createElement("p");
      const pseudo = typeof entry === "string" ? entry : entry?.pseudo;
      const isBot = typeof entry === "object" && entry?.isBot;
      player.textContent = `${isBot ? "🤖" : "👤"} ${pseudo || "Joueur"}`;
      playersContainer.appendChild(player);
    });

    alert(
      "🐺 La partie commence !"
    );
  }
);


/* =====================================
   AFFICHER LE SALON
===================================== */

function renderCurrentRoom(room) {
  const container =
    $("roomsList");

  if (!container) return;

  container.innerHTML = `
    <div class="room-card">

      <h3>
        🎮 Salon ${room.code}
      </h3>

      <p>
        👑 Créateur :
        ${room.host}
      </p>

      <h4>
        Joueurs :
      </h4>

      <div id="currentPlayers"></div>

    </div>
  `;

  const playersContainer =
    $("currentPlayers");

  const players =
    Array.isArray(room.players)
      ? room.players
      : [];

  players.forEach((entry) => {
    const player =
      document.createElement("p");
    const pseudo = typeof entry === "string" ? entry : entry?.pseudo;
    const isBot = typeof entry === "object" && entry?.isBot;

    player.textContent =
      (isBot ? "🤖 " : "👤 ") + (pseudo || "Joueur");

    playersContainer.appendChild(player);
  });
}


/* =====================================
   LISTE DES SALONS
===================================== */

function loadRooms() {
  socket.emit("getRooms");
}

socket.on(
  "roomsList",
  (rooms) => {
    if (currentRoomCode) return;

    const container =
      $("roomsList");

    if (!container) return;

    if (
      !Array.isArray(rooms) ||
      !rooms.length
    ) {
      container.textContent =
        "Aucune partie disponible.";

      return;
    }

    container.innerHTML = "";

    rooms.forEach((room) => {
      const card =
        document.createElement("div");

      card.className =
        "room-card";

      card.innerHTML = `
        <strong>
          🎮 Code : ${room.code}
        </strong>

        <p>
          👑 Créateur :
          ${room.host}
        </p>

        <p>
          👥
          ${
            Array.isArray(room.players)
              ? room.players.length
              : 0
          }
          joueur(s)
        </p>

        <button type="button">
          Rejoindre
        </button>
      `;

      card
        .querySelector("button")
        .addEventListener(
          "click",
          () => {
            if (!currentUser) {
              alert(
                "❌ Tu dois être connecté."
              );

              return;
            }

            socket.emit(
              "joinRoom",
              {
                code:
                  room.code,

                pseudo:
                  currentUser.pseudo
              }
            );
          }
        );

      container.appendChild(card);
    });
  }
);


/* =====================================
   AMIS - RECHERCHE
===================================== */

$("searchFriendButton")
  ?.addEventListener(
    "click",
    async () => {
      const pseudo =
        $("friendSearch")
          ?.value
          .trim();

      const result =
        $("friendResult");

      if (!result) return;

      if (!pseudo) {
        result.textContent =
          "❌ Entre un pseudo.";

        return;
      }

      result.textContent =
        "Recherche...";

      try {
        const response =
          await fetch(
            "/api/users/" +
            encodeURIComponent(pseudo)
          );

        const data =
          await response.json();

        if (!response.ok) {
          result.textContent =
            "❌ " +
            (
              data.message ||
              "Joueur introuvable."
            );

          return;
        }

        const user =
          data.user;

        const equippedClass =
          classesData.find(
            (classe) =>
              classe.id ===
              user.equippedClass
          );

        result.innerHTML = `
          <div class="friend-card">

            <strong>
              ${user.icon || "🐺"}
              ${user.pseudo}
            </strong>

            <p>
              ${
                user.title ||
                "Nouveau Villageois"
              }
            </p>

            <p>
              ⭐ Niveau
              ${user.level || 1}

              • ✨
              ${user.xp || 0} XP

              • 🪙
              ${user.coins || 0}
            </p>

            <p>
              🐺 Classe :
              ${
                equippedClass
                  ? equippedClass.name
                  : "Aucune"
              }
            </p>

          </div>
        `;

      } catch {
        result.textContent =
          "❌ Erreur de connexion.";
      }
    }
  );


/* =====================================
   CLASSEMENT
===================================== */

async function loadRanking() {
  const container =
    $("rankingList");

  if (!container) return;

  container.textContent =
    "Chargement...";

  try {
    const response =
      await fetch("/api/ranking");

    const data =
      await response.json();

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger.";

      return;
    }

    const users =
      Array.isArray(data.users)
        ? data.users
        : [];

    container.innerHTML = "";

    if (!users.length) {
      container.textContent =
        "Aucun joueur.";

      return;
    }

    users.forEach(
      (user, index) => {
        const card =
          document.createElement("div");

        card.className =
          "ranking-card";

        card.innerHTML = `
          <strong>
            #${index + 1}
            ${user.icon || "🐺"}
            ${user.pseudo}
          </strong>

          <p>
            🏆
            ${user.trophies || 0}
            trophée(s)
          </p>

          <p>
            ⭐ Niveau
            ${user.level || 1}

            • ✨
            ${user.xp || 0} XP
          </p>
        `;

        container.appendChild(card);
      }
    );

  } catch {
    container.textContent =
      "❌ Impossible de charger.";
  }
}


/* =====================================
   ADMIN - RECHERCHE JOUEUR
===================================== */

$("adminSearchButton")
  ?.addEventListener(
    "click",
    async () => {
      if (!isAdmin()) {
        alert("❌ Accès refusé.");
        return;
      }

      const targetPseudo =
        $("adminPlayerSearch")
          ?.value
          .trim();

      const result =
        $("adminPlayerResult");

      if (!result) return;

      if (!targetPseudo) {
        result.textContent =
          "❌ Entre un pseudo.";

        return;
      }

      result.textContent =
        "Recherche...";

      try {
        const response =
          await fetch(
            "/api/admin/users/" +
            encodeURIComponent(
              targetPseudo
            ) +
            "?adminPseudo=" +
            encodeURIComponent(
              currentUser.pseudo
            )
          );

        const data =
          await response.json();

        if (!response.ok) {
          selectedAdminUser =
            null;

          result.textContent =
            "❌ " +
            (
              data.message ||
              "Joueur introuvable."
            );

          return;
        }

        selectedAdminUser =
          data.user;

        const user =
          selectedAdminUser;

        result.innerHTML = `
          <div class="friend-card">

            <h3>
              ${user.icon || "🐺"}
              ${user.pseudo}
            </h3>

            <p>
              ⭐ Niveau :
              ${user.level || 1}
            </p>

            <p>
              ✨ XP :
              ${user.xp || 0}
            </p>

            <p>
              🪙 Pièces :
              ${user.coins || 0}
            </p>

            <p>
              🏆 Trophées :
              ${user.trophies || 0}
            </p>

          </div>
        `;

      } catch {
        selectedAdminUser =
          null;

        result.textContent =
          "❌ Erreur de connexion.";
      }
    }
  );


/* =====================================
   ADMIN - TYPE DE RÉCOMPENSE
===================================== */

$("adminRewardType")
  ?.addEventListener(
    "change",
    () => {
      const type =
        $("adminRewardType").value;

      const amountContainer =
        $("adminAmountContainer");

      const classContainer =
        $("adminClassContainer");

      if (
        !amountContainer ||
        !classContainer
      ) {
        return;
      }

      if (type === "class") {
        amountContainer
          .classList.add("hidden");

        classContainer
          .classList.remove("hidden");

      } else {
        amountContainer
          .classList.remove("hidden");

        classContainer
          .classList.add("hidden");
      }
    }
  );


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

$("adminGiveButton")
  ?.addEventListener(
    "click",
    async () => {
      if (!isAdmin()) {
        alert("❌ Accès refusé.");
        return;
      }

      const message =
        $("adminMessage");

      if (!selectedAdminUser) {
        if (message) {
          message.textContent =
            "❌ Recherche d'abord un joueur.";
        }

        return;
      }

      const rewardType =
        $("adminRewardType").value;

      const amount =
        Math.max(
          0,
          Number(
            $("adminAmountInput")
              ?.value || 0
          )
        );

      let coins = 0;
      let xp = 0;
      let trophies = 0;
      let classId = "";

      if (rewardType === "coins") {
        coins = amount;
      }

      if (rewardType === "xp") {
        xp = amount;
      }

      if (rewardType === "trophies") {
        trophies = amount;
      }

      if (rewardType === "level") {
        xp = amount * 500;
      }

      if (rewardType === "class") {
        classId =
          $("adminClassSelect")
            ?.value || "";

        if (!classId) {
          message.textContent =
            "❌ Choisis une classe.";

          return;
        }
      }

      if (
        rewardType !== "class" &&
        amount <= 0
      ) {
        message.textContent =
          "❌ Entre une quantité valide.";

        return;
      }

      message.textContent =
        "⏳ Envoi...";

      try {
        const response =
          await fetch(
            "/api/admin/reward",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                adminPseudo:
                  currentUser.pseudo,

                targetPseudo:
                  selectedAdminUser.pseudo,

                coins,
                xp,
                trophies,
                classId
              })
            }
          );

        const data =
          await response.json();

        message.textContent =
          response.ok
            ? "✅ " + data.message
            : "❌ " +
              (
                data.message ||
                "Erreur."
              );

        if (
          response.ok &&
          data.user
        ) {
          selectedAdminUser =
            data.user;
        }

      } catch {
        message.textContent =
          "❌ Erreur de connexion.";
      }
    }
  );


/* =====================================
   CHANGER E-MAIL
===================================== */

$("changeEmailButton")
  ?.addEventListener(
    "click",
    async () => {
      if (!currentUser) return;

      const email =
        $("newEmail")
          ?.value
          .trim();

      const password =
        $("emailPassword")
          ?.value;

      if (!email || !password) {
        alert(
          "❌ Remplis tous les champs."
        );

        return;
      }

      try {
        const response =
          await fetch(
            "/api/account/email",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                pseudo:
                  currentUser.pseudo,

                email,
                password
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            "❌ " +
            (
              data.message ||
              "Erreur."
            )
          );

          return;
        }

        if (data.user) {
          currentUser =
            data.user;
        } else {
          currentUser.email =
            email;
        }

        saveCurrentUser();

        $("newEmail").value =
          "";

        $("emailPassword").value =
          "";

        alert(
          "✅ " +
          (
            data.message ||
            "Email modifié."
          )
        );

      } catch {
        alert(
          "❌ Erreur de connexion."
        );
      }
    }
  );


/* =====================================
   SUPPRIMER COMPTE
===================================== */

$("deleteAccountButton")
  ?.addEventListener(
    "click",
    async () => {
      if (!currentUser) return;

      const password =
        $("deletePassword")
          ?.value;

      if (!password) {
        alert(
          "❌ Entre ton mot de passe."
        );

        return;
      }

      const confirmation =
        confirm(
          "Supprimer définitivement ton compte ?"
        );

      if (!confirmation) return;

      try {
        const response =
          await fetch(
            "/api/account/delete",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                pseudo:
                  currentUser.pseudo,

                password
              })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            "❌ " +
            (
              data.message ||
              "Erreur."
            )
          );

          return;
        }

        alert("✅ Compte supprimé.");

        logout();

      } catch {
        alert(
          "❌ Erreur de connexion."
        );
      }
    }
  );


/* =====================================
   DÉCONNEXION
===================================== */

function logout() {
  if (currentUser?.pseudo) {
    socket.emit(
      "userOffline",
      {
        pseudo:
          currentUser.pseudo
      }
    );
  }

  localStorage.removeItem(
    "lgv7_user"
  );

  currentUser = null;
  currentRoomCode = null;
  isRoomHost = false;
  selectedAdminUser = null;

  $("menuScreen")
    ?.classList.add("hidden");

  $("forgotScreen")
    ?.classList.add("hidden");

  $("authScreen")
    ?.classList.remove("hidden");

  $("startGameButton")
    ?.classList.add("hidden");

  hidePages();

  showLogin();
}

$("logoutButton")
  ?.addEventListener(
    "click",
    logout
  );


/* =====================================
   MOT DE PASSE OUBLIÉ
===================================== */

$("forgotPasswordButton")
  ?.addEventListener(
    "click",
    () => {
      $("authScreen")
        ?.classList.add("hidden");

      $("forgotScreen")
        ?.classList.remove("hidden");

      if ($("forgotMessage")) {
        $("forgotMessage")
          .textContent = "";
      }
    }
  );

$("backToLoginButton")
  ?.addEventListener(
    "click",
    () => {
      $("forgotScreen")
        ?.classList.add("hidden");

      $("authScreen")
        ?.classList.remove("hidden");

      if ($("forgotMessage")) {
        $("forgotMessage")
          .textContent = "";
      }
    }
  );

$("sendResetButton")
  ?.addEventListener(
    "click",
    async () => {
      const pseudo =
        $("forgotPseudo")
          ?.value
          .trim();

      if (!pseudo) {
        $("forgotMessage").textContent =
          "❌ Entre ton pseudo.";

        return;
      }

      try {
        const response =
          await fetch(
            "/api/password/forgot",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                pseudo
              })
            }
          );

        const data =
          await response.json();

        $("forgotMessage").textContent =
          data.message ||
          "Demande envoyée.";

      } catch {
        $("forgotMessage").textContent =
          "❌ Erreur de connexion.";
      }
    }
  );


/* =====================================
   RESTAURATION DE SESSION
===================================== */

window.addEventListener(
  "load",
  () => {
    const saved =
      localStorage.getItem(
        "lgv7_user"
      );

    if (!saved) {
      showLogin();
      return;
    }

    try {
      const user =
        JSON.parse(saved);

      if (
        !user ||
        !user.pseudo
      ) {
        throw new Error(
          "Session invalide"
        );
      }

      loginUser(user);
      refreshSavedAccount(user.pseudo);

    } catch (error) {
      console.error(error);

      localStorage.removeItem(
        "lgv7_user"
      );

      showLogin();
    }
  }
);
/* =====================================================
   V8 — FONCTIONS COMPLÉMENTAIRES / GAMEPLAY COMPLET
===================================================== */

let myGameRole = null;
let myGameClassChance = 0;
let myGameTeammates = [];
let currentChatFriend = null;

["shopPage","bloodMoonPage"].forEach((id)=>{if(!pages.includes(id))pages.push(id);});

function esc(value){const d=document.createElement("div");d.textContent=String(value??"");return d.innerHTML;}
function apiJson(url, options={}){return fetch(url,options).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Erreur serveur");return d;});}

/* MENU */
$("shopButton")?.addEventListener("click",async()=>{openPage("shopPage");await loadShopV8();});
$("bloodMoonButton")?.addEventListener("click",async()=>{openPage("bloodMoonPage");await loadBloodMoonV8();});

async function refreshBloodMoonButton(){
  if(!currentUser)return;
  try{const d=await apiJson(`/api/blood-moon?pseudo=${encodeURIComponent(currentUser.pseudo)}`);document.body.classList.toggle("blood-moon-active",Boolean(d.event.active));const b=$("bloodMoonButton");if(!b)return;b.classList.toggle("hidden",!d.event.active);updateBloodMoonTimer(d.event);}
  catch{}
}
function updateBloodMoonTimer(event){
  const el=$("bloodMoonTimer");if(!el)return;
  if(!event?.active||!event.endsAt){el.classList.add("hidden");return;}
  el.classList.remove("hidden");
  const tick=()=>{const left=Math.max(0,event.endsAt-Date.now());const h=Math.floor(left/3600000),m=Math.floor(left%3600000/60000),s=Math.floor(left%60000/1000);el.textContent=`🌕 Lune de Sang : ${h}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;if(left<=0){el.classList.add("hidden");refreshBloodMoonButton();}};tick();clearInterval(window._bmTimer);window._bmTimer=setInterval(tick,1000);
}

/* QUÊTES */
loadQuests = async function(){
  const c=$("questsList");if(!c||!currentUser)return;c.textContent="Chargement...";
  try{const d=await apiJson(`/api/quests?pseudo=${encodeURIComponent(currentUser.pseudo)}`);renderQuests(d.quests||[]);}catch(e){c.textContent="❌ "+e.message;}
};
renderQuests = function(quests){
  const c=$("questsList");if(!c)return;c.innerHTML="";
  quests.forEach(q=>{const card=document.createElement("div");card.className="quest-card";const pct=Math.min(100,Math.round(q.progress/q.target*100));card.innerHTML=`<h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><p>✨ ${q.xp} XP • <span class="coin-icon"></span> ${q.coins} pièces</p><div class="quest-progress"><div style="width:${pct}%"></div></div><p>${q.progress}/${q.target} ${q.claimed?"• ✅ Récupérée":""}</p>${q.completed&&!q.claimed?`<button class="main-button quest-claim" data-id="${esc(q.id)}">🎁 Récupérer</button>`:""}`;c.appendChild(card);});
  c.querySelectorAll(".quest-claim").forEach(b=>b.addEventListener("click",async()=>{try{const d=await apiJson("/api/quests/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,questId:b.dataset.id})});currentUser=d.user;saveCurrentUser();updateProfile();loadQuests();}catch(e){alert("❌ "+e.message);}}));
};

/* AMIS + SALON */
async function loadRoomFriendsV8(){
  const c=$("roomFriends");if(!c||!currentUser)return;
  try{const d=await apiJson(`/api/friends/${encodeURIComponent(currentUser.pseudo)}`);const friends=d.friends||[];c.innerHTML=`<h4>👥 Tes amis</h4>`+(friends.length?friends.map(f=>{const u=f.user||{};const can=Boolean(f.online&&!f.inRoom);return `<div class="room-friend"><span>${esc(u.icon||"🐺")} ${esc(u.pseudo)}</span><small>${f.inRoom?"🎮 En partie":f.online?"🟢 En ligne":"⚫ Hors ligne"}</small>${can?`<button class="secondary-button invite-friend" data-pseudo="${esc(u.pseudo)}">Inviter</button>`:""}</div>`}).join(""):"<p>Aucun ami.</p>");c.querySelectorAll(".invite-friend").forEach(b=>b.addEventListener("click",()=>socket.emit("inviteFriendToRoom",{code:currentRoomCode,fromPseudo:currentUser.pseudo,toPseudo:b.dataset.pseudo})));}catch(e){c.textContent="❌ "+e.message;}
}
renderCurrentRoom = function(room){
  document.body.dataset.lgPhase="salon";
  const c=$("roomsList");if(!c)return;currentRoomCode=room.code;isRoomHost=room.host===currentUser?.pseudo;
  c.innerHTML=`<div class="room-card room-main-card"><h3>🎮 Salon ${esc(room.code)}</h3><p>👑 ${esc(room.host)} • 👥 ${room.players.length}/8 ${room.ranked?"• 🏆 CLASSÉ":"• 🎮 NORMAL"}</p><div class="ranked-room-row"><label><input id="roomRankedToggle" type="checkbox" ${room.ranked?"checked":""} ${isRoomHost?"":"disabled"}> 🏆 Activer le mode classé</label></div><div id="currentPlayers"></div><div id="roomActions"></div></div>`;
  const pc=$("currentPlayers");(room.players||[]).forEach(p=>{const d=document.createElement("div");d.className="room-player-row";d.textContent=`${p.isBot?"🤖":"👤"} ${p.pseudo}`;pc.appendChild(d);});
  const a=$("roomActions");if(isRoomHost&&room.status==="waiting"){a.innerHTML=`<button id="roomStartOther" class="main-button">🐺 Lancer la partie avec d'autres joueurs</button><button id="roomStartBots" class="secondary-button">🤖 Lancer la partie avec bots</button>`;$("roomStartOther").onclick=()=>socket.emit("startGame",{code:room.code,pseudo:currentUser.pseudo});$("roomStartBots").onclick=()=>socket.emit("startGameWithBots",{code:room.code,pseudo:currentUser.pseudo});}
  $("roomRankedToggle")?.addEventListener("change",(event)=>{if(isRoomHost)socket.emit("setRoomRanked",{code:room.code,pseudo:currentUser.pseudo,ranked:event.currentTarget.checked});});
  loadRoomFriendsV8();
};

/* CLASSEMENT NORMAL / CLASSÉ */
loadRanking = async function(){
 const c=$("rankingList");if(!c||!currentUser)return;c.innerHTML=`<div class="ranking-tabs"><button id="normalRankTab" class="main-button">🏆 Trophées</button><button id="rankedRankTab" class="secondary-button">🥇 Classé</button></div><div id="rankingModeList">Chargement...</div>`;
 const load=async(mode)=>{try{const d=await apiJson(`/api/ranking?mode=${mode}`);const list=$("rankingModeList");list.innerHTML=(d.users||[]).map((u,i)=>`<div class="ranking-card"><strong>#${i+1} ${esc(u.icon||"🐺")} ${esc(u.pseudo)}</strong><p>${mode==="ranked"?`🥇 ${esc(u.rankedRank)} • ${u.rankedPoints||0} points`:`🏆 ${u.trophies||0} trophée(s)`}</p><p>⭐ Niveau ${u.level||1} • ✨ ${u.xp||0} XP</p></div>`).join("")||"Aucun joueur.";}catch(e){$("rankingModeList").textContent="❌ "+e.message;}};
 $("normalRankTab").onclick=()=>load("normal");$("rankedRankTab").onclick=()=>load("ranked");load("normal");
};

/* NOTIFICATIONS */
function renderNotification(n){
  const wrap=document.createElement("div");wrap.className="notification-card";wrap.dataset.notificationId=n.id;
  wrap.innerHTML=`<strong>${esc(n.title)}</strong><p>${esc(n.message)}</p>`;
  if(n.reward&&!n.claimed){
    const b=document.createElement("button");b.className="main-button";b.textContent="Récupérer";
    b.onclick=async()=>{try{const d=await apiJson("/api/notifications/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,notificationId:n.id})});currentUser=d.user;saveCurrentUser();updateProfile();wrap.remove();}catch(e){alert("❌ "+e.message);}};
    wrap.appendChild(b);
  }
  const age=Math.max(0,Date.now()-Number(n.createdAt||Date.now()));
  const remaining=Math.max(1000,30000-age);
  setTimeout(()=>wrap.remove(),remaining);
  return wrap;
}
async function loadNotificationsV8(){if(!currentUser)return;try{const d=await apiJson(`/api/notifications/${encodeURIComponent(currentUser.pseudo)}`);const c=$("notifications");if(!c)return;c.innerHTML="";(d.notifications||[]).slice(0,8).forEach(n=>c.appendChild(renderNotification(n)));}catch{}}
socket.on("notification",n=>{const c=$("notifications");if(c)c.prepend(renderNotification(n));});
socket.on("profileUpdated",u=>{if(currentUser&&u.pseudo===currentUser.pseudo){currentUser=u;saveCurrentUser();updateProfile();}});
socket.on("roomInvitation",()=>loadNotificationsV8());
socket.on("roomInviteResult",()=>loadNotificationsV8());

/* ADMIN */
async function loadAdminV8(){
 if(!isAdmin())return;try{const d=await apiJson(`/api/admin/bootstrap?adminPseudo=${encodeURIComponent(currentUser.pseudo)}`);const uc=$("adminUsersList"),cc=$("adminClassesList"),sel=$("adminClassSelect"),selAll=$("adminAllClassSelect");
  if(sel)sel.innerHTML=`<option value="">Choisir une classe</option>`+d.classes.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} — ${x.price} 🪙 / ${x.chance}%</option>`).join("");if(selAll)selAll.innerHTML=`<option value="">Aucune classe</option>`+d.classes.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} — ${x.price} 🪙 / ${x.chance}%</option>`).join("");
  if(cc)cc.innerHTML=`<h4>🐺 Classes</h4>`+d.classes.map(x=>`<div class="admin-class-row"><b>${esc(x.name)}</b><span>${x.price} 🪙 • ${x.chance}%</span></div>`).join("");
  renderAdminBoostsV16(d.globalBoosts);
  if(uc)uc.innerHTML=`<h4>👥 ${d.users.length} joueur(s)</h4>`+d.users.map(u=>`<div class="admin-user-row"><span>${esc(u.icon||"🐺")} ${esc(u.pseudo)}</span><small>🪙${u.coins||0} • ✨${u.xp||0} • 🏆${u.trophies||0} • ${esc(u.rankedRank||"Bois")}</small><button class="secondary-button admin-select-user" data-pseudo="${esc(u.pseudo)}">Sélectionner</button></div>`).join("");uc?.querySelectorAll(".admin-select-user").forEach(b=>b.onclick=()=>{$("adminPlayerSearch").value=b.dataset.pseudo;$ ("adminSearchButton")?.click();});
 }catch(e){$("adminMessage").textContent="❌ "+e.message;}
}
$("adminButton")?.addEventListener("click",()=>setTimeout(loadAdminV8,50));
$("adminRewardType")?.addEventListener("change",()=>{});

function renderAdminBoostsV16(boosts){
  const map={coins:"Coins",xp:"Xp",trophies:"Trophies"};
  const now=Date.now();
  Object.entries(map).forEach(([type,label])=>{
    const b=boosts?.[type]||{multiplier:1,until:0};
    const el=$("adminBoost"+label+"Status");
    if(!el)return;
    const left=Math.max(0,Number(b.until||0)-now);
    el.textContent=left>0?`⚡ x${b.multiplier} actif • encore ${Math.ceil(left/60000)} min`:"Aucun bonus actif";
  });
}

async function activateAdminBoostV16(type,multiplier){
  if(!currentUser||!isAdmin())return;
  const msg=$("adminBoostMessage");
  try{
    const d=await apiJson("/api/admin/global-boost",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        adminPseudo:currentUser.pseudo,
        type,
        multiplier,
        durationMinutes:10
      })
    });
    renderAdminBoostsV16(d.globalBoosts);
    if(msg)msg.textContent="✅ "+d.message;
  }catch(e){
    if(msg)msg.textContent="❌ "+e.message;
  }
}

document.querySelectorAll(".admin-boost-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const wrap=btn.closest("[data-boost-type]");
    if(!wrap)return;
    activateAdminBoostV16(wrap.dataset.boostType,Number(btn.dataset.mult));
  });
});

$("adminBloodMoonButton")?.addEventListener("click",async()=>{if(!isAdmin())return;try{const d=await apiJson("/api/admin/blood-moon/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminPseudo:currentUser.pseudo})});$("adminBloodMoonMessage").textContent="✅ "+d.message;refreshBloodMoonButton();}catch(e){$("adminBloodMoonMessage").textContent="❌ "+e.message;}});
socket.on("bloodMoonStatusChanged",()=>{refreshBloodMoonButton();});
socket.on("globalBoostUpdated",data=>{
  if(isAdmin())loadAdminV8();
  if(data?.boost)updateProfile();
});
socket.on("voteError",data=>{alert("🗳️ "+(data?.message||"Vote refusé."));});

$("adminRewardAllButton")?.addEventListener("click",async()=>{if(!isAdmin())return;try{const d=await apiJson("/api/admin/reward-all-now",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminPseudo:currentUser.pseudo,coins:Number($("adminAllCoins")?.value||0),xp:Number($("adminAllXp")?.value||0),trophies:Number($("adminAllTrophies")?.value||0),classId:$("adminAllClassSelect")?.value||"",onlineOnly:Boolean($("adminOnlineOnly")?.checked)})});$("adminAllMessage").textContent="✅ "+d.message;loadAdminV8();}catch(e){$("adminAllMessage").textContent="❌ "+e.message;}});

/* Récompense individuelle : trophées */
const oldAdminGive=window._adminGiveV8;
$("adminGiveButton")?.addEventListener("click",()=>{});
// Le listener historique est conservé ; le serveur accepte désormais les récompenses en attente.

/* CHAT */
$("chatEnabledToggle")?.addEventListener("change",async()=>{try{const d=await apiJson("/api/settings/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,chatEnabled:$ ("chatEnabledToggle").checked})});currentUser=d.user;saveCurrentUser();}catch(e){alert("❌ "+e.message);}});

/* BOUTIQUE */
async function loadShopV8(){
 const c=$("shopList");if(!c||!currentUser)return;c.textContent="Chargement...";
 try{
  const d=await apiJson("/api/shop"); const now=Date.now(); const boosts=currentUser.boosts||{};
  const left=id=>Math.max(0,Number(boosts[id+"_until"]||0)-now);
  const label=id=>{const ms=left(id);return ms>0?`<span class="boost-active">✦ X2 actif encore ${Math.ceil(ms/60000)} min</span>`:"";};
  c.innerHTML=(d.items||[]).map(i=>{const affordable=Number(currentUser.coins||0)>=Number(i.price||0);return `<div class="shop-card"><h3>🛒 ${esc(i.name)}</h3><p>${esc(i.description||"")}</p><p><span class="coin-icon"></span> ${i.price}</p>${i.id!=="blood_quarter"?label(i.id):""}<button class="main-button shop-buy" data-id="${esc(i.id)}" ${affordable?"":"disabled"}>${affordable?"Acheter":"Pas assez de pièces"}</button></div>`;}).join("");
  c.querySelectorAll(".shop-buy").forEach(b=>b.onclick=async()=>{try{const d=await apiJson("/api/shop/buy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,itemId:b.dataset.id})});currentUser=d.user;saveCurrentUser();updateProfile();loadShopV8();alert("✅ "+d.message);}catch(e){alert("❌ "+e.message);}});
 }catch(e){c.textContent="❌ "+e.message;}
}
async function loadBloodMoonV8(){const c=$("bloodMoonContent");if(!c||!currentUser)return;c.textContent="Chargement...";try{const d=await apiJson(`/api/blood-moon?pseudo=${encodeURIComponent(currentUser.pseudo)}`);updateBloodMoonTimer(d.event);if(!d.event.active){c.innerHTML="<h3>🌑 L'événement est fermé.</h3><p>Il revient vendredi de 07h00 à 20h00.</p>";return;}const p=d.progress;c.innerHTML=`<div class="blood-moon-event"><div class="blood-ladder"><div class="blood-rung">🌕 100 🪙</div><div class="blood-rung">🌕 200 XP</div><div class="blood-rung">🌕 500 XP</div><div class="blood-rung final">🌕 ${esc(p.title)} — titre exclusif</div></div><div class="blood-gauge"><div class="blood-gauge-fill" style="height:${p.quarters*25}%"></div><strong>${p.quarters}/4</strong></div></div><h3>Quêtes spéciales</h3><div class="cards-list">${(p.quests||[]).map(q=>`<div class="quest-card"><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p><p>${q.progress}/${q.target}</p>${q.completed&&!q.claimed?`<button class="main-button bm-q" data-id="${esc(q.id)}">🌕 Gagner un quart</button>`:""}</div>`).join("")}</div><p>Quarts : ${p.quarters}/4</p><div class="bm-rewards">${(p.milestones||[]).map(m=>`<div class="blood-rung"><b>Palier ${m.quarter}/4</b><br>${m.reward.coins?`<span class="coin-icon"></span> ${m.reward.coins} pièces`:m.reward.xp?`✨ ${m.reward.xp} XP`:`🏷️ ${esc(m.reward.title)}`} ${p.quarters>=m.quarter&&!(p.claimed||[]).includes(m.quarter)?`<button class="main-button bm-claim" data-quarter="${m.quarter}">Récupérer</button>`:((p.claimed||[]).includes(m.quarter)?"✅ Récupéré":"🔒")}</div>`).join("")}</div><p>Bonus événement : x2 pièces • x2 XP • x2 trophées</p><h3>🏷️ Tes titres</h3><div class="title-list">${(currentUser.titles||[]).map(t=>`<button class="secondary-button title-equip" data-title="${esc(t)}">${esc(t)}${currentUser.equippedTitle===t?" ✓":""}</button>`).join("")}</div>`;c.querySelectorAll(".title-equip").forEach(b=>b.onclick=async()=>{try{const x=await apiJson("/api/titles/equip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,title:b.dataset.title})});currentUser=x.user;saveCurrentUser();updateProfile();loadBloodMoonV8();}catch(e){alert("❌ "+e.message);}});c.querySelectorAll(".bm-claim").forEach(b=>b.onclick=async()=>{try{const x=await apiJson("/api/blood-moon/claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,quarter:Number(b.dataset.quarter)})});currentUser=x.user;saveCurrentUser();updateProfile();loadBloodMoonV8();}catch(e){alert("❌ "+e.message);}});c.querySelectorAll(".bm-q").forEach(b=>b.onclick=async()=>{try{await apiJson("/api/blood-moon/quest-claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,questId:b.dataset.id})});loadBloodMoonV8();}catch(e){alert("❌ "+e.message);}});}catch(e){c.textContent="❌ "+e.message;}}

/* Socket gameplay */
socket.on("yourRole",d=>{myGameRole=d.role||null;myGameClassChance=d.classChance||0;myGameTeammates=Array.isArray(d.teammates)?d.teammates:[];if(currentUser){currentUser.gameRole=myGameRole;updateProfile();}const el=$("playerGameRole");if(el){el.textContent=`🎭 Rôle : ${myGameRole}`;el.classList.remove("hidden");}});
socket.on("voteUpdate",d=>{const el=$("selectedVote");if(el&&d.voter===currentUser?.pseudo)el.textContent=`Vote envoyé contre ${d.target}`;const counter=document.querySelector(".game-vote-counter");if(counter&&d.required)counter.textContent=`🗳️ ${d.count}/${d.required} votes`;});
socket.on("gameFinished",d=>{document.body.classList.remove("in-game");myGameRole=null;myGameClassChance=0;myGameTeammates=[];if(currentUser){currentUser.gameRole=null;saveCurrentUser();updateProfile();}document.body.dataset.lgPhase="salon";const c=$("roomsList");if(c)c.innerHTML=`<div class="room-card game-result"><h2>🏁 Partie terminée</h2><h3>Victoire : ${esc(d.winner)}</h3><p>Retourne au menu ou recrée un salon.</p></div>`;loadNotificationsV8();});
socket.on("gameChatMessage",m=>{const c=$("gameChatMessages");if(!c)return;const el=document.createElement("div");el.className="game-chat-line";el.innerHTML=`<b>${esc(m.pseudo)} :</b> ${esc(m.text)}`;c.appendChild(el);c.scrollTop=c.scrollHeight;});
socket.on("seerResult",d=>alert(`🔮 ${d.target} est ${d.role}.`));
socket.on("roleActionResult",d=>alert("🌙 "+d.message));
function renderGamePhaseV8(phase,data){
  const c=$("roomsList"); if(!c||!currentUser)return;
  const allPlayers=Array.isArray(data.players)?data.players:[];
  const alive=allPlayers.filter(p=>p.alive);
  const canVote = phase==="day" || myGameRole==="Loup-Garou";
  let selectedTarget=null;
  const myVotes=Number(data.voteCount||0);
  const totalVotes=Number(data.requiredVotes||0);

  c.innerHTML=`
    <div class="game-screen">
      <div class="game-header">
        <div>
          <span class="game-phase-badge ${phase}">${phase==="night"?"🌙 NUIT":"☀️ JOUR"}</span>
          <h2>${phase==="night"?"La nuit tombe sur le village":"Le village doit voter"} <small>Jour ${data.day||1}</small></h2>
        </div>
        <div class="game-vote-counter">${totalVotes?`🗳️ ${myVotes}/${totalVotes} votes`:""}</div>
      </div>

      <div class="game-role-card featured">
        <div class="role-label">TON RÔLE</div>
        <div class="my-role">🎭 ${esc(myGameRole||"Chargement...")}</div>
        
      </div>

      <div class="game-instruction">
        ${phase==="night" && myGameRole==="Loup-Garou"?"Choisis une cible puis confirme ton vote. Les autres rôles agissent secrètement. Aucun allié ne sera affiché.":
          phase==="night"&&myGameRole==="Voyante"?"Choisis un joueur puis utilise ton pouvoir pour découvrir son rôle.":
          phase==="night"&&myGameRole==="Sorcière"?"Choisis une cible puis utilise une potion disponible.":
          phase==="night"?"🌙 Tu n’as pas de pouvoir cette nuit. Seuls les Loups-Garous votent, la Voyante utilise son pouvoir et la Sorcière utilise ses potions.":
          "🗳️ Choisis le joueur que tu veux éliminer, puis confirme ton vote."}
      </div>

      <div class="game-players-grid" id="gameTargets"></div>
      <div class="game-action-panel" id="gameActions"></div>
      <div class="game-chat-panel">
        <div class="game-chat-head"><strong>💬 Discussion de la partie</strong><span>Sans insultes</span></div>
        <div id="gameChatMessages" class="game-chat-messages"></div>
        <div class="game-chat-compose"><input id="gameChatInput" maxlength="300" placeholder="Écris un message…"><button id="gameChatSend" class="main-button">Envoyer</button></div>
      </div>
    </div>`;

  const t=$("gameTargets"), a=$("gameActions");
  const gameChatBox=$("gameChatMessages"), gameChatInput=$("gameChatInput"), gameChatSend=$("gameChatSend");
  if(gameChatBox){
    gameChatBox.innerHTML="";
    (data.chat||[]).slice(-50).forEach(m=>{const el=document.createElement("div");el.className="game-chat-line";el.innerHTML=`<b>${esc(m.pseudo)} :</b> ${esc(m.text)}`;gameChatBox.appendChild(el);});
    gameChatBox.scrollTop=gameChatBox.scrollHeight;
  }
  const sendGameChat=()=>{const text=gameChatInput?.value.trim();if(!text)return;socket.emit("gameChat",{code:currentRoomCode,pseudo:currentUser.pseudo,text});if(gameChatInput)gameChatInput.value="";};
  gameChatSend?.addEventListener("click",sendGameChat);
  gameChatInput?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sendGameChat();}});
  const targets=alive.filter(p=>p.pseudo!==currentUser.pseudo);
  targets.forEach(p=>{
    const card=document.createElement("button");
    card.type="button";
    card.className="game-player-card";
    card.dataset.pseudo=p.pseudo;
    card.innerHTML=`<span class="player-avatar">${p.isBot?"🤖":"👤"}</span><span class="player-name">${esc(p.pseudo)}</span><span class="player-status">${p.isBot?"BOT":"JOUEUR"}</span>`;
    card.onclick=()=>{
      selectedTarget=p.pseudo;
      t.querySelectorAll(".game-player-card").forEach(x=>x.classList.remove("selected"));
      card.classList.add("selected");
      if(phase==="day"||myGameRole==="Loup-Garou"){
        const action=$("voteConfirm"); if(action){action.disabled=false;action.textContent=`🗳️ Voter contre ${p.pseudo}`;}
      }
      if(myGameRole==="Voyante") $("seerBtn")?.removeAttribute("disabled");
      if(myGameRole==="Sorcière"){ $("witchSave")?.removeAttribute("disabled"); $("witchKill")?.removeAttribute("disabled"); }
    };
    t.appendChild(card);
  });

  if(phase==="day"||myGameRole==="Loup-Garou"){
    a.innerHTML=`<div class="vote-panel"><strong>🗳️ Vote</strong><span id="selectedVote">Aucune cible sélectionnée</span><button id="voteConfirm" class="main-button" disabled>🗳️ Sélectionne un joueur</button><small>Ton vote est secret et ne peut être envoyé qu'une fois par phase.</small></div>`;
    $("voteConfirm").onclick=()=>{if(!selectedTarget)return;const event=phase==="day"?"dayVote":"nightVote";socket.emit(event,{code:currentRoomCode,pseudo:currentUser.pseudo,targetPseudo:selectedTarget});$("voteConfirm").disabled=true;$("voteConfirm").textContent="✅ Vote envoyé";t.querySelectorAll(".game-player-card").forEach(x=>x.disabled=true);};
  }
  if(phase==="night"&&myGameRole==="Voyante"){
    a.innerHTML=`<div class="vote-panel"><strong>🔮 Pouvoir de la Voyante</strong><span>Choisis une cible.</span><button id="seerBtn" class="main-button" disabled>🔮 Découvrir le rôle</button></div>`;
    $("seerBtn").onclick=()=>{if(!selectedTarget)return;socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,targetPseudo:selectedTarget,action:"inspect"});$("seerBtn").disabled=true;};
  }
  if(phase==="night"&&myGameRole==="Sorcière"){
    a.innerHTML=`<div class="vote-panel"><strong>🧪 Pouvoir de la Sorcière</strong><span>Choisis une cible puis une potion.</span><div class="game-actions"><button id="witchSave" class="main-button" disabled>🛡️ Sauver</button><button id="witchKill" class="secondary-button" disabled>☠️ Éliminer</button></div></div>`;
    $("witchSave").onclick=()=>{if(!selectedTarget)return;socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,targetPseudo:selectedTarget,action:"save"});$("witchSave").disabled=true;$("witchKill").disabled=true;};
    $("witchKill").onclick=()=>{if(!selectedTarget)return;socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,targetPseudo:selectedTarget,action:"kill"});$("witchSave").disabled=true;$("witchKill").disabled=true;};
  }
}

function renderHunterChoicesV8(d){const c=$("roomsList");if(!c)return;c.innerHTML=`<div class="room-card"><h2>🏹 Pouvoir du Chasseur</h2><p>Choisis un joueur.</p><div id="hunterTargets"></div></div>`;const t=$("hunterTargets");(d.targets||[]).forEach(x=>{const b=document.createElement("button");b.className="main-button";b.textContent=x;b.onclick=()=>socket.emit("hunterAction",{code:currentRoomCode,pseudo:d.hunter,targetPseudo:x});t.appendChild(b);});}

/* État salon / classé */
socket.on("roomUpdated",room=>{if(currentRoomCode===room.code)renderCurrentRoom(room);});
$("rankedModeToggle")?.addEventListener("change",()=>{if(currentRoomCode&&isRoomHost)socket.emit("setRoomRanked",{code:currentRoomCode,pseudo:currentUser.pseudo,ranked:$ ("rankedModeToggle").checked});});

/* Connexion : initialisation V8 */
const _loginUserV8=loginUser;
loginUser=function(user){_loginUserV8(user);ensureV8AfterLogin();};
function ensureV8AfterLogin(){if($("chatEnabledToggle"))$("chatEnabledToggle").checked=currentUser.chatEnabled!==false;loadNotificationsV8();refreshBloodMoonButton();if(isAdmin())loadAdminV8();}
window.addEventListener("load",()=>setTimeout(ensureV8AfterLogin,250));
setInterval(()=>{if(currentUser){refreshBloodMoonButton();if(currentRoomCode)loadRoomFriendsV8();}},30000);

/* LISTE D'AMIS + CHAT */
async function loadFriendsV8(){
 const c=$("friendsList");if(!c||!currentUser)return;c.textContent="Chargement...";
 try{const d=await apiJson(`/api/friends/${encodeURIComponent(currentUser.pseudo)}`);c.innerHTML="";(d.friends||[]).forEach(f=>{const u=f.user||{};const card=document.createElement("div");card.className="friend-card";card.innerHTML=`<h3>${esc(u.icon||"🐺")} ${esc(u.pseudo)}</h3><p>${f.online?"🟢 En ligne":"⚫ Hors ligne"} • ${f.inRoom?"🎮 En partie":"🟢 Disponible"}</p><button class="secondary-button chat-request">💬 Demander le chat</button><button class="main-button chat-open">💬 Ouvrir le chat</button>`;card.querySelector(".chat-request").onclick=async()=>{try{await apiJson("/api/chat/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromPseudo:currentUser.pseudo,toPseudo:u.pseudo})});alert("✅ Demande envoyée.");}catch(e){alert("❌ "+e.message);}};card.querySelector(".chat-open").onclick=()=>openChatV8(u.pseudo);c.appendChild(card);});if(!d.friends?.length)c.textContent="Aucun ami.";}catch(e){c.textContent="❌ "+e.message;}
}
$("friendsButton")?.addEventListener("click",loadFriendsV8);
async function openChatV8(friendPseudo){currentChatFriend=friendPseudo;const c=$("friendResult");if(!c)return;try{const status=await apiJson(`/api/chat/status/${encodeURIComponent(currentUser.pseudo)}/${encodeURIComponent(friendPseudo)}`);if(!status.allowed){if(!status.pending){if(!confirm("Le chat doit être accepté. Envoyer une demande ?"))return;try{await apiJson("/api/chat/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromPseudo:currentUser.pseudo,toPseudo:friendPseudo})});}catch(e){alert("❌ "+e.message);}}return;}const d=await apiJson(`/api/chat/${encodeURIComponent(currentUser.pseudo)}/${encodeURIComponent(friendPseudo)}`);c.innerHTML=`<div class="chat-box"><h3>💬 ${esc(friendPseudo)}</h3><div id="chatMessages">${(d.messages||[]).map(m=>`<p><b>${esc(m.from)} :</b> ${esc(m.text)}</p>`).join("")}</div><div class="chat-compose"><input id="chatInput" maxlength="500" placeholder="Ton message"><button id="chatSend" class="main-button">Envoyer</button></div></div>`;$("chatSend").onclick=async()=>{try{const x=await apiJson("/api/chat/send-safe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromPseudo:currentUser.pseudo,toPseudo:friendPseudo,text:$("chatInput").value})});$("chatInput").value="";const m=$("chatMessages");m.insertAdjacentHTML("beforeend",`<p><b>${esc(x.message.from)} :</b> ${esc(x.message.text)}</p>`);}catch(e){alert("❌ "+e.message);}};}catch(e){alert("❌ "+e.message);}}
socket.on("chatMessage",m=>{if(currentChatFriend&&normalizeClient(m.from)===normalizeClient(currentChatFriend)){const c=$("chatMessages");if(c)c.insertAdjacentHTML("beforeend",`<p><b>${esc(m.from)} :</b> ${esc(m.text)}</p>`);}});
function normalizeClient(x){return String(x||"").trim().toLowerCase();}

/* RÉCOMPENSE ADMIN : le type trophées */
const rewardType=$("adminRewardType");rewardType?.addEventListener("change",()=>{const type=rewardType.value;const amount=$("adminAmountInput");if(type==="class"){$("adminAmountContainer")?.classList.add("hidden");$("adminClassContainer")?.classList.remove("hidden");}else{$("adminAmountContainer")?.classList.remove("hidden");$("adminClassContainer")?.classList.add("hidden");if(amount)amount.placeholder=type==="trophies"?"Nombre de trophées":"Quantité";}});

/* ANNONCE ADMIN + MENU */
async function loadAnnouncementV8(){try{const d=await apiJson("/api/announcement");if($("announcementBox"))$("announcementBox").textContent=d.text||"";if($("announcementInput"))$("announcementInput").value=d.text||"";}catch{}}
$("saveAnnouncementButton")?.addEventListener("click",async()=>{if(!isAdmin())return;try{const d=await apiJson("/api/admin/announcement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({adminPseudo:currentUser.pseudo,text:$("announcementInput").value})});$("adminMessage").textContent="✅ "+d.message;loadAnnouncementV8();}catch(e){$("adminMessage").textContent="❌ "+e.message;}});
socket.on("announcementUpdated",d=>{if($("announcementBox"))$("announcementBox").textContent=d.text||"";});
const _ensureV8=ensureV8AfterLogin;ensureV8AfterLogin=function(){_ensureV8();loadAnnouncementV8();};
/* Demandes d'amis : accepter/refuser depuis la notification */
const _renderNotificationV8=renderNotification;
renderNotification=function(n){const el=_renderNotificationV8(n);if(n.type==="friendRequest"&&n.action){[true,false].forEach(ok=>{const b=document.createElement("button");b.className=ok?"main-button":"secondary-button";b.textContent=ok?"Accepter":"Refuser";b.onclick=async()=>{try{await apiJson("/api/friends/respond",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,requestId:n.action.requestId,accept:ok})});b.parentElement?.remove();loadFriendsV8();}catch(e){alert("❌ "+e.message);}};el.appendChild(b);});}
if(n.type==="chatRequest"&&n.requestId){[true,false].forEach(ok=>{const b=document.createElement("button");b.className=ok?"main-button":"secondary-button";b.textContent=ok?"Accepter":"Refuser";b.onclick=async()=>{try{await apiJson("/api/chat/respond",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo:currentUser.pseudo,requestId:n.requestId,accept:ok})});loadNotificationsV8();}catch(e){alert("❌ "+e.message);}};el.appendChild(b);});}
return el;};


/* V19 — boosts publics + partie plus lente et séquencée */
function renderGlobalBoostsV19(payload){
  const box=$("globalBoostBanner"); if(!box)return;
  const boosts=payload?.boosts||payload||{}; const now=Date.now(); const names={coins:"🪙 Pièces",xp:"✨ XP",trophies:"🏆 Trophées"};
  const active=Object.entries(names).map(([type,label])=>{
    const b=boosts[type]||{}; const left=Number(b.until||0)-now; const mult=Number(b.multiplier||1);
    return left>0&&mult>1?`${label} x${mult} — ${Math.ceil(left/60000)} min pour TOUS`:null;
  }).filter(Boolean);
  box.innerHTML=active.length?`<strong>⚡ BOOST POUR TOUT LE MONDE</strong><div>${active.join(" • ")}</div>`:"";
  box.classList.toggle("hidden",!active.length);
}

socket.on("globalBoostUpdated",d=>{
  renderGlobalBoostsV19(d?.boosts||d?.globalBoosts||{});
  if(d?.boost) updateProfile();
});

socket.on("nightStepTimer",d=>{
  const box=$("gameTimer"); if(!box)return; const end=Date.now()+Number(d.duration||0);
  clearInterval(window.gameTimerInterval);
  const labels={cupid:"💘 Tour de Cupidon — choisis 2 amoureux",wolves:"🐺 Tour des Loups-Garous — votez ensemble",seer:"🔮 Tour de la Voyante — découvre un rôle",witch:"🧪 Tour de la Sorcière — potions"};
  const tick=()=>{const left=Math.max(0,end-Date.now());box.textContent=`${labels[d.step]||"Tour de nuit"} • ${Math.ceil(left/1000)}s`;if(!left)clearInterval(window.gameTimerInterval);};
  tick();window.gameTimerInterval=setInterval(tick,250);
});

socket.on("witchTurn",d=>{window.witchVictim=d.victim||null; if($('witchVictimInfo'))$('witchVictimInfo').textContent=d.victim?`La cible des Loups : ${d.victim}`:"Aucune victime";});
socket.on("dayVoteResult",d=>{if(d?.target)alert(`🗳️ Résultat du vote : ${d.target} est éliminé.`);});
socket.on("nightResolved",d=>{if(d?.victim)console.log("Nuit :",d.victim);});

function renderGamePhaseV19(phase,data){
  const c=$("roomsList"); if(!c||!currentUser)return;
  document.body.classList.add("in-game");
  const all=Array.isArray(data.players)?data.players:[]; const alive=all.filter(p=>p.alive); const step=data.nightStep;
  let selected=[]; let voted=false;
  const isNightRole=(r)=>phase==="night"&&myGameRole===r;
  const canDayVote=phase==="day";
  const canWolf=phase==="night"&&step==="wolves"&&myGameRole==="Loup-Garou";
  const canCupid=isNightRole("Cupidon")&&step==="cupid";
  const canSeer=isNightRole("Voyante")&&step==="seer";
  const canWitch=isNightRole("Sorcière")&&step==="witch";
  const targets=alive.filter(p=>p.pseudo!==currentUser.pseudo && (canWolf ? p.role!=="Loup-Garou" : true));
  c.innerHTML=`<div class="game-screen v19-game">
    <div class="game-header"><div><span class="game-phase-badge ${phase}">${phase==="night"?"🌙 NUIT":"☀️ JOUR"}</span><h2>${phase==="night"?"Tout le village dort…":"☀️ Le village se réunit"}</h2><p class="game-subtitle">Jour ${data.day||1} • ${alive.length}/${all.length} vivants • chaque rôle joue à son tour</p></div><div id="gameTimer" class="game-v19-timer">${phase==="day"?"Discussion ouverte":"La nuit commence"}</div></div>
    <div class="game-role-card featured"><div class="role-label">TON RÔLE — SECRET</div><div class="my-role">🎭 ${esc(myGameRole||"Chargement...")}</div><small>Ton rôle est visible uniquement sur ton écran.</small></div>
    <div class="game-instruction">${canCupid?"💘 C’EST TON TOUR — Cupidon choisit deux amoureux. Tu n’agis qu’une seule fois, pendant la première nuit.":canWolf?"🐺 C’EST LE TOUR DES LOUPS — discutez entre vous puis votez pour une victime. Les villageois ne voient rien.":canSeer?"🔮 C’EST TON TOUR — la Voyante choisit un joueur et découvre secrètement son rôle.":canWitch?"🧪 C’EST TON TOUR — la Sorcière voit la victime des Loups et peut utiliser sa potion de vie ou de mort.":phase==="night"?"🌙 TU ATTENDS — un autre rôle joue actuellement. Ton écran reste calme jusqu’à ton tour.":"☀️ C’EST LE TOUR DU VILLAGE — discute, observe les votes puis choisis un joueur à éliminer."}</div>
    ${canCupid?'<div class="cupid-choice"><strong>1er choix :</strong><span id="cupidFirst">Aucun</span><strong>2e choix :</strong><span id="cupidSecond">Aucun</span></div>':''}
    ${canWitch?'<div class="witch-victim-box">🧪 <span id="witchVictimInfo">La Sorcière reçoit la cible des Loups...</span></div>':''}
    <div class="game-night-order"><span class="active">1. Cupidon</span><span>2. Loups</span><span>3. Voyante</span><span>4. Sorcière</span><span>5. Village</span></div>
    <div class="game-players-grid" id="gameTargets"></div>
    <div class="game-action-panel" id="gameActions"></div>
    <div class="game-chat-panel"><div class="game-chat-head"><strong>💬 Discussion du village</strong><span>${phase==="day"?"Active":"Fermée pendant la nuit"}</span></div><div id="gameChatMessages" class="game-chat-messages"></div><div class="game-chat-compose"><input id="gameChatInput" maxlength="300" placeholder="Message respectueux…" ${phase!=="day"?"disabled":""}><button id="gameChatSend" class="main-button" ${phase!=="day"?"disabled":""}>Envoyer</button></div></div>
  </div>`;
  const t=$("gameTargets"),a=$("gameActions");
  (data.chat||[]).slice(-50).forEach(m=>{const el=document.createElement("div");el.className="game-chat-line";el.innerHTML=`<b>${esc(m.pseudo)} :</b> ${esc(m.text)}`;$("gameChatMessages")?.appendChild(el);});
  if($("gameChatMessages"))$("gameChatMessages").scrollTop=$("gameChatMessages").scrollHeight;
  const send=()=>{const input=$("gameChatInput");const text=input?.value.trim();if(!text)return;socket.emit("gameChat",{code:currentRoomCode,pseudo:currentUser.pseudo,text});input.value="";};
  $("gameChatSend")?.addEventListener("click",send);$("gameChatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send();}});
  targets.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="game-player-card";b.innerHTML=`<span class="player-avatar">${p.isBot?"🤖":"👤"}</span><span class="player-name">${esc(p.pseudo)}</span><span class="player-status">${p.isBot?"BOT":"JOUEUR"}</span>`;b.onclick=()=>{if(selected.includes(p.pseudo))return;if(canCupid&&selected.length<2){selected.push(p.pseudo);b.classList.add("selected");$(selected.length===1?"cupidFirst":"cupidSecond").textContent=p.pseudo;if(selected.length===2)$("cupidConfirm")?.removeAttribute("disabled");return;}selected=[p.pseudo];t.querySelectorAll("button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("voteConfirm")?.removeAttribute("disabled");$("seerBtn")?.removeAttribute("disabled");$("witchSave")?.removeAttribute("disabled");$("witchKill")?.removeAttribute("disabled");};t.appendChild(b);});
  if(canCupid)a.innerHTML='<div class="vote-panel"><strong>💘 Choix de Cupidon</strong><button id="cupidConfirm" class="main-button" disabled>💘 Désigner les deux joueurs</button></div>';
  if(canWolf||canDayVote)a.innerHTML='<div class="vote-panel"><strong>🗳️ Vote</strong><span>Un seul vote par phase.</span><button id="voteConfirm" class="main-button" disabled>🗳️ Choisir une cible</button></div>';
  if(canSeer)a.innerHTML='<div class="vote-panel"><strong>🔮 Voyante</strong><button id="seerBtn" class="main-button" disabled>🔮 Découvrir le rôle</button></div>';
  if(canWitch)a.innerHTML='<div class="vote-panel"><strong>🧪 Sorcière</strong><div class="game-actions"><button id="witchSave" class="main-button" disabled>🛡️ Sauver la cible</button><button id="witchKill" class="secondary-button" disabled>☠️ Potion de mort</button><button id="witchPass" class="secondary-button">Passer</button></div></div>';
  $("cupidConfirm")?.addEventListener("click",()=>{if(selected.length===2){socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,action:"cupid",targetPseudo:selected[0],secondTargetPseudo:selected[1]});$("cupidConfirm").disabled=true;}});
  $("voteConfirm")?.addEventListener("click",()=>{if(!selected[0]||voted)return;voted=true;socket.emit(canDayVote?"dayVote":"nightVote",{code:currentRoomCode,pseudo:currentUser.pseudo,targetPseudo:selected[0]});$("voteConfirm").disabled=true;$("voteConfirm").textContent="✅ Vote envoyé";t.querySelectorAll("button").forEach(x=>x.disabled=true);});
  $("seerBtn")?.addEventListener("click",()=>{if(!selected[0])return;socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,action:"inspect",targetPseudo:selected[0]});$("seerBtn").disabled=true;});
  $("witchSave")?.addEventListener("click",()=>{if(window.witchVictim){socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,action:"save",targetPseudo:window.witchVictim});$("witchSave").disabled=true;$("witchKill").disabled=true;}});
  $("witchKill")?.addEventListener("click",()=>{if(!selected[0])return;socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,action:"kill",targetPseudo:selected[0]});$("witchSave").disabled=true;$("witchKill").disabled=true;});
  $("witchPass")?.addEventListener("click",()=>socket.emit("roleAction",{code:currentRoomCode,pseudo:currentUser.pseudo,action:"pass"}));
}

socket.on("nightStarted",d=>renderGamePhaseV19("night",d));
socket.on("nightStepStarted",d=>renderGamePhaseV19("night",d));
socket.on("dayStarted",d=>renderGamePhaseV19("day",d));
socket.on("voteUpdate",d=>{const x=$("gameTimer");if(x&&d?.required)x.textContent=`🗳️ ${d.count}/${d.required} votes enregistrés`;});
