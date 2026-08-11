type AmbientGlowProps = {
  className?: string;
};

export function AmbientGlow({ className = "" }: AmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      <div className="ambient-drift absolute inset-x-[-18rem] top-[-10rem] h-72 bg-[linear-gradient(100deg,transparent,rgba(16,185,129,0.22),rgba(245,158,11,0.12),transparent)] blur-3xl" />
      <div className="ambient-drift absolute inset-x-[-12rem] top-72 h-56 bg-[linear-gradient(80deg,transparent,rgba(244,114,182,0.1),rgba(16,185,129,0.12),transparent)] blur-3xl [animation-delay:-6s]" />
    </div>
  );
}
