import { seedData } from "@/data/seedData";

const DB_KEY = "pizzapolis_local_db";
const USER_KEY = "pizzapolis_current_user";

const clone = (v) => JSON.parse(JSON.stringify(v));
const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));
const uid = (prefix = "id") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function bootstrap() {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) localStorage.setItem(DB_KEY, JSON.stringify(seedData));
  const existingUser = localStorage.getItem(USER_KEY);
  if (!existingUser) localStorage.setItem(USER_KEY, JSON.stringify(seedData.User[0]));
}

function readDb() {
  bootstrap();
  return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getUser() {
  bootstrap();
  return JSON.parse(localStorage.getItem(USER_KEY) || "null");
}

function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function sortItems(items, sort = "") {
  if (!sort) return [...items];
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av > bv ? (desc ? -1 : 1) : (desc ? 1 : -1);
  });
}

function filterItems(items, query = {}, sort = "", limit) {
  let out = [...items];
  if (query && Object.keys(query).length) {
    out = out.filter((item) => Object.entries(query).every(([key, value]) => item?.[key] === value));
  }
  out = sortItems(out, sort);
  if (limit) out = out.slice(0, limit);
  return clone(out);
}

function makeEntity(name) {
  return {
    async list(sort = "", limit = 1000) {
      await wait();
      const db = readDb();
      return clone(sortItems(db[name] || [], sort).slice(0, limit));
    },
    async filter(query = {}, sort = "", limit) {
      await wait();
      const db = readDb();
      return filterItems(db[name] || [], query, sort, limit);
    },
    async create(data) {
      await wait();
      const db = readDb();
      const item = { id: data.id || uid(name.toLowerCase()), created_date: new Date().toISOString(), ...data };
      db[name] = db[name] || [];
      db[name].push(item);
      writeDb(db);
      return clone(item);
    },
    async update(id, data) {
      await wait();
      const db = readDb();
      db[name] = (db[name] || []).map((item) => item.id === id ? { ...item, ...data, updated_date: new Date().toISOString() } : item);
      writeDb(db);
      return clone((db[name] || []).find((item) => item.id === id));
    },
    async delete(id) {
      await wait();
      const db = readDb();
      db[name] = (db[name] || []).filter((item) => item.id !== id);
      writeDb(db);
      return { success: true };
    }
  };
}

const entities = {
  User: makeEntity("User"),
  PizzaPlace: makeEntity("PizzaPlace"),
  Favorite: makeEntity("Favorite"),
  Rating: makeEntity("Rating"),
  Comment: makeEntity("Comment"),
  Photo: makeEntity("Photo"),
  Quedada: makeEntity("Quedada"),
  Interes: makeEntity("Interes"),
  Message: makeEntity("Message"),
  Notification: makeEntity("Notification"),
  UserBadge: makeEntity("UserBadge"),
  List: makeEntity("List"),
  SearchLog: makeEntity("SearchLog"),
  Guide: makeEntity("Guide"),
};

async function toggleFavorite({ place_id, place_name }) {
  const user = getUser();
  const db = readDb();
  db.Favorite = db.Favorite || [];
  const existing = db.Favorite.find((f) => f.place_id === place_id && f.user_email === user.email);
  if (existing) {
    db.Favorite = db.Favorite.filter((f) => f.id !== existing.id);
    writeDb(db);
    return { data: { favorited: false } };
  }
  db.Favorite.push({ id: uid("favorite"), place_id, place_name, user_email: user.email, created_date: new Date().toISOString() });
  writeDb(db);
  return { data: { favorited: true } };
}

function enrichQuedada(quedada, db) {
  if (!quedada) return null;
  const likes = (db.Interes || []).filter((i) => i.quedada_id === quedada.id && i.tipo_interes === "like");
  const usersByEmail = new Map((db.User || []).map((u) => [u.email, u]));
  return {
    ...clone(quedada),
    joined_count: likes.length,
    participant_preview: likes.slice(0, 4).map((like) => {
      const user = usersByEmail.get(like.usuario_id);
      return {
        email: like.usuario_id,
        full_name: user?.full_name || like.usuario_id,
        avatar_color: user?.avatar_color || 'from-stone-500 to-stone-700',
      };
    }),
  };
}

async function obtenerQuedadasParaDescubrir() {
  const user = getUser();
  const db = readDb();
  const decided = new Set((db.Interes || []).filter((i) => i.usuario_id === user.email).map((i) => i.quedada_id));
  const upcoming = sortItems(
    (db.Quedada || []).filter((q) => q.estado === "activa" && new Date(q.fecha_hora) >= new Date() && !decided.has(q.id)),
    "fecha_hora"
  );
  return { data: { quedada: enrichQuedada(upcoming[0] || null, db) } };
}

async function recordarInteres({ quedada_id, tipo_interes, decision }) {
  const user = getUser();
  const db = readDb();
  const choice = tipo_interes || decision || "like";
  db.Interes = db.Interes || [];
  const existing = db.Interes.find((i) => i.quedada_id === quedada_id && i.usuario_id === user.email);
  if (existing) {
    existing.tipo_interes = choice;
    existing.updated_date = new Date().toISOString();
  } else {
    db.Interes.push({ id: uid("interes"), quedada_id, usuario_id: user.email, tipo_interes: choice, created_date: new Date().toISOString() });
  }
  if (choice === "like") {
    const quedada = (db.Quedada || []).find((q) => q.id === quedada_id);
    db.Notification = db.Notification || [];
    db.Notification.push({
      id: uid("notification"),
      user_id: user.id,
      tipo: "nuevo_match",
      texto: `You joined ${quedada?.titulo || "a hangout"}`,
      leida: false,
      created_date: new Date().toISOString()
    });
  }
  writeDb(db);
  return { data: { success: true } };
}

async function checkAndAwardBadges() {
  const user = getUser();
  const db = readDb();
  db.UserBadge = db.UserBadge || [];
  const userRatings = (db.Rating || []).filter((r) => r.user_email === user.email);
  const userLikes = (db.Interes || []).filter((i) => i.usuario_id === user.email && i.tipo_interes === "like");
  const existingTitles = new Set(db.UserBadge.filter((b) => b.user_email === user.email).map((b) => b.title));
  const awarded = [];
  if (userRatings.length >= 1 && !existingTitles.has("First Bite")) {
    const badge = { id: uid("badge"), user_email: user.email, title: "First Bite", icon: "⭐", description: "Rated your first pizza spot.", created_date: new Date().toISOString() };
    db.UserBadge.push(badge); awarded.push(badge.title);
  }
  if (userLikes.length >= 1 && !existingTitles.has("Social Slice")) {
    const badge = { id: uid("badge"), user_email: user.email, title: "Social Slice", icon: "🍕", description: "Joined a pizza hangout.", created_date: new Date().toISOString() };
    db.UserBadge.push(badge); awarded.push(badge.title);
  }
  writeDb(db);
  return { data: { ok: true, awarded } };
}

async function invoke(name, payload = {}) {
  switch (name) {
    case "toggleFavorite": return toggleFavorite(payload);
    case "obtenerQuedadasParaDescubrir": return obtenerQuedadasParaDescubrir(payload);
    case "recordarInteres": return recordarInteres(payload);
    case "checkAndAwardBadges": return checkAndAwardBadges(payload);
    default: return { data: { ok: true } };
  }
}

export const base44 = {
  auth: {
    async isAuthenticated() { await wait(); return true; },
    async me() { await wait(); return clone(getUser()); },
    async updateMe(data) {
      await wait();
      const user = { ...getUser(), ...data };
      setUser(user);
      const db = readDb();
      db.User = (db.User || []).map((u) => u.id === user.id ? user : u);
      writeDb(db);
      return clone(user);
    },
    logout() {
      setUser(seedData.User[0]);
      window.location.href = "/";
    },
    redirectToLogin() { return Promise.resolve(); },
  },
  entities,
  asServiceRole: { entities },
  functions: { invoke },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = URL.createObjectURL(file);
        return { file_url };
      }
    }
  }
};

export const resetLocalDb = () => {
  localStorage.removeItem(DB_KEY);
  bootstrap();
};
