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

export interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  temperatureC: number;
  temperatureF: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  precipitationMm: number;
  condition: string;
  isRain: boolean;
  isSnow: boolean;
  category: "hot" | "mild" | "cool" | "cold" | "rainy";
  summary: string;
  tips: string[];
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "email";
  createdAt: string;
  updatedAt: string;
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
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

    async updateProfile(updates: { name?: string; avatar?: string }): Promise<{ user: ApiUser }> {
      return request<{ user: ApiUser }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
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

  lens: {
    async search(query: string): Promise<{ query: string; results: Array<{ title: string; thumbnail: string; image: string; source: string }> }> {
      return request<{ query: string; results: Array<{ title: string; thumbnail: string; image: string; source: string }> }>(
        `/api/lens/search?q=${encodeURIComponent(query)}`
      );
    },

    async proxy(url: string): Promise<{ dataUrl: string; contentType: string }> {
      return request<{ dataUrl: string; contentType: string }>(
        `/api/lens/proxy?url=${encodeURIComponent(url)}`
      );
    },
  },

  ai: {
    async status(): Promise<{ active: boolean; model: string; message: string }> {
      return request<{ active: boolean; model: string; message: string }>("/api/ai/status");
    },

    async analyze(image: string, apiKey?: string): Promise<{
      analysis: {
        name: string;
        garmentType: string;
        colorName: string;
        colorHex: string;
        fabric?: string;
        styleVibe?: string;
        searchQuery?: string;
        stylingTip?: string;
      };
    }> {
      return request("/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ image, apiKey }),
      });
    },

    async style(brief: any, items: WardrobeItem[], apiKey?: string): Promise<{ look: any }> {
      return request("/api/ai/style", {
        method: "POST",
        body: JSON.stringify({ brief, items, apiKey }),
      });
    },
  },

  weather: {
    async current(params?: { lat?: number; lon?: number; city?: string }): Promise<WeatherData> {
      const q = new URLSearchParams();
      if (params?.lat !== undefined) q.set("lat", String(params.lat));
      if (params?.lon !== undefined) q.set("lon", String(params.lon));
      if (params?.city) q.set("city", params.city);
      const query = q.toString() ? `?${q.toString()}` : "";
      return request<WeatherData>(`/api/weather/current${query}`);
    },
  },
};

const GEMINI_KEY_STORAGE = "fitynx_gemini_api_key";
export function getSavedGeminiKey(): string | null {
  try { return localStorage.getItem(GEMINI_KEY_STORAGE); } catch { return null; }
}
export function saveGeminiKey(key: string | null): void {
  try {
    if (!key) localStorage.removeItem(GEMINI_KEY_STORAGE);
    else localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  } catch { /* ignore */ }
}

