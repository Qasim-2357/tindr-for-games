import { motion } from "framer-motion";
import { ease } from "../lib/motion";

/** Headline whose words slide up out of a mask, one by one. Transform-only, so it never fades a glass parent. */
export default function Reveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((word, i, all) => (
        <span key={i}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.16em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ delay: delay + i * 0.06, duration: 1, ease }}
            >
              {word}
            </motion.span>
          </span>
          {i < all.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
