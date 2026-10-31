import React from "react"
import { createPortal } from "react-dom"

interface ModalProps {
    title: string
    onClose: () => void
    children: React.ReactNode
    width?: number
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A dialog that behaves like one: screen readers announce it with its title, focus
 * starts inside it and cannot Tab out of it, Escape or the backdrop closes it, and
 * focus returns to whatever opened it.
 */
export default function Modal({ title, onClose, children, width = 520 }: ModalProps) {
    const panelRef = React.useRef<HTMLDivElement>(null)
    const onCloseRef = React.useRef(onClose)
    onCloseRef.current = onClose
    const titleId = React.useId()

    React.useEffect(() => {
        const opener = document.activeElement as HTMLElement | null
        const panel = panelRef.current
        const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        // Start in the first field when there is one, rather than on the close button.
        const firstField = panel?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])")
        ;(firstField ?? focusables()[0] ?? panel)?.focus()

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault()
                onCloseRef.current()
                return
            }
            if (event.key !== "Tab") return
            const items = focusables()
            if (items.length === 0) return
            const first = items[0]
            const last = items[items.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown)
            opener?.focus?.()
        }
    }, [])

    // Rendered straight into <body>, so the backdrop always covers the whole window,
    // whatever page layout or animation the dialog was opened from.
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => onCloseRef.current()} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="relative flex max-h-[calc(100vh-4rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
                style={{ maxWidth: width }}
            >
                <div className="flex items-center justify-between border-b border-sage-200 px-6 py-4">
                    <h2 id={titleId} className="m-0 text-lg font-semibold text-sage-900">{title}</h2>
                    <button
                        type="button"
                        onClick={() => onCloseRef.current()}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-sage-500 hover:bg-sage-100 hover:text-sage-800"
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </div>
        </div>,
        document.body,
    )
}
