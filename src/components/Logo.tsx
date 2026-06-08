interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = true }: LogoProps) {
  const dims = {
    sm: { icon: 32, title: "text-lg", tag: "text-[10px]" },
    md: { icon: 48, title: "text-2xl", tag: "text-xs" },
    lg: { icon: 84, title: "text-5xl", tag: "text-sm" },
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative flex items-center justify-center rounded-xl glass shadow-glow-blue"
        style={{ width: dims.icon + 16, height: dims.icon + 16 }}
      >
        <svg
          width={dims.icon}
          height={dims.icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.75 0.18 250)" />
              <stop offset="100%" stopColor="oklch(0.55 0.22 265)" />
            </linearGradient>
            <linearGradient id="logoGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.88 0.14 85)" />
              <stop offset="100%" stopColor="oklch(0.68 0.16 70)" />
            </linearGradient>
          </defs>
          {/* Steering wheel ring */}
          <circle cx="32" cy="32" r="26" stroke="url(#logoBlue)" strokeWidth="3" />
          <circle cx="32" cy="32" r="6" fill="url(#logoGold)" />
          {/* Spokes */}
          <path d="M32 14 L32 26" stroke="url(#logoGold)" strokeWidth="3" strokeLinecap="round" />
          <path d="M16 40 L27 35" stroke="url(#logoGold)" strokeWidth="3" strokeLinecap="round" />
          <path d="M48 40 L37 35" stroke="url(#logoGold)" strokeWidth="3" strokeLinecap="round" />
          {/* Car silhouette underlay */}
          <path
            d="M14 46 Q14 42 18 42 L46 42 Q50 42 50 46"
            stroke="url(#logoBlue)"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={`font-display font-bold tracking-wider gradient-text-primary ${dims.title}`}>
          TS-AUTO
        </span>
        {showTagline && (
          <span className={`text-gold tracking-wide ${dims.tag}`}>
            მანქანის საუკეთესო არჩევანი
          </span>
        )}
      </div>
    </div>
  );
}
