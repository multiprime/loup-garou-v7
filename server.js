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

  return {
    users: {}
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


/* =========================
   TROUVER UN UTILISATEUR
   Ignore les majuscules/minuscules
========================= */

function findUserByPseudo(pseudo) {
  const search = String(pseudo || "")
    .trim()
    .toLowerCase();

  return Object.values(database.users).find((user) => {
    return String(user.pseudo)
      .toLowerCase() === search;
  });
}


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
    level: user.level || 1,
    xp: user.xp || 0,
    coins: user.coins || 0,
    trophies: user.trophies || 0,
    icon: user.icon || "🐺",
    title: user.title || "Nouveau Villageois",
    classes: user.classes || [],
    equippedClass: user.equippedClass || null,
    friends: user.friends || []
  };
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

    if (findUserByPseudo(pseudo)) {
      return res.status(409).json({
        message: "Ce pseudo existe déjà."
      });
    }

    const emailExists = Object.values(
      database.users
    ).some((user) => {
      return user.email === email;
    });

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
      coins: 0,
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
      message: "Compte créé avec succès !",
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
        message: "Pseudo ou mot de passe incorrect."
      });
    }

    const correct =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!correct) {
      return res.status(401).json({
        message: "Pseudo ou mot de passe incorrect."
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
   ACHETER UNE CLASSE
========================= */

app.post("/api/classes/buy", (req, res) => {
  const pseudo = String(req.body.pseudo || "");
  const classId = String(req.body.classId || "");

  const user = findUserByPseudo(pseudo);

  const classe = CLASSES.find(
    (item) => item.id === classId
  );

  if (!user || !classe) {
    return res.status(400).json({
      message: "Utilisateur ou classe invalide."
    });
  }

  if (!user.classes) {
    user.classes = [];
  }

  if (user.classes.includes(classId)) {
    return res.status(400).json({
      message: "Tu possèdes déjà cette classe."
    });
  }

  if (user.coins < classe.price) {
    return res.status(400).json({
      message: "Tu n'as pas assez de pièces."
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


/* =========================
   ÉQUIPER UNE CLASSE
========================= */

app.post("/api/classes/equip", (req, res) => {
  const pseudo = String(req.body.pseudo || "");
  const classId = String(req.body.classId || "");

  const user = findUserByPseudo(pseudo);

  if (
    !user ||
    !user.classes ||
    !user.classes.includes(classId)
  ) {
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


/* =========================
   PROFIL JOUEUR
========================= */

app.get("/api/users/:pseudo", (req, res) => {
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
});


/* =========================
   AJOUTER UN AMI
========================= */

app.post("/api/friends/add", (req, res) => {
  const pseudo = String(
    req.body.pseudo || ""
  );

  const friendPseudo = String(
    req.body.friendPseudo || ""
  );

  const user = findUserByPseudo(pseudo);

  const friend = findUserByPseudo(
    friendPseudo
  );

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  if (!friend) {
    return res.status(404).json({
      message: "Joueur introuvable."
    });
  }

  if (
    user.pseudo.toLowerCase() ===
    friend.pseudo.toLowerCase()
  ) {
    return res.status(400).json({
      message: "Tu ne peux pas t'ajouter toi-même."
    });
  }

  if (!user.friends) {
    user.friends = [];
  }

  if (!friend.friends) {
    friend.friends = [];
  }

  if (!user.friends.includes(friend.pseudo)) {
    user.friends.push(friend.pseudo);
  }

  if (!friend.friends.includes(user.pseudo)) {
    friend.friends.push(user.pseudo);
  }

  saveData();

  res.json({
    message: friend.pseudo + " a été ajouté à tes amis !"
  });
});


/* =========================
   LISTE DES AMIS
========================= */

app.get("/api/friends/:pseudo", (req, res) => {
  const user = findUserByPseudo(
    req.params.pseudo
  );

  if (!user) {
    return res.status(404).json({
      message: "Utilisateur introuvable."
    });
  }

  if (!user.friends) {
    user.friends = [];
  }

  const friends = user.friends
    .map((friendPseudo) => {
      return findUserByPseudo(friendPseudo);
    })
    .filter(Boolean)
    .map(publicUser);

  res.json({
    friends
  });
});


/* =========================
   CLASSEMENT
========================= */

app.get("/api/ranking", (req, res) => {
  const users = Object.values(
    database.users
  )
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
      const pseudo = String(
        req.body.pseudo || ""
      );

      const email = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || ""
      );

      const user =
        findUserByPseudo(pseudo);

      if (!user) {
        return res.status(404).json({
          message: "Utilisateur introuvable."
        });
      }

      if (!email.includes("@")) {
        return res.status(400).json({
          message: "Adresse e-mail invalide."
        });
      }

      const correct =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!correct) {
        return res.status(401).json({
          message: "Mot de passe incorrect."
        });
      }

      const emailUsed = Object.values(
        database.users
      ).some(
        (otherUser) =>
          otherUser.email === email &&
          otherUser.pseudo !== user.pseudo
      );

      if (emailUsed) {
        return res.status(409).json({
          message:
            "Cette adresse e-mail est déjà utilisée."
        });
      }

      user.email = email;

      saveData();

      res.json({
        message: "Adresse e-mail modifiée !"
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
      const pseudo = String(
        req.body.pseudo || ""
      );

      const password = String(
        req.body.password || ""
      );

      const user =
        findUserByPseudo(pseudo);

      if (!user) {
        return res.status(404).json({
          message: "Utilisateur introuvable."
        });
      }

      const correct =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!correct) {
        return res.status(401).json({
          message: "Mot de passe incorrect."
        });
      }

      const realPseudo = user.pseudo;

      delete database.users[realPseudo];

      Object.values(database.users)
        .forEach((otherUser) => {
          if (otherUser.friends) {
            otherUser.friends =
              otherUser.friends.filter(
                (friendPseudo) =>
                  friendPseudo !== realPseudo
              );
          }
        });

      saveData();

      res.json({
        message: "Compte supprimé."
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
   MOT DE PASSE OUBLIÉ
========================= */

app.post(
  "/api/password/forgot",
  (req, res) => {
    const pseudo = String(
      req.body.pseudo || ""
    );

    const user =
      findUserByPseudo(pseudo);

    if (!user) {
      return res.status(404).json({
        message: "Joueur introuvable."
      });
    }

    /*
      Pour réellement envoyer un e-mail,
      il faudra ensuite configurer
      un service d'envoi d'e-mails.
    */

    res.json({
      message:
        "Demande de réinitialisation envoyée à l'adresse e-mail du compte."
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


  /* CRÉER UNE PARTIE */

  socket.on(
    "createRoom",
    ({ pseudo }) => {

      pseudo = String(
        pseudo || ""
      ).trim();

      const user =
        findUserByPseudo(pseudo);

      if (!user) {
        socket.emit(
          "roomError",
          "Utilisateur introuvable. Reconnecte-toi."
        );

        return;
      }

      const code =
        generateRoomCode();

      rooms[code] = {
        code,
        host: user.pseudo,
        players: [user.pseudo],
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


  /* REJOINDRE UNE PARTIE */

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

      const user =
        findUserByPseudo(pseudo);

      if (!user) {
        socket.emit(
          "roomError",
          "Utilisateur introuvable. Reconnecte-toi."
        );

        return;
      }

      if (
        !room.players.includes(
          user.pseudo
        )
      ) {
        room.players.push(
          user.pseudo
        );
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
        room.host.toLowerCase() !==
        pseudo.toLowerCase()
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

      console.log(
        "🐺 Partie démarrée :",
        code
      );

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

  socket.on(
    "getRooms",
    () => {

      const list =
        Object.values(rooms)
          .filter(
            (room) => !room.started
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

});


/* =========================
   TEST
========================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      message:
        "Loup-Garou V7 fonctionne !"
    });
  }
);


/* =========================
   LANCEMENT
========================= */

server.listen(PORT, () => {
  console.log(
    "🐺 Serveur démarré sur le port " +
    PORT
  );
});
