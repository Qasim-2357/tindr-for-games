import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GENRES } from "../lib/genres";
import { trackPointer } from "../lib/spotlight";
import { ease, piece, stagger } from "../lib/motion";

interface Props {
  value: string | null;
  onChange: (genreKey: string) => void;
}

export default function GenrePicker({ value, onChange }: Props) {
  return (
    <motion.div variants={stagger(0.08, 0.15)} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {GENRES.map((g, i) => {
        const selected = value === g.key;
        return (
          <motion.button
            key={g.key}
            type="button"
            variants={piece}
            onClick={() => onChange(g.key)}
            onPointerMove={trackPointer}
            whileHover={{ y: -4, transition: { duration: 0.4, ease } }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={selected}
            className="glass glass-interactive flex h-40 flex-col justify-between p-5 text-left transition-colors duration-500 sm:h-44 sm:p-6"
            style={selected ? { borderColor: "rgb(255 255 255 / 0.5)", backgroundColor: "rgb(255 255 255 / 0.05)", boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.14), 0 0 56px -16px ${g.hex}cc, 0 28px 60px -32px rgb(0 0 0 / 0.95)` } : undefined}
          >
            <span className="flex w-full items-start justify-between">
              {/* One luminous drop in the genre's colour; it breathes slowly. */}
              <motion.span
                className="block h-7 w-7 rounded-full"
                style={{ background: `radial-gradient(circle at 34% 30%, #ffffffe6, ${g.hex} 42%, ${g.hex}aa 100%)` }}
                animate={{ boxShadow: [`0 0 14px 1px ${g.hex}55`, `0 0 30px 6px ${g.hex}99`, `0 0 14px 1px ${g.hex}55`] }}
                transition={{ duration: 3.4 + i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              />
              {selected ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.span>
              ) : (
                <span className="text-xs tabular-nums text-white/25">0{i + 1}</span>
              )}
            </span>
            <span>
              <span className="font-display block text-xl font-medium">{g.label}</span>
              <span className="mt-1 block text-sm text-white/50">{g.vibe}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
