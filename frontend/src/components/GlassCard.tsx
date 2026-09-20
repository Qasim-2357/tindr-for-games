import { motion, type HTMLMotionProps } from "framer-motion";
import { trackPointer } from "../lib/spotlight";

interface Props extends HTMLMotionProps<"div"> {
  /** Soft white light that follows the pointer inside the piece. */
  interactive?: boolean;
  /** Float up slightly on hover (default: on for interactive pieces). */
  lift?: boolean;
}

export default function GlassCard({ interactive, lift = interactive, className = "", children, ...rest }: Props) {
  return (
    <motion.div
      className={`glass ${interactive ? "glass-interactive" : ""} ${className}`}
      onPointerMove={interactive ? trackPointer : undefined}
      whileHover={lift ? { y: -4 } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
