import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { GENRES, genreByKey } from "../lib/genres";
import { piece, stagger } from "../lib/motion";
import GenrePicker from "../components/GenrePicker";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const { setPreview } = useTheme();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(user?.identity_genre ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The background lights and click bursts lean toward the colour you pick.
  const choose = (key: string) => { setPicked(key); setPreview(genreByKey(key)!.hex); };
  useEffect(() => () => setPreview(null), [setPreview]);

  const confirm = async () => {
    const g = GENRES.find((x) => x.key === picked);
    if (!g) return;
    setBusy(true); setError(null);
    try {
      setUser(await api.updateProfile({ identity_genre: g.key, identity_color: g.color }));
      navigate("/discover", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save your colour.");
      setBusy(false);
    }
  };

  const g = genreByKey(picked);

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <motion.div variants={stagger(0.12, 0.05)} initial="hidden" animate="show" className="flex flex-col items-center gap-4">
        <GlassCard variants={piece} className="glass-pill px-5 py-3"><Logo /></GlassCard>
        <GlassCard variants={piece} className="w-full max-w-2xl p-7 text-center sm:p-9">
          <h1 className="font-display text-3xl font-medium sm:text-5xl">
            <Reveal text={`Pick your colour, ${user?.username ?? ""}.`} delay={0.3} />
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/60">Each colour is a genre. You can change it any time.</p>
        </GlassCard>
      </motion.div>

      <GenrePicker value={picked} onChange={choose} />

      <motion.div variants={stagger(0.1, 1.1)} initial="hidden" animate="show" className="flex flex-col items-center gap-3">
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-white/75"><AlertCircle className="h-4 w-4" />{error}</p>}
        <motion.div variants={piece}>
          <GlassButton variant="primary" disabled={!picked} loading={busy} onClick={confirm} className="min-w-64">
            {g ? `Continue with ${g.label}` : "Choose a colour to continue"}
          </GlassButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
