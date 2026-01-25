import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Styling function jo Tailwind classes ko jodta hai
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Page URL function jo links ko sahi format karta hai
export const createPageUrl = (path) => {
  if (!path) return "/";
  return path.startsWith('/') ? path : `/${path}`;
};

export const formatCurrency = (amount, currency = 'SAR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};