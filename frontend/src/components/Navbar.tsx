import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, House, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { genreByKey } from "../lib/genres";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home", icon: House },
  { to: "/discover", label: "Discover", icon: Compass },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const genre = genreByKey(user?.identity_genre);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <motion.header
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-40 px-3 sm:px-6"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <motion.nav
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }}
        className={`glass glass-pill mx-auto flex max-w-6xl items-center justify-between gap-3 pl-5 pr-2 ${scrolled ? "py-1 !bg-[rgb(6_6_10_/_0.55)]" : "py-2"}`}
      >
        <Logo to="/" />
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="relative rounded-full px-3.5 py-2 text-sm text-white/65 transition-colors hover:text-white">
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
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <UserRound className="h-4 w-4" />
          </motion.button>
          {user && (
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={async () => { await logout(); navigate("/"); }}
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
  );
}
