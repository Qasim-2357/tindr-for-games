import { ArrowRight, Compass, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GlassButton from "../components/GlassButton";
import GlassCard from "../components/GlassCard";

const pathways = [
  {
    icon: Compass,
    eyebrow: "Explore",
    title: "Find your next world",
    copy: "Browse a living library shaped around the games and genres you want to feel.",
  },
  {
    icon: TrendingUp,
    eyebrow: "Right now",
    title: "See what is moving",
    copy: "Keep up with trending, top-rated, and newly released games in one place.",
  },
  {
    icon: Sparkles,
    eyebrow: "Personal",
    title: "Make it yours",
    copy: "Choose an identity colour and let your taste guide the way you discover.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const secondaryHref = user ? "/profile" : "/auth";
  const secondaryLabel = user ? "Your profile" : "Sign in";

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8 sm:pt-8">
      <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="hero-piece max-w-2xl"
        >
          <p className="auth-kicker">A library with a pulse</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Discover by
            <span className="block text-white/55">how it feels.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60 sm:text-lg">
            Tindr for Games helps you find the worlds that fit your mood, your
            taste, and the kind of player you are today.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/discover">
              <GlassButton variant="primary">
                {user ? "Open discover" : "Start discovering"}
                <ArrowRight className="h-4 w-4" />
              </GlassButton>
            </Link>
            <Link to={secondaryHref}>
              <GlassButton>{secondaryLabel}</GlassButton>
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/35">
            <span className="h-px w-8 bg-white/20" />
            One feeling at a time
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          {pathways.map(({ icon: Icon, eyebrow, title, copy }, index) => (
            <GlassCard
              key={title}
              className="p-5 sm:p-6"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.7 }}
            >
              <div className="flex gap-4">
                <span className="glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white/75">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/35">{eyebrow}</p>
                  <h2 className="mt-1 font-display text-lg font-medium text-white">{title}</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">{copy}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
