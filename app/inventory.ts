import { STAFF_ROLE_NAME } from "./roles"

// Must match backend/models/inventory_model.py.

export const STOCK_IN_REASONS: Record<string, string> = {
  restock: "Restocked",
  donation: "Donated",
  correction: "Count correction",
}

export const STOCK_OUT_REASONS: Record<string, string> = {
  used: "Used in the clinic",
  damaged: "Damaged or lost",
  expired: "Expired, disposed",
  correction: "Count correction",
}

export const REASONS: Record<string, string> = {
  ...STOCK_IN_REASONS,
  ...STOCK_OUT_REASONS,
  dispensed: "Given at a visit",
  returned: "Returned from an edited visit",
}

// Until a nurse sets an item's own level, it needs reordering at this count or below.
export const DEFAULT_REORDER_LEVEL = 20

// Suggestions only; any unit can be typed.
export const UNITS = ["tablets", "capsules", "sachets", "bottles", "tubes", "pieces", "pairs", "rolls", "boxes", "packs"]

export function stockStatus(stock: number, reorderLevel?: number | null) {
  const level = reorderLevel ?? DEFAULT_REORDER_LEVEL
  if (!(stock > 0)) return { label: "Out of stock", tone: "bg-red-50 text-red-700 ring-1 ring-red-200/60" }
  if (stock <= level) return { label: "Reorder", tone: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60" }
  return { label: "In stock", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60" }
}

/** Days from today to an ISO date ("2026-11-30"); negative once it has passed. */
export function daysUntil(isoDate?: string | null) {
  if (!isoDate) return null
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return null
  const today = new Date()
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86400000)
}

export function expiryLabel(isoDate?: string | null) {
  const days = daysUntil(isoDate)
  if (days === null) return ""
  if (days < 0) return `expired ${-days} day${days === -1 ? "" : "s"} ago`
  if (days === 0) return "expires today"
  return `in ${days} day${days === 1 ? "" : "s"}`
}

export function withUnit(count: number, unit?: string | null) {
  return unit ? `${count} ${unit}` : String(count)
}

export function canManageStock() {
  return (typeof window !== "undefined" ? localStorage.getItem("role") : null) !== STAFF_ROLE_NAME
}
