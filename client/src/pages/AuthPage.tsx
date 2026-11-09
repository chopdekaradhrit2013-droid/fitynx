import React, { useEffect, useState } from "react";
import { Brand } from "@/components/site/Brand";
import { Button } from "@/components/ui/button";
import { GoogleOAuthModal } from "@/components/auth/GoogleOAuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { parseGoogleJwt } from "@/lib/auth";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface AuthPageProps {
  initialMode?: "login" | "signup";
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const { user, isAuthenticated, signIn, signUp, signInWithGoogle, googleClientId } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // Extract redirect target from query string
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTarget = searchParams.get("redirect") || "/app";

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    document.title = `${mode === "login" ? "Sign In" : "Sign Up"} · FITYNX`;
  }, [mode]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation(redirectTarget);
    }
  }, [isAuthenticated, user, redirectTarget, setLocation]);

  // Try initializing GIS button if Google client script and client ID are loaded
  useEffect(() => {
    if (!googleClientId || typeof window === "undefined" || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential: string }) => {
          const payload = parseGoogleJwt(response.credential);
          if (payload) {
            void signInWithGoogle({
              id: payload.sub,
              name: payload.name,
              email: payload.email,
              avatar: payload.picture,
              credential: response.credential,
            }).then(() => {
              toast.success(`Welcome, ${payload.name}!`);
              setLocation(redirectTarget);
            });
          }
        },
      });

      const buttonContainer = document.getElementById("gis-button-target");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          width: 340,
          text: mode === "login" ? "signin_with" : "signup_with",
          shape: "rectangular",
        });
      }
    } catch (e) {
      console.warn("GIS button render warning:", e);
    }
  }, [googleClientId, mode, signInWithGoogle, redirectTarget, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");

        await signUp({ name: name.trim(), email: email.trim(), password });
        toast.success(`Account created! Welcome to FITYNX, ${name.trim()}.`);
      } else {
        await signIn({ email: email.trim(), password });
        toast.success("Welcome back to your wardrobe studio.");
      }
      setLocation(redirectTarget);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (type: "google" | "email") => {
    setLoading(true);
    try {
      if (type === "google") {
        await signInWithGoogle({
          id: "usr_google_alex",
          name: "Alex Morgan",
          email: "alex.morgan@gmail.com",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        });
        toast.success("Signed in as Alex Morgan (Google)");
      } else {
        await signIn({
          email: "demo@fitynx.com",
          password: "password123",
        });
        toast.success("Signed in as Elena Rostova (Email demo)");
      }
      setLocation(redirectTarget);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:px-10">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to website
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            {/* Header / Tabs */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[#F26A4B]" />
                Private Wardrobe Studio
              </span>
              <h1 className="mt-4 font-serif text-3xl tracking-[-0.03em] md:text-4xl">
                {mode === "login" ? "Welcome back." : "Create account."}
              </h1>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {mode === "login"
                  ? "Sign in to access your digital wardrobe, personal stylist, and outfit calendar."
                  : "Start cataloguing your clothes and composing weather-ready looks in seconds."}
              </p>
            </div>

            {/* Mode Toggle Switch */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-accent/40 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg py-2 font-medium transition-all ${
                  mode === "login"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg py-2 font-medium transition-all ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google OAuth Option */}
            <div className="mt-6 space-y-3">
              {googleClientId && (
                <div id="gis-button-target" className="flex justify-center" />
              )}

              <button
                type="button"
                onClick={() => setGoogleModalOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:border-foreground/30 hover:bg-accent/40"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center text-xs text-muted-foreground">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 font-mono text-[10px] uppercase tracking-[0.16em]">
                Or continue with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Full name
                  </label>
                  <div className="relative mt-1.5">
                    <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Email address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-foreground">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Demo note: You can use 'password123' for the demo account or click Instant Demo below.")
                      }
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Confirm password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="text-xs text-muted-foreground">
                    Remember me on this browser
                  </label>
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </span>
                ) : mode === "login" ? (
                  <span className="flex items-center gap-2">
                    Sign in to Studio <ArrowRight className="size-4" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create account &amp; enter <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Demo Logins for Fast Review */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground text-center">
                Fast review · One-click demo sign in
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoSignIn("google")}
                  className="h-8 text-xs font-normal"
                >
                  <Sparkles className="size-3 text-[#F26A4B]" /> Alex (Google)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoSignIn("email")}
                  className="h-8 text-xs font-normal"
                >
                  <Mail className="size-3 text-primary" /> Elena (Email)
                </Button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent/30 p-3 text-[11px] leading-4 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#F26A4B]" />
              <span>
                Your wardrobe data, garment photos, and saved outfits are kept privately in your browser storage.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Google OAuth Modal */}
      <GoogleOAuthModal
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSuccess={() => setLocation(redirectTarget)}
      />

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FITYNX — Private AI Wardrobe Studio
      </footer>
    </div>
  );
}

