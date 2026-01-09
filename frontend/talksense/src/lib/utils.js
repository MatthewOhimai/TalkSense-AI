import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${path}`;
};

export const getRedirectPath = (user) => {
  if (!user) return "/login";
  if (user.role === "admin" || user.is_staff) return "/admin/analytics";
  return "/dashboard";
};
