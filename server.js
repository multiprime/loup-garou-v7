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
  { id: "wolf1", role: "🐺 Loup-Garou", name: "Loup-Garou 1", price: 1000, chance: 10 },
  { id: "wolf2", role: "🐺 Loup-Garou", name: "Loup-Garou 2", price: 1200, chance: 20 },
  { id: "wolf3", role: "🐺 Loup-Garou", name: "Loup-Garou 3", price: 1300, chance: 35 },
  { id: "wolf4", role: "🐺 Loup-Garou", name: "Loup-Garou certifié", price: 1500, chance: 50 },

  { id: "seer1", role: "🔮 Voyante", name: "Voyante 1", price: 200, chance: 10 },
  { id: "seer2", role: "🔮 Voyante", name: "Voyante 2", price: 250, chance: 20 },
  { id: "seer3", role: "🔮 Voyante", name: "Voyante 3", price: 300, chance: 30 },
  { id: "seer4", role: "🔮 Voyante", name: "Voyante certifiée", price: 400, chance: 50 },

  { id: "witch1", role: "🧪 Sorcière", name: "Sorcière 1", price: 350, chance: 10 },
  { id: "witch2", role: "🧪 Sorcière", name: "Sorcière 2", price: 450, chance: 20 },
  { id: "witch3", role: "🧪 Sorcière", name: "Sorcière 3", price: 500, chance: 30 },
  { id: "witch4", role: "🧪 Sorcière", name: "Sorcière certifiée", price: 600, chance: 50 },

  { id: "hunter1", role: "🎯 Chasseur", name: "Chasseur 1", price: 100, chance: 10 },
  { id: "hunter2", role: "🎯 Chasseur", name: "Chasseur 2", price: 150, chance: 20 },
  { id: "hunter3", role: "🎯 Chasseur", name: "Chasseur 3", price: 200, chance: 30 },
  { id: "hunter4", role: "🎯 Chasseur", name: "Chasseur certifié", price: 300, chance: 50 }
];


/* =====================================
   QUÊTES
===================================== */

const QUESTS = [
  {
    id: "play1",
    title: "Première nuit",
    description: "Jouer une partie.",
    xp: 100,
    coins: 100
  },
  {
    id: "play5",
    title: "Villageois actif",
    description: "Jouer 5 parties.",
    xp: 250,
    coins: 100
  },
  {
    id: "win1",
    title: "Première victoire",
    description: "Gagner une partie.",
    xp: 500,
    coins: 100
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
    $(page).classList.add("hidden");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      $("authMessage").textContent =
        "❌ " + (data.message || "Erreur.");
      return;
    }

    $("authMessage").textContent = "✅ Compte créé !";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, password })
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

  $("authScreen").classList.add("hidden");
  $("menuScreen").classList.remove("hidden");

  updateProfile();
}

function updateProfile() {
  if (!currentUser) return;

  $("playerName").textContent = currentUser.pseudo;
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
  const xp = currentUser.xp || 0;
  const xpForNextLevel =
    Math.max(100, (currentUser.level || 1) * 500);

  const percentage = Math.min(
    100,
    Math.round((xp / xpForNextLevel) * 100)
  );

  $("xpProgress").style.width = percentage + "%";
}


/* =====================================
   CLASSES
===================================== */

function renderClasses() {
  const container = $("classesList");

  container.innerHTML = "";

  CLASSES.forEach((classe) => {
    const owned =
      (currentUser.classes || []).includes(classe.id);

    const equipped =
      currentUser.equippedClass === classe.id;

    const card = document.createElement("div");

    card.className =
      "class-card" + (equipped ? " equipped" : "");

    card.innerHTML = `
      <div>
        <h3>${classe.role} ${classe.name}</h3>
        <p>🪙 ${classe.price} • 🎲 ${classe.chance}% de chance</p>
      </div>
      <button>
        ${equipped ? "✓ Équipée" : owned ? "Équiper" : "Acheter"}
      </button>
    `;

    card.querySelector("button").addEventListener("click", () => {
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
  const response = await fetch("/api/classes/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pseudo: currentUser.pseudo,
      classId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message);
    return;
  }

  currentUser = data.user;

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(currentUser)
  );

  updateProfile();
  renderClasses();
}

async function equipClass(classId) {
  const response = await fetch("/api/classes/equip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pseudo: currentUser.pseudo,
      classId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message);
    return;
  }

  currentUser = data.user;

  localStorage.setItem(
    "lgv7_user",
    JSON.stringify(currentUser)
  );

  updateProfile();
  renderClasses();
}


/* =====================================
   QUÊTES
===================================== */

function renderQuests() {
  const container = $("questsList");

  container.innerHTML = "";

  QUESTS.forEach((quest) => {
    const card = document.createElement("div");

    card.className = "quest-card";

    card.innerHTML = `
      <h3>${quest.title}</h3>
      <p>${quest.description}</p>
      <p>✨ ${quest.xp} XP • 🪙 ${quest.coins}</p>
    `;

    container.appendChild(card);
  });
}


/* =====================================
   MULTIJOUEUR - CRÉER SALON
===================================== */

$("createRoomButton").addEventListener("click", () => {

  if (!currentUser) {
    alert("Tu dois être connecté.");
    return;
  }

  socket.emit("createRoom", {
    pseudo: currentUser.pseudo
  });

});


socket.on("roomCreated", (room) => {

  currentRoomCode = room.code;
  isRoomHost = true;

  // Affiche automatiquement le code
  $("joinRoomCode").value = room.code;

  // Affiche le bouton pour le créateur
  $("startGameButton").classList.remove("hidden");

  alert(
    "🎮 Partie créée !\n\n" +
    "Code à donner à tes amis : " +
    room.code
  );

  renderCurrentRoom(room);
});


/* =====================================
   LANCER LA PARTIE
===================================== */

$("startGameButton").addEventListener("click", () => {

  if (!currentRoomCode) {
    alert("Aucune partie créée.");
    return;
  }

  socket.emit("startGame", {
    code: currentRoomCode,
    pseudo: currentUser.pseudo
  });

});


socket.on("gameStarted", (game) => {

  $("startGameButton").classList.add("hidden");

  alert(
    "🐺 LA PARTIE COMMENCE !\n\n" +
    "Les rôles vont être distribués."
  );

  console.log("Partie démarrée :", game);

});


/* =====================================
   REJOINDRE SALON
===================================== */

$("joinRoomButton").addEventListener("click", () => {

  const code =
    $("joinRoomCode").value.trim().toUpperCase();

  if (!code) {
    alert("Entre un code.");
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

  alert(
    "✅ Tu as rejoint la partie " +
    room.code
  );

  renderCurrentRoom(room);

});


socket.on("roomUpdated", (room) => {

  if (currentRoomCode === room.code) {
    renderCurrentRoom(room);
  }

});


socket.on("roomError", (message) => {
  alert("❌ " + message);
});


/* =====================================
   AFFICHAGE DU SALON ACTUEL
===================================== */

function renderCurrentRoom(room) {

  const container = $("roomsList");

  container.innerHTML = `
    <div class="room-card">
      <h3>🎮 Salon ${room.code}</h3>

      <p>👑 Créateur : ${room.host}</p>

      <h4>Joueurs :</h4>

      <div id="currentPlayers"></div>
    </div>
  `;

  const playersContainer =
    $("currentPlayers");

  room.players.forEach((pseudo) => {

    const player = document.createElement("p");

    player.textContent =
      "👤 " + pseudo;

    playersContainer.appendChild(player);

  });

}


/* =====================================
   LISTE DES PARTIES
===================================== */

function loadRooms() {
  socket.emit("getRooms");
}


socket.on("roomsList", (rooms) => {

  // Si on est déjà dans une salle,
  // on garde l'affichage de cette salle
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
        👥 ${room.players.length} joueur(s)
      </p>

      <button>Rejoindre</button>
    `;

    card.querySelector("button")
      .addEventListener("click", () => {

        socket.emit("joinRoom", {
          code: room.code,
          pseudo: currentUser.pseudo
        });

      });

    container.appendChild(card);

  });

});


/* =====================================
   AMIS
===================================== */

$("searchFriendButton").addEventListener(
  "click",
  async () => {

    const pseudo =
      $("friendSearch").value.trim();

    if (!pseudo) return;

    try {

      const response = await fetch(
        "/api/users/" +
        encodeURIComponent(pseudo)
      );

      const data = await response.json();

      const result =
        $("friendResult");

      if (!response.ok) {
        result.textContent =
          "❌ Joueur introuvable.";
        return;
      }

      result.innerHTML = `
        <div class="friend-card">
          <strong>
            ${data.user.icon || "🐺"}
            ${data.user.pseudo}
          </strong>

          <p>
            ${data.user.title ||
            "Nouveau Villageois"}
          </p>

          <p>
            ⭐ Niveau ${data.user.level}
            • ✨ ${data.user.xp} XP
            • 🪙 ${data.user.coins}
          </p>
        </div>
      `;

    } catch {

      $("friendResult").textContent =
        "❌ Erreur de connexion.";

    }

  }
);


async function loadFriends() {

  $("friendsList").textContent =
    "Les amis seront affichés ici.";

}


/* =====================================
   CLASSEMENT
===================================== */

async function loadRanking() {

  const container =
    $("rankingList");

  container.textContent =
    "Chargement...";

  try {

    const response =
      await fetch("/api/ranking");

    const data =
      await response.json();

    container.innerHTML = "";

    data.users.forEach((user, index) => {

      const card =
        document.createElement("div");

      card.className =
        "ranking-card";

      card.innerHTML = `
        #${index + 1}
        ${user.icon || "🐺"}

        <strong>${user.pseudo}</strong>

        — 🏆 ${user.trophies}

        <br>

        ${user.title ||
        "Nouveau Villageois"}
      `;

      container.appendChild(card);

    });

  } catch {

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

    socket.emit("userOffline", {
      pseudo: currentUser?.pseudo
    });

    localStorage.removeItem("lgv7_user");

    currentUser = null;
    currentRoomCode = null;
    isRoomHost = false;

    $("startGameButton")
      .classList.add("hidden");

    $("menuScreen")
      .classList.add("hidden");

    $("authScreen")
      .classList.remove("hidden");

    hidePages();

  }
);


$("changeEmailButton").addEventListener(
  "click",
  async () => {

    const email =
      $("newEmail").value.trim();

    const password =
      $("emailPassword").value;

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
            pseudo: currentUser.pseudo,
            email,
            password
          })
        }
      );

    const data =
      await response.json();

    alert(data.message);

  }
);


$("deleteAccountButton").addEventListener(
  "click",
  async () => {

    const password =
      $("deletePassword").value;

    if (
      !confirm(
        "Supprimer définitivement ton compte ?"
      )
    ) {
      return;
    }

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
            pseudo: currentUser.pseudo,
            password
          })
        }
      );

    const data =
      await response.json();

    if (response.ok) {

      alert("Compte supprimé.");

      $("logoutButton").click();

    } else {

      alert(
        data.message ||
        "Erreur."
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

  }
);


$("sendResetButton").addEventListener(
  "click",
  async () => {

    const pseudo =
      $("forgotPseudo").value.trim();

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

    } catch {

      localStorage.removeItem(
        "lgv7_user"
      );

    }

  }
);
