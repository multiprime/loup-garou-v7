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

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   BASE DE DONNÉES
========================= */

const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      if (!data.users) {
        data.users = {};
      }

      return data;
    }
  } catch (error) {
    console.error("Erreur lecture data :", error);
  }

  return { users: {} };
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

/* =========================
   ADMIN
========================= */

const ADMIN_PSEUDO = "creator2026";

/* =========================
   CLASSES
========================= */

const CLASSES = [
  { id: "wolf1", price: 1000 },
  { id: "wolf2", price: 1200 },
  { id: "wolf3", price: 1300 },
  { id: "wolf4", price: 1500 },

  { id: "seer1", price: 200 },
  { id: "seer2", price: 250 },
  { id: "seer3", price: 300 },
  { id: "seer4", price: 400 },

  { id: "witch1", price: 350 },
  { id: "witch2", price: 450 },
  { id: "witch3", price: 500 },
  { id: "witch4", price: 600 },

  { id: "hunter1", price: 100 },
  { id: "hunter2", price: 150 },
  { id: "hunter3", price: 200 },
  { id: "hunter4", price: 300 }
];

/* =========================
   UTILISATEUR PUBLIC
========================= */

function publicUser(user) {
  return {
    pseudo: user.pseudo,
    email: user.email,
    level: user.level || 1,
    xp: user.xp || 0,
    coins: user.coins || 0,
    trophies: user.trophies || 0,
    icon: user.icon || "🐺",
    title: user.title || "Nouveau Villageois",
    classes: user.classes || [],
    equippedClass: user.equippedClass || null
  };
}

/* =========================
   TROUVER UN UTILISATEUR
========================= */

function findUserByPseudo(pseudo) {
  const search = String(pseudo || "")
    .trim()
    .toLowerCase();

  return Object.values(database.users).find(
    (user) =>
      String(user.pseudo || "")
        .toLowerCase() === search
  );
}

/* =========================
   INSCRIPTION
========================= */

app.post("/api/register", async (req, res) => {
  try {
    const pseudo = String(req.body.pseudo || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (pseudo.length < 3 || pseudo.length > 20) {
      return res.status(400).json({
        message:
          "Le pseudo doit contenir entre 3 et 20 caractères."
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Adresse e-mail invalide."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Le mot de passe doit contenir au moins 6 caractères."
      });
    }

    const pseudoExists = Object.values(
      database.users
    ).some(
      (user) =>
        String(user.pseudo).toLowerCase() ===
        pseudo.toLowerCase()
    );

    if (pseudoExists) {
      return res.status(409).json({
        message: "Ce pseudo existe déjà."
      });
    }

    const emailExists = Object.values(
      database.users
    ).some(
      (user) =>
        String(user.email || "").toLowerCase() ===
        email
    );

    if (emailExists) {
      return res.status(409).json({
        message:
          "Cette adresse e-mail est déjà utilisée."
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const user = {
      pseudo,
      email,
      passwordHash,
      level: 1,
      xp: 0,

      // 50 pièces offertes
      coins: 50,

      trophies: 0,
      icon: "🐺",
      title: "Nouveau Villageois",
      classes: [],
      equippedClass: null,
      friends: [],
      createdAt: new Date().toISOString()
    };

    database.users[pseudo] = user;

    saveData();

    res.status(201).json({
      message:
        "Compte créé avec succès ! Tu reçois 50 pièces 🎁",
      user: publicUser(user)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur."
    });
  }
});

/* =========================
   CONNEXION
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const pseudo = String(req.body.pseudo || "").trim();
    const password = String(req.body.password || "");

    const user = findUserByPseudo(pseudo);

    if (!user) {
      return res.status(401).json({
        message:
          "Pseudo ou mot de passe incorrect."
      });
    }

    const correct = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!correct) {
      return res.status(401).json({
        message:
          "Pseudo ou mot de passe incorrect."
      });
    }

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

/* =========================
   RECHERCHE UTILISATEUR
========================= */

app.get("/api/users/:pseudo", (req, res) => {
  const user = findUserByPseudo(
    decodeURIComponent(req.params.pseudo)
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

/* =========================
   AMIS
========================= */

app.post("/api/friends/add", (req, res) => {
  const user = findUserByPseudo(req.body.pseudo);
  const friend = findUserByPseudo(
    req.body.friendPseudo
  );

  if (!user || !friend) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  if (
    user.pseudo.toLowerCase() ===
    friend.pseudo.toLowerCase()
  ) {
    return res.status(400).json({
      message:
        "Tu ne peux pas t'ajouter toi-même."
    });
  }

  if (!Array.isArray(user.friends)) {
    user.friends = [];
  }

  const alreadyFriend = user.friends.some(
    (pseudo) =>
      String(pseudo).toLowerCase() ===
      friend.pseudo.toLowerCase()
  );

  if (alreadyFriend) {
    return res.status(400).json({
      message: "Ce joueur est déjà ton ami."
    });
  }

  user.friends.push(friend.pseudo);

  saveData();

  res.json({
    message: "Ami ajouté !",
    friend: publicUser(friend)
  });
});

app.get("/api/friends/:pseudo", (req, res) => {
  const user = findUserByPseudo(
    req.params.pseudo
  );

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  const friends = (user.friends || [])
    .map((pseudo) => findUserByPseudo(pseudo))
    .filter(Boolean)
    .map(publicUser);

  res.json({ friends });
});

/* =========================
   CLASSES
========================= */

app.post("/api/classes/buy", (req, res) => {
  const user = findUserByPseudo(req.body.pseudo);
  const classId = String(req.body.classId || "");

  const classe = CLASSES.find(
    (item) => item.id === classId
  );

  if (!user || !classe) {
    return res.status(400).json({
      message:
        "Utilisateur ou classe invalide."
    });
  }

  if (!Array.isArray(user.classes)) {
    user.classes = [];
  }

  if (user.classes.includes(classId)) {
    return res.status(400).json({
      message:
        "Tu possèdes déjà cette classe."
    });
  }

  if ((user.coins || 0) < classe.price) {
    return res.status(400).json({
      message:
        "Tu n'as pas assez de pièces."
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
  const user = findUserByPseudo(req.body.pseudo);
  const classId = String(req.body.classId || "");

  if (
    !user ||
    !(user.classes || []).includes(classId)
  ) {
    return res.status(400).json({
      message:
        "Tu ne possèdes pas cette classe."
    });
  }

  user.equippedClass = classId;

  saveData();

  res.json({
    message: "Classe équipée !",
    user: publicUser(user)
  });
});

/* =========================
   CLASSEMENT
========================= */

app.get("/api/ranking", (req, res) => {
  const users = Object.values(database.users)
    .sort(
      (a, b) =>
        (b.trophies || 0) -
        (a.trophies || 0)
    )
    .slice(0, 100)
    .map(publicUser);

  res.json({ users });
});

/* =========================
   CHANGER E-MAIL
========================= */

app.post(
  "/api/account/email",
  async (req, res) => {
    try {
      const user = findUserByPseudo(
        req.body.pseudo
      );

      const email = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || ""
      );

      if (!user) {
        return res.status(404).json({
          message:
            "Utilisateur introuvable."
        });
      }

      if (!email.includes("@")) {
        return res.status(400).json({
          message:
            "Adresse e-mail invalide."
        });
      }

      const correct = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!correct) {
        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });
      }

      const emailExists = Object.values(
        database.users
      ).some(
        (other) =>
          other.pseudo !== user.pseudo &&
          String(other.email || "")
            .toLowerCase() === email
      );

      if (emailExists) {
        return res.status(409).json({
          message:
            "Cette adresse e-mail est déjà utilisée."
        });
      }

      user.email = email;

      saveData();

      res.json({
        message:
          "Adresse e-mail modifiée !",
        user: publicUser(user)
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Erreur serveur."
      });
    }
  }
);

/* =========================
   SUPPRIMER COMPTE
========================= */

app.post(
  "/api/account/delete",
  async (req, res) => {
    try {
      const user = findUserByPseudo(
        req.body.pseudo
      );

      const password = String(
        req.body.password || ""
      );

      if (!user) {
        return res.status(404).json({
          message:
            "Utilisateur introuvable."
        });
      }

      const correct = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!correct) {
        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });
      }

      delete database.users[user.pseudo];

      saveData();

      res.json({
        message: "Compte supprimé."
      });

    } catch (error) {
      res.status(500).json({
        message: "Erreur serveur."
      });
    }
  }
);

/* =========================
   ADMIN
========================= */

function isAdmin(pseudo) {
  return (
    String(pseudo || "")
      .trim()
      .toLowerCase() ===
    ADMIN_PSEUDO.toLowerCase()
  );
}

/* ADMIN - RECHERCHER */

app.get(
  "/api/admin/users/:pseudo",
  (req, res) => {
    const adminPseudo =
      req.query.adminPseudo;

    if (!isAdmin(adminPseudo)) {
      return res.status(403).json({
        message:
          "Accès administrateur refusé."
      });
    }

    const user = findUserByPseudo(
      req.params.pseudo
    );

    if (!user) {
      return res.status(404).json({
        message: "Joueur introuvable."
      });
    }

    res.json({
      user: publicUser(user)
    });
  }
);

/* ADMIN - PIÈCES */

app.post(
  "/api/admin/coins",
  (req, res) => {
    const {
      adminPseudo,
      targetPseudo,
      amount
    } = req.body;

    if (!isAdmin(adminPseudo)) {
      return res.status(403).json({
        message: "Accès refusé."
      });
    }

    const user = findUserByPseudo(
      targetPseudo
    );

    const number = Number(amount);

    if (
      !user ||
      !Number.isFinite(number) ||
      number <= 0
    ) {
      return res.status(400).json({
        message:
          "Informations invalides."
      });
    }

    user.coins =
      (user.coins || 0) +
      Math.floor(number);

    saveData();

    res.json({
      message:
        `${Math.floor(number)} pièces données à ${user.pseudo} !`,
      user: publicUser(user)
    });
  }
);

/* ADMIN - XP */

app.post(
  "/api/admin/xp",
  (req, res) => {
    const {
      adminPseudo,
      targetPseudo,
      amount
    } = req.body;

    if (!isAdmin(adminPseudo)) {
      return res.status(403).json({
        message: "Accès refusé."
      });
    }

    const user = findUserByPseudo(
      targetPseudo
    );

    const number = Number(amount);

    if (
      !user ||
      !Number.isFinite(number) ||
      number <= 0
    ) {
      return res.status(400).json({
        message:
          "Informations invalides."
      });
    }

    user.xp =
      (user.xp || 0) +
      Math.floor(number);

    user.level = Math.min(
      100,
      Math.max(
        1,
        Math.floor(user.xp / 500) + 1
      )
    );

    saveData();

    res.json({
      message:
        `${Math.floor(number)} XP donnés à ${user.pseudo} !`,
      user: publicUser(user)
    });
  }
);

/* ADMIN - CLASSE */

app.post(
  "/api/admin/class",
  (req, res) => {
    const {
      adminPseudo,
      targetPseudo,
      classId
    } = req.body;

    if (!isAdmin(adminPseudo)) {
      return res.status(403).json({
        message: "Accès refusé."
      });
    }

    const user = findUserByPseudo(
      targetPseudo
    );

    const classe = CLASSES.find(
      (item) => item.id === classId
    );

    if (!user || !classe) {
      return res.status(400).json({
        message:
          "Joueur ou classe invalide."
      });
    }

    if (!Array.isArray(user.classes)) {
      user.classes = [];
    }

    if (user.classes.includes(classId)) {
      return res.status(400).json({
        message:
          "Le joueur possède déjà cette classe."
      });
    }

    user.classes.push(classId);

    saveData();

    res.json({
      message:
        `Classe donnée à ${user.pseudo} !`,
      user: publicUser(user)
    });
  }
);

/* =========================
   SALONS MULTIJOUEURS
========================= */

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
    .filter((room) => !room.started)
    .map(publicRoom);

  io.emit("roomsList", list);
}

/* =========================
   SOCKET.IO
========================= */

io.on("connection", (socket) => {
  console.log(
    "Joueur connecté :",
    socket.id
  );

  socket.on(
    "userOnline",
    ({ pseudo }) => {
      socket.pseudo = String(
        pseudo || ""
      ).trim();
    }
  );

  /* CRÉER */

  socket.on(
    "createRoom",
    ({ pseudo }) => {
      pseudo = String(
        pseudo || ""
      ).trim();

      if (!pseudo) {
        socket.emit(
          "roomError",
          "Pseudo invalide."
        );
        return;
      }

      const code =
        generateRoomCode();

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
    }
  );

  /* REJOINDRE */

  socket.on(
    "joinRoom",
    ({ code, pseudo }) => {
      code = String(
        code || ""
      )
        .trim()
        .toUpperCase();

      pseudo = String(
        pseudo || ""
      ).trim();

      const room = rooms[code];

      if (!room) {
        socket.emit(
          "roomError",
          "Partie introuvable."
        );
        return;
      }

      if (room.started) {
        socket.emit(
          "roomError",
          "La partie a déjà commencé."
        );
        return;
      }

      if (!pseudo) {
        socket.emit(
          "roomError",
          "Pseudo invalide."
        );
        return;
      }

      if (
        !room.players.includes(pseudo)
      ) {
        room.players.push(pseudo);
      }

      socket.join(code);

      socket.emit(
        "joinedRoom",
        publicRoom(room)
      );

      io.to(code).emit(
        "roomUpdated",
        publicRoom(room)
      );

      broadcastRooms();
    }
  );

  /* LANCER LA PARTIE */

  socket.on(
    "startGame",
    ({ code, pseudo }) => {
      code = String(
        code || ""
      )
        .trim()
        .toUpperCase();

      pseudo = String(
        pseudo || ""
      ).trim();

      const room = rooms[code];

      if (!room) {
        socket.emit(
          "roomError",
          "Partie introuvable."
        );
        return;
      }

      if (room.host !== pseudo) {
        socket.emit(
          "roomError",
          "Seul le créateur peut lancer la partie."
        );
        return;
      }

      if (room.players.length < 2) {
        socket.emit(
          "roomError",
          "Il faut au moins 2 joueurs."
        );
        return;
      }

      room.started = true;

      io.to(code).emit(
        "gameStarted",
        {
          code: room.code,
          players: room.players
        }
      );

      broadcastRooms();
    }
  );

  /* LISTE DES SALONS */

  socket.on("getRooms", () => {
    const list = Object.values(rooms)
      .filter((room) => !room.started)
      .map(publicRoom);

    socket.emit(
      "roomsList",
      list
    );
  });

  socket.on("disconnect", () => {
    console.log(
      "Joueur déconnecté :",
      socket.id
    );
  });
});

/* =========================
   TEST
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message:
      "Loup-Garou V7 fonctionne !"
  });
});

/* =========================
   LANCEMENT
========================= */

server.listen(PORT, () => {
  console.log(
    "🐺 Serveur démarré sur le port " +
    PORT
  );
});
