import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings as SettingsIcon, Shirt } from "lucide-react";
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
        className="flex items-center gap-2.5 rounded-full border border-border bg-card/80 p-1 pr-3 text-left transition-all duration-200 hover:border-foreground/30 hover:bg-card active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              Account
            </p>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl backdrop-blur-md animate-menu-pop origin-top-right">
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
          </div>

          <div className="py-1">
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-accent/60 active:scale-[0.98]"
            >
              <Shirt className="size-3.5 text-muted-foreground" />
              Open Studio
            </Link>
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-accent/60 active:scale-[0.98]"
            >
              <SettingsIcon className="size-3.5 text-muted-foreground" />
              Wardrobe &amp; Account Settings
            </Link>
          </div>

          <div className="border-t border-border/80 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-all duration-150 hover:bg-destructive/10 active:scale-[0.98]"
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
