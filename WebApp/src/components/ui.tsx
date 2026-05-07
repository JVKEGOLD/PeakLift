import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className || ""}`.trim()} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input textarea ${props.className || ""}`.trim()} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Notice({ title, body, tone = "default" }: { title: string; body?: string; tone?: "default" | "error" | "success" }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
