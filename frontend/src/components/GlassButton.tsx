import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ease } from "../lib/motion";

interface Props extends HTMLMotionProps<"button"> {
  variant?: "primary" | "glass";
  loading?: boolean;
}

export default function GlassButton({ variant = "glass", loading, className = "", children, disabled, ...rest }: Props) {
  return (
    <motion.button
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.35, ease }}
      className={`${variant === "primary" ? "btn-primary" : "btn-glass"} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children as React.ReactNode}
    </motion.button>
  );
}
