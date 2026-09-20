import { useState } from "react";

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Real cover art when the backend has it; otherwise a quiet generated cover so the grid never looks broken. */
export default function GameCover({ name, src, className = "" }: { name: string; src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />;
  }
  const h = hash(name);
  const hue = 205 + (h % 130); // blue → violet → magenta, matching the background liquid
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(110% 85% at ${20 + (h % 60)}% -10%, hsl(${hue} 70% 34% / 0.85), transparent 62%), linear-gradient(165deg, hsl(${hue + 24} 42% 13%), #07070a)`,
      }}
    >
      <span className="font-display select-none text-6xl font-medium text-white/[0.14]">{name.trim()[0]}</span>
    </div>
  );
}
