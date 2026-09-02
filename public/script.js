/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

const $ = (id) => document.getElementById(id);

const socket = io();

let currentUser = null;
let currentRoomCode = null;
let isRoomHost = false;
let selectedAdminUser = null;

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

$("backButton").addEventListener("click", () => {
  hidePages();
});


/* =====================================
   NAVIGATION
===================================== */

$("playButton").addEventListener("click", () => {
  openPage("gameLobby");

  currentRoomCode = null;
  isRoomHost = false;

  $("startGameButton").classList.add("hidden");

  loadRooms();
});

$("classesButton").addEventListener("click", async () => {
  openPage("classesPage");
  await loadClasses();
});

$("questsButton").addEventListener("click", async () => {
  openPage("questsPage");
  await loadQuests();
});

$("friendsButton").addEventListener("click", () => {
  openPage("friendsPage");
});

$("rankingButton").addEventListener("click", async () => {
  openPage("rankingPage");
  await loadRanking();
});

$("settingsButton").addEventListener("click", () => {
  openPage("settingsPage");
});


/* =====================================
   CONNEXION / INSCRIPTION
===================================== */

function showLogin() {
  $("loginForm").classList.remove("hidden");
  $("registerForm").classList.add("hidden");

  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");

  $("authMessage").textContent = "";
}

function showRegister() {
  $("registerForm").classList.remove("hidden");
  $("loginForm").classList.add("hidden");

  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");

  $("authMessage").textContent = "";
}

$("loginTab").addEventListener("click", showLogin);
$("registerTab").addEventListener("click", showRegister);


/* =====================================
   INSCRIPTION
===================================== */

$("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const pseudo = $("registerPseudo").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;

  $("authMessage").textContent = "⏳ Création du compte...";

  try {
    const response = await fetch("/api/register", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        pseudo,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      $("authMessage").textContent =
        "❌ " + (data.message || "Erreur lors de la création.");

      return;
    }

    loginUser(data.user);

  } catch (error) {
    console.error(error);

    $("authMessage").textContent =
      "❌ Impossible de joindre le serveur.";
  }
});


/* =====================================
   CONNEXION
===================================== */

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const pseudo = $("loginPseudo").value.trim();
  const password = $("loginPassword").value;

  $("authMessage").textContent = "⏳ Connexion...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        pseudo,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      $("authMessage").textContent =
        "❌ " + (data.message || "Connexion impossible.");

      return;
    }

    loginUser(data.user);

  } catch (error) {
    console.error(error);

    $("authMessage").textContent =
      "❌ Impossible de joindre le serveur.";
  }
});


/* =====================================
   UTILISATEUR
===================================== */

function loginUser(user) {
  currentUser = user;

  saveCurrentUser();

  socket.emit("userOnline", {
    pseudo: currentUser.pseudo
  });

  $("authScreen").classList.add("hidden");
  $("forgotScreen").classList.add("hidden");
  $("menuScreen").classList.remove("hidden");

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

  $("playerName").textContent =
    currentUser.pseudo || "Joueur";

  $("playerTitle").textContent =
    currentUser.title || "Nouveau Villageois";

  $("profileIcon").textContent =
    currentUser.icon || "🐺";

  $("playerLevel").textContent =
    currentUser.level || 1;

  $("playerXp").textContent =
    currentUser.xp || 0;

  $("playerCoins").textContent =
    currentUser.coins || 0;

  $("playerTrophies").textContent =
    currentUser.trophies || 0;

  updateXpBar();
}

function updateXpBar() {
  if (!currentUser) return;

  const xp = Number(currentUser.xp || 0);
  const level = Number(currentUser.level || 1);

  const xpForNextLevel = Math.max(
    100,
    level * 500
  );

  const percentage = Math.min(
    100,
    Math.round((xp / xpForNextLevel) * 100)
  );

  $("xpProgress").style.width =
    percentage + "%";
}


/* =====================================
   ADMIN
===================================== */

function updateAdminButton() {
  if (!currentUser) return;

  if (
    currentUser.pseudo.toLowerCase() ===
    ADMIN_PSEUDO.toLowerCase()
  ) {
    $("adminButton").classList.remove("hidden");
  } else {
    $("adminButton").classList.add("hidden");
  }
}

$("adminButton").addEventListener("click", () => {
  if (
    !currentUser ||
    currentUser.pseudo.toLowerCase() !==
    ADMIN_PSEUDO.toLowerCase()
  ) {
    alert("❌ Accès refusé.");
    return;
  }

  openPage("adminPage");
});


/* =====================================
   CLASSES
===================================== */

let classesData = [];

async function loadClasses() {
  const container = $("classesList");

  container.textContent = "Chargement...";

  try {
    const response = await fetch("/api/classes");
    const data = await response.json();

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les classes.";

      return;
    }

    classesData = data.classes || [];

    renderClasses();

  } catch (error) {
    console.error(error);

    container.textContent =
      "❌ Erreur de connexion.";
  }
}

function getClassEmoji(classId) {
  if (classId.startsWith("wolf")) return "🐺";
  if (classId.startsWith("seer")) return "🔮";
  if (classId.startsWith("witch")) return "🧪";
  if (classId.startsWith("hunter")) return "🎯";
  if (classId.startsWith("premium")) return "💎";
  if (classId.startsWith("admin")) return "👑";

  return "🐺";
}

function renderClasses() {
  const container = $("classesList");

  container.innerHTML = "";

  if (!classesData.length) {
    container.textContent = "Aucune classe disponible.";
    return;
  }

  classesData.forEach((classe) => {
    const owned =
      (currentUser.classes || []).includes(classe.id);

    const equipped =
      currentUser.equippedClass === classe.id;

    const card = document.createElement("div");

    card.className =
      "class-card" +
      (equipped ? " equipped" : "");

    const emoji = getClassEmoji(classe.id);

    card.innerHTML = `
      <div>
        <h3>${emoji} ${classe.name}</h3>

        <p>
          🪙 ${classe.price}
          • 🎲 ${classe.chance}% de chance
        </p>
      </div>

      <button>
        ${
          equipped
            ? "✓ Équipée"
            : owned
              ? "Équiper"
              : "Acheter"
        }
      </button>
    `;

    const button = card.querySelector("button");

    if (equipped) {
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      if (equipped) return;

      if (owned) {
        equipClass(classe.id);
      } else {
        buyClass(classe.id);
      }
    });

    container.appendChild(card);
  });
}

async function buyClass(classId) {
  if (!currentUser) return;

  try {
    const response = await fetch(
      "/api/classes/buy",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          pseudo: currentUser.pseudo,
          classId
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert("❌ " + data.message);
      return;
    }

    currentUser = data.user;

    saveCurrentUser();
    updateProfile();
    renderClasses();

    alert("🎉 Classe achetée !");

  } catch {
    alert("❌ Erreur de connexion.");
  }
}

async function equipClass(classId) {
  if (!currentUser) return;

  try {
    const response = await fetch(
      "/api/classes/equip",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          pseudo: currentUser.pseudo,
          classId
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert("❌ " + data.message);
      return;
    }

    currentUser = data.user;

    saveCurrentUser();
    updateProfile();
    renderClasses();

    alert("✅ Classe équipée !");

  } catch {
    alert("❌ Erreur de connexion.");
  }
}


/* =====================================
   QUÊTES
===================================== */

async function loadQuests() {
  const container = $("questsList");

  container.textContent = "Chargement...";

  try {
    const response = await fetch("/api/quests");
    const data = await response.json();

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les quêtes.";

      return;
    }

    renderQuests(data.quests || []);

  } catch {
    container.textContent =
      "❌ Erreur de connexion.";
  }
}

function renderQuests(quests) {
  const container = $("questsList");

  container.innerHTML = "";

  if (!quests.length) {
    container.textContent =
      "Aucune quête disponible.";

    return;
  }

  quests.forEach((quest) => {
    const card = document.createElement("div");

    card.className = "quest-card";

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
   SALONS - CRÉATION
===================================== */

$("createRoomButton").addEventListener("click", () => {
  if (!currentUser) {
    alert("❌ Tu dois être connecté.");
    return;
  }

  socket.emit("createRoom", {
    pseudo: currentUser.pseudo
  });
});

socket.on("roomCreated", (room) => {
  currentRoomCode = room.code;
  isRoomHost = true;

  $("joinRoomCode").value = room.code;

  $("startGameButton").classList.remove("hidden");

  renderCurrentRoom(room);

  alert(
    "🎮 Partie créée !\n\nCode : " +
    room.code
  );
});


/* =====================================
   REJOINDRE UN SALON
===================================== */

$("joinRoomButton").addEventListener("click", () => {
  if (!currentUser) {
    alert("❌ Tu dois être connecté.");
    return;
  }

  const code = $("joinRoomCode")
    .value
    .trim()
    .toUpperCase();

  if (!code) {
    alert("❌ Entre un code.");
    return;
  }

  socket.emit("joinRoom", {
    code,
    pseudo: currentUser.pseudo
  });
});

socket.on("joinedRoom", (room) => {
  currentRoomCode = room.code;
  isRoomHost = false;

  $("startGameButton").classList.add("hidden");

  renderCurrentRoom(room);

  alert("✅ Tu as rejoint la partie !");
});

socket.on("roomUpdated", (room) => {
  if (currentRoomCode === room.code) {
    renderCurrentRoom(room);

    if (
      currentUser &&
      room.host === currentUser.pseudo
    ) {
      isRoomHost = true;
      $("startGameButton").classList.remove("hidden");
    }
  }
});

socket.on("roomError", (message) => {
  alert("❌ " + message);
});


/* =====================================
   LANCER LA PARTIE
===================================== */

$("startGameButton").addEventListener("click", () => {
  if (!currentUser || !currentRoomCode) {
    alert("❌ Aucune partie sélectionnée.");
    return;
  }

  if (!isRoomHost) {
    alert("❌ Seul le créateur peut lancer la partie.");
    return;
  }

  socket.emit("startGame", {
    code: currentRoomCode,
    pseudo: currentUser.pseudo
  });
});

socket.on("gameStarted", (game) => {
  $("startGameButton").classList.add("hidden");

  const container = $("roomsList");

  container.innerHTML = `
    <div class="room-card">
      <h2>🐺 La partie commence !</h2>
      <p>Les joueurs sont prêts :</p>
      <div id="gamePlayers"></div>
    </div>
  `;

  const playersContainer = $("gamePlayers");

  game.players.forEach((pseudo) => {
    const player = document.createElement("p");

    player.textContent = "👤 " + pseudo;

    playersContainer.appendChild(player);
  });

  alert("🐺 La partie commence !");
});


/* =====================================
   AFFICHER LE SALON ACTUEL
===================================== */

function renderCurrentRoom(room) {
  const container = $("roomsList");

  container.innerHTML = `
    <div class="room-card">
      <h3>🎮 Salon ${room.code}</h3>

      <p>
        👑 Créateur : ${room.host}
      </p>

      <h4>Joueurs :</h4>

      <div id="currentPlayers"></div>
    </div>
  `;

  const playersContainer = $("currentPlayers");

  room.players.forEach((pseudo) => {
    const player = document.createElement("p");

    player.textContent = "👤 " + pseudo;

    playersContainer.appendChild(player);
  });
}


/* =====================================
   LISTE DES SALONS
===================================== */

function loadRooms() {
  socket.emit("getRooms");
}

socket.on("roomsList", (rooms) => {
  if (currentRoomCode) return;

  const container = $("roomsList");

  if (!rooms.length) {
    container.textContent =
      "Aucune partie disponible.";

    return;
  }

  container.innerHTML = "";

  rooms.forEach((room) => {
    const card = document.createElement("div");

    card.className = "room-card";

    card.innerHTML = `
      <strong>🎮 Code : ${room.code}</strong>

      <p>
        👑 Créateur : ${room.host}
      </p>

      <p>
        👥 ${room.players.length} joueur(s)
      </p>

      <button>Rejoindre</button>
    `;

    card
      .querySelector("button")
      .addEventListener("click", () => {
        if (!currentUser) return;

        socket.emit("joinRoom", {
          code: room.code,
          pseudo: currentUser.pseudo
        });
      });

    container.appendChild(card);
  });
});


/* =====================================
   AMIS - RECHERCHE
===================================== */

$("searchFriendButton").addEventListener(
  "click",
  async () => {
    const pseudo =
      $("friendSearch").value.trim();

    if (!pseudo) {
      $("friendResult").textContent =
        "Entre un pseudo.";

      return;
    }

    const result = $("friendResult");

    result.textContent = "Recherche...";

    try {
      const response = await fetch(
        "/api/users/" +
        encodeURIComponent(pseudo)
      );

      const data = await response.json();

      if (!response.ok) {
        result.textContent =
          "❌ Joueur introuvable.";

        return;
      }

      const user = data.user;

      const equippedClass =
        classesData.find(
          (classe) =>
            classe.id === user.equippedClass
        );

      result.innerHTML = `
        <div class="friend-card">
          <strong>
            ${user.icon || "🐺"} ${user.pseudo}
          </strong>

          <p>
            ${user.title || "Nouveau Villageois"}
          </p>

          <p>
            ⭐ Niveau ${user.level}
            • ✨ ${user.xp} XP
            • 🪙 ${user.coins}
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
  const container = $("rankingList");

  container.textContent = "Chargement...";

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

    container.innerHTML = "";

    if (!data.users.length) {
      container.textContent =
        "Aucun joueur.";

      return;
    }

    data.users.forEach((user, index) => {
      const card = document.createElement("div");

      card.className = "ranking-card";

      card.innerHTML = `
        <strong>
          #${index + 1}
          ${user.icon || "🐺"}
          ${user.pseudo}
        </strong>

        <p>
          🏆 ${user.trophies} trophée(s)
        </p>

        <p>
          ⭐ Niveau ${user.level}
          • ✨ ${user.xp} XP
        </p>
      `;

      container.appendChild(card);
    });

  } catch {
    container.textContent =
      "❌ Impossible de charger.";
  }
}


/* =====================================
   ADMIN - RECHERCHE
===================================== */

$("adminSearchButton").addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const targetPseudo =
      $("adminPlayerSearch")
        .value
        .trim();

    const result =
      $("adminPlayerResult");

    if (!targetPseudo) {
      result.textContent =
        "❌ Entre un pseudo.";

      return;
    }

    result.textContent =
      "Recherche...";

    try {
      const response = await fetch(
        "/api/admin/users/" +
        encodeURIComponent(targetPseudo) +
        "?adminPseudo=" +
        encodeURIComponent(currentUser.pseudo)
      );

      const data =
        await response.json();

      if (!response.ok) {
        selectedAdminUser = null;

        result.textContent =
          "❌ " +
          (data.message || "Joueur introuvable.");

        return;
      }

      selectedAdminUser =
        data.user;

      const user =
        selectedAdminUser;

      result.innerHTML = `
        <div class="friend-card">
          <h3>
            ${user.icon || "🐺"} ${user.pseudo}
          </h3>

          <p>
            ⭐ Niveau : ${user.level}
          </p>

          <p>
            ✨ XP : ${user.xp}
          </p>

          <p>
            🪙 Pièces : ${user.coins}
          </p>

          <p>
            🏆 Trophées : ${user.trophies}
          </p>
        </div>
      `;

    } catch {
      selectedAdminUser = null;

      result.textContent =
        "❌ Erreur de connexion.";
    }
  }
);


/* =====================================
   ADMIN - TYPE DE RÉCOMPENSE
===================================== */

$("adminRewardType").addEventListener(
  "change",
  () => {
    const type =
      $("adminRewardType").value;

    if (type === "class") {
      $("adminAmount").classList.add("hidden");
      $("adminClassSelect").classList.remove("hidden");
    } else {
      $("adminAmount").classList.remove("hidden");
      $("adminClassSelect").classList.add("hidden");
    }
  }
);


/* =====================================
   ADMIN - DONNER UNE RÉCOMPENSE
===================================== */

$("adminGiveButton").addEventListener(
  "click",
  async () => {
    if (
      !currentUser ||
      currentUser.pseudo.toLowerCase() !==
      ADMIN_PSEUDO.toLowerCase()
    ) {
      alert("❌ Accès refusé.");
      return;
    }

    if (!selectedAdminUser) {
      $("adminMessage").textContent =
        "❌ Recherche d'abord un joueur.";

      return;
    }

    const rewardType =
      $("adminRewardType").value;

    const amount =
      Math.max(
        0,
        Number($("adminAmount").value || 0)
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

    if (rewardType === "level") {
      /*
       * Ton serveur actuel ne possède pas
       * de récompense directe pour les niveaux.
       * On transforme donc le niveau demandé
       * en XP.
       */
      xp = amount * 500;
    }

    if (rewardType === "class") {
      classId =
        $("adminClassSelect").value;
    }

    if (
      rewardType !== "class" &&
      amount <= 0
    ) {
      $("adminMessage").textContent =
        "❌ Entre une quantité valide.";

      return;
    }

    $("adminMessage").textContent =
      "⏳ Envoi...";

    try {
      const response = await fetch(
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

      $("adminMessage").textContent =
        response.ok
          ? "✅ " + data.message
          : "❌ " + data.message;

    } catch {
      $("adminMessage").textContent =
        "❌ Erreur de connexion.";
    }
  }
);


/* =====================================
   CHANGER E-MAIL
===================================== */

$("changeEmailButton").addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const email =
      $("newEmail").value.trim();

    const password =
      $("emailPassword").value;

    try {
      const response = await fetch(
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

      alert(data.message);

      if (response.ok) {
        currentUser.email = email;

        saveCurrentUser();

        $("newEmail").value = "";
        $("emailPassword").value = "";
      }

    } catch {
      alert("❌ Erreur de connexion.");
    }
  }
);


/* =====================================
   SUPPRIMER COMPTE
===================================== */

$("deleteAccountButton").addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const password =
      $("deletePassword").value;

    if (!password) {
      alert(
        "❌ Entre ton mot de passe."
      );

      return;
    }

    const confirmation = confirm(
      "Supprimer définitivement ton compte ?"
    );

    if (!confirmation) return;

    try {
      const response = await fetch(
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
          (data.message || "Erreur.")
        );

        return;
      }

      alert("✅ Compte supprimé.");

      logout();

    } catch {
      alert("❌ Erreur de connexion.");
    }
  }
);


/* =====================================
   DÉCONNEXION
===================================== */

function logout() {
  localStorage.removeItem("lgv7_user");

  currentUser = null;
  currentRoomCode = null;
  isRoomHost = false;
  selectedAdminUser = null;

  $("menuScreen").classList.add("hidden");
  $("forgotScreen").classList.add("hidden");
  $("authScreen").classList.remove("hidden");

  $("startGameButton").classList.add("hidden");

  hidePages();

  showLogin();
}

$("logoutButton").addEventListener(
  "click",
  logout
);


/* =====================================
   MOT DE PASSE OUBLIÉ
===================================== */

$("forgotPasswordButton").addEventListener(
  "click",
  () => {
    $("authScreen").classList.add("hidden");
    $("forgotScreen").classList.remove("hidden");

    $("forgotMessage").textContent = "";
  }
);

$("backToLoginButton").addEventListener(
  "click",
  () => {
    $("forgotScreen").classList.add("hidden");
    $("authScreen").classList.remove("hidden");

    $("forgotMessage").textContent = "";
  }
);

$("sendResetButton").addEventListener(
  "click",
  async () => {
    const pseudo =
      $("forgotPseudo")
        .value
        .trim();

    if (!pseudo) {
      $("forgotMessage").textContent =
        "❌ Entre ton pseudo.";

      return;
    }

    try {
      const response = await fetch(
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
        data.message;

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
      localStorage.getItem("lgv7_user");

    if (!saved) return;

    try {
      const user =
        JSON.parse(saved);

      if (
        !user ||
        !user.pseudo
      ) {
        throw new Error("Session invalide");
      }

      loginUser(user);

    } catch {
      localStorage.removeItem(
        "lgv7_user"
      );
    }
  }
);
