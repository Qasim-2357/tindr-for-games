import type { Variants } from "framer-motion";

/** One long, soft ease-out (no overshoot, no bounce). Calm motion reads as premium. */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Parent that reveals its glass pieces one after another. */
export const stagger = (gap = 0.1, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** A glass piece settling into place. Opacity lives on the piece itself, never on a parent,
 *  because a faded parent stops its glass children from blurring the background. */
export const piece: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.95, ease } },
};
