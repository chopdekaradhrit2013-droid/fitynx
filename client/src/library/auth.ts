export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "email";
  createdAt: string;
}

export interface StoredAccount extends User {
  passwordHash?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

const USERS_STORAGE_KEY = "fitynx_auth_users_v1";
const SESSION_STORAGE_KEY = "fitynx_auth_session_v1";

// Pre-seeded demo account
const INITIAL_DEMO_USERS: StoredAccount[] = [
  {
    id: "usr_email_demo",
    name: "Elena Rostova",
    email: "demo@fitynx.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    provider: "email",
    passwordHash: "7b4c278a9c2ca26955fc1d7a9ca504f77c38550186718cfd1d234c98f86f77ec",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + "_fitynx_salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getStoredUsers(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
      return INITIAL_DEMO_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_USERS;
  } catch {
    return INITIAL_DEMO_USERS;
  }
}

export function saveStoredUsers(users: StoredAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users to localStorage", err);
  }
}

export function getCurrentSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error("Failed to set session", err);
  }
}

export async function signUpUser({ name, email, password }: SignUpData): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("Please enter your name");
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  const users = getStoredUsers();
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error("An account with this email already exists. Please sign in instead.");
  }

  const passwordHash = await hashPassword(password);
  const newUser: StoredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    provider: "email",
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveStoredUsers(users);

  const sessionUser: User = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    avatar: newUser.avatar,
    provider: newUser.provider,
    createdAt: newUser.createdAt,
  };

  setCurrentSession(sessionUser);
  return sessionUser;
}

export async function signInUser({ email, password }: SignInData): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid email address");
  }
  if (!password) {
    throw new Error("Please enter your password");
  }

  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error("No account found with this email. Please check your email or sign up.");
  }

  const hash = await hashPassword(password);
  const isDemo = user.id === "usr_email_demo" && (password === "password123" || hash === user.passwordHash);
  if (!isDemo && user.passwordHash !== hash) {
    throw new Error("Incorrect password. Please try again.");
  }

  const sessionUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
  };

  setCurrentSession(sessionUser);
  return sessionUser;
}

export async function signOutUser(): Promise<void> {
  setCurrentSession(null);
}

export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const current = getCurrentSession();
  if (!current) throw new Error("No active session");

  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === current.id);
  if (idx === -1) throw new Error("User record not found");

  const updated: StoredAccount = {
    ...users[idx],
    ...updates,
    id: current.id,
    email: current.email,
  };

  users[idx] = updated;
  saveStoredUsers(users);

  const sessionUser: User = {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    avatar: updated.avatar,
    provider: updated.provider,
    createdAt: updated.createdAt,
  };

  setCurrentSession(sessionUser);
  return sessionUser;
}
