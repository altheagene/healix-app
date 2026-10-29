import React from "react"
import { NOTICE_EVENT, type NoticeTone } from "../notify"

interface Notice { id: number; text: string; tone: NoticeTone }

/** Shows notify() messages in the corner for a few seconds. Screen readers read them out. */
export default function Notices() {
    const [notices, setNotices] = React.useState<Notice[]>([])

    React.useEffect(() => {
        let next = 0
        function onNotice(event: Event) {
            const { text, tone } = (event as CustomEvent<{ text: string; tone: NoticeTone }>).detail
            const id = ++next
            setNotices(current => [...current, { id, text, tone }])
            setTimeout(() => setNotices(current => current.filter(n => n.id !== id)), tone === "error" ? 6000 : 3500)
        }
        window.addEventListener(NOTICE_EVENT, onNotice)
        return () => window.removeEventListener(NOTICE_EVENT, onNotice)
    }, [])

    return (
        <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
            {notices.map(n => (
                <div key={n.id} role={n.tone === "error" ? "alert" : "status"}
                    className={`pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${n.tone === "error" ? "bg-red-700 text-white" : "bg-brand-800 text-white"}`}>
                    <i className={`bi ${n.tone === "error" ? "bi-exclamation-circle" : "bi-check-circle-fill text-leaf-300"} mt-0.5`} aria-hidden="true" />
                    <span className="flex-1">{n.text}</span>
                    <button type="button" aria-label="Dismiss" onClick={() => setNotices(current => current.filter(x => x.id !== n.id))}
                        className="opacity-70 hover:opacity-100">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>
            ))}
        </div>
    )
}
