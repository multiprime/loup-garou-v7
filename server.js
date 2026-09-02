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


/* =====================================
   BASE DE DONNÉES
===================================== */

const DATA_FILE = path.join(__dirname, "data.json");

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      if (!data.users) data.users = {};
      if (!data.announcement) data.announcement = "";

      return data;
    }
  } catch (error) {
    console.error("Erreur lecture data :", error);
  }

  return {
    users: {},
    announcement: ""
  };
}

let database = loadData();

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(database, null, 2),
    "utf8"
  );
}


/* =====================================
   CLASSES
===================================== */

const CLASSES = [
  { id: "wolf1", name: "Loup-Garou 1", price: 1000, chance: 10 },
  { id: "wolf2", name: "Loup-Garou 2", price: 1200, chance: 20 },
  { id: "wolf3", name: "Loup-Garou 3", price: 1300, chance: 35 },
  {
    id: "wolf4",
    name: "Loup-Garou certifié",
    price: 1500,
    chance: 50
  },

  { id: "seer1", name: "Voyante 1", price: 200, chance: 10 },
  { id: "seer2", name: "Voyante 2", price: 250, chance: 20 },
  { id: "seer3", name: "Voyante 3", price: 300, chance: 30 },
  {
    id: "seer4",
    name: "Voyante certifiée",
    price: 400,
    chance: 50
  },

  {
    id: "witch1",
    name: "Sorcière 1",
    price: 350,
    chance: 10
  },
  {
    id: "witch2",
    name: "Sorcière 2",
    price: 450,
    chance: 20
  },
  {
    id: "witch3",
    name: "Sorcière 3",
    price: 500,
    chance: 30
  },
  {
    id: "witch4",
    name: "Sorcière certifiée",
    price: 600,
    chance: 50
  },

  {
    id: "hunter1",
    name: "Chasseur 1",
    price: 100,
    chance: 10
  },
  {
    id: "hunter2",
    name: "Chasseur 2",
    price: 150,
    chance: 20
  },
  {
    id: "hunter3",
    name: "Chasseur 3",
    price: 200,
    chance: 30
  },
  {
    id: "hunter4",
    name: "Chasseur certifié",
    price: 300,
    chance: 50
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
    id: "premium4",
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
    id: "admin4",
    name: "Admin certifié",
    price: 10000,
    chance: 99
  }
];


/* =====================================
   UTILISATEURS
===================================== */

function prepareUser(user) {
  if (!user.classes) user.classes = [];
  if (!user.notifications) user.notifications = [];
  if (!user.xp) user.xp = 0;
  if (!user.coins) user.coins = 0;
  if (!user.trophies) user.trophies = 0;
  if (!user.level) user.level = 1;
}

Object.values(database.users).forEach(prepareUser);
saveData();


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
    classes: user.classes,
    equippedClass: user.equippedClass || null,
    isAdmin: user.pseudo === ADMIN_PSEUDO
  };
}


function addNotification(user, message, reward) {
  prepareUser(user);

  user.notifications.push({
    id: Date.now() + "-" + Math.random(),
    message,
    reward: reward || {},
    claimed: false,
    createdAt: new Date().toISOString()
  });
}


/* =====================================
   INSCRIPTION
===================================== */

app.post("/api/register", async (req, res) => {
  try {
    const pseudo = String(req.body.pseudo || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (pseudo.length < 3 || pseudo.length > 20) {
      return res.status(400).json({
        message: "Le pseudo doit contenir entre 3 et 20 caractères."
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Adresse e-mail invalide."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères."
      });
    }

    if (database.users[pseudo]) {
      return res.status(409).json({
        message: "Ce pseudo existe déjà."
      });
    }

    const emailExists =
      Object.values(database.users).some(
        (user) => user.email === email
      );

    if (emailExists) {
      return res.status(409).json({
        message: "Cette adresse e-mail est déjà utilisée."
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const user = {
      pseudo,
      email,
      passwordHash,

      level: 1,
      xp: 0,

      // 50 pièces gratuites
      coins: 50,

      trophies: 0,

      icon: "🐺",

      title:
        pseudo === ADMIN_PSEUDO
          ? "👑 Créateur du jeu"
          : "Nouveau Villageois",

      classes: [],
      equippedClass: null,

      notifications: [
        {
          id: "welcome-" + Date.now(),
          message:
            "🎁 Bienvenue ! Vous avez reçu 50 🐺 pièces gratuites !",
          reward: {},
          claimed: true,
          createdAt: new Date().toISOString()
        }
      ],

      createdAt: new Date().toISOString()
    };

    database.users[pseudo] = user;

    saveData();

    res.status(201).json({
      message:
        "Compte créé ! Tu as reçu 50 🐺 pièces.",
      user: publicUser(user)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur."
    });
  }
});


/* =====================================
   CONNEXION
===================================== */

app.post("/api/login", async (req, res) => {
  try {
    const pseudo =
      String(req.body.pseudo || "").trim();

    const password =
      String(req.body.password || "");

    const user =
      database.users[pseudo];

    if (!user) {
      return res.status(401).json({
        message:
          "Pseudo ou mot de passe incorrect."
      });
    }

    prepareUser(user);

    const correct =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!correct) {
      return res.status(401).json({
        message:
          "Pseudo ou mot de passe incorrect."
      });
    }

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


/* =====================================
   PROFIL JOUEUR
===================================== */

app.get("/api/users/:pseudo", (req, res) => {
  const searchedPseudo =
    String(req.params.pseudo || "")
      .trim()
      .toLowerCase();

  const user =
    Object.values(database.users).find(
      (item) =>
        item.pseudo.toLowerCase() === searchedPseudo
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


/* =====================================
   CLASSES
===================================== */

app.get("/api/classes", (req, res) => {
  res.json({
    classes: CLASSES
  });
});


app.post("/api/classes/buy", (req, res) => {

  const pseudo =
    String(req.body.pseudo || "");

  const classId =
    String(req.body.classId || "");

  const user =
    database.users[pseudo];

  const classe =
    CLASSES.find(
      (item) => item.id === classId
    );

  if (!user || !classe) {
    return res.status(400).json({
      message:
        "Utilisateur ou classe invalide."
    });
  }

  prepareUser(user);

  if (user.classes.includes(classId)) {
    return res.status(400).json({
      message:
        "Tu possèdes déjà cette classe."
    });
  }

  if (user.coins < classe.price) {
    return res.status(400).json({
      message:
        "Tu n'as pas assez de 🐺 pièces."
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

  const pseudo =
    String(req.body.pseudo || "");

  const classId =
    String(req.body.classId || "");

  const user =
    database.users[pseudo];

  if (!user) {
    return res.status(404).json({
      message:
        "Utilisateur introuvable."
    });
  }

  prepareUser(user);

  if (!user.classes.includes(classId)) {
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


/* =====================================
   QUÊTES
===================================== */

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
    title: "Légende du village",
    description: "Jouer 50 parties.",
    xp: 2500,
    coins: 1000
  },
  {
    id: "win1",
    title: "Première victoire",
    description: "Gagner 1 partie.",
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
    id: "coins500",
    title: "Économe",
    description: "Posséder 500 🐺 pièces.",
    xp: 300,
    coins: 100
  },
  {
    id: "coins1000",
    title: "Riche villageois",
    description: "Posséder 1000 🐺 pièces.",
    xp: 800,
    coins: 250
  },
  {
    id: "level5",
    title: "Apprenti",
    description: "Atteindre le niveau 5.",
    xp: 500,
    coins: 200
  },
  {
    id: "level10",
    title: "Expert",
    description: "Atteindre le niveau 10.",
    xp: 1500,
    coins: 500
  }
];

app.get("/api/quests", (req, res) => {
  res.json({ quests: QUESTS });
});


/* =====================================
   CLASSEMENT
===================================== */

app.get("/api/ranking", (req, res) => {

  const users =
    Object.values(database.users)
      .map(publicUser)
      .sort(
        (a, b) =>
          b.trophies - a.trophies ||
          b.xp - a.xp
      )
      .slice(0, 100);

  res.json({ users });
});


/* =====================================
   NOTIFICATIONS
===================================== */

app.get(
  "/api/notifications/:pseudo",
  (req, res) => {

    const pseudo =
      String(req.params.pseudo || "");

    const user =
      database.users[pseudo];

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    prepareUser(user);

    res.json({
      notifications:
        user.notifications
    });
  }
);


app.post(
  "/api/notifications/:pseudo/:id/claim",
  (req, res) => {

    const pseudo =
      String(req.params.pseudo || "");

    const id =
      String(req.params.id || "");

    const user =
      database.users[pseudo];

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    prepareUser(user);

    const notification =
      user.notifications.find(
        (item) => item.id === id
      );

    if (!notification) {
      return res.status(404).json({
        message:
          "Notification introuvable."
      });
    }

    if (notification.claimed) {
      return res.status(400).json({
        message:
          "Cette récompense a déjà été récupérée."
      });
    }

    const reward =
      notification.reward || {};

    user.coins += Number(
      reward.coins || 0
    );

    user.xp += Number(
      reward.xp || 0
    );

    user.trophies += Number(
      reward.trophies || 0
    );

    if (
      reward.classId &&
      !user.classes.includes(reward.classId)
    ) {
      user.classes.push(
        reward.classId
      );
    }

    notification.claimed = true;

    saveData();

    res.json({
      message:
        "🎁 Récompense récupérée !",
      user: publicUser(user)
    });
  }
);


/* =====================================
   ADMIN - VÉRIFICATION
===================================== */

function requireAdmin(req, res) {

  const adminPseudo =
    String(
      req.body.adminPseudo ||
      req.query.adminPseudo ||
      ""
    ).trim();

  if (adminPseudo !== ADMIN_PSEUDO) {

    res.status(403).json({
      message:
        "Accès administrateur refusé."
    });

    return false;
  }

  return true;
}


/* =====================================
   ADMIN - RECHERCHE
===================================== */

app.get(
  "/api/admin/users/:pseudo",
  (req, res) => {

    const adminPseudo =
      String(
        req.query.adminPseudo || ""
      ).trim();

    if (adminPseudo !== ADMIN_PSEUDO) {
      return res.status(403).json({
        message: "Accès refusé."
      });
    }

    const searched =
      String(req.params.pseudo || "")
        .trim()
        .toLowerCase();

    const user =
      Object.values(database.users)
        .find(
          (item) =>
            item.pseudo
              .toLowerCase() === searched
        );

    if (!user) {
      return res.status(404).json({
        message:
          "Joueur introuvable."
      });
    }

    res.json({
      user: publicUser(user)
    });
  }
);


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

app.post(
  "/api/admin/reward",
  (req, res) => {

    if (!requireAdmin(req, res)) return;

    const targetPseudo =
      String(
        req.body.targetPseudo || ""
      ).trim();

    const coins =
      Math.max(
        0,
        Number(req.body.coins || 0)
      );

    const xp =
      Math.max(
        0,
        Number(req.body.xp || 0)
      );

    const trophies =
      Math.max(
        0,
        Number(req.body.trophies || 0)
      );

    const classId =
      String(
        req.body.classId || ""
      );

    const user =
      database.users[targetPseudo];

    if (!user) {
      return res.status(404).json({
        message:
          "Joueur introuvable."
      });
    }

    prepareUser(user);

    if (
      classId &&
      !CLASSES.some(
        (classe) =>
          classe.id === classId
      )
    ) {
      return res.status(400).json({
        message:
          "Classe invalide."
      });
    }

    const reward = {
      coins,
      xp,
      trophies,
      classId
    };

    const parts = [];

    if (coins > 0) {
      parts.push(
        coins + " 🐺 pièces"
      );
    }

    if (xp > 0) {
      parts.push(
        xp + " XP"
      );
    }

    if (trophies > 0) {
      parts.push(
        trophies + " trophées"
      );
    }

    if (classId) {

      const classe =
        CLASSES.find(
          (item) =>
            item.id === classId
        );

      parts.push(
        "la classe " +
        classe.name
      );
    }

    addNotification(
      user,
      "👑 Le créateur du jeu vous a offert : " +
        parts.join(", ") +
        " !",
      reward
    );

    saveData();

    res.json({
      message:
        "Récompense envoyée à " +
        user.pseudo + " !"
    });
  }
);


/* =====================================
   ADMIN - RÉCOMPENSER TOUT LE MONDE
===================================== */

app.post(
  "/api/admin/reward-all",
  (req, res) => {

    if (!requireAdmin(req, res)) return;

    const coins =
      Math.max(
        0,
        Number(req.body.coins || 0)
      );

    const xp =
      Math.max(
        0,
        Number(req.body.xp || 0)
      );

    const trophies =
      Math.max(
        0,
        Number(req.body.trophies || 0)
      );

    const classId =
      String(
        req.body.classId || ""
      );

    if (
      classId &&
      !CLASSES.some(
        (classe) =>
          classe.id === classId
      )
    ) {
      return res.status(400).json({
        message:
          "Classe invalide."
      });
    }

    const reward = {
      coins,
      xp,
      trophies,
      classId
    };

    const parts = [];

    if (coins > 0)
      parts.push(
        coins + " 🐺 pièces"
      );

    if (xp > 0)
      parts.push(
        xp + " XP"
      );

    if (trophies > 0)
      parts.push(
        trophies + " trophées"
      );

    if (classId) {

      const classe =
        CLASSES.find(
          (item) =>
            item.id === classId
        );

      parts.push(
        "la classe " +
        classe.name
      );
    }

    Object.values(
      database.users
    ).forEach((user) => {

      addNotification(
        user,
        "👑 Le créateur du jeu vous a offert : " +
          parts.join(", ") +
          " !",
        reward
      );

    });

    saveData();

    res.json({
      message:
        "Récompense envoyée à tous les joueurs !"
    });
  }
);


/* =====================================
   ADMIN - ANNONCE
===================================== */

app.get(
  "/api/announcement",
  (req, res) => {

    res.json({
      announcement:
        database.announcement || ""
    });
  }
);


app.post(
  "/api/admin/announcement",
  (req, res) => {

    if (!requireAdmin(req, res)) return;

    const announcement =
      String(
        req.body.announcement || ""
      )
        .trim()
        .slice(0, 1000);

    database.announcement =
      announcement;

    saveData();

    res.json({
      message:
        "Annonce modifiée !",
      announcement
    });
  }
);


/* =====================================
   CHANGER EMAIL
===================================== */

app.post(
  "/api/account/email",
  async (req, res) => {

    try {

      const pseudo =
        String(req.body.pseudo || "");

      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      const password =
        String(req.body.password || "");

      const user =
        database.users[pseudo];

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

      const alreadyUsed =
        Object.values(database.users)
          .some(
            (item) =>
              item.pseudo !== pseudo &&
              item.email === email
          );

      if (alreadyUsed) {
        return res.status(409).json({
          message:
            "Cette adresse e-mail est déjà utilisée."
        });
      }

      const correct =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!correct) {
        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });
      }

      user.email = email;

      saveData();

      res.json({
        message:
          "Adresse e-mail modifiée !"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Erreur serveur."
      });

    }

  }
);


/* =====================================
   SUPPRIMER COMPTE
===================================== */

app.post(
  "/api/account/delete",
  async (req, res) => {

    try {

      const pseudo =
        String(req.body.pseudo || "");

      const password =
        String(req.body.password || "");

      const user =
        database.users[pseudo];

      if (!user) {
        return res.status(404).json({
          message:
            "Utilisateur introuvable."
        });
      }

      const correct =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!correct) {
        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });
      }

      delete database.users[pseudo];

      saveData();

      res.json({
        message:
          "Compte supprimé."
      });

    } catch (error) {

      res.status(500).json({
        message:
          "Erreur serveur."
      });

    }

  }
);


/* =====================================
   MOT DE PASSE OUBLIÉ
===================================== */

app.post(
  "/api/password/forgot",
  (req, res) => {

    res.json({
      message:
        "Fonction de réinitialisation à connecter à un service d'e-mail."
    });

  }
);


/* =====================================
   SALONS MULTIJOUEURS
===================================== */

const rooms = {};

function generateRoomCode() {

  let code;

  do {

    code =
      Math.random()
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

  const list =
    Object.values(rooms)
      .filter(
        (room) => !room.started
      )
      .map(publicRoom);

  io.emit(
    "roomsList",
    list
  );

}


/* =====================================
   SOCKET.IO
===================================== */

io.on(
  "connection",
  (socket) => {

    console.log(
      "Joueur connecté :",
      socket.id
    );


    socket.on(
      "userOnline",
      ({ pseudo }) => {

        socket.pseudo = pseudo;

      }
    );


    socket.on(
      "createRoom",
      ({ pseudo }) => {

        pseudo =
          String(pseudo || "")
            .trim();

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

          players: [
            pseudo
          ],

          started: false

        };

        socket.join(code);

        socket.emit(
          "roomCreated",
          publicRoom(
            rooms[code]
          )
        );

        broadcastRooms();

      }
    );


    socket.on(
      "joinRoom",
      ({ code, pseudo }) => {

        code =
          String(code || "")
            .trim()
            .toUpperCase();

        pseudo =
          String(pseudo || "")
            .trim();

        const room =
          rooms[code];

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


    socket.on(
      "startGame",
      ({ code, pseudo }) => {

        const room =
          rooms[code];

        if (!room) {

          socket.emit(
            "roomError",
            "Partie introuvable."
          );

          return;

        }

        if (
          room.host !== pseudo
        ) {

          socket.emit(
            "roomError",
            "Seul le créateur peut lancer la partie."
          );

          return;

        }

        if (
          room.players.length < 2
        ) {

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
            code:
              room.code,

            players:
              room.players
          }
        );

        broadcastRooms();

      }
    );


    socket.on(
      "getRooms",
      () => {

        const list =
          Object.values(rooms)
            .filter(
              (room) =>
                !room.started
            )
            .map(publicRoom);

        socket.emit(
          "roomsList",
          list
        );

      }
    );


    socket.on(
      "disconnect",
      () => {

        console.log(
          "Joueur déconnecté :",
          socket.id
        );

      }
    );

  }
);


/* =====================================
   TEST
===================================== */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,
      message:
        "🐺 Loup-Garou V7 fonctionne !"
    });

  }
);


/* =====================================
   LANCEMENT
===================================== */

server.listen(
  PORT,
  () => {

    console.log(
      "🐺 Serveur démarré sur le port " +
      PORT
    );

  }
);
