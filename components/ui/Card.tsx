type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--border)] bg-[rgba(17,21,17,0.88)] shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
