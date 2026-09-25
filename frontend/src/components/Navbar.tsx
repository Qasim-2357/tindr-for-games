import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Heart, House, LogOut, UserRound, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { genreByKey } from "../lib/genres";
import Logo from "./Logo";
import GlassButton from "./GlassButton";
import GlassCard from "./GlassCard";

const links = [
  { to: "/", label: "Home", icon: House },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/daily", label: "Daily", icon: Zap },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const genre = genreByKey(user?.identity_genre);
  const [scrolled, setScrolled] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const logoutBusyRef = useRef(logoutBusy);
  logoutBusyRef.current = logoutBusy;
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!confirmLogout) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    getFocusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !logoutBusyRef.current) {
        setConfirmLogout(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [confirmLogout]);

  const confirmSignOut = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setLogoutBusy(false);
      setConfirmLogout(false);
    }
  };

  return (
    <>
    <motion.header
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-40 px-3 sm:px-6"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <motion.nav
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
        className={`glass glass-pill mx-auto flex max-w-6xl items-center justify-between gap-1 px-3 sm:gap-3 sm:pl-5 sm:pr-2 ${scrolled ? "py-1 !bg-[rgb(6_6_10_/_0.55)]" : "py-2"}`}
      >
        <Logo to="/" />
        <div className="flex items-center gap-0 sm:gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={label} className="relative rounded-full px-2.5 py-3 text-sm text-white/65 transition-colors hover:text-white sm:px-3.5 sm:py-2">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-white/12 bg-white/10"
                      style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.2)" }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className={`relative flex items-center gap-2 ${isActive ? "text-white" : ""}`}>
                    <Icon className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
          {user && (
            <span className="chip ml-1 hidden md:inline-flex">
              <span className="h-2 w-2 rounded-full" style={{ background: genre?.hex ?? "#fff", boxShadow: `0 0 8px 1px ${genre?.hex ?? "#fff"}` }} />
              {user.username}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/profile")}
            aria-label="Profile"
            title="Profile"
            className="ml-0 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:ml-1"
          >
            <UserRound className="h-4 w-4" />
          </motion.button>
          {user && (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={() => setConfirmLogout(true)}
              aria-label="Sign out"
              title="Sign out"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </motion.nav>
    </motion.header>
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !logoutBusy) setConfirmLogout(false);
          }}
        >
          <GlassCard
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-title"
            className="w-full max-w-sm p-6 sm:p-7"
          >
            <h2 id="sign-out-title" className="font-display text-xl font-medium">Sign out?</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Are you sure you want to sign out of your account?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <GlassButton type="button" onClick={() => setConfirmLogout(false)} disabled={logoutBusy}>
                Cancel
              </GlassButton>
              <GlassButton type="button" variant="primary" loading={logoutBusy} onClick={confirmSignOut}>
                Sign out
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}
