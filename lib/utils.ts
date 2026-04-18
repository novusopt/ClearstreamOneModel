import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMiles(n: number) {
  return `${new Intl.NumberFormat("en-US").format(n)} mi`;
}

export function formatRelative(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const days = Math.max(0, Math.round((now - then) / 86_400_000));
  if (days === 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 7) return `Listed ${days} days ago`;
  if (days < 30) return `Listed ${Math.round(days / 7)} weeks ago`;
  return `Listed ${Math.round(days / 30)} months ago`;
}
