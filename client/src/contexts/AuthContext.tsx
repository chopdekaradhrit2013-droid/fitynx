import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getAuthToken, setAuthToken } from "@/lib/api";
import {
  getCurrentSession,
  getGoogleClientId,
  setCurrentSession,
  setGoogleClientId as setStoredGoogleClientId,
  type GoogleAuthPayload,
  type SignInData,
  type SignUpData,
  type User,
} from "@/lib/auth";
import { initStore } from "@/lib/store";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  signUp: (data: SignUpData) => Promise<User>;
  signIn: (data: SignInData) => Promise<User>;
  signInWithGoogle: (payload: GoogleAuthPayload) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientIdState] = useState<string>(getGoogleClientId());

  useEffect(() => {
    async function loadInitialSession() {
      const token = getAuthToken();
      if (token) {
        try {
          const { user: serverUser } = await api.auth.me();
          const mappedUser: User = {
            id: serverUser.id,
            name: serverUser.name,
            email: serverUser.email,
            avatar: serverUser.avatar,
            provider: serverUser.provider,
            createdAt: serverUser.createdAt,
          };
          setUser(mappedUser);
          setCurrentSession(mappedUser);
          await initStore(mappedUser.id);
          setLoading(false);
          return;
        } catch {
          // Token expired or server unreachable, fallback to local session
        }
      }

      const session = getCurrentSession();
      setUser(session);
      await initStore(session ? session.id : null);
      setLoading(false);
    }

    void loadInitialSession();

    // Listen to changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "fitynx_auth_session_v1") {
        const nextUser = getCurrentSession();
        setUser(nextUser);
        void initStore(nextUser ? nextUser.id : null);
      } else if (e.key === "fitynx_google_client_id") {
        setGoogleClientIdState(getGoogleClientId());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSetGoogleClientId = (id: string) => {
    setStoredGoogleClientId(id);
    setGoogleClientIdState(id);
  };

  const handleSignUp = async (data: SignUpData): Promise<User> => {
    try {
      const res = await api.auth.signup(data);
      const newUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        avatar: res.user.avatar,
        provider: res.user.provider,
        createdAt: res.user.createdAt,
      };
      setUser(newUser);
      setCurrentSession(newUser);
      await initStore(newUser.id);
      return newUser;
    } catch (err) {
      console.error("Sign up error:", err);
      throw err;
    }
  };

  const handleSignIn = async (data: SignInData): Promise<User> => {
    try {
      const res = await api.auth.signin(data);
      const sessionUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        avatar: res.user.avatar,
        provider: res.user.provider,
        createdAt: res.user.createdAt,
      };
      setUser(sessionUser);
      setCurrentSession(sessionUser);
      await initStore(sessionUser.id);
      return sessionUser;
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const handleSignInWithGoogle = async (payload: GoogleAuthPayload): Promise<User> => {
    try {
      const res = await api.auth.google({
        email: payload.email,
        name: payload.name,
        avatar: payload.avatar,
        id: payload.id,
        credential: payload.credential,
      });
      const sessionUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        avatar: res.user.avatar,
        provider: res.user.provider,
        createdAt: res.user.createdAt,
      };
      setUser(sessionUser);
      setCurrentSession(sessionUser);
      await initStore(sessionUser.id);
      return sessionUser;
    } catch (err) {
      console.error("Google sign in error:", err);
      throw err;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await api.auth.signout();
    } catch {
      // ignore
    } finally {
      setAuthToken(null);
      setCurrentSession(null);
      setUser(null);
      await initStore(null);
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error("No active user");
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setCurrentSession(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        googleClientId,
        setGoogleClientId: handleSetGoogleClientId,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
