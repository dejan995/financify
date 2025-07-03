import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getTransactionIcon(category: string) {
  const iconMap: Record<string, string> = {
    groceries: "🛒",
    dining: "🍽️",
    transportation: "🚗",
    entertainment: "🎬",
    utilities: "⚡",
    shopping: "🛍️",
    healthcare: "🏥",
    salary: "💰",
    freelance: "💼",
    investments: "📈",
  };
  
  return iconMap[category.toLowerCase()] || "💳";
}

export function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    groceries: "#0F766E",
    dining: "#10B981",
    transportation: "#F59E0B",
    entertainment: "#3B82F6",
    utilities: "#8B5CF6",
    shopping: "#EF4444",
    healthcare: "#EC4899",
    salary: "#10B981",
    freelance: "#059669",
    investments: "#0D9488",
  };
  
  return colorMap[category.toLowerCase()] || "#6B7280";
}
