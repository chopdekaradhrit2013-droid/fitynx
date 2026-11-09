import React, { useEffect, useState } from "react";
import { Brand } from "@/components/site/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface AuthPageProps {
  initialMode?: "login" | "signup";
}

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const { user, isAuthenticated, signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

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

  const handleDemoSignIn = async () => {
    setLoading(true);
    try {
      await signIn({
        email: "demo@fitynx.com",
        password: "password123",
      });
      toast.success("Signed in as Elena Rostova (Demo)");
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

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Full name
                  </label>
                  <div className="relative mt-1.5">
                    <UserIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="e.g. Elena Rostova"
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
                        toast.info("Demo account password is 'password123' (or click Instant Demo below).")
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

            {/* Quick Demo Login */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground text-center">
                Fast review · One-click demo sign in
              </p>
              <div className="mt-2.5 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDemoSignIn}
                  className="w-full text-xs font-normal"
                >
                  <Sparkles className="size-3 text-[#F26A4B]" /> Continue as Elena (Demo Account)
                </Button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent/30 p-3 text-[11px] leading-4 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#F26A4B]" />
              <span>
                Your wardrobe data, garment photos, and saved outfits are securely linked to your account.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FITYNX — Private AI Wardrobe Studio
      </footer>
    </div>
  );
}
