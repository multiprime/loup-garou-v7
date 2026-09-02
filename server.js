/* =====================================
   LOUP-GAROU V7 - SERVEUR
===================================== */

const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");


/* =====================================
   CONFIGURATION
===================================== */

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

const ADMIN_PSEUDO = "creator2026";

const DATA_FILE = path.join(
  __dirname,
  "data.json"
);


/* =====================================
   MIDDLEWARE
===================================== */

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =====================================
   BASE DE DONNÉES JSON
===================================== */

function createDefaultData() {
  return {
    users: []
  };
}


function loadData() {

  try {

    if (!fs.existsSync(DATA_FILE)) {

      const defaultData =
        createDefaultData();

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          defaultData,
          null,
          2
        )
      );

      return defaultData;

    }


    const content =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const data =
      JSON.parse(content);

    if (!data.users) {

      data.users = [];

    }

    return data;

  } catch (error) {

    console.error(
      "Erreur chargement data.json :",
      error
    );

    return createDefaultData();

  }

}


let database = loadData();


function saveData() {

  try {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        database,
        null,
        2
      )
    );

  } catch (error) {

    console.error(
      "Erreur sauvegarde data.json :",
      error
    );

  }

}


/* =====================================
   CLASSES
===================================== */

const CLASSES = [

  {
    id: "wolf1",
    name: "Loup-Garou 1",
    price: 1000,
    chance: 10
  },

  {
    id: "wolf2",
    name: "Loup-Garou 2",
    price: 1200,
    chance: 20
  },

  {
    id: "wolf3",
    name: "Loup-Garou 3",
    price: 1300,
    chance: 35
  },

  {
    id: "wolf4",
    name: "Loup-Garou certifié",
    price: 1500,
    chance: 50
  },


  {
    id: "seer1",
    name: "Voyante 1",
    price: 200,
    chance: 10
  },

  {
    id: "seer2",
    name: "Voyante 2",
    price: 250,
    chance: 20
  },

  {
    id: "seer3",
    name: "Voyante 3",
    price: 300,
    chance: 30
  },

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
  }

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
    title: "🏘️ Habitant du village",
    description: "Jouer 3 parties.",
    xp: 150,
    coins: 100
  },

  {
    id: "play5",
    title: "🎮 Joueur actif",
    description: "Jouer 5 parties.",
    xp: 250,
    coins: 150
  },

  {
    id: "play10",
    title: "🔥 Villageois expérimenté",
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
    title: "⭐ Trois victoires",
    description: "Gagner 3 parties.",
    xp: 600,
    coins: 200
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
   FONCTIONS UTILISATEURS
===================================== */

function normalizePseudo(pseudo) {

  return String(
    pseudo || ""
  )
    .trim()
    .toLowerCase();

}


function findUser(pseudo) {

  const normalized =
    normalizePseudo(pseudo);

  return database.users.find(
    (user) =>
      normalizePseudo(user.pseudo) ===
      normalized
  );

}


function publicUser(user) {

  if (!user) return null;

  return {

    pseudo: user.pseudo,

    email: user.email,

    icon: user.icon || "🐺",

    title:
      user.title ||
      "Nouveau Villageois",

    level:
      Number(user.level || 1),

    xp:
      Number(user.xp || 0),

    coins:
      Number(user.coins || 0),

    trophies:
      Number(user.trophies || 0),

    classes:
      Array.isArray(user.classes)
        ? user.classes
        : [],

    equippedClass:
      user.equippedClass || ""

  };

}


function updateLevel(user) {

  user.xp =
    Math.max(
      0,
      Number(user.xp || 0)
    );

  user.level =
    Math.max(
      1,
      Math.floor(
        user.xp / 500
      ) + 1
    );

}


/* =====================================
   ROUTE ACCUEIL
===================================== */

app.get(
  "/",
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


/* =====================================
   INSCRIPTION
===================================== */

app.post(
  "/api/register",
  async (req, res) => {

    try {

      const pseudo =
        String(
          req.body.pseudo || ""
        ).trim();

      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body.password || ""
        );


      if (
        !pseudo ||
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            "Tous les champs sont obligatoires."
        });

      }


      if (
        pseudo.length < 3 ||
        pseudo.length > 20
      ) {

        return res.status(400).json({
          message:
            "Le pseudo doit contenir entre 3 et 20 caractères."
        });

      }


      if (
        password.length < 4
      ) {

        return res.status(400).json({
          message:
            "Le mot de passe doit contenir au moins 4 caractères."
        });

      }


      if (
        findUser(pseudo)
      ) {

        return res.status(409).json({
          message:
            "Ce pseudo existe déjà."
        });

      }


      const existingEmail =
        database.users.find(
          (user) =>
            String(
              user.email || ""
            )
              .toLowerCase() ===
            email
        );


      if (existingEmail) {

        return res.status(409).json({
          message:
            "Cet email est déjà utilisé."
        });

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );


      const user = {

        id:
          Date.now().toString() +
          Math.random()
            .toString(36)
            .slice(2),

        pseudo,

        email,

        passwordHash,

        icon: "🐺",

        title:
          "Nouveau Villageois",

        level: 1,

        xp: 0,

        coins: 50,

        trophies: 0,

        classes: [],

        equippedClass: "",

        createdAt:
          new Date().toISOString()

      };


      database.users.push(user);

      saveData();


      return res.status(201).json({

        message:
          "Compte créé !",

        user:
          publicUser(user)

      });

    } catch (error) {

      console.error(
        "Erreur inscription :",
        error
      );

      return res.status(500).json({
        message:
          "Erreur serveur."
      });

    }

  }
);


/* =====================================
   CONNEXION
===================================== */

app.post(
  "/api/login",
  async (req, res) => {

    try {

      const pseudo =
        String(
          req.body.pseudo || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );


      const user =
        findUser(pseudo);


      if (!user) {

        return res.status(401).json({
          message:
            "Pseudo ou mot de passe incorrect."
        });

      }


      const passwordHash =
        user.passwordHash ||
        user.password;


      const valid =
        await bcrypt.compare(
          password,
          passwordHash
        );


      if (!valid) {

        return res.status(401).json({
          message:
            "Pseudo ou mot de passe incorrect."
        });

      }


      return res.json({

        message:
          "Connexion réussie.",

        user:
          publicUser(user)

      });

    } catch (error) {

      console.error(
        "Erreur connexion :",
        error
      );

      return res.status(500).json({
        message:
          "Erreur serveur."
      });

    }

  }
);


/* =====================================
   LISTE DES CLASSES
===================================== */

app.get(
  "/api/classes",
  (req, res) => {

    res.json({
      classes: CLASSES
    });

  }
);


/* =====================================
   ACHETER UNE CLASSE
===================================== */

app.post(
  "/api/classes/buy",
  (req, res) => {

    const pseudo =
      req.body.pseudo;

    const classId =
      req.body.classId;


    const user =
      findUser(pseudo);


    if (!user) {

      return res.status(404).json({
        message:
          "Utilisateur introuvable."
      });

    }


    const classe =
      CLASSES.find(
        (item) =>
          item.id === classId
      );


    if (!classe) {

      return res.status(404).json({
        message:
          "Classe introuvable."
      });

    }


    if (
      !Array.isArray(
        user.classes
      )
    ) {

      user.classes = [];

    }


    if (
      user.classes.includes(
        classId
      )
    ) {

      return res.status(400).json({
        message:
          "Tu possèdes déjà cette classe."
      });

    }


    if (
      Number(user.coins || 0) <
      classe.price
    ) {

      return res.status(400).json({
        message:
          "Tu n'as pas assez de pièces."
      });

    }


    user.coins -=
      classe.price;


    user.classes.push(
      classId
    );


    saveData();


    return res.json({

      message:
        "Classe achetée !",

      user:
        publicUser(user)

    });

  }
);


/* =====================================
   ÉQUIPER UNE CLASSE
===================================== */

app.post(
  "/api/classes/equip",
  (req, res) => {

    const pseudo =
      req.body.pseudo;

    const classId =
      req.body.classId;


    const user =
      findUser(pseudo);


    if (!user) {

      return res.status(404).json({
        message:
          "Utilisateur introuvable."
      });

    }


    if (
      !Array.isArray(
        user.classes
      ) ||
      !user.classes.includes(
        classId
      )
    ) {

      return res.status(400).json({
        message:
          "Tu ne possèdes pas cette classe."
      });

    }


    const exists =
      CLASSES.some(
        (item) =>
          item.id === classId
      );


    if (!exists) {

      return res.status(404).json({
        message:
          "Classe introuvable."
      });

    }


    user.equippedClass =
      classId;


    saveData();


    return res.json({

      message:
        "Classe équipée !",

      user:
        publicUser(user)

    });

  }
);


/* =====================================
   QUÊTES
===================================== */

app.get(
  "/api/quests",
  (req, res) => {

    res.json({
      quests: QUESTS
    });

  }
);


/* =====================================
   RECHERCHER UN UTILISATEUR
===================================== */

app.get(
  "/api/users/:pseudo",
  (req, res) => {

    const user =
      findUser(
        req.params.pseudo
      );


    if (!user) {

      return res.status(404).json({
        message:
          "Joueur introuvable."
      });

    }


    return res.json({

      user:
        publicUser(user)

    });

  }
);


/* =====================================
   CLASSEMENT
===================================== */

app.get(
  "/api/ranking",
  (req, res) => {

    const users =
      database.users
        .map(publicUser)
        .sort(
          (a, b) => {

            if (
              b.trophies !==
              a.trophies
            ) {

              return (
                b.trophies -
                a.trophies
              );

            }


            if (
              b.level !==
              a.level
            ) {

              return (
                b.level -
                a.level
              );

            }


            return (
              b.xp -
              a.xp
            );

          }
        );


    res.json({
      users
    });

  }
);


/* =====================================
   ADMIN - VÉRIFICATION
===================================== */

function isAdmin(pseudo) {

  return (
    normalizePseudo(pseudo) ===
    normalizePseudo(ADMIN_PSEUDO)
  );

}


/* =====================================
   ADMIN - RECHERCHER UTILISATEUR
===================================== */

app.get(
  "/api/admin/users/:pseudo",
  (req, res) => {

    const adminPseudo =
      req.query.adminPseudo;


    if (!isAdmin(adminPseudo)) {

      return res.status(403).json({
        message:
          "Accès refusé."
      });

    }


    const user =
      findUser(
        req.params.pseudo
      );


    if (!user) {

      return res.status(404).json({
        message:
          "Joueur introuvable."
      });

    }


    return res.json({

      user:
        publicUser(user)

    });

  }
);


/* =====================================
   ADMIN - DONNER RÉCOMPENSE
===================================== */

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


    if (!isAdmin(adminPseudo)) {

      return res.status(403).json({
        message:
          "Accès refusé."
      });

    }


    const user =
      findUser(
        targetPseudo
      );


    if (!user) {

      return res.status(404).json({
        message:
          "Joueur introuvable."
      });

    }


    const safeCoins =
      Math.max(
        0,
        Number(coins || 0)
      );


    const safeXp =
      Math.max(
        0,
        Number(xp || 0)
      );


    const safeTrophies =
      Math.max(
        0,
        Number(trophies || 0)
      );


    user.coins =
      Number(user.coins || 0) +
      safeCoins;


    user.xp =
      Number(user.xp || 0) +
      safeXp;


    user.trophies =
      Number(user.trophies || 0) +
      safeTrophies;


    if (classId) {

      const classe =
        CLASSES.find(
          (item) =>
            item.id === classId
        );


      if (!classe) {

        return res.status(400).json({
          message:
            "Classe invalide."
        });

      }


      if (
        !Array.isArray(
          user.classes
        )
      ) {

        user.classes = [];

      }


      if (
        !user.classes.includes(
          classId
        )
      ) {

        user.classes.push(
          classId
        );

      }

    }


    updateLevel(user);

    saveData();


    return res.json({

      message:
        "Récompense envoyée !",

      user:
        publicUser(user)

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
        req.body.pseudo;

      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body.password || ""
        );


      const user =
        findUser(pseudo);


      if (!user) {

        return res.status(404).json({
          message:
            "Utilisateur introuvable."
        });

      }


      if (!email) {

        return res.status(400).json({
          message:
            "Entre un email valide."
        });

      }


      const passwordHash =
        user.passwordHash ||
        user.password;


      const valid =
        await bcrypt.compare(
          password,
          passwordHash
        );


      if (!valid) {

        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });

      }


      const existing =
        database.users.find(
          (otherUser) =>
            otherUser !== user &&
            String(
              otherUser.email || ""
            )
              .toLowerCase() ===
            email
        );


      if (existing) {

        return res.status(409).json({
          message:
            "Cet email est déjà utilisé."
        });

      }


      user.email =
        email;


      saveData();


      return res.json({

        message:
          "Email modifié !",

        user:
          publicUser(user)

      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
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
        req.body.pseudo;

      const password =
        String(
          req.body.password || ""
        );


      const user =
        findUser(pseudo);


      if (!user) {

        return res.status(404).json({
          message:
            "Utilisateur introuvable."
        });

      }


      const passwordHash =
        user.passwordHash ||
        user.password;


      const valid =
        await bcrypt.compare(
          password,
          passwordHash
        );


      if (!valid) {

        return res.status(401).json({
          message:
            "Mot de passe incorrect."
        });

      }


      database.users =
        database.users.filter(
          (item) =>
            item !== user
        );


      saveData();


      return res.json({
        message:
          "Compte supprimé."
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
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

    const pseudo =
      req.body.pseudo;


    const user =
      findUser(pseudo);


    /*
     * Version simple.
     * Un vrai système devrait envoyer
     * un email avec un token sécurisé.
     */

    if (!user) {

      return res.status(404).json({
        message:
          "Joueur introuvable."
      });

    }


    return res.json({
      message:
        "Demande enregistrée. Contacte l'administrateur pour récupérer ton compte."
    });

  }
);


/* =====================================
   SALONS
===================================== */

const rooms = new Map();


function generateRoomCode() {

  let code;

  do {

    code =
      Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();

  } while (
    rooms.has(code)
  );


  return code;

}


function getPublicRooms() {

  return Array.from(
    rooms.values()
  )
    .filter(
      (room) =>
        !room.started
    )
    .map(
      (room) => ({

        code:
          room.code,

        host:
          room.host,

        players:
          [...room.players]

      })
    );

}


function broadcastRooms() {

  io.emit(
    "roomsList",
    getPublicRooms()
  );

}


/* =====================================
   SOCKET.IO
===================================== */

io.on(
  "connection",
  (socket) => {

    console.log(
      "Client connecté :",
      socket.id
    );


    /* UTILISATEUR EN LIGNE */

    socket.on(
      "userOnline",
      ({ pseudo }) => {

        if (!pseudo) return;

        socket.data.pseudo =
          String(pseudo);

      }
    );


    /* UTILISATEUR HORS LIGNE */

    socket.on(
      "userOffline",
      () => {

        socket.data.pseudo =
          null;

      }
    );


    /* LISTE DES SALONS */

    socket.on(
      "getRooms",
      () => {

        socket.emit(
          "roomsList",
          getPublicRooms()
        );

      }
    );


    /* CRÉER UN SALON */

    socket.on(
      "createRoom",
      ({ pseudo }) => {

        if (!pseudo) {

          socket.emit(
            "roomError",
            "Pseudo invalide."
          );

          return;

        }


        const code =
          generateRoomCode();


        const room = {

          code,

          host:
            String(pseudo),

          players: [
            String(pseudo)
          ],

          started:
            false

        };


        rooms.set(
          code,
          room
        );


        socket.join(
          "room-" + code
        );


        socket.data.roomCode =
          code;


        socket.emit(
          "roomCreated",
          {
            code:
              room.code,

            host:
              room.host,

            players:
              [...room.players]
          }
        );


        broadcastRooms();

      }
    );


    /* REJOINDRE UN SALON */

    socket.on(
      "joinRoom",
      ({ code, pseudo }) => {

        const roomCode =
          String(
            code || ""
          )
            .trim()
            .toUpperCase();


        const room =
          rooms.get(
            roomCode
          );


        if (!room) {

          socket.emit(
            "roomError",
            "Salon introuvable."
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


        const playerPseudo =
          String(pseudo);


        if (
          !room.players.includes(
            playerPseudo
          )
        ) {

          room.players.push(
            playerPseudo
          );

        }


        socket.join(
          "room-" + roomCode
        );


        socket.data.roomCode =
          roomCode;


        const roomData = {

          code:
            room.code,

          host:
            room.host,

          players:
            [...room.players]

        };


        socket.emit(
          "joinedRoom",
          roomData
        );


        io.to(
          "room-" + roomCode
        ).emit(
          "roomUpdated",
          roomData
        );


        broadcastRooms();

      }
    );


    /* LANCER UNE PARTIE */

    socket.on(
      "startGame",
      ({ code, pseudo }) => {

        const roomCode =
          String(
            code || ""
          )
            .trim()
            .toUpperCase();


        const room =
          rooms.get(
            roomCode
          );


        if (!room) {

          socket.emit(
            "roomError",
            "Salon introuvable."
          );

          return;

        }


        if (
          room.host !==
          String(pseudo)
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


        room.started =
          true;


        io.to(
          "room-" + roomCode
        ).emit(
          "gameStarted",
          {

            code:
              room.code,

            players:
              [...room.players]

          }
        );


        broadcastRooms();

      }
    );


    /* DÉCONNEXION */

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Client déconnecté :",
          socket.id
        );

      }
    );

  }
);


/* =====================================
   DÉMARRER SERVEUR
===================================== */

server.listen(
  PORT,
  () => {

    console.log(
      "🐺 Loup-Garou V7 lancé sur :"
    );

    console.log(
      "http://localhost:" +
      PORT
    );

  }
);
