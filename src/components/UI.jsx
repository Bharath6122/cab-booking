import { Link } from "react-router-dom";

export function Button({ children, variant = "", className = "", ...props }) {
  return <button className={`button ${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function Field({ label, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function SelectField({ label, children, className = "", ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function Notice({ children, kind = "error" }) {
  if (!children) return null;
  return <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export function EmptyState({ title, children, action, to }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">✳</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action && <Link className="button primary" to={to}>{action}</Link>}
    </div>
  );
}

export function Spinner({ label = "Loading..." }) {
  return <div className="spinner-wrap" role="status"><span className="spinner" /><span>{label}</span></div>;
}

export function StatusPill({ status }) {
  return <span className={`status status-${String(status).toLowerCase()}`}>{String(status).replaceAll("_", " ")}</span>;
}
