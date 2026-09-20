import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { GENRES, genreByKey } from "../lib/genres";
import { piece, stagger } from "../lib/motion";
import GenrePicker from "../components/GenrePicker";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";
import Reveal from "../components/Reveal";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const { setPreview } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username ?? "");
  const [picked, setPicked] = useState<string | null>(user?.identity_genre ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = username.trim() !== user?.username || picked !== user?.identity_genre;
  const choose = (key: string) => { setPicked(key); setPreview(genreByKey(key)!.hex); setMsg(null); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const g = GENRES.find((x) => x.key === picked);
      const updated = await api.updateProfile({
        username: username.trim(),
        ...(g ? { identity_genre: g.key, identity_color: g.color } : {}),
      });
      setPreview(null);
      setUser(updated);
      setMsg({ ok: true, text: "Saved." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Couldn't save changes." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <form onSubmit={save} className="flex flex-col gap-4">
        <motion.div variants={stagger(0.12, 0.05)} initial="hidden" animate="show" className="flex flex-col gap-4">
          <GlassCard variants={piece} className="p-6 sm:p-8">
            <h1 className="font-display text-3xl font-medium sm:text-5xl"><Reveal text="Your profile" delay={0.2} /></h1>
            <p className="mt-3 text-white/60">{user?.email}</p>
          </GlassCard>
          <GlassCard variants={piece} className="p-6 sm:p-8">
            <label htmlFor="name" className="mb-1.5 block text-sm text-white/60">Username</label>
            <input id="name" className="input-glass" value={username} onChange={(e) => { setUsername(e.target.value); setMsg(null); }} maxLength={100} required />
          </GlassCard>
          <GlassCard variants={piece} className="glass-pill w-fit px-6 py-3">
            <h2 className="font-display text-base font-medium">Your colour</h2>
          </GlassCard>
        </motion.div>

        <GenrePicker value={picked} onChange={choose} />

        <motion.div variants={stagger(0.1, 1)} initial="hidden" animate="show">
          <GlassCard variants={piece} className="flex flex-wrap items-center gap-3 rounded-2xl p-2.5">
            <GlassButton type="submit" variant="primary" loading={busy} disabled={!dirty}>Save changes</GlassButton>
            <GlassButton type="button" onClick={async () => { await logout(); navigate("/"); }}>Sign out</GlassButton>
            {msg && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} role="status" className="flex items-center gap-2 px-2 text-sm text-white/80">
                {msg.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{msg.text}
              </motion.span>
            )}
          </GlassCard>
        </motion.div>
      </form>
    </div>
  );
}
