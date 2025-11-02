import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString()
}

export function maskApiKey(key: string, visibleChars: number = 8) {
  if (key.length <= visibleChars) return key
  return `${key.slice(0, visibleChars)}***${key.slice(-4)}`
}
