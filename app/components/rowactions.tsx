import React from "react"
import { createPortal } from "react-dom"

/*
 * The ⋮ menu at the end of every table row. The row's name opens the record; this
 * menu holds the rest. Destructive actions go last, in red, below a divider.
 */

export interface RowAction {
    label: string
    icon: string
    onSelect: () => void
    danger?: boolean
    disabled?: boolean
    /** Leave the action out, e.g. when the user's role cannot do it. */
    hidden?: boolean
}

const MENU_WIDTH = 208

export default function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
    const shown = actions.filter(a => !a.hidden)
    const ordered = [...shown.filter(a => !a.danger), ...shown.filter(a => a.danger)]
    const [open, setOpen] = React.useState(false)
    const [place, setPlace] = React.useState<React.CSSProperties>({})
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const menuId = React.useId()

    const close = React.useCallback((returnFocus = true) => {
        setOpen(false)
        if (returnFocus) buttonRef.current?.focus()
    }, [])

    function toggle() {
        if (open) return close()
        const rect = buttonRef.current!.getBoundingClientRect()
        const height = ordered.length * 40 + 16
        const opensUp = rect.bottom + height > window.innerHeight - 8 && rect.top > height
        setPlace({
            position: "fixed",
            // Kept on screen on narrow phones.
            left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
            ...(opensUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
            width: MENU_WIDTH,
        })
        setOpen(true)
    }

    React.useEffect(() => {
        if (!open) return
        const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not([disabled])") ?? [])
        items()[0]?.focus()
        function onPointer(event: MouseEvent) {
            if (!menuRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) close(false)
        }
        // The menu is placed against the window, so it would drift away from its row.
        function onMove() { close(false) }
        document.addEventListener("mousedown", onPointer)
        window.addEventListener("resize", onMove)
        window.addEventListener("scroll", onMove, true)
        return () => {
            document.removeEventListener("mousedown", onPointer)
            window.removeEventListener("resize", onMove)
            window.removeEventListener("scroll", onMove, true)
        }
    }, [open, close])

    function onMenuKey(event: React.KeyboardEvent) {
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not([disabled])") ?? [])
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
        const go = (i: number) => { event.preventDefault(); items[(i + items.length) % items.length]?.focus() }
        if (event.key === "ArrowDown") go(index + 1)
        else if (event.key === "ArrowUp") go(index - 1)
        else if (event.key === "Home") go(0)
        else if (event.key === "End") go(items.length - 1)
        else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close() }
        else if (event.key === "Tab") close(false)
    }

    if (!ordered.length) return null
    const firstDanger = ordered.findIndex(a => a.danger)
    return (
        <>
            <button ref={buttonRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={(e) => { e.stopPropagation(); toggle() }}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sage-500 transition hover:bg-sage-100 hover:text-sage-900 sm:h-8 sm:w-8 ${open ? "bg-sage-100 text-sage-900" : ""}`}>
                <i className="bi bi-three-dots-vertical" aria-hidden="true" />
            </button>
            {open && typeof document !== "undefined" && createPortal(
                <div ref={menuRef} id={menuId} role="menu" aria-label={label} style={place} onKeyDown={onMenuKey}
                    onClick={(e) => e.stopPropagation()}
                    className="z-[60] overflow-hidden rounded-xl border border-sage-200 bg-white py-1 text-left shadow-lg">
                    {ordered.map((action, i) => (
                        <React.Fragment key={action.label}>
                            {i === firstDanger && i > 0 && <div role="separator" className="my-1 border-t border-sage-100" />}
                            <button type="button" role="menuitem" disabled={action.disabled}
                                onClick={() => { close(false); action.onSelect() }}
                                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${action.danger ? "text-red-700 hover:bg-red-50 focus:bg-red-50" : "text-sage-800 hover:bg-sage-50 focus:bg-sage-50"}`}>
                                <i className={`bi ${action.icon} w-4 text-center`} aria-hidden="true" />
                                {action.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>,
                document.body,
            )}
        </>
    )
}

/** A small labelled button for a status action that stays in the row, e.g. "Close visit". */
export const inlineActionClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"

/** The class for a name cell that opens its record. */
export const rowLinkClass = "text-left font-medium text-sage-900 no-underline hover:text-brand-800 hover:underline"
