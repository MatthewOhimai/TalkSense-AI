import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

export const Input = ({
  label,
  error,
  className,
  id,
  type = "text",
  startIcon: StartIcon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none text-[var(--color-text-main)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        {StartIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors peer-focus:text-[var(--color-primary)]">
            <StartIcon className="h-5 w-5" />
          </div>
        )}
        <input
          type={inputType}
          id={id}
          className={cn(
            "flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-[var(--color-text-main)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm",
            error && "border-red-500 focus:ring-red-500 bg-red-50",
            StartIcon && "pl-10",
            isPassword && "pr-10",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle password visibility</span>
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm font-medium text-red-500 animate-slide-up">{error}</p>
      )}
    </div>
  );
};
