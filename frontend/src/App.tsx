import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { IS_MOCK } from "./api";
import FluidBackground from "./components/FluidBackground";
import ClickBloom from "./components/ClickBloom";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import OnboardingPage from "./pages/OnboardingPage";
import DiscoverPage from "./pages/DiscoverPage";
import GameDetailPage from "./pages/GameDetailPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";

// The preview build runs from a single file, where hash routing is the only thing that works.
const Router = IS_MOCK ? HashRouter : BrowserRouter;

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading">
      <motion.span
        className="block h-14 w-14 rounded-full"
        style={{ border: "1.5px solid rgb(200 210 255 / 0.9)" }}
        animate={{
          scale: [1, 1.14, 1],
          boxShadow: [
            "0 0 18px rgb(120 140 255 / 0.4), inset 0 0 14px rgb(120 140 255 / 0.25)",
            "0 0 42px rgb(150 120 255 / 0.75), inset 0 0 26px rgb(150 120 255 / 0.4)",
            "0 0 18px rgb(120 140 255 / 0.4), inset 0 0 14px rgb(120 140 255 / 0.25)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** Signed-in only. Users who haven't chosen a colour yet are sent to pick one first. */
function Protected({ children, needsColor = true, nav = true }: { children: ReactNode; needsColor?: boolean; nav?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/" replace />;
  if (needsColor && !user.identity_color) return <Navigate to="/onboarding" replace />;
  return <>{nav && <Navbar />}{children}</>;
}

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  return (
    // Transform-only transition: opacity/filter on a wrapper would break the glass blur behind children.
    <motion.div key={location.pathname} initial={{ y: 14 }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
      <Routes location={location}>
        <Route path="/" element={<ApplicationPage><HomePage /></ApplicationPage>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<Protected needsColor={false} nav={false}><OnboardingPage /></Protected>} />
        <Route path="/discover" element={<ApplicationPage><DiscoverPage /></ApplicationPage>} />
        <Route path="/wishlist" element={<ApplicationPage><WishlistPage /></ApplicationPage>} />
        <Route path="/game/:slug" element={<ApplicationPage><GameDetailPage /></ApplicationPage>} />
        <Route path="/profile" element={<Protected nav={false}><ApplicationPage><ProfilePage /></ApplicationPage></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

function ApplicationPage({ children }: { children: ReactNode }) {
  return <><Navbar />{children}</>;
}

export default function App() {
  // Silky, inertial scrolling
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let id = requestAnimationFrame(function raf(t) { lenis.raf(t); id = requestAnimationFrame(raf); });
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <FluidBackground />
        <div className="relative z-10 min-h-dvh">
          <Router>
            <AppRoutes />
          </Router>
        </div>
        <ClickBloom />
        {IS_MOCK && <div className="chip pointer-events-none fixed bottom-3 left-3 z-50 hidden text-white/60 sm:inline-flex">Preview with sample data</div>}
      </ThemeProvider>
    </AuthProvider>
  );
}
