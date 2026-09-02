/* =========================================
   LOUP-GAROU V7
   SERVER.JS
========================================= */

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");


/* =========================================
   CONFIGURATION
========================================= */

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

const ADMIN_PSEUDO =
  (process.env.ADMIN_PSEUDO || "creator2026")
    .toLowerCase();

const DATA_FILE = path.join(
  __dirname,
  "data.json"
);

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================
   BASE DE DONNÉES JSON
========================================= */

function defaultDatabase() {
  return {
    users: [],
    rooms: [],
    friendships: [],
    friendRequests: [],
    messages: [],
    notifications: [],
    announcements: {
      text: "Bienvenue dans Loup-Garou V7 🐺"
    },
    bloodMoonProgress: {}
  };
}

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const db = defaultDatabase();

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(db, null, 2)
      );

      return db;
    }

    const content =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const database =
      JSON.parse(content);

    return {
      ...defaultDatabase(),
      ...database
    };

  } catch (error) {
    console.error(
      "Erreur chargement data.json :",
      error
    );

    return defaultDatabase();
  }
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(db, null, 2)
    );

  } catch (error) {
    console.error(
      "Erreur sauvegarde :",
      error
    );
  }
}


/* =========================================
   OUTILS
========================================= */

function normalizePseudo(pseudo) {
  return String(
    pseudo || ""
  )
    .trim()
    .toLowerCase();
}

function cleanPseudo(pseudo) {
  return String(
    pseudo || ""
  ).trim();
}

function findUser(pseudo) {
  const normalized =
    normalizePseudo(pseudo);

  return db.users.find(
    (user) =>
      normalizePseudo(user.pseudo) ===
      normalized
  );
}

function publicUser(user) {
  if (!user) return null;

  const {
    password,
    ...safeUser
  } = user;

  return safeUser;
}

function generateCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (
    let index = 0;
    index < 6;
    index++
  ) {
    code +=
      characters[
        Math.floor(
          Math.random() *
          characters.length
        )
      ];
  }

  return code;
}

function createUniqueRoomCode() {
  let code = generateCode();

  while (
    db.rooms.some(
      (room) => room.code === code
    )
  ) {
    code = generateCode();
  }

  return code;
}

function createId() {
  return (
    Date.now()
      .toString(36) +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}


/* =========================================
   CLASSES
========================================= */

const CLASSES = [

  {
    id: "wolf1",
    name: "Loup débutant",
    price: 0,
    chance: 10
  },

  {
    id: "wolf2",
    name: "Loup confirmé",
    price: 300,
    chance: 20
  },

  {
    id: "seer1",
    name: "Voyante",
    price: 500,
    chance: 25
  },

  {
    id: "witch1",
    name: "Sorcière",
    price: 750,
    chance: 30
  },

  {
    id: "hunter1",
    name: "Chasseur",
    price: 1000,
    chance: 35
  },

  {
    id: "premium1",
    name: "Premium 1",
    price: 2000,
    chance: 60
  },

  {
    id: "premium2",
    name: "Premium 2",
    price: 2500,
    chance: 70
  },

  {
    id: "premium3",
    name: "Premium 3",
    price: 3000,
    chance: 75
  },

  {
    id: "premium_certified",
    name: "Premium certifié",
    price: 3500,
    chance: 80
  },

  {
    id: "admin1",
    name: "Admin 1",
    price: 5000,
    chance: 85
  },

  {
    id: "admin2",
    name: "Admin 2",
    price: 6000,
    chance: 90
  },

  {
    id: "admin3",
    name: "Admin 3",
    price: 7000,
    chance: 95
  },

  {
    id: "admin_certified",
    name: "Admin certifié",
    price: 10000,
    chance: 99
  }
];


/* =========================================
   QUÊTES NORMALES
========================================= */

const QUESTS = [

  {
    id: "play_1",
    title: "Premier hurlement",
    description:
      "Joue une partie.",
    xp: 50,
    coins: 25
  },

  {
    id: "play_3",
    title: "Villageois actif",
    description:
      "Participe à 3 parties.",
    xp: 100,
    coins: 50
  },

  {
    id: "play_5",
    title: "Nuit agitée",
    description:
      "Participe à 5 parties.",
    xp: 150,
    coins: 75
  },

  {
    id: "play_10",
    title: "Chasseur de loups",
    description:
      "Participe à 10 parties.",
    xp: 300,
    coins: 150
  },

  {
    id: "win_1",
    title: "Première victoire",
    description:
      "Gagne une partie.",
    xp: 100,
    coins: 100
  },

  {
    id: "win_3",
    title: "Héros du village",
    description:
      "Gagne 3 parties.",
    xp: 250,
    coins: 150
  },

  {
    id: "win_10",
    title: "Légende",
    description:
      "Gagne 10 parties.",
    xp: 1000,
    coins: 500
  },

  {
    id: "social_1",
    title: "Bienvenue au village",
    description:
      "Ajoute un ami.",
    xp: 50,
    coins: 25
  },

  {
    id: "ranked_1",
    title: "Premier combat classé",
    description:
      "Joue une partie classée.",
    xp: 150,
    coins: 75
  },

  {
    id: "ranked_5",
    title: "Combattant classé",
    description:
      "Joue 5 parties classées.",
    xp: 500,
    coins: 250
  }
];


/* =========================================
   QUÊTES LUNE DE SANG
========================================= */

const BLOOD_MOON_QUESTS = [

  {
    id: "bloodmoon_play",
    title: "Sous la Lune de Sang",
    description:
      "Participe à une partie pendant l'événement.",
    bloodMoonQuarters: 1
  },

  {
    id: "bloodmoon_win",
    title: "Victoire sanglante",
    description:
      "Gagne une partie pendant l'événement.",
    bloodMoonQuarters: 1
  },

  {
    id: "bloodmoon_ranked",
    title: "Chasseur écarlate",
    description:
      "Joue une partie classée pendant l'événement.",
    bloodMoonQuarters: 1
  },

  {
    id: "bloodmoon_quest",
    title: "Lune rouge",
    description:
      "Termine les objectifs de l'événement.",
    bloodMoonQuarters: 1
  }
];


/* =========================================
   LUNE DE SANG
   Vendredi 07:00 -> 20:00
========================================= */

function getBloodMoonStatus() {
  const now = new Date();

  const day = now.getDay();

  const hour = now.getHours();

  const active =
    day === 5 &&
    hour >= 7 &&
    hour < 20;

  let endsAt = null;

  if (active) {
    endsAt = new Date(now);

    endsAt.setHours(
      20,
      0,
      0,
      0
    );
  }

  return {
    active,
    endsAt:
      endsAt
        ? endsAt.getTime()
        : null
  };
}


/* =========================================
   RANGS CLASSÉS
========================================= */

function getRank(trophies) {
  const score =
    Number(trophies || 0);

  if (score >= 5000) {
    return "Admin";
  }

  if (score >= 3000) {
    return "Pro";
  }

  if (score >= 1800) {
    return "Chasseur";
  }

  if (score >= 1000) {
    return "Diamant";
  }

  if (score >= 500) {
    return "Or";
  }

  if (score >= 200) {
    return "Bronze";
  }

  return "Bois";
}

function getRankIcon(rank) {
  const icons = {
    Bois: "🪵",
    Bronze: "🥉",
    Or: "🥇",
    Diamant: "💎",
    Chasseur: "🏹",
    Pro: "⭐",
    Admin: "👑"
  };

  return icons[rank] || "🪵";
}


/* =========================================
   NIVEAUX
========================================= */

function updateLevel(user) {
  if (!user) return;

  const xp =
    Number(user.xp || 0);

  user.level =
    Math.max(
      1,
      Math.floor(xp / 500) + 1
    );
}


/* =========================================
   NOTIFICATIONS
========================================= */

function addNotification(
  pseudo,
  notification
) {
  const user = findUser(pseudo);

  if (!user) return;

  const item = {
    id: createId(),

    pseudo: user.pseudo,

    title:
      notification.title ||
      "Notification",

    message:
      notification.message ||
      "",

    type:
      notification.type ||
      "info",

    reward:
      notification.reward ||
      null,

    claimed:
      false,

    createdAt:
      Date.now()
  };

  db.notifications.push(item);

  saveDatabase();

  const socketId =
    onlineUsers.get(
      normalizePseudo(user.pseudo)
    );

  if (socketId) {
    io.to(socketId).emit(
      "notification",
      item
    );
  }

  return item;
}


/* =========================================
   RÉCOMPENSES
========================================= */

function applyReward(
  user,
  reward
) {
  if (!user) return null;

  const coins =
    Math.max(
      0,
      Number(reward.coins || 0)
    );

  const xp =
    Math.max(
      0,
      Number(reward.xp || 0)
    );

  const trophies =
    Number(reward.trophies || 0);

  user.coins =
    Number(user.coins || 0) +
    coins;

  user.xp =
    Number(user.xp || 0) +
    xp;

  user.trophies =
    Math.max(
      0,
      Number(user.trophies || 0) +
      trophies
    );

  if (reward.classId) {
    user.classes =
      user.classes || [];

    if (
      !user.classes.includes(
        reward.classId
      )
    ) {
      user.classes.push(
        reward.classId
      );
    }
  }

  updateLevel(user);

  user.rank =
    getRank(user.trophies);

  return user;
}


/* =========================================
   UTILISATEURS EN LIGNE
========================================= */

const onlineUsers = new Map();

const socketUsers = new Map();


function getOnlineUserInfo() {
  return Array.from(
    onlineUsers.keys()
  );
}

function isUserOnline(pseudo) {
  return onlineUsers.has(
    normalizePseudo(pseudo)
  );
}


/* =========================================
   SALONS
========================================= */

function findRoom(code) {
  return db.rooms.find(
    (room) => room.code === code
  );
}

function roomPublic(room) {
  if (!room) return null;

  return {
    code: room.code,

    host: room.host,

    players: room.players,

    ranked: Boolean(
      room.ranked
    ),

    status:
      room.status || "waiting",

    maxPlayers: 8
  };
}

function removeUserFromRooms(pseudo) {
  const normalized =
    normalizePseudo(pseudo);

  db.rooms.forEach(
    (room) => {
      room.players =
        room.players.filter(
          (player) =>
            normalizePseudo(
              player.pseudo
            ) !== normalized
        );
    }
  );

  db.rooms =
    db.rooms.filter(
      (room) =>
        room.players.length > 0
    );
}

function addBotsToRoom(room) {
  let number = 1;

  while (
    room.players.length < 8
  ) {
    let botPseudo =
      `Bot_${number}`;

    while (
      room.players.some(
        (player) =>
          player.pseudo === botPseudo
      )
    ) {
      number++;
      botPseudo =
        `Bot_${number}`;
    }

    room.players.push({
      pseudo: botPseudo,
      isBot: true,
      socketId: null
    });

    number++;
  }
}


/* =========================================
   VRAIE PARTIE LOUP-GAROU
========================================= */

function shuffle(array) {
  const copy =
    [...array];

  for (
    let index =
      copy.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
        (index + 1)
      );

    [
      copy[index],
      copy[randomIndex]
    ] =
      [
        copy[randomIndex],
        copy[index]
      ];
  }

  return copy;
}

function createGame(room) {
  const players =
    shuffle(room.players);

  const roles = [
    "Loup-Garou",
    "Loup-Garou",
    "Voyante",
    "Sorcière",
    "Chasseur",
    "Villageois",
    "Villageois",
    "Villageois"
  ];

  const gamePlayers =
    players.map(
      (player, index) => ({
        pseudo: player.pseudo,

        isBot:
          Boolean(
            player.isBot
          ),

        alive: true,

        role:
          roles[index] ||
          "Villageois"
      })
    );

  return {
    id: createId(),

    roomCode:
      room.code,

    ranked:
      Boolean(
        room.ranked
      ),

    phase: "night",

    day: 1,

    players:
      gamePlayers,

    nightVotes: {},

    dayVotes: {},

    winner: null,

    createdAt:
      Date.now()
  };
}

function getGameForRoom(room) {
  return room.game || null;
}

function getAlivePlayers(game) {
  return game.players.filter(
    (player) => player.alive
  );
}

function checkGameWinner(game) {
  const alive =
    getAlivePlayers(game);

  const wolves =
    alive.filter(
      (player) =>
        player.role ===
        "Loup-Garou"
    );

  const villagers =
    alive.filter(
      (player) =>
        player.role !==
        "Loup-Garou"
    );

  if (wolves.length === 0) {
    game.winner =
      "Villageois";

    return true;
  }

  if (
    wolves.length >=
    villagers.length
  ) {
    game.winner =
      "Loups-Garous";

    return true;
  }

  return false;
}

function finishGame(room) {
  const game = room.game;

  if (!game) return;

  game.phase = "finished";

  const bloodMoon =
    getBloodMoonStatus();

  game.players.forEach(
    (player) => {
      if (player.isBot) return;

      const user =
        findUser(player.pseudo);

      if (!user) return;

      let xp = 50;
      let coins = 25;
      let trophies = 0;

      const isWolf =
        player.role ===
        "Loup-Garou";

      const won =
        (
          game.winner ===
          "Loups-Garous" &&
          isWolf
        ) ||
        (
          game.winner ===
          "Villageois" &&
          !isWolf
        );

      if (won) {
        xp += 100;
        coins += 50;

        trophies =
          game.ranked
            ? 30
            : 0;

      } else {
        trophies =
          game.ranked
            ? -10
            : 0;
      }

      if (bloodMoon.active) {
        xp *= 2;
        coins *= 2;
        trophies *= 2;
      }

      applyReward(
        user,
        {
          xp,
          coins,
          trophies
        }
      );

      user.gamesPlayed =
        Number(
          user.gamesPlayed || 0
        ) + 1;

      if (won) {
        user.gamesWon =
          Number(
            user.gamesWon || 0
          ) + 1;
      }

      const socketId =
        onlineUsers.get(
          normalizePseudo(
            user.pseudo
          )
        );

      if (socketId) {
        io.to(socketId).emit(
          "profileUpdated",
          publicUser(user)
        );
      }
    }
  );

  saveDatabase();

  io.to(room.code).emit(
    "gameFinished",
    {
      winner:
        game.winner,

      players:
        game.players
    }
  );
}


/* =========================================
   API : INSCRIPTION
========================================= */

app.post(
  "/api/register",
  async (req, res) => {
    try {
      const {
        pseudo,
        email,
        password
      } = req.body;

      const clean =
        cleanPseudo(pseudo);

      if (
        clean.length < 3
      ) {
        return res
          .status(400)
          .json({
            message:
              "Le pseudo doit contenir au moins 3 caractères."
          });
      }

      if (
        !email ||
        !String(email).includes("@")
      ) {
        return res
          .status(400)
          .json({
            message:
              "Adresse e-mail invalide."
          });
      }

      if (
        !password ||
        String(password).length < 4
      ) {
        return res
          .status(400)
          .json({
            message:
              "Le mot de passe doit contenir au moins 4 caractères."
          });
      }

      if (
        findUser(clean)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Ce pseudo existe déjà."
          });
      }

      const emailExists =
        db.users.some(
          (user) =>
            String(
              user.email
            ).toLowerCase() ===
            String(
              email
            ).toLowerCase()
        );

      if (emailExists) {
        return res
          .status(400)
          .json({
            message:
              "Cette adresse e-mail est déjà utilisée."
          });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user = {
        id: createId(),

        pseudo: clean,

        email:
          String(email)
            .trim()
            .toLowerCase(),

        password:
          hashedPassword,

        icon: "🐺",

        title:
          "Nouveau Villageois",

        titles: [
          "Nouveau Villageois"
        ],

        equippedTitle:
          "Nouveau Villageois",

        level: 1,

        xp: 0,

        coins: 50,

        trophies: 0,

        rank: "Bois",

        classes: [
          "wolf1"
        ],

        equippedClass:
          "wolf1",

        gamesPlayed: 0,

        gamesWon: 0,

        createdAt:
          Date.now()
      };

      db.users.push(user);

      saveDatabase();

      addNotification(
        user.pseudo,
        {
          title:
            "Bienvenue !",

          message:
            "Vous avez reçu 50 pièces 🐺.",

          type:
            "reward"
        }
      );

      return res.json({
        message:
          "Compte créé avec succès.",
        user:
          publicUser(user)
      });

    } catch (error) {
      console.error(error);

      return res
        .status(500)
        .json({
          message:
            "Erreur serveur."
        });
    }
  }
);


/* =========================================
   API : CONNEXION
========================================= */

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const {
        pseudo,
        password
      } = req.body;

      const user =
        findUser(pseudo);

      if (!user) {
        return res
          .status(401)
          .json({
            message:
              "Pseudo ou mot de passe incorrect."
          });
      }

      const valid =
        await bcrypt.compare(
          password || "",
          user.password
        );

      if (!valid) {
        return res
          .status(401)
          .json({
            message:
              "Pseudo ou mot de passe incorrect."
          });
      }

      updateLevel(user);

      user.rank =
        getRank(
          user.trophies
        );

      saveDatabase();

      return res.json({
        message:
          "Connexion réussie.",
        user:
          publicUser(user)
      });

    } catch (error) {
      console.error(error);

      return res
        .status(500)
        .json({
          message:
            "Erreur serveur."
        });
    }
  }
);


/* =========================================
   API : CLASSES
========================================= */

app.get(
  "/api/classes",
  (req, res) => {
    res.json({
      classes: CLASSES
    });
  }
);

app.post(
  "/api/classes/buy",
  (req, res) => {
    const {
      pseudo,
      classId
    } = req.body;

    const user =
      findUser(pseudo);

    const classe =
      CLASSES.find(
        (item) =>
          item.id === classId
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    if (!classe) {
      return res
        .status(404)
        .json({
          message:
            "Classe introuvable."
        });
    }

    user.classes =
      user.classes || [];

    if (
      user.classes.includes(
        classe.id
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Tu possèdes déjà cette classe."
        });
    }

    if (
      Number(user.coins || 0) <
      classe.price
    ) {
      return res
        .status(400)
        .json({
          message:
            "Tu n'as pas assez de pièces."
        });
    }

    user.coins -=
      classe.price;

    user.classes.push(
      classe.id
    );

    saveDatabase();

    res.json({
      message:
        "Classe achetée !",
      user:
        publicUser(user)
    });
  }
);

app.post(
  "/api/classes/equip",
  (req, res) => {
    const {
      pseudo,
      classId
    } = req.body;

    const user =
      findUser(pseudo);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    if (
      !(user.classes || [])
        .includes(classId)
    ) {
      return res
        .status(400)
        .json({
          message:
            "Tu ne possèdes pas cette classe."
        });
    }

    user.equippedClass =
      classId;

    saveDatabase();

    res.json({
      message:
        "Classe équipée !",
      user:
        publicUser(user)
    });
  }
);


/* =========================================
   API : QUÊTES
========================================= */

app.get(
  "/api/quests",
  (req, res) => {
    res.json({
      quests: QUESTS
    });
  }
);

app.get(
  "/api/blood-moon",
  (req, res) => {
    res.json({
      event:
        getBloodMoonStatus(),

      quests:
        BLOOD_MOON_QUESTS
    });
  }
);


/* =========================================
   API : CLASSEMENT
========================================= */

app.get(
  "/api/ranking",
  (req, res) => {
    const users =
      db.users
        .map(publicUser)
        .sort(
          (first, second) =>
            Number(
              second.trophies || 0
            ) -
            Number(
              first.trophies || 0
            )
        );

    res.json({
      users
    });
  }
);


/* =========================================
   API : RECHERCHE JOUEUR
========================================= */

app.get(
  "/api/users/:pseudo",
  (req, res) => {
    const user =
      findUser(
        req.params.pseudo
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Joueur introuvable."
        });
    }

    res.json({
      user:
        publicUser(user)
    });
  }
);


/* =========================================
   API : NOTIFICATIONS
========================================= */

app.get(
  "/api/notifications/:pseudo",
  (req, res) => {
    const user =
      findUser(
        req.params.pseudo
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    const notifications =
      db.notifications
        .filter(
          (notification) =>
            normalizePseudo(
              notification.pseudo
            ) ===
            normalizePseudo(
              user.pseudo
            )
        )
        .sort(
          (a, b) =>
            b.createdAt -
            a.createdAt
        );

    res.json({
      notifications
    });
  }
);

app.post(
  "/api/notifications/claim",
  (req, res) => {
    const {
      pseudo,
      notificationId
    } = req.body;

    const user =
      findUser(pseudo);

    const notification =
      db.notifications.find(
        (item) =>
          item.id ===
          notificationId &&
          normalizePseudo(
            item.pseudo
          ) ===
          normalizePseudo(pseudo)
      );

    if (
      !user ||
      !notification
    ) {
      return res
        .status(404)
        .json({
          message:
            "Notification introuvable."
        });
    }

    if (notification.claimed) {
      return res
        .status(400)
        .json({
          message:
            "Récompense déjà récupérée."
        });
    }

    notification.claimed = true;

    if (notification.reward) {
      applyReward(
        user,
        notification.reward
      );
    }

    saveDatabase();

    res.json({
      message:
        "Récompense récupérée !",

      user:
        publicUser(user)
    });
  }
);


/* =========================================
   API : ANNONCE
========================================= */

app.get(
  "/api/announcement",
  (req, res) => {
    res.json(
      db.announcements
    );
  }
);

app.post(
  "/api/admin/announcement",
  (req, res) => {
    const {
      adminPseudo,
      text
    } = req.body;

    if (
      normalizePseudo(
        adminPseudo
      ) !== ADMIN_PSEUDO
    ) {
      return res
        .status(403)
        .json({
          message:
            "Accès refusé."
        });
    }

    db.announcements.text =
      String(text || "")
        .trim()
        .slice(0, 2000);

    saveDatabase();

    io.emit(
      "announcementUpdated",
      db.announcements
    );

    res.json({
      message:
        "Annonce enregistrée."
    });
  }
);


/* =========================================
   API : ADMIN
========================================= */

app.get(
  "/api/admin/users/:pseudo",
  (req, res) => {
    const adminPseudo =
      req.query.adminPseudo;

    if (
      normalizePseudo(
        adminPseudo
      ) !== ADMIN_PSEUDO
    ) {
      return res
        .status(403)
        .json({
          message:
            "Accès refusé."
        });
    }

    const user =
      findUser(
        req.params.pseudo
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Joueur introuvable."
        });
    }

    res.json({
      user:
        publicUser(user)
    });
  }
);

app.post(
  "/api/admin/reward",
  (req, res) => {
    const {
      adminPseudo,
      targetPseudo,
      coins,
      xp,
      trophies,
      classId
    } = req.body;

    if (
      normalizePseudo(
        adminPseudo
      ) !== ADMIN_PSEUDO
    ) {
      return res
        .status(403)
        .json({
          message:
            "Accès refusé."
        });
    }

    const user =
      findUser(targetPseudo);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Joueur introuvable."
        });
    }

    if (
      classId &&
      !CLASSES.some(
        (classe) =>
          classe.id === classId
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Classe invalide."
        });
    }

    const reward = {
      coins:
        Math.max(
          0,
          Number(coins || 0)
        ),

      xp:
        Math.max(
          0,
          Number(xp || 0)
        ),

      trophies:
        Math.max(
          0,
          Number(trophies || 0)
        ),

      classId:
        classId || ""
    };

    /*
      La récompense est appliquée
      immédiatement.
    */

    applyReward(
      user,
      reward
    );

    saveDatabase();

    addNotification(
      user.pseudo,
      {
        title:
          "🎁 Récompense du créateur",

        message:
          "Le créateur du jeu vous a offert une récompense.",

        type:
          "creator",

        reward: null
      }
    );

    const socketId =
      onlineUsers.get(
        normalizePseudo(
          user.pseudo
        )
      );

    if (socketId) {
      io.to(socketId).emit(
        "profileUpdated",
        publicUser(user)
      );
    }

    res.json({
      message:
        "Récompense envoyée !",

      user:
        publicUser(user)
    });
  }
);


/* =========================================
   ADMIN : RÉCOMPENSER TOUS LES JOUEURS
========================================= */

app.post(
  "/api/admin/reward-all",
  (req, res) => {
    const {
      adminPseudo,
      coins,
      xp,
      trophies,
      classId,
      onlineOnly
    } = req.body;

    if (
      normalizePseudo(
        adminPseudo
      ) !== ADMIN_PSEUDO
    ) {
      return res
        .status(403)
        .json({
          message:
            "Accès refusé."
        });
    }

    if (
      classId &&
      !CLASSES.some(
        (classe) =>
          classe.id === classId
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Classe invalide."
        });
    }

    const reward = {
      coins:
        Math.max(
          0,
          Number(coins || 0)
        ),

      xp:
        Math.max(
          0,
          Number(xp || 0)
        ),

      trophies:
        Math.max(
          0,
          Number(trophies || 0)
        ),

      classId:
        classId || ""
    };

    let count = 0;

    db.users.forEach(
      (user) => {
        if (
          onlineOnly &&
          !isUserOnline(
            user.pseudo
          )
        ) {
          return;
        }

        applyReward(
          user,
          reward
        );

        addNotification(
          user.pseudo,
          {
            title:
              "🎁 Récompense du créateur",

            message:
              "Le créateur du jeu vous a offert une récompense.",

            type:
              "creator"
          }
        );

        const socketId =
          onlineUsers.get(
            normalizePseudo(
              user.pseudo
            )
          );

        if (socketId) {
          io.to(socketId).emit(
            "profileUpdated",
            publicUser(user)
          );
        }

        count++;
      }
    );

    saveDatabase();

    res.json({
      message:
        `Récompense envoyée à ${count} joueur(s).`
    });
  }
);


/* =========================================
   API : AMIS
========================================= */

app.get(
  "/api/friends/:pseudo",
  (req, res) => {
    const pseudo =
      req.params.pseudo;

    const friends =
      db.friendships
        .filter(
          (friendship) =>
            normalizePseudo(
              friendship.user1
            ) ===
              normalizePseudo(pseudo) ||
            normalizePseudo(
              friendship.user2
            ) ===
              normalizePseudo(pseudo)
        )
        .map(
          (friendship) => {
            const friendPseudo =
              normalizePseudo(
                friendship.user1
              ) ===
              normalizePseudo(pseudo)
                ? friendship.user2
                : friendship.user1;

            const friend =
              findUser(
                friendPseudo
              );

            const room =
              db.rooms.find(
                (item) =>
                  item.players.some(
                    (player) =>
                      normalizePseudo(
                        player.pseudo
                      ) ===
                      normalizePseudo(
                        friendPseudo
                      )
                  )
              );

            return {
              user:
                publicUser(friend),

              online:
                isUserOnline(
                  friendPseudo
                ),

              inRoom:
                Boolean(room),

              roomCode:
                room
                  ? room.code
                  : null
            };
          }
        );

    res.json({
      friends
    });
  }
);

app.post(
  "/api/friends/request",
  (req, res) => {
    const {
      fromPseudo,
      toPseudo
    } = req.body;

    const from =
      findUser(fromPseudo);

    const to =
      findUser(toPseudo);

    if (
      !from ||
      !to
    ) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    if (
      normalizePseudo(
        from.pseudo
      ) ===
      normalizePseudo(
        to.pseudo
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Tu ne peux pas t'ajouter toi-même."
        });
    }

    const exists =
      db.friendships.some(
        (item) =>
          (
            normalizePseudo(
              item.user1
            ) ===
            normalizePseudo(from.pseudo) &&
            normalizePseudo(
              item.user2
            ) ===
            normalizePseudo(to.pseudo)
          ) ||
          (
            normalizePseudo(
              item.user2
            ) ===
            normalizePseudo(from.pseudo) &&
            normalizePseudo(
              item.user1
            ) ===
            normalizePseudo(to.pseudo)
          )
      );

    if (exists) {
      return res
        .status(400)
        .json({
          message:
            "Vous êtes déjà amis."
        });
    }

    const requestExists =
      db.friendRequests.some(
        (item) =>
          normalizePseudo(
            item.fromPseudo
          ) ===
          normalizePseudo(
            from.pseudo
          ) &&
          normalizePseudo(
            item.toPseudo
          ) ===
          normalizePseudo(
            to.pseudo
          )
      );

    if (requestExists) {
      return res
        .status(400)
        .json({
          message:
            "Demande déjà envoyée."
        });
    }

    const request = {
      id: createId(),

      fromPseudo:
        from.pseudo,

      toPseudo:
        to.pseudo,

      type: "friend",

      createdAt:
        Date.now()
    };

    db.friendRequests.push(
      request
    );

    saveDatabase();

    addNotification(
      to.pseudo,
      {
        title:
          "👥 Demande d'ami",

        message:
          `${from.pseudo} souhaite devenir votre ami.`,

        type:
          "friendRequest"
      }
    );

    res.json({
      message:
        "Demande envoyée."
    });
  }
);

app.get(
  "/api/friends/requests/:pseudo",
  (req, res) => {
    const requests =
      db.friendRequests.filter(
        (request) =>
          normalizePseudo(
            request.toPseudo
          ) ===
          normalizePseudo(
            req.params.pseudo
          )
      );

    res.json({
      requests
    });
  }
);

app.post(
  "/api/friends/respond",
  (req, res) => {
    const {
      pseudo,
      requestId,
      accept
    } = req.body;

    const request =
      db.friendRequests.find(
        (item) =>
          item.id === requestId &&
          normalizePseudo(
            item.toPseudo
          ) ===
          normalizePseudo(pseudo)
      );

    if (!request) {
      return res
        .status(404)
        .json({
          message:
            "Demande introuvable."
        });
    }

    db.friendRequests =
      db.friendRequests.filter(
        (item) =>
          item.id !== request.id
      );

    if (accept) {
      db.friendships.push({
        id: createId(),

        user1:
          request.fromPseudo,

        user2:
          request.toPseudo,

        createdAt:
          Date.now()
      });
    }

    saveDatabase();

    res.json({
      message:
        accept
          ? "Ami ajouté !"
          : "Demande refusée."
    });
  }
);


/* =========================================
   API : CHAT AMIS
========================================= */

app.get(
  "/api/chat/:pseudo/:friendPseudo",
  (req, res) => {
    const {
      pseudo,
      friendPseudo
    } = req.params;

    const messages =
      db.messages.filter(
        (message) =>
          (
            normalizePseudo(
              message.from
            ) ===
            normalizePseudo(pseudo) &&
            normalizePseudo(
              message.to
            ) ===
            normalizePseudo(friendPseudo)
          ) ||
          (
            normalizePseudo(
              message.from
            ) ===
            normalizePseudo(friendPseudo) &&
            normalizePseudo(
              message.to
            ) ===
            normalizePseudo(pseudo)
          )
      );

    res.json({
      messages
    });
  }
);

app.post(
  "/api/chat/send",
  (req, res) => {
    const {
      fromPseudo,
      toPseudo,
      text
    } = req.body;

    const content =
      String(text || "")
        .trim()
        .slice(0, 500);

    if (!content) {
      return res
        .status(400)
        .json({
          message:
            "Message vide."
        });
    }

    const areFriends =
      db.friendships.some(
        (friendship) =>
          (
            normalizePseudo(
              friendship.user1
            ) ===
            normalizePseudo(fromPseudo) &&
            normalizePseudo(
              friendship.user2
            ) ===
            normalizePseudo(toPseudo)
          ) ||
          (
            normalizePseudo(
              friendship.user2
            ) ===
            normalizePseudo(fromPseudo) &&
            normalizePseudo(
              friendship.user1
            ) ===
            normalizePseudo(toPseudo)
          )
      );

    if (!areFriends) {
      return res
        .status(403)
        .json({
          message:
            "Le chat est réservé aux amis."
        });
    }

    const message = {
      id: createId(),

      from:
        cleanPseudo(fromPseudo),

      to:
        cleanPseudo(toPseudo),

      text: content,

      createdAt:
        Date.now()
    };

    db.messages.push(
      message
    );

    saveDatabase();

    const socketId =
      onlineUsers.get(
        normalizePseudo(
          toPseudo
        )
      );

    if (socketId) {
      io.to(socketId).emit(
        "friendMessage",
        message
      );
    }

    res.json({
      message
    });
  }
);


/* =========================================
   API : PARAMÈTRES
========================================= */

app.post(
  "/api/settings/chat",
  (req, res) => {
    const {
      pseudo,
      chatEnabled
    } = req.body;

    const user =
      findUser(pseudo);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    user.chatEnabled =
      Boolean(chatEnabled);

    saveDatabase();

    res.json({
      message:
        "Paramètre enregistré.",

      user:
        publicUser(user)
    });
  }
);


/* =========================================
   API : COMPTE
========================================= */

app.post(
  "/api/account/email",
  async (req, res) => {
    const {
      pseudo,
      email,
      password
    } = req.body;

    const user =
      findUser(pseudo);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    const valid =
      await bcrypt.compare(
        password || "",
        user.password
      );

    if (!valid) {
      return res
        .status(401)
        .json({
          message:
            "Mot de passe incorrect."
        });
    }

    user.email =
      String(email || "")
        .trim()
        .toLowerCase();

    saveDatabase();

    res.json({
      message:
        "Adresse e-mail modifiée."
    });
  }
);

app.post(
  "/api/account/delete",
  async (req, res) => {
    const {
      pseudo,
      password
    } = req.body;

    const user =
      findUser(pseudo);

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Utilisateur introuvable."
        });
    }

    const valid =
      await bcrypt.compare(
        password || "",
        user.password
      );

    if (!valid) {
      return res
        .status(401)
        .json({
          message:
            "Mot de passe incorrect."
        });
    }

    const normalized =
      normalizePseudo(
        user.pseudo
      );

    db.users =
      db.users.filter(
        (item) =>
          normalizePseudo(
            item.pseudo
          ) !== normalized
      );

    db.friendships =
      db.friendships.filter(
        (item) =>
          normalizePseudo(
            item.user1
          ) !== normalized &&
          normalizePseudo(
            item.user2
          ) !== normalized
      );

    removeUserFromRooms(
      user.pseudo
    );

    saveDatabase();

    res.json({
      message:
        "Compte supprimé."
    });
  }
);


/* =========================================
   API : MOT DE PASSE
========================================= */

app.post(
  "/api/password/forgot",
  (req, res) => {
    const user =
      findUser(
        req.body.pseudo
      );

    /*
      Pour une vraie version publique,
      il faudra ajouter un système
      d'e-mail sécurisé.
    */

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "Joueur introuvable."
        });
    }

    res.json({
      message:
        "Fonction de récupération disponible prochainement."
    });
  }
);


/* =========================================
   SOCKET.IO
========================================= */

io.on(
  "connection",
  (socket) => {

    console.log(
      "Connexion :",
      socket.id
    );


    /* =====================================
       UTILISATEUR EN LIGNE
    ===================================== */

    socket.on(
      "userOnline",
      (data) => {
        const pseudo =
          cleanPseudo(
            data?.pseudo
          );

        if (!pseudo) return;

        const user =
          findUser(pseudo);

        if (!user) return;

        onlineUsers.set(
          normalizePseudo(
            user.pseudo
          ),
          socket.id
        );

        socketUsers.set(
          socket.id,
          user.pseudo
        );

        socket.emit(
          "onlineUsers",
          getOnlineUserInfo()
        );

        io.emit(
          "userStatusChanged",
          {
            pseudo:
              user.pseudo,

            online: true
          }
        );
      }
    );


    /* =====================================
       CRÉER SALON
    ===================================== */

    socket.on(
      "createRoom",
      (data) => {
        const pseudo =
          cleanPseudo(
            data?.pseudo
          );

        const user =
          findUser(pseudo);

        if (!user) {
          socket.emit(
            "roomError",
            "Utilisateur introuvable."
          );

          return;
        }

        removeUserFromRooms(
          user.pseudo
        );

        const room = {
          code:
            createUniqueRoomCode(),

          host:
            user.pseudo,

          ranked: false,

          status:
            "waiting",

          players: [
            {
              pseudo:
                user.pseudo,

              isBot: false,

              socketId:
                socket.id
            }
          ],

          createdAt:
            Date.now()
        };

        db.rooms.push(
          room
        );

        socket.join(
          room.code
        );

        saveDatabase();

        socket.emit(
          "roomCreated",
          roomPublic(room)
        );

        io.emit(
          "roomsList",
          db.rooms
            .filter(
              (item) =>
                item.status ===
                "waiting"
            )
            .map(roomPublic)
        );
      }
    );


    /* =====================================
       MODE CLASSÉ
    ===================================== */

    socket.on(
      "setRoomRanked",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        if (!room) return;

        if (
          normalizePseudo(
            room.host
          ) !==
          normalizePseudo(
            data?.pseudo
          )
        ) {
          socket.emit(
            "roomError",
            "Seul le créateur peut modifier ce mode."
          );

          return;
        }

        room.ranked =
          Boolean(
            data?.ranked
          );

        saveDatabase();

        io.to(room.code).emit(
          "roomUpdated",
          roomPublic(room)
        );
      }
    );


    /* =====================================
       REJOINDRE SALON
    ===================================== */

    socket.on(
      "joinRoom",
      (data) => {
        const code =
          String(
            data?.code || ""
          )
            .trim()
            .toUpperCase();

        const pseudo =
          cleanPseudo(
            data?.pseudo
          );

        const room =
          findRoom(code);

        const user =
          findUser(pseudo);

        if (
          !room ||
          !user
        ) {
          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;
        }

        if (
          room.status !==
          "waiting"
        ) {
          socket.emit(
            "roomError",
            "Cette partie a déjà commencé."
          );

          return;
        }

        const alreadyInRoom =
          room.players.some(
            (player) =>
              normalizePseudo(
                player.pseudo
              ) ===
              normalizePseudo(
                user.pseudo
              )
          );

        if (!alreadyInRoom) {
          if (
            room.players.length >= 8
          ) {
            socket.emit(
              "roomError",
              "Le salon est complet."
            );

            return;
          }

          removeUserFromRooms(
            user.pseudo
          );

          room.players.push({
            pseudo:
              user.pseudo,

            isBot: false,

            socketId:
              socket.id
          });
        }

        socket.join(
          room.code
        );

        saveDatabase();

        socket.emit(
          "joinedRoom",
          roomPublic(room)
        );

        io.to(room.code).emit(
          "roomUpdated",
          roomPublic(room)
        );

        io.emit(
          "roomsList",
          db.rooms
            .filter(
              (item) =>
                item.status ===
                "waiting"
            )
            .map(roomPublic)
        );
      }
    );


    /* =====================================
       INVITER UN AMI
    ===================================== */

    socket.on(
      "inviteFriendToRoom",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        const fromPseudo =
          cleanPseudo(
            data?.fromPseudo
          );

        const toPseudo =
          cleanPseudo(
            data?.toPseudo
          );

        if (!room) {
          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;
        }

        if (
          normalizePseudo(
            room.host
          ) !==
          normalizePseudo(
            fromPseudo
          )
        ) {
          socket.emit(
            "roomError",
            "Seul le créateur peut inviter."
          );

          return;
        }

        addNotification(
          toPseudo,
          {
            title:
              "🎮 Invitation",

            message:
              `${fromPseudo} vous invite dans le salon ${room.code}.`,

            type:
              "roomInvite"
          }
        );

        const targetSocket =
          onlineUsers.get(
            normalizePseudo(
              toPseudo
            )
          );

        if (targetSocket) {
          io.to(targetSocket).emit(
            "roomInvitation",
            {
              code:
                room.code,

              fromPseudo
            }
          );
        }
      }
    );


    /* =====================================
       RECHERCHE DE JOUEURS
    ===================================== */

    socket.on(
      "searchPlayers",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        if (!room) {
          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;
        }

        socket.emit(
          "playerSearchStarted",
          {
            duration: 10000
          }
        );

        /*
          Après 10 secondes,
          le serveur complète
          automatiquement avec des bots.
        */

        setTimeout(
          () => {
            if (
              room.status !==
              "waiting"
            ) {
              return;
            }

            addBotsToRoom(
              room
            );

            saveDatabase();

            io.to(room.code).emit(
              "playerSearchFinished",
              roomPublic(room)
            );
          },
          10000
        );
      }
    );


    /* =====================================
       LANCER AVEC D'AUTRES JOUEURS
    ===================================== */

    socket.on(
      "startGame",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        const pseudo =
          cleanPseudo(
            data?.pseudo
          );

        if (!room) {
          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;
        }

        if (
          normalizePseudo(
            room.host
          ) !==
          normalizePseudo(
            pseudo
          )
        ) {
          socket.emit(
            "roomError",
            "Seul le créateur peut lancer la partie."
          );

          return;
        }

        if (
          room.status !==
          "waiting"
        ) {
          socket.emit(
            "roomError",
            "La partie est déjà lancée."
          );

          return;
        }

        /*
          S'il manque des joueurs,
          les bots complètent jusqu'à 8.
        */

        addBotsToRoom(
          room
        );

        room.status =
          "playing";

        room.game =
          createGame(room);

        saveDatabase();

        io.to(room.code).emit(
          "gameStarted",
          {
            room:
              roomPublic(room),

            phase:
              room.game.phase,

            day:
              room.game.day,

            players:
              room.game.players.map(
                (player) => ({
                  pseudo:
                    player.pseudo,

                  alive:
                    player.alive,

                  isBot:
                    player.isBot
                })
              )
          }
        );

        /*
          Chaque vrai joueur
          reçoit uniquement son rôle.
        */

        room.game.players.forEach(
          (player) => {
            if (player.isBot) return;

            const playerSocket =
              onlineUsers.get(
                normalizePseudo(
                  player.pseudo
                )
              );

            if (playerSocket) {
              io.to(playerSocket).emit(
                "yourRole",
                {
                  role:
                    player.role
                }
              );
            }
          }
        );
      }
    );


    /* =====================================
       LANCER AVEC BOTS
    ===================================== */

    socket.on(
      "startGameWithBots",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        const pseudo =
          cleanPseudo(
            data?.pseudo
          );

        if (!room) {
          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;
        }

        if (
          normalizePseudo(
            room.host
          ) !==
          normalizePseudo(
            pseudo
          )
        ) {
          socket.emit(
            "roomError",
            "Seul le créateur peut lancer la partie."
          );

          return;
        }

        socket.emit(
          "botLoadingStarted",
          {
            duration: 10000
          }
        );

        setTimeout(
          () => {
            if (
              room.status !==
              "waiting"
            ) {
              return;
            }

            addBotsToRoom(
              room
            );

            room.status =
              "playing";

            room.game =
              createGame(room);

            saveDatabase();

            io.to(room.code).emit(
              "gameStarted",
              {
                room:
                  roomPublic(room),

                phase:
                  room.game.phase,

                day:
                  room.game.day,

                players:
                  room.game.players.map(
                    (player) => ({
                      pseudo:
                        player.pseudo,

                      alive:
                        player.alive,

                      isBot:
                        player.isBot
                    })
                  )
              }
            );

            room.game.players.forEach(
              (player) => {
                if (
                  player.isBot
                ) {
                  return;
                }

                const playerSocket =
                  onlineUsers.get(
                    normalizePseudo(
                      player.pseudo
                    )
                  );

                if (playerSocket) {
                  io.to(
                    playerSocket
                  ).emit(
                    "yourRole",
                    {
                      role:
                        player.role
                    }
                  );
                }
              }
            );
          },
          10000
        );
      }
    );


    /* =====================================
       VOTE DE NUIT
    ===================================== */

    socket.on(
      "nightVote",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        if (
          !room ||
          !room.game
        ) {
          return;
        }

        const game =
          room.game;

        if (
          game.phase !==
          "night"
        ) {
          return;
        }

        const voter =
          game.players.find(
            (player) =>
              player.pseudo ===
              data?.pseudo
          );

        const target =
          game.players.find(
            (player) =>
              player.pseudo ===
              data?.targetPseudo
          );

        if (
          !voter ||
          !target ||
          !voter.alive ||
          !target.alive
        ) {
          return;
        }

        if (
          voter.role !==
          "Loup-Garou"
        ) {
          return;
        }

        game.nightVotes[
          voter.pseudo
        ] =
          target.pseudo;

        const wolves =
          game.players.filter(
            (player) =>
              player.alive &&
              player.role ===
              "Loup-Garou"
          );

        if (
          Object.keys(
            game.nightVotes
          ).length >=
          wolves.length
        ) {
          const counts = {};

          Object.values(
            game.nightVotes
          ).forEach(
            (targetPseudo) => {
              counts[targetPseudo] =
                (
                  counts[targetPseudo] ||
                  0
                ) + 1;
            }
          );

          const victimPseudo =
            Object.keys(counts)
              .sort(
                (a, b) =>
                  counts[b] -
                  counts[a]
              )[0];

          const victim =
            game.players.find(
              (player) =>
                player.pseudo ===
                victimPseudo
            );

          if (victim) {
            victim.alive = false;
          }

          game.nightVotes = {};

          if (
            checkGameWinner(game)
          ) {
            finishGame(room);
            return;
          }

          game.phase = "day";

          saveDatabase();

          io.to(room.code).emit(
            "dayStarted",
            {
              victim:
                victim
                  ? victim.pseudo
                  : null,

              players:
                game.players.map(
                  (player) => ({
                    pseudo:
                      player.pseudo,

                    alive:
                      player.alive
                  })
                )
            }
          );
        }
      }
    );


    /* =====================================
       VOTE DU JOUR
    ===================================== */

    socket.on(
      "dayVote",
      (data) => {
        const room =
          findRoom(
            data?.code
          );

        if (
          !room ||
          !room.game
        ) {
          return;
        }

        const game =
          room.game;

        if (
          game.phase !==
          "day"
        ) {
          return;
        }

        const voter =
          game.players.find(
            (player) =>
              player.pseudo ===
              data?.pseudo
          );

        const target =
          game.players.find(
            (player) =>
              player.pseudo ===
              data?.targetPseudo
          );

        if (
          !voter ||
          !target ||
          !voter.alive ||
          !target.alive
        ) {
          return;
        }

        game.dayVotes[
          voter.pseudo
        ] =
          target.pseudo;

        const alive =
          getAlivePlayers(game);

        if (
          Object.keys(
            game.dayVotes
          ).length >=
          alive.filter(
            (player) =>
              !player.isBot
          ).length
        ) {
          const counts = {};

          Object.values(
            game.dayVotes
          ).forEach(
            (targetPseudo) => {
              counts[targetPseudo] =
                (
                  counts[targetPseudo] ||
                  0
                ) + 1;
            }
          );

          const eliminatedPseudo =
            Object.keys(counts)
              .sort(
                (a, b) =>
                  counts[b] -
                  counts[a]
              )[0];

          const eliminated =
            game.players.find(
              (player) =>
                player.pseudo ===
                eliminatedPseudo
            );

          if (eliminated) {
            eliminated.alive =
              false;
          }

          game.dayVotes = {};

          if (
            checkGameWinner(game)
          ) {
            finishGame(room);
            return;
          }

          game.phase =
            "night";

          game.day++;

          saveDatabase();

          io.to(room.code).emit(
            "nightStarted",
            {
              day:
                game.day,

              eliminated:
                eliminated
                  ? eliminated.pseudo
                  : null
            }
          );
        }
      }
    );


    /* =====================================
       LISTE DES SALONS
    ===================================== */

    socket.on(
      "getRooms",
      () => {
        socket.emit(
          "roomsList",
          db.rooms
            .filter(
              (room) =>
                room.status ===
                "waiting"
            )
            .map(roomPublic)
        );
      }
    );


    /* =====================================
       DÉCONNEXION
    ===================================== */

    socket.on(
      "disconnect",
      () => {
        const pseudo =
          socketUsers.get(
            socket.id
          );

        if (pseudo) {
          onlineUsers.delete(
            normalizePseudo(
              pseudo
            )
          );

          socketUsers.delete(
            socket.id
          );

          io.emit(
            "userStatusChanged",
            {
              pseudo,
              online: false
            }
          );
        }

        console.log(
          "Déconnexion :",
          socket.id
        );
      }
    );
  }
);


/* =========================================
   PAGE PRINCIPALE
========================================= */

app.get(
  "*",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);


/* =========================================
   NETTOYAGE DES SALONS
========================================= */

setInterval(
  () => {
    const now = Date.now();

    db.rooms =
      db.rooms.filter(
        (room) => {
          if (
            room.status ===
            "waiting"
          ) {
            return (
              now -
              room.createdAt
            ) <
              1000 *
              60 *
              60 *
              12;
          }

          return true;
        }
      );

    saveDatabase();

  },
  1000 * 60 * 10
);


/* =========================================
   DÉMARRAGE
========================================= */

server.listen(
  PORT,
  () => {
    console.log(
      `🐺 Loup-Garou V7 lancé sur le port ${PORT}`
    );
  }
);
