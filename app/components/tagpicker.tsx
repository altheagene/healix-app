import React from "react"
import { inputClass } from "./form"

export interface TagOption { id: number; name: string }

const TONES = {
    red: "bg-red-50 text-red-700 ring-red-200/70",
    citron: "bg-citron-100 text-brand-900 ring-citron-400/60",
}

/**
 * Pick several items from a list, such as allergies: every choice shows as a chip
 * that can be removed, the list filters as you type, and a name that is not in the
 * list can be added to it.
 */
export default function TagPicker({ id, label, options, selected, onChange, onCreate, tone = "citron", placeholder }: {
    id: string
    label: string
    options: TagOption[]
    selected: number[]
    onChange: (selected: number[]) => void
    onCreate?: (name: string) => Promise<number | null>
    tone?: keyof typeof TONES
    placeholder?: string
}) {
    const [query, setQuery] = React.useState("")
    const [open, setOpen] = React.useState(false)
    const boxRef = React.useRef<HTMLDivElement>(null)
    const listId = `${id}-options`

    React.useEffect(() => {
        if (!open) return
        function onPointer(event: MouseEvent) {
            if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener("mousedown", onPointer)
        return () => document.removeEventListener("mousedown", onPointer)
    }, [open])

    const chosen = options.filter(o => selected.includes(o.id))
    const term = query.trim().toLowerCase()
    const matches = options.filter(o => !term || o.name.toLowerCase().includes(term))
    const canCreate = Boolean(onCreate && term && !options.some(o => o.name.toLowerCase() === term))

    function toggle(optionId: number) {
        onChange(selected.includes(optionId) ? selected.filter(x => x !== optionId) : [...selected, optionId])
    }

    async function create() {
        if (!onCreate) return
        const newId = await onCreate(query.trim())
        if (newId !== null) {
            onChange([...selected, newId])
            setQuery("")
        }
    }

    return (
        <div ref={boxRef} className="relative">
            <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-sage-700">
                {label} <span className="font-normal text-sage-400">(optional)</span>
            </label>
            {chosen.length > 0 && (
                <ul className="m-0 mb-2 flex list-none flex-wrap gap-1.5 p-0" aria-label={`${label} chosen`}>
                    {chosen.map(o => (
                        <li key={o.id} className={`inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium ring-1 ${TONES[tone]}`}>
                            {o.name}
                            <button type="button" onClick={() => toggle(o.id)} aria-label={`Remove ${o.name}`}
                                className="flex h-5 w-5 items-center justify-center rounded-full opacity-70 hover:bg-white/70 hover:opacity-100">
                                <i className="bi bi-x" aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <input id={id} type="text" role="combobox" aria-expanded={open} aria-controls={listId} autoComplete="off"
                className={inputClass} placeholder={placeholder || `Search ${label.toLowerCase()}`} value={query}
                onFocus={() => setOpen(true)}
                onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                onKeyDown={(e) => {
                    if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false) }
                    // Enter picks the only match, or adds a new name, instead of submitting the form.
                    if (e.key === "Enter" && open && term) {
                        e.preventDefault()
                        if (matches.length === 1) { toggle(matches[0].id); setQuery("") } else if (canCreate) create()
                    }
                }} />
            {open && (
                <ul id={listId} role="listbox" aria-multiselectable="true"
                    className="absolute z-30 mt-1.5 max-h-52 w-full list-none overflow-y-auto rounded-xl border border-sage-200 bg-white p-1 shadow-lg">
                    {matches.map(o => {
                        const isChosen = selected.includes(o.id)
                        return (
                            <li key={o.id} role="option" aria-selected={isChosen}>
                                <button type="button" onClick={() => toggle(o.id)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${isChosen ? "bg-brand-50 font-medium text-brand-900" : "text-sage-700 hover:bg-sage-50"}`}>
                                    {o.name}
                                    {isChosen && <i className="bi bi-check-lg text-brand-800" aria-hidden="true" />}
                                </button>
                            </li>
                        )
                    })}
                    {canCreate && (
                        <li>
                            <button type="button" onClick={create}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-800 hover:bg-brand-50">
                                <i className="bi bi-plus-lg" aria-hidden="true" /> Add "{query.trim()}" to the list
                            </button>
                        </li>
                    )}
                    {!matches.length && !canCreate && <li className="px-3 py-2 text-sm text-sage-400">Nothing matches.</li>}
                </ul>
            )}
        </div>
    )
}

/** Loads a list (allergies or conditions) and lets new names be added to it. */
export function useTagList(kind: "allergy" | "condition") {
    const [options, setOptions] = React.useState<TagOption[]>([])
    const plural = kind === "allergy" ? "allergies" : "conditions"
    const nameKey = `${kind}_name`
    const idKey = `${kind}_id`

    React.useEffect(() => {
        import("../api").then(({ apiFetch }) => apiFetch(`/get${plural}`)
            .then(res => res.json())
            .then((rows: Record<string, any>[]) => setOptions(
                (Array.isArray(rows) ? rows : [])
                    .map(row => ({ id: row[idKey], name: row[nameKey] }))
                    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
            )))
    }, [plural, idKey, nameKey])

    async function create(name: string) {
        const { apiFetch } = await import("../api")
        const response = await apiFetch(kind === "allergy" ? "/addnewallergy" : "/addnewcondition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [nameKey]: name }),
        })
        const result = await response.json().catch(() => ({}))
        if (!result.success) return null
        setOptions(current => [...current, { id: result.id, name }].sort((a, b) => a.name.localeCompare(b.name)))
        return result.id as number
    }

    return { options, create }
}
