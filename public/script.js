/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

const $ = (id) => document.getElementById(id);

const socket = io();

let currentUser = null;
let currentRoomCode = null;
let isRoomHost = false;

let serverClasses = [];
let serverQuests = [];


/* =====================================
   API HELPER
===================================== */

async function api(url, options = {}) {

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

$("playButton").addEventListener(
  "click",
  () => {

    openPage("gameLobby");

    loadRooms();

  }
);


$("classesButton").addEventListener(
  "click",
  async () => {

    openPage("classesPage");

    await loadClasses();

  }
);


$("questsButton").addEventListener(
  "click",
  async () => {

    openPage("questsPage");

    await loadQuests();

  }
);


$("friendsButton").addEventListener(
  "click",
  () => {

    openPage("friendsPage");

    const container = $("friendsList");

    container.innerHTML = `
      <p>
        👥 Le système d'amis sera activé
        lorsque les routes API amis seront ajoutées
        au serveur.
      </p>
    `;

  }
);


$("rankingButton").addEventListener(
  "click",
  async () => {

    openPage("rankingPage");

    await loadRanking();

  }
);


$("settingsButton").addEventListener(
  "click",
  () => {

    openPage("settingsPage");

  }
);


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


$("loginTab").addEventListener(
  "click",
  showLogin
);


$("registerTab").addEventListener(
  "click",
  showRegister
);


/* =====================================
   INSCRIPTION
===================================== */

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

    $("authMessage").textContent =
      "⏳ Création du compte...";

    try {

      const { response, data } =
        await api(
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

        $("authMessage").textContent =
          "❌ " +
          (
            data.message ||
            "Erreur lors de la création."
          );

        return;
      }

      $("authMessage").textContent =
        "✅ Compte créé avec succès !";

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

$("loginForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const pseudo =
      $("loginPseudo").value.trim();

    const password =
      $("loginPassword").value;

    $("authMessage").textContent =
      "⏳ Connexion...";

    try {

      const { response, data } =
        await api(
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

        $("authMessage").textContent =
          "❌ " +
          (
            data.message ||
            "Connexion impossible."
          );

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

function loginUser(user) {

  currentUser = user;

  saveCurrentUser();

  socket.emit(
    "userOnline",
    {
      pseudo: user.pseudo
    }
  );

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
    currentUser.pseudo;

  $("playerTitle").textContent =
    currentUser.title ||
    "Nouveau Villageois";

  $("profileIcon").textContent =
    currentUser.icon ||
    "🐺";

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

  $("xpProgress").style.width =
    percentage + "%";

}


/* =====================================
   ADMIN BUTTON
===================================== */

function updateAdminButton() {

  const adminButton =
    $("adminButton");

  if (!adminButton) return;

  if (
    currentUser &&
    currentUser.isAdmin === true
  ) {

    adminButton.classList.remove("hidden");

  } else {

    adminButton.classList.add("hidden");

  }

}


$("adminButton").addEventListener(
  "click",
  () => {

    if (
      !currentUser ||
      !currentUser.isAdmin
    ) {

      alert("❌ Accès refusé.");

      return;

    }

    openPage("adminPage");

    $("adminPlayerResult").innerHTML = "";

    $("adminMessage").textContent = "";

  }
);


/* =====================================
   CLASSES
===================================== */

async function loadClasses() {

  const container =
    $("classesList");

  container.textContent =
    "Chargement des classes...";

  try {

    const { response, data } =
      await api("/api/classes");

    if (!response.ok) {

      container.textContent =
        "❌ Impossible de charger les classes.";

      return;

    }

    serverClasses =
      data.classes || [];

    renderClasses();

    updateAdminClassSelect();

  } catch {

    container.textContent =
      "❌ Erreur de connexion.";

  }

}


function getClassEmoji(className) {

  if (
    className.toLowerCase()
      .includes("loup")
  ) return "🐺";

  if (
    className.toLowerCase()
      .includes("voyante")
  ) return "🔮";

  if (
    className.toLowerCase()
      .includes("sorci")
  ) return "🧪";

  if (
    className.toLowerCase()
      .includes("chasseur")
  ) return "🎯";

  if (
    className.toLowerCase()
      .includes("premium")
  ) return "💎";

  if (
    className.toLowerCase()
      .includes("admin")
  ) return "👑";

  return "🐺";

}


function getClassName(classId) {

  const classe =
    serverClasses.find(
      (item) =>
        item.id === classId
    );

  return classe
    ? classe.name
    : "Aucune";

}


function renderClasses() {

  const container =
    $("classesList");

  container.innerHTML = "";

  if (!serverClasses.length) {

    container.textContent =
      "Aucune classe disponible.";

    return;

  }

  serverClasses.forEach(
    (classe) => {

      const owned =
        (
          currentUser.classes || []
        ).includes(classe.id);

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

      const emoji =
        getClassEmoji(classe.name);

      card.innerHTML = `
        <div>
          <h3>
            ${emoji}
            ${classe.name}
          </h3>

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

    const { response, data } =
      await api(
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

    alert("🎉 Classe achetée !");

  } catch {

    alert(
      "❌ Erreur de connexion."
    );

  }

}


async function equipClass(classId) {

  if (!currentUser) return;

  try {

    const { response, data } =
      await api(
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

  } catch {

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

  container.textContent =
    "Chargement des quêtes...";

  try {

    const { response, data } =
      await api("/api/quests");

    if (!response.ok) {

      container.textContent =
        "❌ Impossible de charger.";

      return;

    }

    serverQuests =
      data.quests || [];

    renderQuests();

  } catch {

    container.textContent =
      "❌ Erreur de connexion.";

  }

}


function renderQuests() {

  const container =
    $("questsList");

  container.innerHTML = "";

  if (!serverQuests.length) {

    container.textContent =
      "Aucune quête disponible.";

    return;

  }

  serverQuests.forEach(
    (quest) => {

      const card =
        document.createElement("div");

      card.className =
        "quest-card";

      card.innerHTML = `
        <h3>
          ${quest.title}
        </h3>

        <p>
          ${quest.description}
        </p>

        <p>
          ✨ ${quest.xp} XP
          • 🪙 ${quest.coins}
        </p>
      `;

      container.appendChild(card);

    }
  );

}


/* =====================================
   SALONS - CRÉER
===================================== */

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


socket.on(
  "roomCreated",
  (room) => {

    currentRoomCode =
      room.code;

    isRoomHost =
      true;

    $("joinRoomCode").value =
      room.code;

    $("startGameButton")
      .classList.remove("hidden");

    renderCurrentRoom(room);

    alert(
      "🎮 Partie créée !\n\nCode : " +
      room.code
    );

  }
);


/* =====================================
   REJOINDRE SALON
===================================== */

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


socket.on(
  "joinedRoom",
  (room) => {

    currentRoomCode =
      room.code;

    isRoomHost =
      false;

    $("startGameButton")
      .classList.add("hidden");

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
      currentRoomCode === room.code
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
   LANCER PARTIE
===================================== */

$("startGameButton").addEventListener(
  "click",
  () => {

    if (!currentRoomCode) {

      alert(
        "Aucune partie active."
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


socket.on(
  "gameStarted",
  (game) => {

    $("startGameButton")
      .classList.add("hidden");

    const container =
      $("roomsList");

    container.innerHTML = `
      <div class="room-card">

        <h2>
          🐺 La partie commence !
        </h2>

        <p>
          Code : ${game.code}
        </p>

        <h3>
          Joueurs :
        </h3>

        <div id="gamePlayers"></div>

      </div>
    `;

    const players =
      $("gamePlayers");

    game.players.forEach(
      (pseudo) => {

        const p =
          document.createElement("p");

        p.textContent =
          "👤 " + pseudo;

        players.appendChild(p);

      }
    );

    alert(
      "🐺 La partie commence !"
    );

  }
);


/* =====================================
   SALON ACTUEL
===================================== */

function renderCurrentRoom(room) {

  const container =
    $("roomsList");

  container.innerHTML = `
    <div class="room-card">

      <h3>
        🎮 Salon ${room.code}
      </h3>

      <p>
        👑 Créateur :
        ${room.host}
      </p>

      <p>
        👥 ${room.players.length}
        joueur(s)
      </p>

      <h4>
        Joueurs :
      </h4>

      <div id="currentPlayers"></div>

    </div>
  `;

  const playersContainer =
    $("currentPlayers");

  room.players.forEach(
    (pseudo) => {

      const player =
        document.createElement("p");

      player.textContent =
        "👤 " + pseudo;

      playersContainer.appendChild(player);

    }
  );

}


/* =====================================
   LISTE SALONS
===================================== */

function loadRooms() {

  currentRoomCode = null;

  isRoomHost = false;

  $("startGameButton")
    .classList.add("hidden");

  socket.emit("getRooms");

}


socket.on(
  "roomsList",
  (rooms) => {

    if (currentRoomCode) return;

    const container =
      $("roomsList");

    if (!rooms.length) {

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
          <h3>
            🎮 Partie ${room.code}
          </h3>

          <p>
            👑 Créateur :
            ${room.host}
          </p>

          <p>
            👥
            ${room.players.length}
            joueur(s)
          </p>

          <button>
            Rejoindre
          </button>
        `;

        card
          .querySelector("button")
          .addEventListener(
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
   RECHERCHE JOUEUR / AMIS
===================================== */

$("searchFriendButton").addEventListener(
  "click",
  async () => {

    const pseudo =
      $("friendSearch")
        .value
        .trim();

    if (!pseudo) {

      alert(
        "Entre un pseudo."
      );

      return;

    }

    const result =
      $("friendResult");

    result.textContent =
      "🔎 Recherche...";

    try {

      const { response, data } =
        await api(
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

      result.innerHTML = `
        <div class="friend-card">

          <h3>
            ${user.icon || "🐺"}
            ${user.pseudo}
          </h3>

          <p>
            ${user.title ||
            "Nouveau Villageois"}
          </p>

          <p>
            ⭐ Niveau ${user.level}
          </p>

          <p>
            ✨ ${user.xp} XP
          </p>

          <p>
            🏆 ${user.trophies} trophées
          </p>

          <p>
            🐺 Classe :
            ${
              getClassName(
                user.equippedClass
              )
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

  container.textContent =
    "Chargement...";

  try {

    const { response, data } =
      await api("/api/ranking");

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

    data.users.forEach(
      (user, index) => {

        const card =
          document.createElement("div");

        card.className =
          "ranking-card";

        let medal = "";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";

        card.innerHTML = `
          <h3>
            ${medal}
            #${index + 1}
            ${user.icon || "🐺"}
            ${user.pseudo}
          </h3>

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

    if (
      !currentUser ||
      !currentUser.isAdmin
    ) {

      alert(
        "❌ Accès refusé."
      );

      return;

    }

    const targetPseudo =
      $("adminPlayerSearch")
        .value
        .trim();

    const result =
      $("adminPlayerResult");

    if (!targetPseudo) {

      result.textContent =
        "Entre un pseudo.";

      return;

    }

    result.textContent =
      "🔎 Recherche...";

    try {

      const { response, data } =
        await api(
          "/api/admin/users/" +
          encodeURIComponent(targetPseudo) +
          "?adminPseudo=" +
          encodeURIComponent(
            currentUser.pseudo
          )
        );

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

      result.innerHTML = `
        <div class="friend-card">

          <h3>
            ${user.icon || "🐺"}
            ${user.pseudo}
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

          <p>
            🐺 Classe :
            ${
              getClassName(
                user.equippedClass
              )
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
   ADMIN - TYPE RÉCOMPENSE
===================================== */

$("adminRewardType").addEventListener(
  "change",
  () => {

    const type =
      $("adminRewardType").value;

    const classSelect =
      $("adminClassSelect");

    const amount =
      $("adminAmount");

    if (type === "class") {

      classSelect.classList.remove("hidden");

      amount.classList.add("hidden");

    } else {

      classSelect.classList.add("hidden");

      amount.classList.remove("hidden");

    }

  }
);


/* =====================================
   ADMIN - CLASSES SELECT
===================================== */

function updateAdminClassSelect() {

  const select =
    $("adminClassSelect");

  if (!select) return;

  if (!serverClasses.length) return;

  select.innerHTML = "";

  serverClasses.forEach(
    (classe) => {

      const option =
        document.createElement("option");

      option.value =
        classe.id;

      option.textContent =
        getClassEmoji(
          classe.name
        ) +
        " " +
        classe.name;

      select.appendChild(option);

    }
  );

}


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

$("adminGiveButton").addEventListener(
  "click",
  async () => {

    if (
      !currentUser ||
      !currentUser.isAdmin
    ) {

      alert(
        "❌ Accès refusé."
      );

      return;

    }

    const targetPseudo =
      $("adminPlayerSearch")
        .value
        .trim();

    const type =
      $("adminRewardType")
        .value;

    const amount =
      Math.max(
        0,
        Number(
          $("adminAmount").value
        ) || 0
      );

    const classId =
      $("adminClassSelect")
        .value;

    if (!targetPseudo) {

      $("adminMessage").textContent =
        "❌ Recherche d'abord un joueur.";

      return;

    }

    const body = {

      adminPseudo:
        currentUser.pseudo,

      targetPseudo,

      coins: 0,

      xp: 0,

      trophies: 0,

      classId: ""

    };

    if (type === "coins") {

      body.coins =
        amount;

    }

    if (type === "xp") {

      body.xp =
        amount;

    }

    if (type === "level") {

      /*
       Le serveur actuel ne possède
       pas encore de récompense "niveau".
       On convertit temporairement
       le niveau en XP.
      */

      body.xp =
        amount * 500;

    }

    if (type === "class") {

      body.classId =
        classId;

    }

    if (
      type !== "class" &&
      amount <= 0
    ) {

      $("adminMessage").textContent =
        "❌ Entre une quantité valide.";

      return;

    }

    $("adminMessage").textContent =
      "⏳ Envoi...";

    try {

      const { response, data } =
        await api(
          "/api/admin/reward",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify(body)

          }
        );

      $("adminMessage").textContent =
        (
          response.ok
            ? "✅ "
            : "❌ "
        ) +
        (
          data.message ||
          "Erreur."
        );

    } catch {

      $("adminMessage").textContent =
        "❌ Erreur de connexion.";

    }

  }
);


/* =====================================
   PARAMÈTRES - EMAIL
===================================== */

$("changeEmailButton").addEventListener(
  "click",
  async () => {

    if (!currentUser) return;

    const email =
      $("newEmail")
        .value
        .trim();

    const password =
      $("emailPassword")
        .value;

    try {

      const { response, data } =
        await api(
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

    } catch {

      alert(
        "❌ Erreur de connexion."
      );

    }

  }
);


/* =====================================
   PARAMÈTRES - SUPPRIMER COMPTE
===================================== */

$("deleteAccountButton").addEventListener(
  "click",
  async () => {

    if (!currentUser) return;

    const password =
      $("deletePassword")
        .value;

    if (
      !confirm(
        "Supprimer définitivement ton compte ?"
      )
    ) {

      return;

    }

    try {

      const { response, data } =
        await api(
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

  localStorage.removeItem(
    "lgv7_user"
  );

  currentUser = null;

  currentRoomCode = null;

  isRoomHost = false;

  $("startGameButton")
    .classList.add("hidden");

  $("menuScreen")
    .classList.add("hidden");

  $("forgotScreen")
    .classList.add("hidden");

  $("authScreen")
    .classList.remove("hidden");

  hidePages();

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

    $("authScreen")
      .classList.add("hidden");

    $("forgotScreen")
      .classList.remove("hidden");

  }
);


$("backToLoginButton").addEventListener(
  "click",
  () => {

    $("forgotScreen")
      .classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

  }
);


$("sendResetButton").addEventListener(
  "click",
  async () => {

    const pseudo =
      $("forgotPseudo")
        .value
        .trim();

    try {

      const { data } =
        await api(
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
   NOTIFICATIONS
===================================== */

async function loadNotifications() {

  if (!currentUser) return;

  try {

    const { response, data } =
      await api(
        "/api/notifications/" +
        encodeURIComponent(
          currentUser.pseudo
        )
      );

    if (!response.ok) return;

    const notifications =
      data.notifications || [];

    const unclaimed =
      notifications.filter(
        (notification) =>
          !notification.claimed
      );

    if (!unclaimed.length) return;

    console.log(
      "Notifications disponibles :",
      unclaimed
    );

  } catch {

    console.log(
      "Impossible de charger les notifications."
    );

  }

}


/* =====================================
   RESTAURATION SESSION
===================================== */

window.addEventListener(
  "load",
  () => {

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

        loadNotifications();

      }

    } catch {

      localStorage.removeItem(
        "lgv7_user"
      );

    }

  }
);
