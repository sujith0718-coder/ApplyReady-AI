export function Skeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skel skel-title" />
      <div className="skel-row">
        <div className="skel skel-card tall" />
        <div className="skel skel-card tall" />
        <div className="skel skel-card tall" />
      </div>
      <div className="skel-row">
        <div className="skel skel-card" />
        <div className="skel skel-card" />
        <div className="skel skel-card" />
        <div className="skel skel-card" />
      </div>
      <div className="skel-row">
        <div className="skel skel-card wide" />
        <div className="skel skel-card" />
      </div>
    </div>
  );
}
