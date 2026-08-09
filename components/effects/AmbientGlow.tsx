type AmbientGlowProps = {
  className?: string;
};

export function AmbientGlow({ className = "" }: AmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      <div className="ambient-drift absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.34),transparent_64%)] blur-2xl" />
      <div className="ambient-drift absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_64%)] blur-2xl [animation-delay:-6s]" />
    </div>
  );
}
