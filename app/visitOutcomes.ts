// Must match backend/models/visit_outcome_model.py.

export const DISPOSITIONS: Record<string, string> = {
  returned_to_class: "Returned to class",
  rested_returned: "Rested, then returned to class",
  sent_home: "Sent home",
  referred: "Referred",
  emergency: "Emergency transfer",
}

export const NOTIFY_METHODS: Record<string, string> = {
  call: "Phone call",
  sms: "Text message",
  in_person: "In person",
  email: "Email",
  other: "Other",
}

// Short forms for badges in tables, where the full wording wraps badly.
export const DISPOSITION_SHORT: Record<string, string> = {
  returned_to_class: "Back to class",
  rested_returned: "Rested, returned",
  sent_home: "Sent home",
  referred: "Referred",
  emergency: "Emergency",
}

// Outcomes where the student leaves school with someone, so a parent must know.
export const LEAVES_SCHOOL = new Set(["sent_home", "referred", "emergency"])

export const DISPOSITION_TONES: Record<string, string> = {
  returned_to_class: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rested_returned: "bg-emerald-50 text-emerald-800 border-emerald-200",
  sent_home: "bg-amber-50 text-amber-800 border-amber-200",
  referred: "bg-sky-50 text-sky-800 border-sky-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
}

/** "2026-10-28 09:15:00" in the clinic's own time zone, not UTC. */
export function localDateTime(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function durationLabel(minutes: number | null | undefined) {
  if (minutes == null) return ""
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${minutes % 60} min`
}

export function telHref(phone: string | number | null | undefined) {
  return `tel:${String(phone ?? "").replace(/[^\d+]/g, "")}`
}
