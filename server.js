const express = require("express");
const bcrypt = require("bcryptjs");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ADMIN_PSEUDO = "creator2026";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


/* =========================================================
   BASE DE DONNÉES
========================================================= */

const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

      if (!data.users) data.users = {};
      if (!data.announcement) data.announcement = "";

      return data;
    }
  } catch (error) {
    console.error("Erreur data.json :", error);
  }

  return {
    users: {},
    announcement: ""
  };
}

let database = loadData();

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(database, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Erreur sauvegarde :", error);
  }
}


/* =========================================================
   CLASSES
========================================================= */

const CLASSES = [

  { id: "wolf1", name: "Loup-Garou 1", price: 1000, chance: 10 },
  { id: "wolf2", name: "Loup-Garou 2", price: 1200, chance: 20 },
  { id: "wolf3", name: "Loup-Garou 3", price: 1300, chance: 35 },
  { id: "wolf4", name: "Loup-Garou certifié", price: 1500, chance: 50 },

  { id: "seer1", name: "Voyante 1", price: 200, chance: 10 },
  { id: "seer2", name: "Voyante 2", price: 250, chance: 20 },
  { id: "seer3", name: "Voyante 3", price: 300, chance: 30 },
  { id: "seer4", name: "Voyante certifiée", price: 400, chance: 50 },

  { id: "witch1", name: "Sorcière 1", price: 350, chance: 10 },
  { id: "witch2", name: "Sorcière 2", price: 450, chance: 20 },
  { id: "witch3", name: "Sorcière 3", price: 500, chance: 30 },
  { id: "witch4", name: "Sorcière certifiée", price: 600, chance: 50 },

  { id: "hunter1", name: "Chasseur 1", price: 100, chance: 10 },
  { id: "hunter2", name: "Chasseur 2", price: 150, chance: 20 },
  { id: "hunter3", name: "Chasseur 3", price: 200, chance: 30 },
  { id: "hunter4", name: "Chasseur certifié", price: 300, chance: 50 },

  { id: "premium1", name: "Premium 1", price: 2000, chance: 60 },
  { id: "premium2", name: "Premium 2", price: 2500, chance: 70 },
  { id: "premium3", name: "Premium 3", price: 3000, chance: 75 },
  { id: "premium4", name: "Premium certifié", price: 3500, chance: 80 },

  { id: "admin1", name: "Admin 1", price: 5000, chance: 85 },
  { id: "admin2", name: "Admin 2", price: 6000, chance: 90 },
  { id: "admin3", name: "Admin 3", price: 7000, chance: 95 },
  { id: "admin4", name: "Admin certifié", price: 10000, chance: 99 }
];


/* =========================================================
   QUÊTES
========================================================= */

const QUESTS = [

  {
    id: "play1",
    title: "Première partie",
    description: "Jouer 1 partie.",
    xp: 100,
    coins: 50
  },

  {
    id: "play5",
    title: "Villageois actif",
    description: "Jouer 5 parties.",
    xp: 250,
    coins: 100
  },

  {
    id: "play10",
    title: "Habitué du village",
    description: "Jouer 10 parties.",
    xp: 500,
    coins: 200
  },

  {
    id: "play25",
    title: "Vétéran",
    description: "Jouer 25 parties.",
    xp: 1000,
    coins: 400
  },

  {
    id: "play50",
    title: "Légende",
    description: "Jouer 50 parties.",
    xp: 2500,
    coins: 1000
  },

  {
    id: "play100",
    title: "Maître du village",
    description: "Jouer 100 parties.",
    xp: 5000,
    coins: 2000
  },

  {
    id: "win1",
    title: "Première victoire",
    description: "Gagner une partie.",
    xp: 500,
    coins: 200
  },

  {
    id: "win5",
    title: "Gagnant",
    description: "Gagner 5 parties.",
    xp: 1000,
    coins: 500
  },

  {
    id: "win10",
    title: "Champion",
    description: "Gagner 10 parties.",
    xp: 2500,
    coins: 1000
  },

  {
    id: "win25",
    title: "Grand champion",
    description: "Gagner 25 parties.",
    xp: 5000,
    coins: 2000
  },

  {
    id: "level5",
    title: "Apprenti",
    description: "Atteindre le niveau 5.",
    xp: 500,
    coins: 100
  },

  {
    id: "level10",
    title: "Expert",
    description: "Atteindre le niveau 10.",
    xp: 1000,
    coins: 300
  },

  {
    id: "level25",
    title: "Professionnel",
    description: "Atteindre le niveau 25.",
    xp: 2500,
    coins: 1000
  },

  {
    id: "coins500",
    title: "Économe",
    description: "Posséder 500 pièces.",
    xp: 300,
    coins: 100
  },

  {
    id: "coins1000",
    title: "Riche villageois",
    description: "Posséder 1000 pièces.",
    xp: 500,
    coins: 200
  },

  {
    id: "coins5000",
    title: "Fortuné",
    description: "Posséder 5000 pièces.",
    xp: 1500,
    coins: 500
  },

  {
    id: "trophies100",
    title: "Collectionneur",
    description: "Obtenir 100 trophées.",
    xp: 1000,
    coins: 300
  }
];


/* =========================================================
   UTILISATEURS
========================================================= */

function calculateLevel(xp) {
  return Math.min(
    100,
    Math.floor(Number(xp || 0) / 1000) + 1
  );
}

function prepareUser(user) {
  if (!user.classes) user.classes = [];
  if (!user.notifications) user.notifications = [];
  if (!user.friends) user.friends = [];
  if (!user.friendRequests) user.friendRequests = [];
  if (!user.blockedChat) user.blockedChat = [];
  if (!user.titles) user.titles = [];

  if (typeof user.xp !== "number") user.xp = 0;
  if (typeof user.coins !== "number") user.coins = 0;
  if (typeof user.trophies !== "number") user.trophies = 0;

  user.level = calculateLevel(user.xp);

  if (!user.icon) user.icon = "🐺";

  if (!user.title) {
    user.title =
      user.pseudo === ADMIN_PSEUDO
        ? "👑 Créateur du jeu"
        : "Nouveau Villageois";
  }

  if (typeof user.gamesPlayed !== "number") user.gamesPlayed = 0;
  if (typeof user.gamesWon !== "number") user.gamesWon = 0;
}

Object.values(database.users).forEach(prepareUser);


function publicUser(user) {
  prepareUser(user);

  return {
    pseudo: user.pseudo,
    email: user.email,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    trophies: user.trophies,
    icon: user.icon,
    title: user.title,
    titles: user.titles,
    classes: user.classes,
    equippedClass: user.equippedClass || null,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    isAdmin: user.pseudo === ADMIN_PSEUDO
  };
}


function addNotification(user, message, reward = {}) {
  prepareUser(user);

  user.notifications.unshift({
    id: Date.now() + "-" + Math.random(),
    message,
    reward,
    claimed: false,
    createdAt: new Date().toISOString()
  });
}


/* =========================================================
   INSCRIPTION
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const pseudo = String(req.body.pseudo || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (pseudo.length < 3 || pseudo.length > 20) {
      return res.status(400).json({
        message: "Pseudo entre 3 et 20 caractères."
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Adresse e-mail invalide."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mot de passe trop court."
      });
    }

    const pseudoExists = Object.values(database.users).some(
      user => user.pseudo.toLowerCase() === pseudo.toLowerCase()
    );

    if (pseudoExists) {
      return res.status(409).json({
        message: "Ce pseudo existe déjà."
      });
    }

    const emailExists = Object.values(database.users).some(
      user => user.email === email
    );

    if (emailExists) {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      pseudo,
      email,
      passwordHash,

      xp: 0,
      level: 1,
      coins: 50,
      trophies: 0,

      icon: "🐺",

      title:
        pseudo === ADMIN_PSEUDO
          ? "👑 Créateur du jeu"
          : "Nouveau Villageois",

      titles: [],
      classes: [],
      equippedClass: null,

      friends: [],
      friendRequests: [],
      blockedChat: [],

      gamesPlayed: 0,
      gamesWon: 0,

      notifications: [],

      createdAt: new Date().toISOString()
    };

    addNotification(
      user,
      "🎁 Vous avez reçu 50 🐺 pièces !",
      {}
    );

    user.notifications[0].claimed = true;

    database.users[pseudo] = user;

    saveData();

    res.status(201).json({
      message: "Compte créé ! Vous avez reçu 50 🐺 pièces.",
      user: publicUser(user)
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur serveur."
    });
  }
});


/* =========================================================
   CONNEXION
========================================================= */

app.post("/api/login", async (req, res) => {
  try {

    const pseudo = String(req.body.pseudo || "").trim();
    const password = String(req.body.password || "");

    const user = Object.values(database.users).find(
      item => item.pseudo.toLowerCase() === pseudo.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        message: "Pseudo ou mot de passe incorrect."
      });
    }

    const correct = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!correct) {
      return res.status(401).json({
        message: "Pseudo ou mot de passe incorrect."
      });
    }

    prepareUser(user);
    saveData();

    res.json({
      message: "Connexion réussie !",
      user: publicUser(user)
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Erreur serveur."
    });
  }
});


/* =========================================================
   UTILISATEUR
========================================================= */

app.get("/api/users/:pseudo", (req, res) => {

  const searched = String(req.params.pseudo || "")
    .trim()
    .toLowerCase();

  const user = Object.values(database.users).find(
    item => item.pseudo.toLowerCase() === searched
  );

  if (!user) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  res.json({
    user: publicUser(user)
  });
});


/* =========================================================
   CLASSES
========================================================= */

app.get("/api/classes", (req, res) => {
  res.json({ classes: CLASSES });
});


app.post("/api/classes/buy", (req, res) => {

  const pseudo = String(req.body.pseudo || "");
  const classId = String(req.body.classId || "");

  const user = database.users[pseudo];
  const classe = CLASSES.find(item => item.id === classId);

  if (!user || !classe) {
    return res.status(400).json({
      message: "Utilisateur ou classe invalide."
    });
  }

  prepareUser(user);

  if (user.classes.includes(classId)) {
    return res.status(400).json({
      message: "Classe déjà possédée."
    });
  }

  if (user.coins < classe.price) {
    return res.status(400).json({
      message: "Pas assez de pièces."
    });
  }

  user.coins -= classe.price;
  user.classes.push(classId);

  saveData();

  res.json({
    message: "Classe achetée !",
    user: publicUser(user)
  });
});


app.post("/api/classes/equip", (req, res) => {

  const pseudo = String(req.body.pseudo || "");
  const classId = String(req.body.classId || "");

  const user = database.users[pseudo];

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  prepareUser(user);

  if (!user.classes.includes(classId)) {
    return res.status(400).json({
      message: "Tu ne possèdes pas cette classe."
    });
  }

  user.equippedClass = classId;

  saveData();

  res.json({
    message: "Classe équipée !",
    user: publicUser(user)
  });
});


/* =========================================================
   QUÊTES
========================================================= */

app.get("/api/quests", (req, res) => {
  res.json({ quests: QUESTS });
});


/* =========================================================
   CLASSEMENT
========================================================= */

app.get("/api/ranking", (req, res) => {

  const users = Object.values(database.users)
    .map(publicUser)
    .sort((a, b) =>
      b.trophies - a.trophies ||
      b.xp - a.xp
    )
    .slice(0, 100);

  res.json({ users });
});


/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get("/api/notifications/:pseudo", (req, res) => {

  const user = database.users[req.params.pseudo];

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  prepareUser(user);

  res.json({
    notifications: user.notifications
  });
});


app.post("/api/notifications/:pseudo/:id/claim", (req, res) => {

  const user = database.users[req.params.pseudo];

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  prepareUser(user);

  const notification = user.notifications.find(
    item => item.id === req.params.id
  );

  if (!notification) {
    return res.status(404).json({
      message: "Notification introuvable."
    });
  }

  if (notification.claimed) {
    return res.status(400).json({
      message: "Récompense déjà récupérée."
    });
  }

  const reward = notification.reward || {};

  user.coins += Number(reward.coins || 0);
  user.xp += Number(reward.xp || 0);
  user.trophies += Number(reward.trophies || 0);

  if (reward.level) {
    user.xp += Number(reward.level) * 1000;
  }

  if (
    reward.classId &&
    !user.classes.includes(reward.classId)
  ) {
    user.classes.push(reward.classId);
  }

  user.level = calculateLevel(user.xp);

  notification.claimed = true;

  saveData();

  res.json({
    message: "🎁 Récompense récupérée !",
    user: publicUser(user)
  });
});


/* =========================================================
   AMIS
========================================================= */

app.get("/api/friends/:pseudo", (req, res) => {

  const user = database.users[req.params.pseudo];

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  prepareUser(user);

  res.json({
    friends: user.friends
  });
});


app.post("/api/friends/request", (req, res) => {

  const from = String(req.body.from || "");
  const to = String(req.body.to || "");

  const sender = database.users[from];
  const receiver = database.users[to];

  if (!sender || !receiver) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  prepareUser(sender);
  prepareUser(receiver);

  if (from === to) {
    return res.status(400).json({
      message: "Tu ne peux pas t'ajouter toi-même."
    });
  }

  if (receiver.friends.includes(from)) {
    return res.status(400).json({
      message: "Vous êtes déjà amis."
    });
  }

  if (!receiver.friendRequests.includes(from)) {
    receiver.friendRequests.push(from);

    addNotification(
      receiver,
      "👥 " + from + " souhaite devenir votre ami."
    );
  }

  saveData();

  res.json({
    message: "Demande envoyée !"
  });
});


app.post("/api/friends/accept", (req, res) => {

  const pseudo = String(req.body.pseudo || "");
  const from = String(req.body.from || "");

  const user = database.users[pseudo];
  const other = database.users[from];

  if (!user || !other) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  prepareUser(user);
  prepareUser(other);

  user.friendRequests =
    user.friendRequests.filter(item => item !== from);

  if (!user.friends.includes(from)) {
    user.friends.push(from);
  }

  if (!other.friends.includes(pseudo)) {
    other.friends.push(pseudo);
  }

  saveData();

  res.json({
    message: "Ami ajouté !"
  });
});


/* =========================================================
   ADMIN
========================================================= */

function requireAdmin(req, res) {

  const adminPseudo = String(
    req.body.adminPseudo ||
    req.query.adminPseudo ||
    ""
  ).trim();

  if (adminPseudo !== ADMIN_PSEUDO) {

    res.status(403).json({
      message: "Accès administrateur refusé."
    });

    return false;
  }

  return true;
}


app.get("/api/admin/users/:pseudo", (req, res) => {

  if (!requireAdmin(req, res)) return;

  const searched = String(req.params.pseudo || "")
    .trim()
    .toLowerCase();

  const user = Object.values(database.users).find(
    item => item.pseudo.toLowerCase() === searched
  );

  if (!user) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  res.json({
    user: publicUser(user)
  });
});


app.post("/api/admin/reward", (req, res) => {

  if (!requireAdmin(req, res)) return;

  const targetPseudo = String(req.body.targetPseudo || "").trim();

  const user = Object.values(database.users).find(
    item => item.pseudo.toLowerCase() === targetPseudo.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  const coins = Math.max(0, Number(req.body.coins || 0));
  const xp = Math.max(0, Number(req.body.xp || 0));
  const trophies = Math.max(0, Number(req.body.trophies || 0));
  const level = Math.max(0, Number(req.body.level || 0));
  const classId = String(req.body.classId || "");

  if (
    classId &&
    !CLASSES.some(item => item.id === classId)
  ) {
    return res.status(400).json({
      message: "Classe invalide."
    });
  }

  const reward = {
    coins,
    xp,
    trophies,
    level,
    classId
  };

  const parts = [];

  if (coins) parts.push(coins + " 🐺 pièces");
  if (xp) parts.push(xp + " XP");
  if (trophies) parts.push(trophies + " 🏆 trophées");
  if (level) parts.push(level + " niveaux");

  if (classId) {
    const classe = CLASSES.find(item => item.id === classId);
    parts.push("la classe " + classe.name);
  }

  addNotification(
    user,
    "👑 Le créateur du jeu vous a offert : " +
    parts.join(", ") +
    " ! Cliquez sur récupérer.",
    reward
  );

  saveData();

  res.json({
    message: "Récompense envoyée à " + user.pseudo + " !"
  });
});


app.post("/api/admin/reward-all", (req, res) => {

  if (!requireAdmin(req, res)) return;

  const reward = {
    coins: Math.max(0, Number(req.body.coins || 0)),
    xp: Math.max(0, Number(req.body.xp || 0)),
    trophies: Math.max(0, Number(req.body.trophies || 0)),
    level: Math.max(0, Number(req.body.level || 0)),
    classId: String(req.body.classId || "")
  };

  Object.values(database.users).forEach(user => {

    addNotification(
      user,
      "👑 Le créateur du jeu vous a offert une récompense ! Cliquez sur récupérer.",
      reward
    );

  });

  saveData();

  res.json({
    message: "Récompense envoyée à tous les joueurs !"
  });
});


/* =========================================================
   ANNONCE
========================================================= */

app.get("/api/announcement", (req, res) => {

  res.json({
    announcement: database.announcement || ""
  });
});


app.post("/api/admin/announcement", (req, res) => {

  if (!requireAdmin(req, res)) return;

  database.announcement = String(
    req.body.announcement || ""
  )
    .trim()
    .slice(0, 1000);

  saveData();

  res.json({
    message: "Annonce modifiée !",
    announcement: database.announcement
  });
});


/* =========================================================
   SALONS
========================================================= */

const rooms = {};

function generateRoomCode() {

  let code;

  do {
    code = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
  } while (rooms[code]);

  return code;
}


function publicRoom(room) {

  return {
    code: room.code,
    host: room.host,
    players: room.players,
    started: room.started
  };
}


function broadcastRooms() {

  const list = Object.values(rooms)
    .filter(room => !room.started)
    .map(publicRoom);

  io.emit("roomsList", list);
}


function createBots(room) {

  let number = 1;

  while (room.players.length < 8) {

    room.players.push(
      "🤖 Bot " + number
    );

    number++;
  }
}


function assignRoles(players) {

  const roles = [
    "🐺 Loup-Garou",
    "🐺 Loup-Garou",
    "🔮 Voyante",
    "🧪 Sorcière",
    "🎯 Chasseur",
    "👨 Villageois",
    "👩 Villageois",
    "👨 Villageois"
  ];

  const shuffled = [...roles]
    .sort(() => Math.random() - 0.5);

  const result = {};

  players.forEach((player, index) => {
    result[player] =
      shuffled[index] || "👨 Villageois";
  });

  return result;
}


/* =========================================================
   SOCKET.IO
========================================================= */

io.on("connection", socket => {

  console.log("Connexion :", socket.id);

  socket.on("userOnline", ({ pseudo }) => {

    socket.pseudo = String(pseudo || "").trim();

    if (socket.pseudo) {
      socket.join("user:" + socket.pseudo);
    }
  });


  socket.on("getRooms", () => {

    const list = Object.values(rooms)
      .filter(room => !room.started)
      .map(publicRoom);

    socket.emit("roomsList", list);
  });


  socket.on("createRoom", ({ pseudo }) => {

    pseudo = String(pseudo || "").trim();

    if (!pseudo) {
      socket.emit("roomError", "Pseudo invalide.");
      return;
    }

    const code = generateRoomCode();

    rooms[code] = {
      code,
      host: pseudo,
      players: [pseudo],
      started: false
    };

    socket.join(code);

    socket.emit(
      "roomCreated",
      publicRoom(rooms[code])
    );

    broadcastRooms();
  });


  socket.on("joinRoom", ({ code, pseudo }) => {

    code = String(code || "").trim().toUpperCase();
    pseudo = String(pseudo || "").trim();

    const room = rooms[code];

    if (!room) {
      socket.emit("roomError", "Partie introuvable.");
      return;
    }

    if (room.started) {
      socket.emit("roomError", "Partie déjà commencée.");
      return;
    }

    if (!room.players.includes(pseudo)) {
      room.players.push(pseudo);
    }

    socket.join(code);

    io.to(code).emit(
      "roomUpdated",
      publicRoom(room)
    );

    socket.emit(
      "joinedRoom",
      publicRoom(room)
    );

    broadcastRooms();
  });


  socket.on("startGameWithBots", ({ code, pseudo }) => {

    const room = rooms[code];

    if (!room) {
      socket.emit("roomError", "Partie introuvable.");
      return;
    }

    if (room.host !== pseudo) {
      socket.emit(
        "roomError",
        "Seul le créateur peut lancer la partie."
      );
      return;
    }

    createBots(room);

    room.started = true;

    room.roles = assignRoles(room.players);

    io.to(code).emit(
      "gameStarted",
      {
        code: room.code,
        players: room.players,
        roles: room.roles
      }
    );

    broadcastRooms();
  });


  socket.on("startGameWithPlayers", ({ code, pseudo }) => {

    const room = rooms[code];

    if (!room) {
      socket.emit("roomError", "Partie introuvable.");
      return;
    }

    if (room.host !== pseudo) {
      socket.emit(
        "roomError",
        "Seul le créateur peut lancer la partie."
      );
      return;
    }

    createBots(room);

    room.started = true;

    room.roles = assignRoles(room.players);

    io.to(code).emit(
      "gameStarted",
      {
        code: room.code,
        players: room.players,
        roles: room.roles
      }
    );

    broadcastRooms();
  });


  socket.on("disconnect", () => {
    console.log("Déconnexion :", socket.id);
  });

});


/* =========================================================
   TEST
========================================================= */

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    message: "🐺 Loup-Garou V7 fonctionne !"
  });
});


/* =========================================================
   LANCEMENT
========================================================= */

server.listen(PORT, () => {

  console.log(
    "🐺 Serveur démarré sur le port " + PORT
  );

});
