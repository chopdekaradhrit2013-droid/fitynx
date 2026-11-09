import type { Look, PlanEntry, WardrobeItem } from "./types";

const TOKEN_KEY = "fitynx_auth_jwt_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    console.error("Failed to store auth token", err);
  }
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "email" | "google";
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = (typeof data === "object" && data !== null && "error" in data)
      ? String((data as { error: string }).error)
      : `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    async signup(data: { name: string; email: string; password: string }): Promise<{ user: ApiUser; token: string }> {
      const res = await request<{ user: ApiUser; token: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setAuthToken(res.token);
      return res;
    },

    async signin(data: { email: string; password: string }): Promise<{ user: ApiUser; token: string }> {
      const res = await request<{ user: ApiUser; token: string }>("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setAuthToken(res.token);
      return res;
    },

    async google(data: {
      credential?: string;
      email?: string;
      name?: string;
      avatar?: string;
      id?: string;
    }): Promise<{ user: ApiUser; token: string }> {
      const res = await request<{ user: ApiUser; token: string }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setAuthToken(res.token);
      return res;
    },

    async me(): Promise<{ user: ApiUser }> {
      return request<{ user: ApiUser }>("/api/auth/me");
    },

    async signout(): Promise<void> {
      try {
        await request("/api/auth/signout", { method: "POST" });
      } finally {
        setAuthToken(null);
      }
    },
  },

  wardrobe: {
    async list(): Promise<{ items: WardrobeItem[] }> {
      return request<{ items: WardrobeItem[] }>("/api/wardrobe");
    },

    async add(items: WardrobeItem | WardrobeItem[]): Promise<{ items: WardrobeItem[] }> {
      return request<{ items: WardrobeItem[] }>("/api/wardrobe", {
        method: "POST",
        body: JSON.stringify(Array.isArray(items) ? { items } : items),
      });
    },

    async update(id: string, patch: Partial<WardrobeItem>): Promise<{ item: WardrobeItem }> {
      return request<{ item: WardrobeItem }>(`/api/wardrobe/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/wardrobe/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },

    async wipe(): Promise<{ success: boolean }> {
      return request<{ success: boolean }>("/api/wardrobe", {
        method: "DELETE",
      });
    },
  },

  looks: {
    async list(): Promise<{ looks: Look[] }> {
      return request<{ looks: Look[] }>("/api/looks");
    },

    async save(looks: Look[]): Promise<{ looks: Look[] }> {
      return request<{ looks: Look[] }>("/api/looks", {
        method: "POST",
        body: JSON.stringify({ looks }),
      });
    },

    async toggle(id: string): Promise<{ look: Look }> {
      return request<{ look: Look }>(`/api/looks/${encodeURIComponent(id)}/toggle`, {
        method: "PATCH",
      });
    },
  },

  plans: {
    async list(): Promise<{ plans: PlanEntry[] }> {
      return request<{ plans: PlanEntry[] }>("/api/plans");
    },

    async add(plan: { id?: string; lookId: string; date: string; note?: string }): Promise<{ plan: PlanEntry }> {
      return request<{ plan: PlanEntry }>("/api/plans", {
        method: "POST",
        body: JSON.stringify(plan),
      });
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/plans/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  },
};

