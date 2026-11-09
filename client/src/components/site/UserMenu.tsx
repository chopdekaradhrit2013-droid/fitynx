import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings as SettingsIcon, Shirt, User as UserIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface UserMenuProps {
  compact?: boolean;
}

export function UserMenu({ compact = false }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const handleSignOut = async () => {
    await signOut();
    toast("You have been signed out.");
    setLocation("/");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-full border border-border bg-card/80 p-1 pr-3 text-left transition-all hover:border-foreground/30 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-expanded={open}
        aria-label="User account menu"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="size-7 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-[#F26A4B] text-[10px] font-semibold text-white">
            {initials}
          </div>
        )}
        {!compact && (
          <div className="hidden text-left sm:block">
            <p className="max-w-[120px] truncate text-xs font-medium leading-none text-foreground">
              {user.name}
            </p>
            <p className="mt-0.5 max-w-[120px] truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {user.provider === "google" ? "Google account" : "Email account"}
            </p>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl backdrop-blur-md">
          <div className="border-b border-border/80 px-3 py-3">
            <div className="flex items-center gap-2.5">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-9 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-[#F26A4B] text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {user.provider === "google" ? (
                  <>
                    <svg className="size-2.5" viewBox="0 0 24 24">
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
                    Google OAuth
                  </>
                ) : (
                  <>Email &amp; Password</>
                )}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/60"
            >
              <Shirt className="size-3.5 text-muted-foreground" />
              Open Studio
            </Link>
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-accent/60"
            >
              <SettingsIcon className="size-3.5 text-muted-foreground" />
              Wardrobe &amp; Account Settings
            </Link>
          </div>

          <div className="border-t border-border/80 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

