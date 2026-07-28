export function Card({
  children,
  className = '',
  as: Tag = 'article',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="card-title">
      <h2>{children}</h2>
      {hint && <span className="card-hint">{hint}</span>}
    </div>
  );
}
