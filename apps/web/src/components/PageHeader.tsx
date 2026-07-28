export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
