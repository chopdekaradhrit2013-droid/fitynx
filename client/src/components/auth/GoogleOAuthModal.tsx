import React, { useState } from "react";
import { Modal } from "@/components/site/Modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Check, KeyRound, Loader2, Sparkles, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface GoogleAccountOption {
  name: string;
  email: string;
  avatar: string;
}

const PRESET_GOOGLE_ACCOUNTS: GoogleAccountOption[] = [
  {
    name: "Alex Morgan",
    email: "alex.morgan@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Taylor Swift",
    email: "taylor.swift@gmail.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  },
  {
    name: "Jordan Lee",
    email: "jordan.lee@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
];

interface GoogleOAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GoogleOAuthModal({ open, onClose, onSuccess }: GoogleOAuthModalProps) {
  const { signInWithGoogle, googleClientId, setGoogleClientId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(googleClientId || "");

  const handleSelectAccount = async (account: GoogleAccountOption) => {
    setLoading(true);
    try {
      await signInWithGoogle({
        name: account.name,
        email: account.email,
        avatar: account.avatar,
      });
      toast.success(`Signed in with Google as ${account.name}`);
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes("@")) {
      toast.error("Please enter a valid Google email");
      return;
    }
    const name = customName.trim() || customEmail.split("@")[0];
    setLoading(true);
    try {
      await signInWithGoogle({
        name,
        email: customEmail.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f26a4b`,
      });
      toast.success(`Signed in with Google as ${name}`);
      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(clientIdInput.trim());
    toast.success("Google Client ID saved");
    setShowConfig(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign in with Google" eyebrow="Google Identity">
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <svg className="size-6 shrink-0" viewBox="0 0 24 24">
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
          <div>
            <p className="text-sm font-medium leading-none text-foreground">Choose an account</p>
            <p className="mt-1 text-xs text-muted-foreground">to continue to <strong className="font-semibold text-foreground">FITYNX Studio</strong></p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="size-8 animate-spin text-[#F26A4B]" />
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Authenticating with Google...</p>
          </div>
        ) : customMode ? (
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">Enter Google account details to sign in or create an account:</p>
            <div>
              <label className="block text-xs font-medium text-foreground">Full name</label>
              <input
                type="text"
                placeholder="e.g. Maya Lin"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Google email</label>
              <input
                type="email"
                placeholder="maya.lin@gmail.com"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomMode(false)}>
                ← Back to accounts
              </Button>
              <Button type="submit" size="sm">
                Continue with this account
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {PRESET_GOOGLE_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => handleSelectAccount(acc)}
                className="group flex w-full items-center gap-3.5 rounded-xl border border-border bg-background/50 p-3 text-left transition-all hover:border-primary/40 hover:bg-accent/40"
              >
                <img src={acc.avatar} alt={acc.name} className="size-10 rounded-full object-cover ring-1 ring-border" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{acc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                </div>
                <UserCheck className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}

            <button
              onClick={() => setCustomMode(true)}
              className="flex w-full items-center gap-3.5 rounded-xl border border-dashed border-border p-3 text-left transition-colors hover:bg-accent/40"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-accent text-muted-foreground">
                <UserPlus className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Use another Google account</p>
                <p className="text-xs text-muted-foreground">Sign in with any custom Google account email</p>
              </div>
            </button>
          </div>
        )}

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <KeyRound className="size-3" />
            <span>{showConfig ? "Hide Google Client ID settings" : "OAuth Client ID Configuration"}</span>
          </button>

          {showConfig && (
            <form onSubmit={handleSaveClientId} className="mt-3 space-y-2 rounded-xl border border-border bg-accent/20 p-3">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Optional: Connect a real Google Cloud OAuth Client ID (from Google Cloud Console) or set <code className="font-mono text-primary">VITE_GOOGLE_CLIENT_ID</code> in <code className="font-mono">.env</code>.
              </p>
              <input
                type="text"
                placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={e => setClientIdInput(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                {googleClientId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setClientIdInput("");
                      setGoogleClientId("");
                      toast("Google Client ID cleared");
                    }}
                  >
                    Clear
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-7 text-xs">
                  Save Client ID
                </Button>
              </div>
            </form>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            To continue, Google will share your name, email address, language preference, and profile picture with FITYNX. See FITYNX’s Privacy Policy.
          </p>
        </div>
      </div>
    </Modal>
  );
}

