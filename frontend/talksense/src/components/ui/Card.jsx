import { cn } from "../../lib/utils";

export const Card = ({
  className,
  children,
  title,
  description,
  variant = "default", // default | glass
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200",
        variant === "glass" ? "glass" : "bg-white border border-slate-100 shadow-xl shadow-slate-200/40",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-6 space-y-1">
          {title && <h3 className="text-2xl font-bold leading-none tracking-tight text-[var(--color-text-main)]">{title}</h3>}
          {description && <p className="text-sm text-[var(--color-text-muted)]">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
