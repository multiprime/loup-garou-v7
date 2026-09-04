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
db.users.forEach(ensureUserState);

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
  { id:"play_1", title:"Premier hurlement", description:"Joue 1 partie.", target:1, stat:"gamesPlayed", xp:50, coins:25 },
  { id:"play_3", title:"Villageois actif", description:"Joue 3 parties.", target:3, stat:"gamesPlayed", xp:100, coins:50 },
  { id:"play_5", title:"Nuit agitée", description:"Joue 5 parties.", target:5, stat:"gamesPlayed", xp:150, coins:75 },
  { id:"play_10", title:"Chasseur de loups", description:"Joue 10 parties.", target:10, stat:"gamesPlayed", xp:300, coins:150 },
  { id:"play_25", title:"Habitué du village", description:"Joue 25 parties.", target:25, stat:"gamesPlayed", xp:600, coins:300 },
  { id:"play_50", title:"Maître du village", description:"Joue 50 parties.", target:50, stat:"gamesPlayed", xp:1200, coins:600 },
  { id:"win_1", title:"Première victoire", description:"Gagne 1 partie.", target:1, stat:"gamesWon", xp:100, coins:100 },
  { id:"win_3", title:"Héros du village", description:"Gagne 3 parties.", target:3, stat:"gamesWon", xp:250, coins:150 },
  { id:"win_10", title:"Légende", description:"Gagne 10 parties.", target:10, stat:"gamesWon", xp:1000, coins:500 },
  { id:"win_25", title:"Terreur du village", description:"Gagne 25 parties.", target:25, stat:"gamesWon", xp:2000, coins:1000 },
  { id:"social_1", title:"Bienvenue au village", description:"Ajoute 1 ami.", target:1, stat:"friendsAdded", xp:50, coins:25 },
  { id:"social_5", title:"Village soudé", description:"Aie 5 amis.", target:5, stat:"friendsCount", xp:150, coins:100 },
  { id:"ranked_1", title:"Premier combat classé", description:"Joue 1 partie classée.", target:1, stat:"rankedPlayed", xp:150, coins:75 },
  { id:"ranked_5", title:"Combattant classé", description:"Joue 5 parties classées.", target:5, stat:"rankedPlayed", xp:500, coins:250 },
  { id:"ranked_win_1", title:"Première victoire classée", description:"Gagne 1 partie classée.", target:1, stat:"rankedWon", xp:250, coins:150 },
  { id:"ranked_win_5", title:"Champion classé", description:"Gagne 5 parties classées.", target:5, stat:"rankedWon", xp:750, coins:400 },
  { id:"wolf_win_1", title:"Premier hurlement", description:"Gagne une partie dans le camp des Loups-Garous.", target:1, stat:"wolfWins", xp:200, coins:150 },
  { id:"special_1", title:"Pouvoir spécial", description:"Joue 1 partie avec un rôle spécial.", target:1, stat:"specialRoles", xp:100, coins:75 },
  { id:"special_5", title:"Maître des pouvoirs", description:"Joue 5 parties avec un rôle spécial.", target:5, stat:"specialRoles", xp:400, coins:250 },
  { id:"survive_1", title:"Dernier souffle", description:"Gagne 1 partie en étant vivant à la fin.", target:1, stat:"survivals", xp:250, coins:150 },
  { id:"trophy_100", title:"Premiers trophées", description:"Atteins 100 trophées.", target:100, stat:"trophies", xp:200, coins:150 },
  { id:"trophy_500", title:"Collectionneur", description:"Atteins 500 trophées.", target:500, stat:"trophies", xp:500, coins:350 },
  { id:"level_5", title:"Montée en puissance", description:"Atteins le niveau 5.", target:5, stat:"level", xp:300, coins:200 },
  { id:"level_10", title:"Vétéran", description:"Atteins le niveau 10.", target:10, stat:"level", xp:750, coins:500 }
];


/* =========================================
   QUÊTES LUNE DE SANG
========================================= */

const BLOOD_MOON_QUESTS = [
 {id:"bloodmoon_play",title:"Sous la Lune de Sang",description:"Participe à 1 partie pendant l'événement.",target:1,stat:"bloodPlayed",bloodMoonQuarters:1},
 {id:"bloodmoon_win",title:"Victoire sanglante",description:"Gagne 1 partie pendant l'événement.",target:1,stat:"bloodWon",bloodMoonQuarters:1},
 {id:"bloodmoon_ranked",title:"Chasseur écarlate",description:"Joue 1 partie classée pendant l'événement.",target:1,stat:"bloodRanked",bloodMoonQuarters:1},
 {id:"bloodmoon_five",title:"Nuit rouge",description:"Joue 5 parties pendant l'événement.",target:5,stat:"bloodPlayed",bloodMoonQuarters:1}
];


/* =========================================
   LUNE DE SANG
   Vendredi 07:00 -> 20:00
========================================= */

function getParisDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("fr-FR", { timeZone:"Europe/Paris", weekday:"short", hour:"2-digit", minute:"2-digit", hour12:false }).formatToParts(date);
  const get=(type)=>parts.find(p=>p.type===type)?.value||"";
  const weekdays={lun:1,mar:2,mer:3,jeu:4,ven:5,sam:6,dim:0};
  return {day:weekdays[get("weekday").toLowerCase().replace(".","")] ?? new Date(date).getDay(),hour:Number(get("hour")),minute:Number(get("minute"))};
}
function getBloodMoonWeekKey(date = new Date()) {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const y=Number(parts.find(p=>p.type==="year")?.value),m=Number(parts.find(p=>p.type==="month")?.value),d=Number(parts.find(p=>p.type==="day")?.value);
  const base=new Date(Date.UTC(y,m-1,d)); const day=base.getUTCDay(); base.setUTCDate(base.getUTCDate()-((day+2)%7)); return base.toISOString().slice(0,10);
}
const BLOOD_MOON_TITLES=["Loup écarlate","Sang de la nuit","Croissant maudit","Gardien de la lune","Hurlement rouge","Marcheur lunaire","Furie écarlate","Seigneur de la Lune"];
function getWeeklyBloodMoonTitle(weekKey){let n=0;for(const c of String(weekKey))n=(n*31+c.charCodeAt(0))>>>0;return BLOOD_MOON_TITLES[n%BLOOD_MOON_TITLES.length];}
function getBloodMoonStatus(){
  const now=new Date(),p=getParisDateParts(now);
  const active=p.day===5 && (p.hour>7 || (p.hour===7&&p.minute>=0)) && p.hour<20;
  let endsAt=null;
  if(active){
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
    const date=`${parts.find(x=>x.type==="year").value}-${parts.find(x=>x.type==="month").value}-${parts.find(x=>x.type==="day").value}`;
    const tzParts=new Intl.DateTimeFormat("en-US",{timeZone:"Europe/Paris",timeZoneName:"shortOffset",hour:"2-digit"}).formatToParts(new Date(`${date}T20:00:00Z`));
    const offsetText=tzParts.find(x=>x.type==="timeZoneName")?.value||"GMT+1";
    const match=offsetText.match(/GMT([+-])(\d+)(?::(\d+))?/);
    const offsetMinutes=match?(Number(match[2])*60+(Number(match[3]||0)))*(match[1]==="-"?-1:1):60;
    endsAt=Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7))-1,Number(date.slice(8,10)),20,0,0)-offsetMinutes*60000;
    if(Number.isNaN(endsAt))endsAt=Date.now()+((20-p.hour)*60-p.minute)*60000;
  }
  const weekKey=getBloodMoonWeekKey(now),progress=db.bloodMoonProgress?.[weekKey]||{};
  return {active,endsAt,weekKey,quarters:Math.min(4,Number(progress.quarters||0)),title:progress.title||getWeeklyBloodMoonTitle(weekKey)};
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

    action:
      notification.action ||
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

function rewardDescription(reward = {}) {
  const parts = [];
  const coins = Number(reward.coins || 0);
  const xp = Number(reward.xp || 0);
  const trophies = Number(reward.trophies || 0);
  if (coins > 0) parts.push(`${coins} pièce${coins > 1 ? "s" : ""} 🪙`);
  if (xp > 0) parts.push(`${xp} XP ✨`);
  if (trophies > 0) parts.push(`${trophies} trophée${trophies > 1 ? "s" : ""} 🏆`);
  if (reward.classId) {
    const classe = CLASSES.find(c => c.id === reward.classId);
    if (classe) parts.push(`la classe ${classe.name} 🐺`);
  }
  return parts.length ? parts.join(" + ") : "une récompense";
}

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
   PROGRESSION DES QUÊTES / SAISON
========================================= */
function ensureUserState(user) {
  if (!user) return;
  user.questStats = user.questStats || {};
  user.claimedQuests = user.claimedQuests || [];
  user.rankedSeason = user.rankedSeason || getRankedSeasonKey();
  if (user.rankedSeason !== getRankedSeasonKey()) resetRankedSeason(user);
  user.rankedPoints = Number(user.rankedPoints || 0);
  user.rankedWins = Number(user.rankedWins || 0);
  user.titles = Array.isArray(user.titles) ? user.titles : ["Nouveau Villageois"];
  user.equippedTitle = user.equippedTitle || user.titles[0];
  user.chatEnabled = user.chatEnabled !== false;
  user.chatAllowed = Array.isArray(user.chatAllowed) ? user.chatAllowed : [];
}
function getRankedSeasonKey(date=new Date()) {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit"}).formatToParts(date);
  return `${parts.find(x=>x.type==="year")?.value}-${parts.find(x=>x.type==="month")?.value}`;
}
function resetRankedSeason(user) {
  user.rankedSeason=getRankedSeasonKey(); user.rankedPoints=0; user.rankedWins=0; user.rankedRank="Bois";
}
function getRankedRank(points) {
  const p=Number(points||0);
  if(p>=2500)return "Admin"; if(p>=1800)return "Pro"; if(p>=1200)return "Chasseur"; if(p>=800)return "Diamant"; if(p>=450)return "Or"; if(p>=200)return "Bronze"; return "Bois";
}
function getFriendCount(user){ return db.friendships.filter(f=>normalizePseudo(f.user1)===normalizePseudo(user.pseudo)||normalizePseudo(f.user2)===normalizePseudo(user.pseudo)).length; }
function questStatValue(user, stat){
  ensureUserState(user);
  if(stat==="friendsCount") return getFriendCount(user);
  if(stat==="trophies") return Number(user.trophies||0);
  if(stat==="level") return Number(user.level||1);
  return Number(user.questStats[stat]||0);
}
function registerQuestStat(user, stat, amount=1){ ensureUserState(user); user.questStats[stat]=Number(user.questStats[stat]||0)+Number(amount||0); }
function questView(user, quest){
  const progress=Math.min(quest.target,questStatValue(user,quest.stat));
  return {...quest,progress,completed:progress>=quest.target,claimed:user.claimedQuests.includes(quest.id)};
}
function getQuestPayload(user){ return QUESTS.map(q=>questView(user,q)); }
function claimQuest(user, questId){
  ensureUserState(user); const q=QUESTS.find(x=>x.id===questId);
  if(!q) return {ok:false,message:"Quête introuvable."};
  const view=questView(user,q);
  if(!view.completed)return {ok:false,message:"Quête non terminée."};
  if(view.claimed)return {ok:false,message:"Quête déjà récupérée."};
  user.claimedQuests.push(q.id); applyReward(user,{coins:q.coins,xp:q.xp}); return {ok:true,quest:q,user:publicUser(user)};
}
function getBloodProgress(user, weekKey=getBloodMoonStatus().weekKey){
  db.bloodMoonProgress=db.bloodMoonProgress||{}; db.bloodMoonProgress[weekKey]=db.bloodMoonProgress[weekKey]||{}; const key=normalizePseudo(user?.pseudo||"guest");
  if(!db.bloodMoonProgress[weekKey][key])db.bloodMoonProgress[weekKey][key]={quarters:0,claimed:[],questClaims:[],stats:{},title:getWeeklyBloodMoonTitle(weekKey)};
  return db.bloodMoonProgress[weekKey][key];
}
function addBloodMoonQuarter(user){const st=getBloodMoonStatus();if(!st.active)return false;const p=getBloodProgress(user,st.weekKey);p.quarters=Math.min(4,Number(p.quarters||0)+1);return true;}

function bloodMoonPayload(user){const st=getBloodMoonStatus();const p=getBloodProgress(user,st.weekKey);const stats=p.stats||{};const quests=BLOOD_MOON_QUESTS.map(q=>({...q,progress:Math.min(q.target,Number(stats[q.stat]||0)),completed:Number(stats[q.stat]||0)>=q.target,claimed:(p.questClaims||[]).includes(q.id)}));return {event:st,quarters:Number(p.quarters||0),claimed:p.claimed||[],title:p.title||st.title,quests,milestones:[{quarter:1,reward:{coins:100}},{quarter:2,reward:{xp:200}},{quarter:3,reward:{xp:500}},{quarter:4,reward:{title:p.title||st.title}}]};}
function registerBloodQuest(user,stat,amount=1){const st=getBloodMoonStatus();if(!st.active)return;const p=getBloodProgress(user,st.weekKey);p.stats=p.stats||{};p.stats[stat]=Number(p.stats[stat]||0)+Number(amount||0);}

function filterChatText(text){
  const bad=["idiot","idiote","imbecile","imbécile","connard","connasse","conne","con","pute","putain","salope","salaud","nique","niquer","fdp","fils de pute","merde","encule","enculé","batard","bâtard","batarde","bâtarde","abruti","abrutie","crétin","cretin","bouffon","enfoire","enfoiré","tg"];
  let out=String(text||"").trim().slice(0,500); const lower=out.toLowerCase();
  for(const word of bad) out=out.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"),"•••");
  return out;
}
function areFriends(a,b){return db.friendships.some(f=>(normalizePseudo(f.user1)===normalizePseudo(a)&&normalizePseudo(f.user2)===normalizePseudo(b))||(normalizePseudo(f.user2)===normalizePseudo(a)&&normalizePseudo(f.user1)===normalizePseudo(b)));}
function emitProfile(user){ const sid=onlineUsers.get(normalizePseudo(user.pseudo)); if(sid)io.to(sid).emit("profileUpdated",publicUser(user)); }

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

    players: room.players.map((p)=>({pseudo:p.pseudo,isBot:Boolean(p.isBot)})),

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

function getEquippedClass(player) {
  if (!player || player.isBot) return null;

  const user = findUser(player.pseudo);
  if (!user) return null;

  return (
    CLASSES.find(
      (classe) => classe.id === user.equippedClass
    ) || CLASSES[0]
  );
}

function classCanGrantRole(classId, role) {
  const exact = {
    wolf1: ["Loup-Garou"],
    wolf2: ["Loup-Garou"],
    seer1: ["Voyante"],
    witch1: ["Sorcière"],
    hunter1: ["Chasseur"]
  };

  return Boolean(exact[classId]?.includes(role));
}

function choosePlayerForRole(players, role, used) {
  const candidates = players.filter((player) => !used.has(player.pseudo));
  if (!candidates.length) return null;

  // La chance de la classe est une vraie probabilité serveur.
  // Une classe correspondant au rôle reçoit en plus une préférence forte.
  const eligible = candidates.filter((player) => {
    const classe = getEquippedClass(player) || { chance: 0 };
    const chance = Math.max(0, Math.min(100, Number(classe.chance || 0)));
    return Math.random() * 100 < chance;
  });

  const pool = eligible.length ? eligible : candidates;
  const preferred = pool.filter((player) => {
    const classe = getEquippedClass(player);
    return classe && classCanGrantRole(classe.id, role);
  });

  const finalPool = preferred.length ? preferred : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function createGame(room) {
  const players = shuffle(room.players);
  const roles = [
    "Loup-Garou",
    "Loup-Garou",
    "Voyante",
    "Sorcière",
    "Chasseur"
  ];

  const assignments = new Map();
  const used = new Set();

  // On attribue d'abord les rôles spéciaux.
  roles.forEach((role) => {
    const player = choosePlayerForRole(players, role, used);
    if (player) {
      assignments.set(player.pseudo, role);
      used.add(player.pseudo);
    }
  });

  const gamePlayers = players.map((player) => ({
    pseudo: player.pseudo,
    isBot: Boolean(player.isBot),
    alive: true,
    role: assignments.get(player.pseudo) || "Villageois",
    classChance: getEquippedClass(player)?.chance || 0
  }));

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
  const game=room.game; if(!game || game.phase==="finished") return;
  game.phase="finished"; const blood=getBloodMoonStatus();
  game.players.forEach(player=>{
    if(player.isBot)return; const user=findUser(player.pseudo); if(!user)return; ensureUserState(user);
    const isWolf=player.role==="Loup-Garou";
    if(blood.active){registerBloodQuest(user,"bloodPlayed",1);if(game.ranked)registerBloodQuest(user,"bloodRanked",1);}
    const won=(game.winner==="Loups-Garous"&&isWolf)||(game.winner==="Villageois"&&!isWolf);
    let xp=50+(won?100:0), coins=25+(won?50:0), trophies=game.ranked?(won?30:-10):0;
    if(blood.active){xp*=2;coins*=2;trophies*=2;}
    user.boosts=user.boosts||{}; if(user.boosts.double_coins>0){coins*=2;user.boosts.double_coins--;} if(user.boosts.double_xp>0){xp*=2;user.boosts.double_xp--;}
    applyReward(user,{xp,coins,trophies});
    user.gamesPlayed=Number(user.gamesPlayed||0)+1; registerQuestStat(user,"gamesPlayed",1);
    if(won){user.gamesWon=Number(user.gamesWon||0)+1;registerQuestStat(user,"gamesWon",1);if(blood.active)registerBloodQuest(user,"bloodWon",1);}
    if(game.ranked){registerQuestStat(user,"rankedPlayed",1);if(won){registerQuestStat(user,"rankedWon",1);user.rankedWins++;user.rankedPoints+=30;}else{user.rankedPoints=Math.max(0,user.rankedPoints-10);}user.rankedRank=getRankedRank(user.rankedPoints);}
    if(isWolf&&won)registerQuestStat(user,"wolfWins",1);
    if(player.role!=="Villageois")registerQuestStat(user,"specialRoles",1);
    if(won&&player.alive)registerQuestStat(user,"survivals",1);
    emitProfile(user);
  });
  saveDatabase();
  io.to(room.code).emit("gameFinished",{winner:game.winner,players:game.players.map(p=>({pseudo:p.pseudo,alive:p.alive,isBot:p.isBot,role:p.isBot?undefined:p.role}))});
  room.status="finished";
  setTimeout(()=>{ const r=findRoom(room.code); if(r&&r.status==="finished"){db.rooms=db.rooms.filter(x=>x.code!==r.code);saveDatabase();io.emit("roomsList",db.rooms.filter(x=>x.status==="waiting").map(roomPublic));}},30000);
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
          Date.now(),

        questStats: {},
        claimedQuests: [],
        rankedSeason: getRankedSeasonKey(),
        rankedPoints: 0,
        rankedWins: 0,
        rankedRank: "Bois",
        chatEnabled: true
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

app.get("/api/quests", (req,res)=>{
  const user=findUser(req.query.pseudo || "");
  if(!user) return res.status(404).json({message:"Utilisateur introuvable."});
  ensureUserState(user); saveDatabase();
  res.json({quests:getQuestPayload(user)});
});
app.post("/api/quests/claim", (req,res)=>{
  const user=findUser(req.body.pseudo); if(!user)return res.status(404).json({message:"Utilisateur introuvable."});
  const result=claimQuest(user,req.body.questId); if(!result.ok)return res.status(400).json({message:result.message});
  saveDatabase(); emitProfile(user); addNotification(user.pseudo,{title:"📜 Quête terminée",message:`${result.quest.title} : récompense récupérée !`,type:"quest"});
  res.json({message:"Récompense récupérée !",user:publicUser(user),quest:result.quest});
});

app.get("/api/blood-moon",(req,res)=>{
  const user=findUser(req.query.pseudo||""); res.json({event:getBloodMoonStatus(),quests:BLOOD_MOON_QUESTS,progress:user?bloodMoonPayload(user):bloodMoonPayload({})});
});
app.post("/api/blood-moon/quest-claim",(req,res)=>{const user=findUser(req.body.pseudo),st=getBloodMoonStatus();if(!user||!st.active)return res.status(400).json({message:"Événement indisponible."});const p=getBloodProgress(user,st.weekKey);p.questClaims=p.questClaims||[];const q=BLOOD_MOON_QUESTS.find(x=>x.id===req.body.questId);if(!q)return res.status(404).json({message:"Quête introuvable."});if(p.questClaims.includes(q.id))return res.status(400).json({message:"Quête déjà récupérée."});if(Number(p.stats?.[q.stat]||0)<q.target)return res.status(400).json({message:"Quête non terminée."});p.questClaims.push(q.id);addBloodMoonQuarter(user);saveDatabase();emitProfile(user);res.json({message:"Quart de Lune de Sang gagné !",user:publicUser(user),progress:bloodMoonPayload(user)});});
app.post("/api/blood-moon/claim",(req,res)=>{
  const user=findUser(req.body.pseudo); const st=getBloodMoonStatus(); if(!user)return res.status(404).json({message:"Utilisateur introuvable."});
  if(!st.active)return res.status(400).json({message:"La Lune de Sang est terminée."});
  const p=getBloodProgress(user,st.weekKey); const q=Number(req.body.quarter); if(![1,2,3,4].includes(q))return res.status(400).json({message:"Quart invalide."});
  if(Number(p.quarters||0)<q)return res.status(400).json({message:"Ce palier n'est pas encore atteint."}); p.claimed=p.claimed||[]; if(p.claimed.includes(q))return res.status(400).json({message:"Palier déjà récupéré."});
  const rewards={1:{coins:100},2:{xp:200},3:{xp:500},4:{title:p.title||getWeeklyBloodMoonTitle(st.weekKey)}}; const reward=rewards[q]; if(q<4)applyReward(user,reward); else {user.titles=user.titles||["Nouveau Villageois"]; if(!user.titles.includes(reward.title))user.titles.push(reward.title);} p.claimed.push(q); saveDatabase(); emitProfile(user); res.json({message:"Récompense Lune de Sang récupérée !",user:publicUser(user),progress:bloodMoonPayload(user)});
});


/* =========================================
   API : CLASSEMENT
========================================= */

app.get("/api/ranking",(req,res)=>{const ranked=req.query.mode==="ranked";db.users.forEach(ensureUserState);const users=db.users.map(u=>{const x=publicUser(u);x.rankedPoints=Number(u.rankedPoints||0);x.rankedRank=getRankedRank(u.rankedPoints);return x;}).sort((a,b)=>ranked?b.rankedPoints-a.rankedPoints:Number(b.trophies||0)-Number(a.trophies||0));res.json({mode:ranked?"ranked":"normal",season:getRankedSeasonKey(),users});});


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

    addNotification(user.pseudo,{title:"🎁 Récompense du créateur",message:`Le créateur du jeu vous a offert ${rewardDescription(reward)}. Appuie sur Récupérer.`,type:"creator",reward});
    saveDatabase();

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

        addNotification(user.pseudo,{title:"🎁 Récompense du créateur",message:`Le créateur du jeu vous a offert ${rewardDescription(reward)}. Appuie sur Récupérer.`,type:"creator",reward});

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


app.get("/api/admin/bootstrap",(req,res)=>{
  if(normalizePseudo(req.query.adminPseudo)!==ADMIN_PSEUDO)return res.status(403).json({message:"Accès refusé."});
  res.json({users:db.users.map(publicUser),classes:CLASSES,announcement:db.announcements});
});

app.post("/api/admin/reward-all-now",(req,res)=>{
  if(normalizePseudo(req.body.adminPseudo)!==ADMIN_PSEUDO)return res.status(403).json({message:"Accès refusé."});
  const reward={coins:Math.max(0,Number(req.body.coins||0)),xp:Math.max(0,Number(req.body.xp||0)),trophies:Number(req.body.trophies||0),classId:req.body.classId||""};
  if(reward.classId&&!CLASSES.some(c=>c.id===reward.classId))return res.status(400).json({message:"Classe invalide."});
  let count=0; db.users.forEach(u=>{if(req.body.onlineOnly&&!isUserOnline(u.pseudo))return;addNotification(u.pseudo,{title:"🎁 Récompense du créateur",message:`Le créateur du jeu vous a offert ${rewardDescription(reward)}. Appuie sur Récupérer.`,type:"creator",reward});count++;}); saveDatabase(); res.json({message:`Récompense envoyée à ${count} joueur(s).`});
});


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

        type:"friendRequest",
        action:{requestId:request.id,fromPseudo:request.fromPseudo}
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
        user1: request.fromPseudo,
        user2: request.toPseudo,
        createdAt: Date.now()
      });
      const acceptedFrom=findUser(request.fromPseudo), acceptedTo=findUser(request.toPseudo);
      if(acceptedFrom)registerQuestStat(acceptedFrom,"friendsAdded",1);
      if(acceptedTo)registerQuestStat(acceptedTo,"friendsAdded",1);
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


app.get("/api/chat/status/:pseudo/:friendPseudo",(req,res)=>{
  const a=findUser(req.params.pseudo),b=findUser(req.params.friendPseudo); if(!a||!b)return res.status(404).json({message:"Utilisateur introuvable."});
  const allowed=areFriends(a.pseudo,b.pseudo)&&a.chatEnabled!==false&&b.chatEnabled!==false; const pending=db.friendRequests.some(r=>r.type==="chat"&&normalizePseudo(r.fromPseudo)===normalizePseudo(a.pseudo)&&normalizePseudo(r.toPseudo)===normalizePseudo(b.pseudo)); res.json({allowed,pending});
});
app.post("/api/chat/request",(req,res)=>{const from=findUser(req.body.fromPseudo),to=findUser(req.body.toPseudo);if(!from||!to)return res.status(404).json({message:"Utilisateur introuvable."});if(!areFriends(from.pseudo,to.pseudo))return res.status(403).json({message:"Vous devez être amis."});if(from.chatEnabled===false||to.chatEnabled===false)return res.status(403).json({message:"Le chat est désactivé."});if(db.friendRequests.some(r=>r.type==="chat"&&normalizePseudo(r.fromPseudo)===normalizePseudo(from.pseudo)&&normalizePseudo(r.toPseudo)===normalizePseudo(to.pseudo)))return res.status(400).json({message:"Demande déjà envoyée."});const r={id:createId(),fromPseudo:from.pseudo,toPseudo:to.pseudo,type:"chat",createdAt:Date.now()};db.friendRequests.push(r);addNotification(to.pseudo,{title:"💬 Demande de chat",message:`${from.pseudo} souhaite discuter avec toi.`,type:"chatRequest",requestId:r.id});saveDatabase();res.json({message:"Demande de chat envoyée."});});
app.post("/api/chat/respond",(req,res)=>{const r=db.friendRequests.find(x=>x.id===req.body.requestId&&x.type==="chat"&&normalizePseudo(x.toPseudo)===normalizePseudo(req.body.pseudo));if(!r)return res.status(404).json({message:"Demande introuvable."});db.friendRequests=db.friendRequests.filter(x=>x.id!==r.id);if(req.body.accept){const from=findUser(r.fromPseudo),to=findUser(r.toPseudo);from.chatAllowed=from.chatAllowed||[];to.chatAllowed=to.chatAllowed||[];if(!from.chatAllowed.includes(normalizePseudo(to.pseudo)))from.chatAllowed.push(normalizePseudo(to.pseudo));if(!to.chatAllowed.includes(normalizePseudo(from.pseudo)))to.chatAllowed.push(normalizePseudo(from.pseudo));addNotification(r.fromPseudo,{title:"💬 Chat accepté",message:`${r.toPseudo} a accepté ta demande de chat.`,type:"info"});}saveDatabase();res.json({message:req.body.accept?"Chat accepté !":"Chat refusé."});});
app.post("/api/chat/send-safe",(req,res)=>{const from=findUser(req.body.fromPseudo),to=findUser(req.body.toPseudo);if(!from||!to||!areFriends(from.pseudo,to.pseudo))return res.status(403).json({message:"Le chat est réservé aux amis."});if(from.chatEnabled===false||to.chatEnabled===false)return res.status(403).json({message:"Le chat est désactivé."});const allowed=db.friendRequests.some(r=>r.type==="chat"&&normalizePseudo(r.fromPseudo)===normalizePseudo(from.pseudo)&&normalizePseudo(r.toPseudo)===normalizePseudo(to.pseudo))||db.friendRequests.some(r=>r.type==="chat"&&normalizePseudo(r.fromPseudo)===normalizePseudo(to.pseudo)&&normalizePseudo(r.toPseudo)===normalizePseudo(from.pseudo))||from.chatAllowed?.includes(normalizePseudo(to.pseudo))||to.chatAllowed?.includes(normalizePseudo(from.pseudo)); if(!allowed)return res.status(403).json({message:"Vous devez accepter la demande de chat."});const msg={id:createId(),from:from.pseudo,to:to.pseudo,text:filterChatText(req.body.text),createdAt:Date.now()};db.messages.push(msg);saveDatabase();const sid=onlineUsers.get(normalizePseudo(to.pseudo));if(sid)io.to(sid).emit("chatMessage",msg);res.json({message:msg});});
app.post("/api/settings/chat",(req,res)=>{const u=findUser(req.body.pseudo);if(!u)return res.status(404).json({message:"Utilisateur introuvable."});u.chatEnabled=req.body.chatEnabled!==false;saveDatabase();res.json({message:"Paramètre du chat enregistré.",user:publicUser(u)});});

const SHOP_ITEMS=[{id:"double_coins",name:"x2 pièces",price:200,description:"Double les pièces de ta prochaine partie."},{id:"double_xp",name:"x2 XP",price:200,description:"Double l'XP de ta prochaine partie."}];
app.get("/api/shop",(req,res)=>{const st=getBloodMoonStatus();const items=[...SHOP_ITEMS];if(st.active)items.push({id:"blood_quarter",name:"Quart de Lune de Sang",price:500,description:"Ajoute un quart à ta progression de Lune de Sang."});res.json({items});});
app.post("/api/shop/buy",(req,res)=>{const u=findUser(req.body.pseudo);if(!u)return res.status(404).json({message:"Utilisateur introuvable."});const st=getBloodMoonStatus();const id=req.body.itemId;const item=[...SHOP_ITEMS,...(st.active?[{id:"blood_quarter",name:"Quart de Lune de Sang",price:500}]:[])].find(x=>x.id===id);if(!item)return res.status(404).json({message:"Article indisponible."});if(Number(u.coins||0)<item.price)return res.status(400).json({message:"Pas assez de pièces."});u.coins-=item.price;u.boosts=u.boosts||{};if(id==="blood_quarter"){addBloodMoonQuarter(u);}else{u.boosts[id]=Number(u.boosts[id]||0)+1;}saveDatabase();emitProfile(u);res.json({message:"Achat effectué !",user:publicUser(u)});});

app.post("/api/titles/equip",(req,res)=>{const u=findUser(req.body.pseudo);if(!u||!(u.titles||[]).includes(req.body.title))return res.status(400).json({message:"Titre indisponible."});u.equippedTitle=req.body.title;u.title=req.body.title;saveDatabase();res.json({message:"Titre équipé !",user:publicUser(u)});});


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


function emitGameStart(room) {
  io.to(room.code).emit(
    "gameStarted",
    {
      room: roomPublic(room),
      phase: room.game.phase,
      day: room.game.day,
      players: room.game.players.map((player) => ({
        pseudo: player.pseudo,
        alive: player.alive,
        isBot: player.isBot
      }))
    }
  );

  room.game.players.forEach((player) => {
    if (player.isBot) return;

    const playerSocket = onlineUsers.get(
      normalizePseudo(player.pseudo)
    );

    if (playerSocket) {
      io.to(playerSocket).emit("yourRole", {
        role: player.role,
        classChance: player.classChance,
        teammates: player.role === "Loup-Garou"
          ? game.players.filter(x => x.role === "Loup-Garou" && x.pseudo !== player.pseudo).map(x => x.pseudo)
          : []
      });
    }
  });
}

function launchRoomGame(room) {
  if (!room || room.status !== "waiting") return false;
  if(room.startingAt && Date.now()-room.startingAt<9000)return false;
  room.startingAt=null;
  addBotsToRoom(room);
  room.status = "playing";
  room.game = createGame(room);
  saveDatabase();
  emitGameStart(room);
  setTimeout(()=>startNightPhase(room),250);
  return true;
}

function randomAliveTarget(game, filterFn) {
  const list=getAlivePlayers(game).filter(filterFn||(()=>true)); return list.length?list[Math.floor(Math.random()*list.length)]:null;
}
function emitPublicGameState(room,event="gameState"){const g=room.game;if(!g)return;io.to(room.code).emit(event,{phase:g.phase,day:g.day,winner:g.winner,players:g.players.map(p=>({pseudo:p.pseudo,alive:p.alive,isBot:p.isBot})),ranked:g.ranked});}
function startNightPhase(room){const g=room.game;if(!g||g.phase==="finished")return;g.phase="night";g.nightVotes={};g.nightActions=g.nightActions||{saved:null,witchKill:null,witchUsed:false};emitPublicGameState(room,"nightStarted");
  const wolves=g.players.filter(p=>p.alive&&p.role==="Loup-Garou"); wolves.filter(p=>p.isBot).forEach((bot,i)=>setTimeout(()=>{if(room.game?.phase!=="night")return;const target=randomAliveTarget(g,p=>p.role!=="Loup-Garou");if(target)g.nightVotes[bot.pseudo]=target.pseudo;tryResolveNight(room);},800+i*350));
  setTimeout(()=>{if(room.game?.phase==="night"){wolves.forEach(w=>{if(!g.nightVotes[w.pseudo]){const t=randomAliveTarget(g,p=>p.role!=="Loup-Garou");if(t)g.nightVotes[w.pseudo]=t.pseudo;}});tryResolveNight(room);}},15000);
}
function tryResolveNight(room){const g=room.game;if(!g||g.phase!=="night")return;const wolves=g.players.filter(p=>p.alive&&p.role==="Loup-Garou");if(wolves.some(w=>!g.nightVotes[w.pseudo]))return;const counts={};Object.values(g.nightVotes).forEach(t=>counts[t]=(counts[t]||0)+1);const victimPseudo=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];let victim=g.players.find(p=>p.pseudo===victimPseudo);
  if(g.nightActions?.saved===victimPseudo)victim=null; else if(victim)victim.alive=false;
  const witchKill=g.nightActions?.witchKill;if(witchKill){const v=g.players.find(p=>p.pseudo===witchKill&&p.alive);if(v)v.alive=false;}
  g.nightVotes={};g.nightActions={saved:null,witchKill:null,witchUsed:Boolean(g.nightActions?.witchUsed)};
  if(victim && victim.role==="Chasseur")return hunterDeathFlow(room,victim,()=>{if(!checkGameWinner(g)){g.phase="day";startDayPhase(room,victim.pseudo);}});
  if(checkGameWinner(g)){finishGame(room);return;}g.phase="day";startDayPhase(room,victim?victim.pseudo:null);
}
function startDayPhase(room,victimPseudo){const g=room.game;if(!g||g.phase==="finished")return;g.dayVotes={};emitPublicGameState(room,"dayStarted");io.to(room.code).emit("dayStarted",{victim:victimPseudo,players:g.players.map(p=>({pseudo:p.pseudo,alive:p.alive,isBot:p.isBot}))});
  const alive=g.players.filter(p=>p.alive);alive.filter(p=>p.isBot).forEach((bot,i)=>setTimeout(()=>{if(room.game?.phase!=="day")return;const t=randomAliveTarget(g,p=>p.pseudo!==bot.pseudo);if(t)g.dayVotes[bot.pseudo]=t.pseudo;tryResolveDay(room);},700+i*250));
  setTimeout(()=>{if(room.game?.phase!=="day")return;g.players.filter(p=>p.alive).forEach(p=>{if(!g.dayVotes[p.pseudo]){const t=randomAliveTarget(g,x=>x.pseudo!==p.pseudo);if(t)g.dayVotes[p.pseudo]=t.pseudo;}});tryResolveDay(room);},15000);
}
function tryResolveDay(room){const g=room.game;if(!g||g.phase!=="day")return;const alive=g.players.filter(p=>p.alive);if(alive.some(p=>!g.dayVotes[p.pseudo]))return;const counts={};Object.values(g.dayVotes).forEach(t=>counts[t]=(counts[t]||0)+1);const targetPseudo=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];const eliminated=g.players.find(p=>p.pseudo===targetPseudo);if(eliminated)eliminated.alive=false;g.dayVotes={};if(eliminated&&eliminated.role==="Chasseur")return hunterDeathFlow(room,eliminated,()=>{if(!checkGameWinner(g)){g.day++;g.phase="night";startNightPhase(room);}});if(checkGameWinner(g)){finishGame(room);return;}g.day++;startNightPhase(room);}
function hunterDeathFlow(room,hunter,done){io.to(room.code).emit("hunterActionRequired",{hunter:hunter.pseudo,targets:room.game.players.filter(p=>p.alive&&p.pseudo!==hunter.pseudo).map(p=>p.pseudo)});setTimeout(()=>{if(room.game?.phase==="finished")return;const alive=room.game.players.filter(p=>p.alive&&p.pseudo!==hunter.pseudo);if(!alive.length)return done();const target=alive[Math.floor(Math.random()*alive.length)];target.alive=false;io.to(room.code).emit("hunterShot",{hunter:hunter.pseudo,target:target.pseudo});done();},10000);}
function handleRoleAction(room,data){const g=room.game;if(!g||g.phase!=="night")return;const p=g.players.find(x=>normalizePseudo(x.pseudo)===normalizePseudo(data.pseudo));if(!p||!p.alive)return;const target=g.players.find(x=>x.pseudo===data.targetPseudo);
  if(p.role==="Voyante"&&data.action==="inspect"&&target){const sid=onlineUsers.get(normalizePseudo(p.pseudo));if(sid)io.to(sid).emit("seerResult",{target:target.pseudo,role:target.role});return;}
  if(p.role==="Sorcière"&&data.action==="save"&&target&&target.alive){g.nightActions=g.nightActions||{};if(!g.nightActions.witchUsed){g.nightActions.saved=target.pseudo;g.nightActions.witchUsed=true;io.to(room.code).emit("roleActionResult",{message:"La Sorcière a utilisé sa potion de vie."});}}
  if(p.role==="Sorcière"&&data.action==="kill"&&target){g.nightActions=g.nightActions||{};if(!g.nightActions.witchUsed){g.nightActions.witchKill=target.pseudo;g.nightActions.witchUsed=true;io.to(room.code).emit("roleActionResult",{message:"La Sorcière a utilisé sa potion de mort."});}}
}

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

    socket.on("inviteFriendToRoom",(data)=>{
      const room=findRoom(data?.code), fromPseudo=cleanPseudo(data?.fromPseudo), toPseudo=cleanPseudo(data?.toPseudo);
      if(!room)return socket.emit("roomError","Salon introuvable.");
      if(room.status!=="waiting")return socket.emit("roomError","Le salon a déjà commencé.");
      if(!room.players.some(p=>normalizePseudo(p.pseudo)===normalizePseudo(fromPseudo)))return socket.emit("roomError","Tu dois être dans le salon.");
      if(!areFriends(fromPseudo,toPseudo))return socket.emit("roomError","Tu dois être ami avec ce joueur.");
      if(room.players.length>=8)return socket.emit("roomError","Le salon est complet.");
      const target=findUser(toPseudo); if(!target)return socket.emit("roomError","Joueur introuvable.");
      const request={id:createId(),fromPseudo,toPseudo:target.pseudo,type:"roomInvite",roomCode:room.code,createdAt:Date.now()}; db.friendRequests.push(request);
      addNotification(target.pseudo,{title:"🎮 Invitation de salon",message:`${fromPseudo} t'invite dans le salon ${room.code}.`,type:"roomInvite",action:{requestId:request.id,code:room.code,fromPseudo}}); saveDatabase();
    });

    socket.on("respondRoomInvite",(data)=>{
      const request=db.friendRequests.find(r=>r.id===data?.requestId&&r.type==="roomInvite"&&normalizePseudo(r.toPseudo)===normalizePseudo(data?.pseudo));
      if(!request)return socket.emit("roomError","Invitation introuvable.");
      db.friendRequests=db.friendRequests.filter(r=>r.id!==request.id);
      if(!data.accept){saveDatabase();return socket.emit("roomInviteResult",{accepted:false,message:"Invitation refusée."});}
      const room=findRoom(request.roomCode), user=findUser(data.pseudo);
      if(!room||room.status!=="waiting")return socket.emit("roomError","Le salon n'est plus disponible.");
      if(room.players.length>=8)return socket.emit("roomError","Le salon est complet.");
      // Quitter les autres salons avant d'entrer dans celui-ci.
      db.rooms.forEach(r=>{if(r.code!==room.code)r.players=r.players.filter(p=>normalizePseudo(p.pseudo)!==normalizePseudo(user.pseudo));});
      if(!room.players.some(p=>normalizePseudo(p.pseudo)===normalizePseudo(user.pseudo)))room.players.push({pseudo:user.pseudo,isBot:false,socketId:socket.id});
      const targetRoom=room;
      socket.join(targetRoom.code); saveDatabase(); socket.emit("joinedRoom",roomPublic(targetRoom)); io.to(targetRoom.code).emit("roomUpdated",roomPublic(targetRoom));
      addNotification(request.fromPseudo,{title:"🎮 Invitation acceptée",message:`${user.pseudo} a rejoint ton salon.`,type:"info"});
    });


    /* =====================================
       RECHERCHE DE JOUEURS
    ===================================== */

    socket.on(
      "searchPlayers",
      (data) => {
        const room = findRoom(data?.code);
        const pseudo = cleanPseudo(data?.pseudo);

        if (!room) {
          socket.emit("roomError", "Salon introuvable.");
          return;
        }

        if (normalizePseudo(room.host) !== normalizePseudo(pseudo)) {
          socket.emit("roomError", "Seul le créateur peut lancer la recherche.");
          return;
        }

        if (room.status !== "waiting") {
          socket.emit("roomError", "La partie est déjà lancée.");
          return;
        }

        if(room.startingAt)return; room.startingAt=Date.now(); saveDatabase();
        io.to(room.code).emit("playerSearchStarted", { duration: 10000 });
        setTimeout(() => { if(room.status!=="waiting")return; launchRoomGame(room); },10000);
      }
    );

    /* =====================================
       LANCER AVEC D'AUTRES JOUEURS
    ===================================== */

    socket.on(
      "startGame",
      (data) => {
        const room = findRoom(data?.code);
        const pseudo = cleanPseudo(data?.pseudo);

        if (!room) {
          socket.emit("roomError", "Salon introuvable.");
          return;
        }

        if (normalizePseudo(room.host) !== normalizePseudo(pseudo)) {
          socket.emit("roomError", "Seul le créateur peut lancer la partie.");
          return;
        }

        if (room.status !== "waiting") {
          socket.emit("roomError", "La partie est déjà lancée.");
          return;
        }

        // Recherche de joueurs pendant 10 secondes, puis bots si nécessaire.
        if(room.startingAt)return; room.startingAt=Date.now(); saveDatabase();
        io.to(room.code).emit("playerSearchStarted", { duration: 10000 });
        setTimeout(() => { if(room.status!=="waiting")return; launchRoomGame(room); },10000);
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

        if(room.status!=="waiting")return socket.emit("roomError","La partie est déjà lancée.");
        if(room.startingAt)return; room.startingAt=Date.now(); saveDatabase();
        io.to(room.code).emit("botLoadingStarted",{duration:10000});
        setTimeout(()=>{if(room.status!=="waiting")return;launchRoomGame(room);},10000);
      }
    );


    /* =====================================
       ACTIONS DE PARTIE
    ===================================== */
    socket.on("nightVote",(data)=>{const room=findRoom(data?.code);if(!room?.game||room.game.phase!=="night")return;const g=room.game,v=g.players.find(p=>normalizePseudo(p.pseudo)===normalizePseudo(data?.pseudo)),t=g.players.find(p=>p.pseudo===data?.targetPseudo);if(!v||!t||!v.alive||!t.alive||v.role!=="Loup-Garou")return;g.nightVotes[v.pseudo]=t.pseudo;tryResolveNight(room);saveDatabase();});
    socket.on("roleAction",(data)=>{const room=findRoom(data?.code);if(!room)return;handleRoleAction(room,data);saveDatabase();});
    socket.on("hunterAction",(data)=>{const room=findRoom(data?.code);const g=room?.game;if(!g)return;const hunter=g.players.find(p=>p.pseudo===data?.pseudo&&p.role==="Chasseur"&&!p.alive);const target=g.players.find(p=>p.pseudo===data?.targetPseudo&&p.alive);if(!hunter||!target)return;target.alive=false;io.to(room.code).emit("hunterShot",{hunter:hunter.pseudo,target:target.pseudo});if(checkGameWinner(g))finishGame(room);else if(g.phase==="day"){g.day++;startNightPhase(room);}else startDayPhase(room,null);});
    socket.on("dayVote",(data)=>{const room=findRoom(data?.code);if(!room?.game||room.game.phase!=="day")return;const g=room.game,v=g.players.find(p=>normalizePseudo(p.pseudo)===normalizePseudo(data?.pseudo)),t=g.players.find(p=>p.pseudo===data?.targetPseudo);if(!v||!t||!v.alive||!t.alive)return;g.dayVotes[v.pseudo]=t.pseudo;tryResolveDay(room);saveDatabase();});

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
