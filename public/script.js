/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

"use strict";


/* =====================================
   RACCOURCI DOM
===================================== */

const $ = (id) => document.getElementById(id);


/* =====================================
   SOCKET.IO
===================================== */

const socket = io();


/* =====================================
   VARIABLES
===================================== */

let currentUser = null;

let currentRoomCode = null;

let isRoomHost = false;

let selectedAdminPlayer = null;


/* =====================================
   CLASSES
===================================== */

let CLASSES = [];


/* =====================================
   QUÊTES
===================================== */

let QUESTS = [];


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


/* =====================================
   UTILITAIRES
===================================== */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


async function getJSON(url, options = {}) {

  const response = await fetch(url, options);

  let data = {};

  try {

    data = await response.json();

  } catch {

    data = {};

  }

  return {
    response,
    data
  };

}


function showMessage(id, message) {

  const element = $(id);

  if (element) {

    element.textContent = message;

  }

}


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


const backButton = $("backButton");

if (backButton) {

  backButton.addEventListener("click", () => {

    hidePages();

  });

}


/* =====================================
   CHARGER CLASSES
===================================== */

async function loadClasses() {

  try {

    const { response, data } =
      await getJSON("/api/classes");

    if (!response.ok) {

      console.error(
        data.message || "Impossible de charger les classes."
      );

      return;

    }

    CLASSES = Array.isArray(data.classes)
      ? data.classes
      : [];

  } catch (error) {

    console.error(
      "Erreur chargement classes :",
      error
    );

  }

}


/* =====================================
   CHARGER QUÊTES
===================================== */

async function loadQuests() {

  try {

    const { response, data } =
      await getJSON("/api/quests");

    if (!response.ok) {

      console.error(
        data.message || "Impossible de charger les quêtes."
      );

      return;

    }

    QUESTS = Array.isArray(data.quests)
      ? data.quests
      : [];

  } catch (error) {

    console.error(
      "Erreur chargement quêtes :",
      error
    );

  }

}


/* =====================================
   NAVIGATION
===================================== */

const playButton = $("playButton");

if (playButton) {

  playButton.addEventListener("click", () => {

    openPage("gameLobby");

    currentRoomCode = null;

    isRoomHost = false;

    loadRooms();

  });

}


const classesButton = $("classesButton");

if (classesButton) {

  classesButton.addEventListener("click", async () => {

    openPage("classesPage");

    await loadClasses();

    renderClasses();

  });

}


const questsButton = $("questsButton");

if (questsButton) {

  questsButton.addEventListener("click", async () => {

    openPage("questsPage");

    await loadQuests();

    renderQuests();

  });

}


const friendsButton = $("friendsButton");

if (friendsButton) {

  friendsButton.addEventListener("click", () => {

    openPage("friendsPage");

    loadFriends();

  });

}


const rankingButton = $("rankingButton");

if (rankingButton) {

  rankingButton.addEventListener("click", () => {

    openPage("rankingPage");

    loadRanking();

  });

}


const settingsButton = $("settingsButton");

if (settingsButton) {

  settingsButton.addEventListener("click", () => {

    openPage("settingsPage");

  });

}


/* =====================================
   CONNEXION / INSCRIPTION
===================================== */

function showLogin() {

  const loginForm = $("loginForm");

  const registerForm = $("registerForm");

  const loginTab = $("loginTab");

  const registerTab = $("registerTab");

  if (loginForm) {

    loginForm.classList.remove("hidden");

  }

  if (registerForm) {

    registerForm.classList.add("hidden");

  }

  if (loginTab) {

    loginTab.classList.add("active");

  }

  if (registerTab) {

    registerTab.classList.remove("active");

  }

  showMessage("authMessage", "");

}


function showRegister() {

  const loginForm = $("loginForm");

  const registerForm = $("registerForm");

  const loginTab = $("loginTab");

  const registerTab = $("registerTab");

  if (registerForm) {

    registerForm.classList.remove("hidden");

  }

  if (loginForm) {

    loginForm.classList.add("hidden");

  }

  if (registerTab) {

    registerTab.classList.add("active");

  }

  if (loginTab) {

    loginTab.classList.remove("active");

  }

  showMessage("authMessage", "");

}


const loginTab = $("loginTab");

if (loginTab) {

  loginTab.addEventListener(
    "click",
    showLogin
  );

}


const registerTab = $("registerTab");

if (registerTab) {

  registerTab.addEventListener(
    "click",
    showRegister
  );

}


/* =====================================
   INSCRIPTION
===================================== */

const registerForm = $("registerForm");

if (registerForm) {

  registerForm.addEventListener(
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

        const { response, data } =
          await getJSON(
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

        if (!response.ok) {

          showMessage(
            "authMessage",
            "❌ " +
            (data.message || "Erreur.")
          );

          return;

        }

        showMessage(
          "authMessage",
          "✅ Compte créé !"
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

const loginForm = $("loginForm");

if (loginForm) {

  loginForm.addEventListener(
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

        const { response, data } =
          await getJSON(
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

  if (!Array.isArray(currentUser.classes)) {

    currentUser.classes = [];

  }

  if (!currentUser.equippedClass) {

    currentUser.equippedClass = null;

  }

  saveCurrentUser();

  socket.emit(
    "userOnline",
    {
      pseudo: currentUser.pseudo
    }
  );

  const authScreen = $("authScreen");

  const forgotScreen = $("forgotScreen");

  const menuScreen = $("menuScreen");

  if (authScreen) {

    authScreen.classList.add("hidden");

  }

  if (forgotScreen) {

    forgotScreen.classList.add("hidden");

  }

  if (menuScreen) {

    menuScreen.classList.remove("hidden");

  }

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

  const xp =
    Number(currentUser.xp || 0);

  const level =
    Number(currentUser.level || 1);

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

  const xpProgress =
    $("xpProgress");

  if (xpProgress) {

    xpProgress.style.width =
      percentage + "%";

  }

}


/* =====================================
   BOUTON ADMIN
===================================== */

function updateAdminButton() {

  const adminButton =
    $("adminButton");

  if (!adminButton) return;

  const isAdmin =
    currentUser &&
    currentUser.pseudo ===
    "creator2026";

  if (isAdmin) {

    adminButton.classList.remove("hidden");

  } else {

    adminButton.classList.add("hidden");

  }

}


const adminButton = $("adminButton");

if (adminButton) {

  adminButton.addEventListener(
    "click",
    () => {

      if (
        !currentUser ||
        currentUser.pseudo !==
        "creator2026"
      ) {

        alert(
          "❌ Accès refusé."
        );

        return;

      }

      selectedAdminPlayer = null;

      showMessage(
        "adminPlayerResult",
        ""
      );

      showMessage(
        "adminMessage",
        ""
      );

      openPage("adminPage");

    }
  );

}


/* =====================================
   CLASSES - AFFICHAGE
===================================== */

function getClassIcon(classe) {

  const name =
    String(classe.name || "")
      .toLowerCase();

  if (name.includes("loup")) return "🐺";

  if (name.includes("voyante")) return "🔮";

  if (name.includes("sorcière")) return "🧪";

  if (name.includes("chasseur")) return "🎯";

  if (name.includes("premium")) return "💎";

  if (name.includes("admin")) return "👑";

  return "🐺";

}


function renderClasses() {

  const container =
    $("classesList");

  if (!container) return;

  if (!currentUser) {

    container.textContent =
      "Tu dois être connecté.";

    return;

  }

  container.innerHTML = "";

  if (!CLASSES.length) {

    container.textContent =
      "Chargement des classes...";

    return;

  }

  CLASSES.forEach((classe) => {

    const owned =
      (
        currentUser.classes || []
      ).includes(
        classe.id
      );

    const equipped =
      currentUser.equippedClass ===
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

    const icon =
      getClassIcon(classe);

    card.innerHTML = `
      <div>
        <h3>
          ${icon}
          ${escapeHTML(classe.name)}
        </h3>

        <p>
          🪙 ${Number(classe.price || 0)}
          • 🎲 ${Number(classe.chance || 0)}%
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

    const { response, data } =
      await getJSON(
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

    alert(
      "🎉 Classe achetée !"
    );

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

    const { response, data } =
      await getJSON(
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

    alert(
      "✅ Classe équipée !"
    );

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

function renderQuests() {

  const container =
    $("questsList");

  if (!container) return;

  container.innerHTML = "";

  if (!QUESTS.length) {

    container.textContent =
      "Aucune quête disponible.";

    return;

  }

  QUESTS.forEach((quest) => {

    const card =
      document.createElement("div");

    card.className =
      "quest-card";

    card.innerHTML = `
      <h3>
        ${escapeHTML(quest.title)}
      </h3>

      <p>
        ${escapeHTML(quest.description)}
      </p>

      <p>
        ✨ ${Number(quest.xp || 0)} XP
        • 🪙 ${Number(quest.coins || 0)}
      </p>
    `;

    container.appendChild(card);

  });

}


/* =====================================
   MULTIJOUEUR - CRÉER
===================================== */

const createRoomButton =
  $("createRoomButton");

if (createRoomButton) {

  createRoomButton.addEventListener(
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
        .classList
        .remove("hidden");

    }

    renderCurrentRoom(room);

    alert(
      "🎮 Partie créée !\n\nCode : " +
      room.code
    );

  }
);


/* =====================================
   MULTIJOUEUR - REJOINDRE
===================================== */

const joinRoomButton =
  $("joinRoomButton");

if (joinRoomButton) {

  joinRoomButton.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        alert(
          "Tu dois être connecté."
        );

        return;

      }

      const input =
        $("joinRoomCode");

      const code =
        String(
          input?.value || ""
        )
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
      false;

    if ($("startGameButton")) {

      $("startGameButton")
        .classList
        .add("hidden");

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
   MULTIJOUEUR - DÉMARRER
===================================== */

const startGameButton =
  $("startGameButton");

if (startGameButton) {

  startGameButton.addEventListener(
    "click",
    () => {

      if (!currentUser) return;

      if (!currentRoomCode) {

        alert(
          "Aucune partie sélectionnée."
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

    const startButton =
      $("startGameButton");

    if (startButton) {

      startButton.classList.add(
        "hidden"
      );

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
          Joueurs :
        </p>

        <div id="gamePlayers"></div>

      </div>
    `;

    const players =
      $("gamePlayers");

    if (players) {

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

  const playersHTML =
    room.players
      .map(
        (pseudo) =>
          `<p>👤 ${escapeHTML(pseudo)}</p>`
      )
      .join("");

  container.innerHTML = `
    <div class="room-card">

      <h3>
        🎮 Salon ${escapeHTML(room.code)}
      </h3>

      <p>
        👑 Créateur :
        ${escapeHTML(room.host)}
      </p>

      <h4>
        Joueurs (${room.players.length})
      </h4>

      <div>
        ${playersHTML}
      </div>

    </div>
  `;

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
      rooms.length === 0
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
            ${escapeHTML(room.code)}
          </strong>

          <p>
            👑 ${escapeHTML(room.host)}
          </p>

          <p>
            👥 ${room.players.length}
            joueur(s)
          </p>

          <button>
            Rejoindre
          </button>
        `;

        const button =
          card.querySelector("button");

        button.addEventListener(
          "click",
          () => {

            if (!currentUser) return;

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
   AMIS - RECHERCHE JOUEUR
===================================== */

const searchFriendButton =
  $("searchFriendButton");

if (searchFriendButton) {

  searchFriendButton.addEventListener(
    "click",
    async () => {

      const pseudo =
        String(
          $("friendSearch")?.value || ""
        ).trim();

      if (!pseudo) {

        alert(
          "Entre un pseudo."
        );

        return;

      }

      const result =
        $("friendResult");

      if (!result) return;

      result.textContent =
        "🔎 Recherche...";

      try {

        const { response, data } =
          await getJSON(
            "/api/users/" +
            encodeURIComponent(pseudo)
          );

        if (!response.ok) {

          result.textContent =
            "❌ Joueur introuvable.";

          return;

        }

        const user =
          data.user;

        const className =
          CLASSES.find(
            (classe) =>
              classe.id ===
              user.equippedClass
          )?.name ||
          "Aucune";

        result.innerHTML = `
          <div class="friend-card">

            <strong>
              ${escapeHTML(user.icon || "🐺")}
              ${escapeHTML(user.pseudo)}
            </strong>

            <p>
              ${escapeHTML(
                user.title ||
                "Nouveau Villageois"
              )}
            </p>

            <p>
              ⭐ Niveau ${Number(user.level || 1)}
              • ✨ ${Number(user.xp || 0)} XP
              • 🪙 ${Number(user.coins || 0)}
            </p>

            <p>
              🐺 Classe :
              ${escapeHTML(className)}
            </p>

          </div>
        `;

      } catch (error) {

        console.error(error);

        result.textContent =
          "❌ Erreur de connexion.";

      }

    }
  );

}


/* =====================================
   AMIS - LISTE

   Les routes seront ajoutées
   dans le prochain serveur.js.
===================================== */

async function loadFriends() {

  const container =
    $("friendsList");

  if (!container) return;

  if (!currentUser) {

    container.textContent =
      "Tu dois être connecté.";

    return;

  }

  try {

    const { response, data } =
      await getJSON(
        "/api/friends/" +
        encodeURIComponent(
          currentUser.pseudo
        )
      );

    if (!response.ok) {

      container.textContent =
        "Le système d'amis sera activé avec le nouveau serveur.";

      return;

    }

    if (
      !Array.isArray(data.friends) ||
      !data.friends.length
    ) {

      container.textContent =
        "Tu n'as pas encore d'amis.";

      return;

    }

    container.innerHTML = "";

    data.friends.forEach(
      (friend) => {

        const card =
          document.createElement("div");

        card.className =
          "friend-card";

        card.innerHTML = `
          <strong>
            ${escapeHTML(friend.icon || "🐺")}
            ${escapeHTML(friend.pseudo)}
          </strong>

          <p>
            ${escapeHTML(
              friend.title ||
              "Nouveau Villageois"
            )}
          </p>

          <p>
            ⭐ Niveau ${Number(friend.level || 1)}
            • 🏆 ${Number(friend.trophies || 0)}
          </p>
        `;

        container.appendChild(card);

      }
    );

  } catch {

    container.textContent =
      "Le système d'amis sera activé avec le nouveau serveur.";

  }

}


/* =====================================
   CLASSEMENT
===================================== */

async function loadRanking() {

  const container =
    $("rankingList");

  if (!container) return;

  container.textContent =
    "⏳ Chargement...";

  try {

    const { response, data } =
      await getJSON(
        "/api/ranking"
      );

    if (!response.ok) {

      container.textContent =
        "❌ Impossible de charger le classement.";

      return;

    }

    const users =
      Array.isArray(data.users)
        ? data.users
        : [];

    if (!users.length) {

      container.textContent =
        "Aucun joueur.";

      return;

    }

    container.innerHTML = "";

    users.forEach(
      (user, index) => {

        const card =
          document.createElement("div");

        card.className =
          "ranking-card";

        card.innerHTML = `
          <strong>
            #${index + 1}
            ${escapeHTML(user.icon || "🐺")}
            ${escapeHTML(user.pseudo)}
          </strong>

          <p>
            🏆 ${Number(user.trophies || 0)}
            trophée(s)
          </p>

          <p>
            ⭐ Niveau ${Number(user.level || 1)}
            • ✨ ${Number(user.xp || 0)} XP
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
   ADMIN - RECHERCHE
===================================== */

const adminSearchButton =
  $("adminSearchButton");

if (adminSearchButton) {

  adminSearchButton.addEventListener(
    "click",
    async () => {

      if (
        !currentUser ||
        currentUser.pseudo !==
        "creator2026"
      ) {

        alert(
          "❌ Accès refusé."
        );

        return;

      }

      const targetPseudo =
        String(
          $("adminPlayerSearch")?.value || ""
        ).trim();

      const result =
        $("adminPlayerResult");

      if (!targetPseudo) {

        showMessage(
          "adminPlayerResult",
          "❌ Entre un pseudo."
        );

        return;

      }

      showMessage(
        "adminPlayerResult",
        "🔎 Recherche..."
      );

      try {

        const { response, data } =
          await getJSON(
            "/api/admin/users/" +
            encodeURIComponent(targetPseudo) +
            "?adminPseudo=" +
            encodeURIComponent(
              currentUser.pseudo
            )
          );

        if (!response.ok) {

          selectedAdminPlayer =
            null;

          showMessage(
            "adminPlayerResult",
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

        selectedAdminPlayer =
          user.pseudo;

        result.innerHTML = `
          <div class="friend-card">

            <h3>
              ${escapeHTML(user.icon || "🐺")}
              ${escapeHTML(user.pseudo)}
            </h3>

            <p>
              ⭐ Niveau :
              ${Number(user.level || 1)}
            </p>

            <p>
              ✨ XP :
              ${Number(user.xp || 0)}
            </p>

            <p>
              🪙 Pièces :
              ${Number(user.coins || 0)}
            </p>

            <p>
              🏆 Trophées :
              ${Number(user.trophies || 0)}
            </p>

          </div>
        `;

        showMessage(
          "adminMessage",
          "✅ Joueur sélectionné : " +
          user.pseudo
        );

      } catch (error) {

        console.error(error);

        showMessage(
          "adminPlayerResult",
          "❌ Erreur de connexion."
        );

      }

    }
  );

}


/* =====================================
   ADMIN - TYPE RÉCOMPENSE
===================================== */

const adminRewardType =
  $("adminRewardType");

if (adminRewardType) {

  adminRewardType.addEventListener(
    "change",
    () => {

      const classSelect =
        $("adminClassSelect");

      const amount =
        $("adminAmount");

      if (
        adminRewardType.value ===
        "class"
      ) {

        if (classSelect) {

          classSelect.classList.remove(
            "hidden"
          );

        }

        if (amount) {

          amount.classList.add(
            "hidden"
          );

        }

      } else {

        if (classSelect) {

          classSelect.classList.add(
            "hidden"
          );

        }

        if (amount) {

          amount.classList.remove(
            "hidden"
          );

        }

      }

    }
  );

}


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

const adminGiveButton =
  $("adminGiveButton");

if (adminGiveButton) {

  adminGiveButton.addEventListener(
    "click",
    async () => {

      if (
        !currentUser ||
        currentUser.pseudo !==
        "creator2026"
      ) {

        alert(
          "❌ Accès refusé."
        );

        return;

      }

      if (!selectedAdminPlayer) {

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
            $("adminAmount")?.value || 0
          )
        );

      const classId =
        String(
          $("adminClassSelect")?.value || ""
        );

      const reward = {

        adminPseudo:
          currentUser.pseudo,

        targetPseudo:
          selectedAdminPlayer,

        coins: 0,

        xp: 0,

        trophies: 0,

        classId: ""

      };


      if (type === "coins") {

        reward.coins =
          amount;

      }

      if (type === "xp") {

        reward.xp =
          amount;

      }

      if (type === "level") {

        reward.xp =
          amount * 500;

      }

      if (type === "class") {

        reward.classId =
          classId;

      }


      if (
        type !== "class" &&
        amount <= 0
      ) {

        showMessage(
          "adminMessage",
          "❌ Entre une quantité valide."
        );

        return;

      }


      try {

        showMessage(
          "adminMessage",
          "⏳ Envoi..."
        );

        const { response, data } =
          await getJSON(
            "/api/admin/reward",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify(
                reward
              )
            }
          );

        showMessage(
          "adminMessage",
          (
            response.ok
              ? "✅ "
              : "❌ "
          ) +
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
   PARAMÈTRES - DÉCONNEXION
===================================== */

const logoutButton =
  $("logoutButton");

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "lgv7_user"
      );

      currentUser =
        null;

      currentRoomCode =
        null;

      isRoomHost =
        false;

      selectedAdminPlayer =
        null;

      const startButton =
        $("startGameButton");

      if (startButton) {

        startButton.classList.add(
          "hidden"
        );

      }

      hidePages();

      $("menuScreen")
        ?.classList
        .add("hidden");

      $("forgotScreen")
        ?.classList
        .add("hidden");

      $("authScreen")
        ?.classList
        .remove("hidden");

      showLogin();

    }
  );

}


/* =====================================
   PARAMÈTRES - EMAIL
===================================== */

const changeEmailButton =
  $("changeEmailButton");

if (changeEmailButton) {

  changeEmailButton.addEventListener(
    "click",
    async () => {

      if (!currentUser) return;

      const email =
        $("newEmail").value.trim();

      const password =
        $("emailPassword").value;

      if (!email || !password) {

        alert(
          "Remplis tous les champs."
        );

        return;

      }

      try {

        const { response, data } =
          await getJSON(
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

        alert(
          (
            response.ok
              ? "✅ "
              : "❌ "
          ) +
          (
            data.message ||
            "Erreur."
          )
        );

        if (response.ok) {

          currentUser.email =
            email;

          saveCurrentUser();

          $("newEmail").value =
            "";

          $("emailPassword").value =
            "";

        }

      } catch {

        alert(
          "❌ Erreur de connexion."
        );

      }

    }
  );

}


/* =====================================
   PARAMÈTRES - SUPPRESSION
===================================== */

const deleteAccountButton =
  $("deleteAccountButton");

if (deleteAccountButton) {

  deleteAccountButton.addEventListener(
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

      if (
        !confirm(
          "Supprimer définitivement ton compte ?"
        )
      ) {

        return;

      }

      try {

        const { response, data } =
          await getJSON(
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

        alert(
          "✅ Compte supprimé."
        );

        logoutButton?.click();

      } catch {

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

const forgotPasswordButton =
  $("forgotPasswordButton");

if (forgotPasswordButton) {

  forgotPasswordButton.addEventListener(
    "click",
    () => {

      $("authScreen")
        ?.classList
        .add("hidden");

      $("forgotScreen")
        ?.classList
        .remove("hidden");

      showMessage(
        "forgotMessage",
        ""
      );

    }
  );

}


const backToLoginButton =
  $("backToLoginButton");

if (backToLoginButton) {

  backToLoginButton.addEventListener(
    "click",
    () => {

      $("forgotScreen")
        ?.classList
        .add("hidden");

      $("authScreen")
        ?.classList
        .remove("hidden");

    }
  );

}


const sendResetButton =
  $("sendResetButton");

if (sendResetButton) {

  sendResetButton.addEventListener(
    "click",
    async () => {

      const pseudo =
        String(
          $("forgotPseudo")?.value || ""
        ).trim();

      if (!pseudo) {

        showMessage(
          "forgotMessage",
          "❌ Entre ton pseudo."
        );

        return;

      }

      try {

        const { data } =
          await getJSON(
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

        showMessage(
          "forgotMessage",
          data.message ||
          "Demande envoyée."
        );

      } catch {

        showMessage(
          "forgotMessage",
          "❌ Erreur de connexion."
        );

      }

    }
  );


/* =====================================
   RESTAURER SESSION
===================================== */

window.addEventListener(
  "load",
  async () => {

    await loadClasses();

    await loadQuests();

    const saved =
      localStorage.getItem(
        "lgv7_user"
      );

    if (!saved) return;

    try {

      const user =
        JSON.parse(saved);

      if (
        user &&
        user.pseudo
      ) {

        loginUser(user);

      }

    } catch (error) {

      console.error(error);

      localStorage.removeItem(
        "lgv7_user"
      );

    }

  }
);
