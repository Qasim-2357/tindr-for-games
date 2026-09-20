import { Link } from "react-router-dom";

export default function Logo({ to = "/", size = "md" }: { to?: string; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span className={`logo-dot ${lg ? "h-5 w-5" : "h-4 w-4"} shrink-0 rounded-full transition-transform duration-700 group-hover:scale-125`} />
      <span className={`font-display ${lg ? "text-xl" : "text-lg"} font-medium`}>
        Tindr<span className={`font-normal text-white/45 ${lg ? "" : "hidden sm:inline"}`}> for Games</span>
      </span>
    </Link>
  );
}
