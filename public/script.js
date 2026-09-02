/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

const $ = (id) => document.getElementById(id);

const socket = io();

const ADMIN_PSEUDO = "creator2026";

let currentUser = null;
let currentRoomCode = null;
let isRoomHost = false;
let selectedAdminPlayer = null;

let classesCache = [];
let questsCache = [];


/* =====================================
   OUTILS
===================================== */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


async function getJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}


function showMessage(id, message) {
  const element = $(id);

  if (element) {
    element.textContent = message;
  }
}


function isAdmin() {
  return Boolean(
    currentUser &&
    currentUser.pseudo &&
    currentUser.pseudo.toLowerCase() ===
      ADMIN_PSEUDO.toLowerCase()
  );
}


function getClassById(classId) {
  return classesCache.find(
    (classe) => classe.id === classId
  );
}


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

  if ($("backButton")) {
    $("backButton").classList.add("hidden");
  }
}


function openPage(pageId) {
  hidePages();

  const page = $(pageId);

  if (page) {
    page.classList.remove("hidden");
  }

  if ($("backButton")) {
    $("backButton").classList.remove("hidden");
  }
}


if ($("backButton")) {
  $("backButton").addEventListener(
    "click",
    () => {
      hidePages();
    }
  );
}


/* =====================================
   NAVIGATION
===================================== */

if ($("playButton")) {
  $("playButton").addEventListener(
    "click",
    () => {
      openPage("gameLobby");

      currentRoomCode = null;
      isRoomHost = false;

      if ($("startGameButton")) {
        $("startGameButton").classList.add("hidden");
      }

      loadRooms();
    }
  );
}


if ($("classesButton")) {
  $("classesButton").addEventListener(
    "click",
    async () => {
      openPage("classesPage");

      await loadClasses();
    }
  );
}


if ($("questsButton")) {
  $("questsButton").addEventListener(
    "click",
    async () => {
      openPage("questsPage");

      await loadQuests();
    }
  );
}


if ($("friendsButton")) {
  $("friendsButton").addEventListener(
    "click",
    () => {
      openPage("friendsPage");
      renderFriendsUnavailable();
    }
  );
}


if ($("rankingButton")) {
  $("rankingButton").addEventListener(
    "click",
    () => {
      openPage("rankingPage");
      loadRanking();
    }
  );
}


if ($("settingsButton")) {
  $("settingsButton").addEventListener(
    "click",
    () => {
      openPage("settingsPage");
    }
  );
}


if ($("adminButton")) {
  $("adminButton").addEventListener(
    "click",
    () => {
      if (!isAdmin()) {
        alert("❌ Accès refusé.");
        return;
      }

      openPage("adminPage");
      selectedAdminPlayer = null;

      showMessage(
        "adminMessage",
        ""
      );

      if ($("adminPlayerResult")) {
        $("adminPlayerResult").innerHTML = "";
      }
    }
  );
}


/* =====================================
   CONNEXION / INSCRIPTION
===================================== */

function showLogin() {
  if ($("loginForm")) {
    $("loginForm").classList.remove("hidden");
  }

  if ($("registerForm")) {
    $("registerForm").classList.add("hidden");
  }

  if ($("loginTab")) {
    $("loginTab").classList.add("active");
  }

  if ($("registerTab")) {
    $("registerTab").classList.remove("active");
  }

  showMessage("authMessage", "");
}


function showRegister() {
  if ($("registerForm")) {
    $("registerForm").classList.remove("hidden");
  }

  if ($("loginForm")) {
    $("loginForm").classList.add("hidden");
  }

  if ($("registerTab")) {
    $("registerTab").classList.add("active");
  }

  if ($("loginTab")) {
    $("loginTab").classList.remove("active");
  }

  showMessage("authMessage", "");
}


if ($("loginTab")) {
  $("loginTab").addEventListener(
    "click",
    showLogin
  );
}


if ($("registerTab")) {
  $("registerTab").addEventListener(
    "click",
    showRegister
  );
}


/* =====================================
   INSCRIPTION
===================================== */

if ($("registerForm")) {
  $("registerForm").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const pseudo =
        $("registerPseudo").value.trim();

      const email =
        $("registerEmail").value.trim();

      const password =
        $("registerPassword").value;

      showMessage(
        "authMessage",
        "⏳ Création du compte..."
      );

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
          await getJson(response);

        if (!response.ok) {
          showMessage(
            "authMessage",
            "❌ " +
              (
                data.message ||
                "Erreur lors de la création."
              )
          );

          return;
        }

        showMessage(
          "authMessage",
          "✅ Compte créé avec succès !"
        );

        loginUser(data.user);

      } catch (error) {
        console.error(error);

        showMessage(
          "authMessage",
          "❌ Impossible de joindre le serveur."
        );
      }
    }
  );
}


/* =====================================
   CONNEXION
===================================== */

if ($("loginForm")) {
  $("loginForm").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const pseudo =
        $("loginPseudo").value.trim();

      const password =
        $("loginPassword").value;

      showMessage(
        "authMessage",
        "⏳ Connexion..."
      );

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
          await getJson(response);

        if (!response.ok) {
          showMessage(
            "authMessage",
            "❌ " +
              (
                data.message ||
                "Connexion impossible."
              )
          );

          return;
        }

        loginUser(data.user);

      } catch (error) {
        console.error(error);

        showMessage(
          "authMessage",
          "❌ Impossible de joindre le serveur."
        );
      }
    }
  );
}


/* =====================================
   UTILISATEUR
===================================== */

function loginUser(user) {
  if (!user) return;

  currentUser = user;

  saveCurrentUser();

  socket.emit(
    "userOnline",
    {
      pseudo: currentUser.pseudo
    }
  );

  if ($("authScreen")) {
    $("authScreen").classList.add("hidden");
  }

  if ($("forgotScreen")) {
    $("forgotScreen").classList.add("hidden");
  }

  if ($("menuScreen")) {
    $("menuScreen").classList.remove("hidden");
  }

  hidePages();

  updateProfile();
  updateAdminButton();

  refreshCurrentUser();
}


function saveCurrentUser() {
  if (!currentUser) return;

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(currentUser)
  );
}


async function refreshCurrentUser() {
  if (!currentUser || !currentUser.pseudo) return;

  try {
    const response = await fetch(
      "/api/users/" +
        encodeURIComponent(
          currentUser.pseudo
        )
    );

    const data =
      await getJson(response);

    if (!response.ok || !data.user) {
      return;
    }

    currentUser = data.user;

    saveCurrentUser();

    updateProfile();
    updateAdminButton();

  } catch (error) {
    console.warn(
      "Impossible d'actualiser le profil :",
      error
    );
  }
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

  updateXpBar();
}


function updateXpBar() {
  if (!currentUser) return;

  const level =
    Math.max(
      1,
      Number(currentUser.level) || 1
    );

  const xp =
    Math.max(
      0,
      Number(currentUser.xp) || 0
    );

  const xpForNextLevel =
    Math.max(
      100,
      level * 500
    );

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
   ADMIN BUTTON
===================================== */

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
      await getJson(response);

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les classes.";

      return;
    }

    classesCache =
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


function getRoleEmoji(classId) {
  if (classId.startsWith("wolf")) {
    return "🐺";
  }

  if (classId.startsWith("seer")) {
    return "🔮";
  }

  if (classId.startsWith("witch")) {
    return "🧪";
  }

  if (classId.startsWith("hunter")) {
    return "🎯";
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

  if (!container) return;

  if (!classesCache.length) {
    container.textContent =
      "Aucune classe disponible.";

    return;
  }

  container.innerHTML = "";

  classesCache.forEach(
    (classe) => {
      const owned =
        Array.isArray(
          currentUser?.classes
        ) &&
        currentUser.classes.includes(
          classe.id
        );

      const equipped =
        currentUser?.equippedClass ===
        classe.id;

      const card =
        document.createElement("div");

      card.className =
        "class-card" +
        (
          equipped
            ? " equipped"
            : ""
        );

      const role =
        getRoleEmoji(classe.id);

      card.innerHTML = `
        <div>
          <h3>
            ${role}
            ${escapeHtml(classe.name)}
          </h3>

          <p>
            🪙 ${Number(classe.price) || 0}
            • 🎲 ${Number(classe.chance) || 0}% de chance
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
    }
  );
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
      await getJson(response);

    if (!response.ok) {
      alert(
        "❌ " +
        (
          data.message ||
          "Erreur lors de l'achat."
        )
      );

      return;
    }

    currentUser =
      data.user;

    saveCurrentUser();

    updateProfile();

    renderClasses();

    alert("🎉 Classe achetée !");

  } catch (error) {
    console.error(error);

    alert(
      "❌ Erreur de connexion."
    );
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
      await getJson(response);

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

    currentUser =
      data.user;

    saveCurrentUser();

    updateProfile();

    renderClasses();

    alert("✅ Classe équipée !");

  } catch (error) {
    console.error(error);

    alert(
      "❌ Erreur de connexion."
    );
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
      await getJson(response);

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger les quêtes.";

      return;
    }

    questsCache =
      Array.isArray(data.quests)
        ? data.quests
        : [];

    renderQuests();

  } catch (error) {
    console.error(error);

    container.textContent =
      "❌ Erreur de connexion.";
  }
}


function renderQuests() {
  const container =
    $("questsList");

  if (!container) return;

  if (!questsCache.length) {
    container.textContent =
      "Aucune quête disponible.";

    return;
  }

  container.innerHTML = "";

  questsCache.forEach(
    (quest) => {
      const card =
        document.createElement("div");

      card.className =
        "quest-card";

      card.innerHTML = `
        <h3>
          ${escapeHtml(quest.title)}
        </h3>

        <p>
          ${escapeHtml(
            quest.description
          )}
        </p>

        <p>
          ✨ ${Number(quest.xp) || 0} XP
          • 🪙 ${Number(quest.coins) || 0}
        </p>
      `;

      container.appendChild(card);
    }
  );
}


/* =====================================
   SALONS - CRÉER
===================================== */

if ($("createRoomButton")) {
  $("createRoomButton").addEventListener(
    "click",
    () => {
      if (!currentUser) {
        alert(
          "Tu dois être connecté."
        );

        return;
      }

      socket.emit(
        "createRoom",
        {
          pseudo:
            currentUser.pseudo
        }
      );
    }
  );
}


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

    if ($("startGameButton")) {
      $("startGameButton")
        .classList.remove("hidden");
    }

    renderCurrentRoom(room);

    alert(
      "🎮 Partie créée !\n\nCode : " +
      room.code
    );
  }
);


/* =====================================
   SALONS - REJOINDRE
===================================== */

if ($("joinRoomButton")) {
  $("joinRoomButton").addEventListener(
    "click",
    () => {
      if (!currentUser) {
        alert(
          "Tu dois être connecté."
        );

        return;
      }

      const code =
        $("joinRoomCode")
          .value
          .trim()
          .toUpperCase();

      if (!code) {
        alert(
          "Entre un code de partie."
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
}


socket.on(
  "joinedRoom",
  (room) => {
    currentRoomCode =
      room.code;

    isRoomHost =
      room.host ===
      currentUser?.pseudo;

    if ($("startGameButton")) {
      if (isRoomHost) {
        $("startGameButton")
          .classList.remove("hidden");
      } else {
        $("startGameButton")
          .classList.add("hidden");
      }
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
      isRoomHost =
        room.host ===
        currentUser?.pseudo;

      if ($("startGameButton")) {
        if (isRoomHost) {
          $("startGameButton")
            .classList.remove("hidden");
        } else {
          $("startGameButton")
            .classList.add("hidden");
        }
      }

      renderCurrentRoom(room);
    }
  }
);


socket.on(
  "roomError",
  (message) => {
    alert(
      "❌ " + message
    );
  }
);


/* =====================================
   LANCER PARTIE
===================================== */

if ($("startGameButton")) {
  $("startGameButton").addEventListener(
    "click",
    () => {
      if (
        !currentRoomCode ||
        !currentUser
      ) {
        alert(
          "Aucune partie active."
        );

        return;
      }

      if (!isRoomHost) {
        alert(
          "Seul le créateur peut lancer la partie."
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
}


socket.on(
  "gameStarted",
  (game) => {
    if ($("startGameButton")) {
      $("startGameButton")
        .classList.add("hidden");
    }

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

    const players =
      $("gamePlayers");

    if (
      players &&
      Array.isArray(game.players)
    ) {
      game.players.forEach(
        (pseudo) => {
          const p =
            document.createElement("p");

          p.textContent =
            "👤 " + pseudo;

          players.appendChild(p);
        }
      );
    }

    alert(
      "🐺 La partie commence !"
    );
  }
);


/* =====================================
   AFFICHAGE SALON ACTUEL
===================================== */

function renderCurrentRoom(room) {
  const container =
    $("roomsList");

  if (!container) return;

  container.innerHTML = `
    <div class="room-card">
      <h3>
        🎮 Salon
        ${escapeHtml(room.code)}
      </h3>

      <p>
        👑 Créateur :
        ${escapeHtml(room.host)}
      </p>

      <p>
        👥 ${room.players.length} joueur(s)
      </p>

      <h4>Joueurs :</h4>

      <div id="currentPlayers"></div>
    </div>
  `;

  const playersContainer =
    $("currentPlayers");

  if (
    playersContainer &&
    Array.isArray(room.players)
  ) {
    room.players.forEach(
      (pseudo) => {
        const player =
          document.createElement("p");

        player.textContent =
          "👤 " + pseudo;

        playersContainer.appendChild(
          player
        );
      }
    );
  }
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

    rooms.forEach(
      (room) => {
        const card =
          document.createElement("div");

        card.className =
          "room-card";

        card.innerHTML = `
          <strong>
            🎮 Code :
            ${escapeHtml(room.code)}
          </strong>

          <p>
            👑 Créateur :
            ${escapeHtml(room.host)}
          </p>

          <p>
            👥 ${room.players.length} joueur(s)
          </p>

          <button type="button">
            Rejoindre
          </button>
        `;

        const button =
          card.querySelector("button");

        button.addEventListener(
          "click",
          () => {
            if (!currentUser) {
              alert(
                "Tu dois être connecté."
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
      }
    );
  }
);


/* =====================================
   AMIS
===================================== */

function renderFriendsUnavailable() {
  const container =
    $("friendsList");

  if (container) {
    container.textContent =
      "La fonctionnalité Amis sera activée lorsque les routes serveur /api/friends seront ajoutées.";
  }
}


/* =====================================
   RECHERCHE JOUEUR
===================================== */

if ($("searchFriendButton")) {
  $("searchFriendButton").addEventListener(
    "click",
    async () => {
      const pseudo =
        $("friendSearch")
          .value
          .trim();

      if (!pseudo) {
        showMessage(
          "friendResult",
          "Entre un pseudo."
        );

        return;
      }

      showMessage(
        "friendResult",
        "Recherche..."
      );

      try {
        const response =
          await fetch(
            "/api/users/" +
            encodeURIComponent(pseudo)
          );

        const data =
          await getJson(response);

        if (!response.ok) {
          showMessage(
            "friendResult",
            "❌ " +
              (
                data.message ||
                "Joueur introuvable."
              )
          );

          return;
        }

        const user =
          data.user;

        const equipped =
          getClassById(
            user.equippedClass
          );

        const className =
          equipped
            ? equipped.name
            : (
              user.equippedClass ||
              "Aucune"
            );

        $("friendResult").innerHTML = `
          <div class="friend-card">
            <strong>
              ${escapeHtml(
                user.icon || "🐺"
              )}
              ${escapeHtml(user.pseudo)}
            </strong>

            <p>
              ${escapeHtml(
                user.title ||
                "Nouveau Villageois"
              )}
            </p>

            <p>
              ⭐ Niveau ${user.level}
              • ✨ ${user.xp} XP
              • 🪙 ${user.coins}
            </p>

            <p>
              🐺 Classe :
              ${escapeHtml(className)}
            </p>
          </div>
        `;

      } catch (error) {
        console.error(error);

        showMessage(
          "friendResult",
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


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
      await fetch(
        "/api/ranking"
      );

    const data =
      await getJson(response);

    if (!response.ok) {
      container.textContent =
        "❌ Impossible de charger le classement.";

      return;
    }

    container.innerHTML = "";

    if (
      !Array.isArray(data.users) ||
      !data.users.length
    ) {
      container.textContent =
        "Aucun joueur dans le classement.";

      return;
    }

    data.users.forEach(
      (user, index) => {
        const card =
          document.createElement("div");

        card.className =
          "ranking-card";

        card.innerHTML = `
          <strong>
            #${index + 1}
            ${escapeHtml(
              user.icon || "🐺"
            )}
            ${escapeHtml(user.pseudo)}
          </strong>

          <p>
            🏆 ${user.trophies}
            trophée(s)
          </p>

          <p>
            ⭐ Niveau ${user.level}
            • ✨ ${user.xp} XP
          </p>
        `;

        container.appendChild(card);
      }
    );

  } catch (error) {
    console.error(error);

    container.textContent =
      "❌ Impossible de charger.";
  }
}


/* =====================================
   ADMIN - TYPE DE RÉCOMPENSE
===================================== */

function updateAdminRewardInputs() {
  const type =
    $("adminRewardType")?.value;

  const amount =
    $("adminAmount");

  const classSelect =
    $("adminClassSelect");

  if (!amount || !classSelect) return;

  if (type === "class") {
    amount.classList.add("hidden");
    classSelect.classList.remove("hidden");
  } else {
    amount.classList.remove("hidden");
    classSelect.classList.add("hidden");

    if (type === "level") {
      amount.placeholder =
        "Le serveur actuel ne gère pas directement les niveaux";
    } else {
      amount.placeholder =
        "Quantité";
    }
  }
}


if ($("adminRewardType")) {
  $("adminRewardType").addEventListener(
    "change",
    updateAdminRewardInputs
  );

  updateAdminRewardInputs();
}


/* =====================================
   ADMIN - RECHERCHE
===================================== */

if ($("adminSearchButton")) {
  $("adminSearchButton").addEventListener(
    "click",
    async () => {
      if (!isAdmin()) {
        alert(
          "❌ Accès refusé."
        );

        return;
      }

      const targetPseudo =
        $("adminPlayerSearch")
          .value
          .trim();

      if (!targetPseudo) {
        showMessage(
          "adminMessage",
          "❌ Entre le pseudo d'un joueur."
        );

        return;
      }

      showMessage(
        "adminMessage",
        "⏳ Recherche..."
      );

      try {
        const response =
          await fetch(
            "/api/admin/users/" +
            encodeURIComponent(targetPseudo) +
            "?adminPseudo=" +
            encodeURIComponent(
              currentUser.pseudo
            )
          );

        const data =
          await getJson(response);

        if (!response.ok) {
          selectedAdminPlayer = null;

          if ($("adminPlayerResult")) {
            $("adminPlayerResult").innerHTML =
              "❌ " +
              (
                data.message ||
                "Joueur introuvable."
              );
          }

          showMessage(
            "adminMessage",
            ""
          );

          return;
        }

        const user =
          data.user;

        selectedAdminPlayer =
          user.pseudo;

        if ($("adminPlayerResult")) {
          $("adminPlayerResult").innerHTML = `
            <div class="friend-card">
              <h3>
                ${escapeHtml(
                  user.icon || "🐺"
                )}
                ${escapeHtml(user.pseudo)}
              </h3>

              <p>
                ⭐ Niveau :
                ${user.level}
              </p>

              <p>
                ✨ XP :
                ${user.xp}
              </p>

              <p>
                🪙 Pièces :
                ${user.coins}
              </p>

              <p>
                🏆 Trophées :
                ${user.trophies}
              </p>
            </div>
          `;
        }

        showMessage(
          "adminMessage",
          "✅ Joueur sélectionné : " +
            user.pseudo
        );

      } catch (error) {
        console.error(error);

        selectedAdminPlayer = null;

        showMessage(
          "adminMessage",
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

if ($("adminGiveButton")) {
  $("adminGiveButton").addEventListener(
    "click",
    async () => {
      if (!isAdmin()) {
        alert(
          "❌ Accès refusé."
        );

        return;
      }

      const targetPseudo =
        selectedAdminPlayer ||
        $("adminPlayerSearch")
          .value
          .trim();

      if (!targetPseudo) {
        showMessage(
          "adminMessage",
          "❌ Recherche d'abord un joueur."
        );

        return;
      }

      const type =
        $("adminRewardType").value;

      const amount =
        Math.max(
          0,
          Number(
            $("adminAmount").value
          ) || 0
        );

      const classId =
        $("adminClassSelect").value;

      let coins = 0;
      let xp = 0;
      let trophies = 0;
      let rewardClassId = "";

      if (type === "coins") {
        coins = amount;
      }

      if (type === "xp") {
        xp = amount;
      }

      if (type === "level") {
        showMessage(
          "adminMessage",
          "⚠️ Le serveur actuel ne possède pas de récompense directe pour augmenter un niveau. Nous corrigerons cela dans serveur.js."
        );

        return;
      }

      if (type === "class") {
        rewardClassId = classId;
      }

      if (
        coins <= 0 &&
        xp <= 0 &&
        trophies <= 0 &&
        !rewardClassId
      ) {
        showMessage(
          "adminMessage",
          "❌ Choisis une récompense valide."
        );

        return;
      }

      showMessage(
        "adminMessage",
        "⏳ Envoi de la récompense..."
      );

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

                targetPseudo,

                coins,

                xp,

                trophies,

                classId:
                  rewardClassId
              })
            }
          );

        const data =
          await getJson(response);

        showMessage(
          "adminMessage",
          response.ok
            ? "✅ " + data.message
            : "❌ " +
              (
                data.message ||
                "Erreur."
              )
        );

      } catch (error) {
        console.error(error);

        showMessage(
          "adminMessage",
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


/* =====================================
   NOTIFICATIONS
===================================== */

async function loadNotifications() {
  if (!currentUser) return [];

  try {
    const response =
      await fetch(
        "/api/notifications/" +
        encodeURIComponent(
          currentUser.pseudo
        )
      );

    const data =
      await getJson(response);

    if (!response.ok) {
      return [];
    }

    return Array.isArray(
      data.notifications
    )
      ? data.notifications
      : [];

  } catch {
    return [];
  }
}


async function checkNotifications() {
  if (!currentUser) return;

  const notifications =
    await loadNotifications();

  const pending =
    notifications.filter(
      (notification) =>
        !notification.claimed
    );

  if (!pending.length) return;

  console.log(
    "Récompenses disponibles :",
    pending.length
  );
}


/* =====================================
   PARAMÈTRES - DÉCONNEXION
===================================== */

if ($("logoutButton")) {
  $("logoutButton").addEventListener(
    "click",
    () => {
      localStorage.removeItem(
        "lgv7_user"
      );

      currentUser = null;
      currentRoomCode = null;
      isRoomHost = false;
      selectedAdminPlayer = null;

      if ($("startGameButton")) {
        $("startGameButton")
          .classList.add("hidden");
      }

      if ($("menuScreen")) {
        $("menuScreen")
          .classList.add("hidden");
      }

      if ($("forgotScreen")) {
        $("forgotScreen")
          .classList.add("hidden");
      }

      if ($("authScreen")) {
        $("authScreen")
          .classList.remove("hidden");
      }

      hidePages();

      showLogin();

      updateAdminButton();
    }
  );
}


/* =====================================
   PARAMÈTRES - EMAIL
===================================== */

if ($("changeEmailButton")) {
  $("changeEmailButton").addEventListener(
    "click",
    async () => {
      if (!currentUser) return;

      const email =
        $("newEmail").value.trim();

      const password =
        $("emailPassword").value;

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
          await getJson(response);

        alert(
          data.message ||
          (
            response.ok
              ? "Adresse modifiée."
              : "Erreur."
          )
        );

        if (response.ok) {
          $("newEmail").value = "";
          $("emailPassword").value = "";

          await refreshCurrentUser();
        }

      } catch (error) {
        console.error(error);

        alert(
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


/* =====================================
   PARAMÈTRES - SUPPRESSION COMPTE
===================================== */

if ($("deleteAccountButton")) {
  $("deleteAccountButton").addEventListener(
    "click",
    async () => {
      if (!currentUser) return;

      const password =
        $("deletePassword").value;

      if (!password) {
        alert(
          "Entre ton mot de passe."
        );

        return;
      }

      const confirmed =
        confirm(
          "Supprimer définitivement ton compte ?"
        );

      if (!confirmed) return;

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
          await getJson(response);

        if (response.ok) {
          alert(
            "Compte supprimé."
          );

          if ($("logoutButton")) {
            $("logoutButton").click();
          }

        } else {
          alert(
            "❌ " +
            (
              data.message ||
              "Erreur."
            )
          );
        }

      } catch (error) {
        console.error(error);

        alert(
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


/* =====================================
   MOT DE PASSE OUBLIÉ
===================================== */

if ($("forgotPasswordButton")) {
  $("forgotPasswordButton").addEventListener(
    "click",
    () => {
      if ($("authScreen")) {
        $("authScreen")
          .classList.add("hidden");
      }

      if ($("forgotScreen")) {
        $("forgotScreen")
          .classList.remove("hidden");
      }

      showMessage(
        "forgotMessage",
        ""
      );
    }
  );
}


if ($("backToLoginButton")) {
  $("backToLoginButton").addEventListener(
    "click",
    () => {
      if ($("forgotScreen")) {
        $("forgotScreen")
          .classList.add("hidden");
      }

      if ($("authScreen")) {
        $("authScreen")
          .classList.remove("hidden");
      }

      showMessage(
        "forgotMessage",
        ""
      );
    }
  );
}


if ($("sendResetButton")) {
  $("sendResetButton").addEventListener(
    "click",
    async () => {
      const pseudo =
        $("forgotPseudo")
          .value
          .trim();

      if (!pseudo) {
        showMessage(
          "forgotMessage",
          "Entre ton pseudo."
        );

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
          await getJson(response);

        showMessage(
          "forgotMessage",
          data.message ||
          (
            response.ok
              ? "Demande envoyée."
              : "Erreur."
          )
        );

      } catch (error) {
        console.error(error);

        showMessage(
          "forgotMessage",
          "❌ Erreur de connexion."
        );
      }
    }
  );
}


/* =====================================
   CONNEXION SOCKET
===================================== */

socket.on(
  "connect",
  () => {
    if (
      currentUser &&
      currentUser.pseudo
    ) {
      socket.emit(
        "userOnline",
        {
          pseudo:
            currentUser.pseudo
        }
      );
    }
  }
);


/* =====================================
   RESTAURATION SESSION
===================================== */

window.addEventListener(
  "load",
  async () => {
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

      await loadClasses();

      checkNotifications();

    } catch (error) {
      console.error(error);

      localStorage.removeItem(
        "lgv7_user"
      );

      currentUser = null;

      showLogin();
    }
  }
);
