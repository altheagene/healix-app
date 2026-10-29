// A short "Saved" style notice after a dialog closes, shown by <Notices> in root.tsx.
// Replaces browser alert() popups, which block the page and look out of place.

export const NOTICE_EVENT = "healix-notice"

export type NoticeTone = "success" | "error"

export function notify(text: string, tone: NoticeTone = "success") {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { text, tone } }))
}
