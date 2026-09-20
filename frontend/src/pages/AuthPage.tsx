import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api";
import { GENRES } from "../lib/genres";
import { piece, stagger } from "../lib/motion";
import GlassCard from "../components/GlassCard";
import GlassButton from "../components/GlassButton";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";

type Mode = "login" | "register";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(user.identity_color ? "/discover" : "/onboarding", { replace: true });
  }, [user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password.length < 8) return setError("Password needs at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "register") await register(username.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? (err.status === 401 ? "Wrong email or password." : err.message) : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
      {/* Left: three separate pieces */}
      <motion.div variants={stagger(0.13, 0.05)} initial="hidden" animate="show" className="flex flex-col items-start gap-4">
        <GlassCard variants={piece} className="glass-pill px-5 py-3"><Logo size="lg" /></GlassCard>

        <GlassCard variants={piece} className="w-full p-7 sm:p-10">
          <h1 className="font-display text-[2.6rem] font-medium leading-[1.03] sm:text-[4.25rem]">
            <Reveal text="Find the games that feel like you." delay={0.35} />
          </h1>
        </GlassCard>

        <GlassCard variants={piece} className="w-full p-6 sm:p-8">
          <p className="max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            Pick one colour. Every colour is a genre, and your whole library follows it.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/40">
            {GENRES.map((g) => (
              <span key={g.key} className="transition-colors duration-500 hover:text-white">{g.label}</span>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Right: the sign-in pieces */}
      <motion.div variants={stagger(0.13, 0.35)} initial="hidden" animate="show" className="flex w-full max-w-md flex-col gap-4 justify-self-center lg:justify-self-end">
        <GlassCard variants={piece} className="relative grid grid-cols-2 rounded-2xl p-1.5">
          {(["register", "login"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className="relative z-10 rounded-xl py-2.5 text-sm font-medium transition-colors"
              style={{ color: mode === m ? "#fff" : "rgb(255 255 255 / 0.5)" }}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 -z-10 rounded-xl border border-white/12 bg-white/10"
                  style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.2)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              {m === "register" ? "Create account" : "Sign in"}
            </button>
          ))}
        </GlassCard>

        <GlassCard variants={piece} className="p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.div key="u" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <label className="mb-1.5 block text-sm text-white/60" htmlFor="username">Username</label>
                  <input id="username" className="input-glass" placeholder="Player One" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={100} autoComplete="username" />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <label className="mb-1.5 block text-sm text-white/60" htmlFor="email">Email</label>
              <input id="email" type="email" className="input-glass" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/60" htmlFor="password">Password</label>
              <input id="password" type="password" className="input-glass" placeholder={mode === "register" ? "At least 8 characters" : "Your password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "register" ? "new-password" : "current-password"} />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto", x: [0, -6, 6, -4, 4, 0] }} exit={{ opacity: 0, height: 0 }}
                  transition={{ x: { duration: 0.4 } }}
                  className="flex items-start gap-2 overflow-hidden rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/80"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <GlassButton type="submit" variant="primary" loading={busy} className="w-full">
              {mode === "register" ? "Create account" : "Sign in"}
            </GlassButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
