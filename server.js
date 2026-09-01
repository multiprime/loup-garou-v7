/* =====================================
   LOUP-GAROU V7 - SCRIPT CLIENT
===================================== */

const $ = (id) => document.getElementById(id);

const socket = io();

let currentUser = null;
let currentRoomCode = null;
let isRoomHost = false;


/* =====================================
   CLASSES
===================================== */

const CLASSES = [
  { id: "wolf1", role: "🐺", name: "Loup-Garou 1", price: 1000, chance: 10 },
  { id: "wolf2", role: "🐺", name: "Loup-Garou 2", price: 1200, chance: 20 },
  { id: "wolf3", role: "🐺", name: "Loup-Garou 3", price: 1300, chance: 35 },
  { id: "wolf4", role: "🐺", name: "Loup-Garou certifié", price: 1500, chance: 50 },

  { id: "seer1", role: "🔮", name: "Voyante 1", price: 200, chance: 10 },
  { id: "seer2", role: "🔮", name: "Voyante 2", price: 250, chance: 20 },
  { id: "seer3", role: "🔮", name: "Voyante 3", price: 300, chance: 30 },
  { id: "seer4", role: "🔮", name: "Voyante certifiée", price: 400, chance: 50 },

  { id: "witch1", role: "🧪", name: "Sorcière 1", price: 350, chance: 10 },
  { id: "witch2", role: "🧪", name: "Sorcière 2", price: 450, chance: 20 },
  { id: "witch3", role: "🧪", name: "Sorcière 3", price: 500, chance: 30 },
  { id: "witch4", role: "🧪", name: "Sorcière certifiée", price: 600, chance: 50 },

  { id: "hunter1", role: "🎯", name: "Chasseur 1", price: 100, chance: 10 },
  { id: "hunter2", role: "🎯", name: "Chasseur 2", price: 150, chance: 20 },
  { id: "hunter3", role: "🎯", name: "Chasseur 3", price: 200, chance: 30 },
  { id: "hunter4", role: "🎯", name: "Chasseur certifié", price: 300, chance: 50 }
];


/* =====================================
   QUÊTES
===================================== */

const QUESTS = [
  {
    id: "play1",
    title: "🌙 Première nuit",
    description: "Jouer 1 partie.",
    xp: 100,
    coins: 100
  },
  {
    id: "play3",
    title: "🎮 Joueur débutant",
    description: "Jouer 3 parties.",
    xp: 200,
    coins: 100
  },
  {
    id: "play5",
    title: "🏘️ Villageois actif",
    description: "Jouer 5 parties.",
    xp: 300,
    coins: 150
  },
  {
    id: "play10",
    title: "🔥 Joueur expérimenté",
    description: "Jouer 10 parties.",
    xp: 500,
    coins: 200
  },
  {
    id: "win1",
    title: "🏆 Première victoire",
    description: "Gagner 1 partie.",
    xp: 500,
    coins: 100
  },
  {
    id: "win3",
    title: "🥇 Vainqueur",
    description: "Gagner 3 parties.",
    xp: 500,
    coins: 250
  },
  {
    id: "win10",
    title: "👑 Légende du village",
    description: "Gagner 10 parties.",
    xp: 1000,
    coins: 500
  }
];


/* =====================================
   NAVIGATION
===================================== */

const pages = [
  "gameLobby",
  "classesPage",
  "questsPage",
  "friendsPage",
  "rankingPage",
  "settingsPage"
];

function hidePages() {

  pages.forEach((page) => {
    const element = $(page);

    if (element) {
      element.classList.add("hidden");
    }
  });

  $("backButton").classList.add("hidden");
}


function openPage(pageId) {

  hidePages();

  $(pageId).classList.remove("hidden");

  $("backButton").classList.remove("hidden");
}


$("backButton").addEventListener("click", hidePages);


$("playButton").addEventListener("click", () => {

  openPage("gameLobby");

  currentRoomCode = null;

  $("startGameButton").classList.add("hidden");

  loadRooms();

});


$("classesButton").addEventListener("click", () => {

  openPage("classesPage");

  renderClasses();

});


$("questsButton").addEventListener("click", () => {

  openPage("questsPage");

  renderQuests();

});


$("friendsButton").addEventListener("click", () => {

  openPage("friendsPage");

  loadFriends();

});


$("rankingButton").addEventListener("click", () => {

  openPage("rankingPage");

  loadRanking();

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
        "❌ " + (data.message || "Erreur.");

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

});


/* =====================================
   CONNEXION
===================================== */

$("loginForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const pseudo = $("loginPseudo").value.trim();

  const password = $("loginPassword").value;

  $("authMessage").textContent =
    "⏳ Connexion...";

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

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(user)
  );

  socket.emit("userOnline", {
    pseudo: user.pseudo
  });

  $("forgotScreen").classList.add("hidden");

  $("authScreen").classList.add("hidden");

  $("menuScreen").classList.remove("hidden");

  updateProfile();

}


function updateProfile() {

  if (!currentUser) return;

  $("playerName").textContent =
    currentUser.pseudo;

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


function saveCurrentUser() {

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(currentUser)
  );

}


function updateXpBar() {

  if (!currentUser) return;

  const xp = currentUser.xp || 0;

  const level = currentUser.level || 1;

  const xpForNextLevel = Math.max(
    100,
    level * 500
  );

  const percentage = Math.min(
    100,
    Math.round(
      (xp / xpForNextLevel) * 100
    )
  );

  $("xpProgress").style.width =
    percentage + "%";

}


/* =====================================
   CLASSES
===================================== */

function renderClasses() {

  const container = $("classesList");

  container.innerHTML = "";

  CLASSES.forEach((classe) => {

    const owned =
      (currentUser.classes || [])
        .includes(classe.id);

    const equipped =
      currentUser.equippedClass === classe.id;

    const card =
      document.createElement("div");

    card.className =
      "class-card" +
      (equipped ? " equipped" : "");

    card.innerHTML = `
      <div>
        <h3>${classe.role} ${classe.name}</h3>

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

    card.querySelector("button")
      .addEventListener("click", () => {

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

  try {

    const response =
      await fetch("/api/classes/buy", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          pseudo: currentUser.pseudo,
          classId
        })

      });

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        "❌ " +
        (data.message || "Erreur.")
      );

      return;

    }

    currentUser = data.user;

    saveCurrentUser();

    updateProfile();

    renderClasses();

    alert("✅ Classe achetée !");

  } catch {

    alert("❌ Erreur de connexion.");

  }

}


async function equipClass(classId) {

  try {

    const response =
      await fetch("/api/classes/equip", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          pseudo: currentUser.pseudo,
          classId
        })

      });

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        "❌ " +
        (data.message || "Erreur.")
      );

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

function renderQuests() {

  const container =
    $("questsList");

  container.innerHTML = "";

  QUESTS.forEach((quest) => {

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
   CRÉER UNE PARTIE
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

    socket.emit("createRoom", {

      pseudo:
        currentUser.pseudo

    });

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
      "🎮 Partie créée !\n\n" +
      "Code : " +
      room.code
    );

  }
);


/* =====================================
   REJOINDRE UNE PARTIE
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
        "Entre le code de la partie."
      );

      return;

    }

    socket.emit("joinRoom", {

      code,

      pseudo:
        currentUser.pseudo

    });

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
      "✅ Tu as rejoint la partie " +
      room.code
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
   AFFICHER LE SALON
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

      <h4>Joueurs :</h4>

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

      playersContainer
        .appendChild(player);

    }
  );

}


/* =====================================
   LANCER LA PARTIE
===================================== */

$("startGameButton").addEventListener(
  "click",
  () => {

    if (!currentUser) {

      alert(
        "Tu dois être connecté."
      );

      return;

    }

    if (!currentRoomCode) {

      alert(
        "Aucune partie créée."
      );

      return;

    }

    if (!isRoomHost) {

      alert(
        "Seul le créateur peut lancer."
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
          ${game.players.length}
          joueurs participent.
        </p>

        <h3>
          Les rôles ont été distribués.
        </h3>

        <div id="gamePlayers"></div>

      </div>
    `;

    const gamePlayers =
      $("gamePlayers");

    game.players.forEach(
      (pseudo) => {

        const p =
          document.createElement("p");

        p.textContent =
          "👤 " + pseudo;

        gamePlayers.appendChild(p);

      }
    );

  }
);


/* =====================================
   LISTE DES PARTIES
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
            🎮 ${room.code}
          </h3>

          <p>
            👑 ${room.host}
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
   AMIS - RECHERCHE
===================================== */

$("searchFriendButton").addEventListener(
  "click",
  async () => {

    const pseudo =
      $("friendSearch")
        .value
        .trim();

    if (!pseudo) {

      $("friendResult").textContent =
        "Entre un pseudo.";

      return;

    }

    $("friendResult").textContent =
      "⏳ Recherche...";

    try {

      const response =
        await fetch(
          "/api/users/" +
          encodeURIComponent(pseudo)
        );

      const data =
        await response.json();

      if (!response.ok) {

        $("friendResult").textContent =
          "❌ " +
          (data.message ||
          "Joueur introuvable.");

        return;

      }

      const user =
        data.user;

      $("friendResult").innerHTML = `
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
            ⭐ Niveau ${user.level || 1}
          </p>

          <p>
            ✨ ${user.xp || 0} XP
          </p>

          <p>
            🪙 ${user.coins || 0}
          </p>

          <p>
            🏆 ${user.trophies || 0}
          </p>

          <button id="addFriendButton">
            ➕ Ajouter en ami
          </button>

        </div>
      `;

      $("addFriendButton")
        .addEventListener(
          "click",
          () => {

            alert(
              "La demande d'ami sera ajoutée " +
              "dans la prochaine version du serveur."
            );

          }
        );

    } catch (error) {

      console.error(error);

      $("friendResult").textContent =
        "❌ Erreur de connexion.";

    }

  }
);


/* =====================================
   MES AMIS
===================================== */

async function loadFriends() {

  $("friendsList").textContent =
    "Aucun ami pour le moment.";

}


/* =====================================
   CLASSEMENT
===================================== */

async function loadRanking() {

  const container =
    $("rankingList");

  container.textContent =
    "⏳ Chargement...";

  try {

    const response =
      await fetch(
        "/api/ranking"
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error();

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

        card.innerHTML = `
          <h3>
            #${index + 1}
            ${user.icon || "🐺"}
            ${user.pseudo}
          </h3>

          <p>
            🏆 ${user.trophies || 0}
            trophée(s)
          </p>

          <p>
            ⭐ Niveau
            ${user.level || 1}
          </p>

          <p>
            ${user.title ||
            "Nouveau Villageois"}
          </p>
        `;

        container.appendChild(card);

      }
    );

  } catch (error) {

    console.error(error);

    container.textContent =
      "❌ Impossible de charger le classement.";

  }

}


/* =====================================
   PARAMÈTRES
===================================== */

$("logoutButton").addEventListener(
  "click",
  () => {

    if (currentUser) {

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

    currentUser =
      null;

    currentRoomCode =
      null;

    isRoomHost =
      false;

    $("startGameButton")
      .classList.add("hidden");

    $("menuScreen")
      .classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

    hidePages();

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
      $("newEmail")
        .value
        .trim();

    const password =
      $("emailPassword")
        .value;

    if (!email || !password) {

      alert(
        "Remplis tous les champs."
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

            body: JSON.stringify(
              {

                pseudo:
                  currentUser.pseudo,

                email,

                password

              }
            )

          }
        );

      const data =
        await response.json();

      alert(
        data.message
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


/* =====================================
   SUPPRIMER COMPTE
===================================== */

$("deleteAccountButton").addEventListener(
  "click",
  async () => {

    if (!currentUser) return;

    const password =
      $("deletePassword")
        .value;

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

            body: JSON.stringify(
              {

                pseudo:
                  currentUser.pseudo,

                password

              }
            )

          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          "❌ " +
          data.message
        );

        return;

      }

      alert(
        "Compte supprimé."
      );

      localStorage.removeItem(
        "lgv7_user"
      );

      currentUser =
        null;

      $("menuScreen")
        .classList.add("hidden");

      $("authScreen")
        .classList.remove("hidden");

      hidePages();

    } catch {

      alert(
        "❌ Erreur de connexion."
      );

    }

  }
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

    $("forgotMessage").textContent =
      "";

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
        "Entre ton pseudo.";

      return;

    }

    $("forgotMessage").textContent =
      "⏳ Envoi...";

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
        data.message;

    } catch {

      $("forgotMessage").textContent =
        "❌ Erreur de connexion.";

    }

  }
);


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

      loginUser(user);

    } catch (error) {

      console.error(error);

      localStorage.removeItem(
        "lgv7_user"
      );

    }

  }
);


/* =====================================
   RECONNEXION SOCKET
===================================== */

socket.on(
  "connect",
  () => {

    if (currentUser) {

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
