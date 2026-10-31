import React from "react";
import { useSearchParams } from "react-router";
import { BASIC_EDUCATION, COLLEGES, STAGES } from "../school";

/*
 * The one filter bar every table uses: search, one or two filters that are always in view,
 * a "Filters" button for the rest, and chips for what is switched on.
 *
 *   [ search ] [ quick filter ] [ Filters · 2 ]                [ Export ]
 *   [ Grade 5 x ] [ Has allergies x ]  Clear all                 34 shown
 */

export type FilterChip = { key: string; label: string; onRemove: () => void }

const pillBase = "h-9 rounded-full border px-3.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-100"
const pillIdle = "border-sage-200 bg-white text-sage-700 hover:bg-sage-50"
const pillOn = "border-brand-300 bg-brand-50 text-brand-900"

export function FilterBar({ search, quick, panel, panelCount = 0, chips = [], onClearAll, actions, summary }: {
    search?: { value: string; onChange: (value: string) => void; placeholder: string; label: string }
    /** Filters that stay in view next to the search. */
    quick?: React.ReactNode
    /** Everything else, shown when "Filters" is opened. */
    panel?: React.ReactNode
    /** How many of the panel's filters are on, for the button's badge. */
    panelCount?: number
    chips?: FilterChip[]
    onClearAll?: () => void
    actions?: React.ReactNode
    /** e.g. "34 shown", on the right of the chip row. */
    summary?: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-2.5 border-b border-sage-100 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
                {search && (
                    <label className="flex h-9 w-full items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3.5 text-sage-400 focus-within:border-brand-300 focus-within:bg-white sm:w-72">
                        <i className="bi bi-search text-sm" aria-hidden="true" />
                        <span className="sr-only">{search.label}</span>
                        <input type="search" placeholder={search.placeholder} value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            className="w-full border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400 [&::-webkit-search-cancel-button]:hidden" />
                        {search.value && (
                            <button type="button" onClick={() => search.onChange("")} aria-label="Clear search"
                                className="-mr-1 flex h-6 w-6 items-center justify-center rounded-full text-sage-400 hover:bg-sage-100 hover:text-sage-700">
                                <i className="bi bi-x-lg text-xs" aria-hidden="true" />
                            </button>
                        )}
                    </label>
                )}
                {quick}
                {panel && <FiltersButton count={panelCount}>{panel}</FiltersButton>}
                {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
            </div>

            {(chips.length > 0 || summary) && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {chips.map(chip => (
                        <span key={chip.key} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-900 ring-1 ring-brand-200/70">
                            {chip.label}
                            <button type="button" onClick={chip.onRemove} aria-label={`Remove filter: ${chip.label}`}
                                className="flex h-5 w-5 items-center justify-center rounded-full text-brand-700 hover:bg-brand-100">
                                <i className="bi bi-x text-sm" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                    {chips.length > 1 && onClearAll && (
                        <button type="button" onClick={onClearAll} className="ml-1 text-xs font-medium text-sage-500 hover:text-sage-900 hover:underline">
                            Clear all
                        </button>
                    )}
                    {summary && <span className="ml-auto text-xs text-sage-500" aria-live="polite">{summary}</span>}
                </div>
            )}
        </div>
    )
}

/** "Filters" and its panel: a dropdown on wide screens, a sheet from the bottom on phones. */
function FiltersButton({ count, children }: { count: number; children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const wrapper = React.useRef<HTMLDivElement>(null)
    const panelId = React.useId()

    React.useEffect(() => {
        if (!open) return
        const onPointer = (event: PointerEvent) => {
            if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
        document.addEventListener("pointerdown", onPointer)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onPointer)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <div ref={wrapper} className="relative">
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={panelId}
                className={`${pillBase} inline-flex items-center gap-2 font-medium ${count > 0 || open ? pillOn : pillIdle}`}>
                <i className="bi bi-sliders2" aria-hidden="true" /> Filters
                {count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-800 px-1.5 text-[11px] font-semibold text-white">{count}</span>
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" aria-hidden="true" />
                    <div id={panelId} role="dialog" aria-label="Filters"
                        className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-80 sm:rounded-2xl sm:p-4 sm:shadow-xl sm:ring-1 sm:ring-sage-200">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="m-0 text-sm font-semibold text-sage-900">Filters</p>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close filters"
                                className="flex h-7 w-7 items-center justify-center rounded-full text-sage-500 hover:bg-sage-100">
                                <i className="bi bi-x-lg text-xs" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3.5">{children}</div>
                        <button type="button" onClick={() => setOpen(false)}
                            className="mt-4 w-full rounded-xl bg-brand-800 py-2.5 text-sm font-semibold text-white hover:bg-brand-900">
                            Done
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

type Options = ([string, string] | { group: string; options: [string, string][] })[]

function renderOptions(options: Options) {
    return options.map(option => Array.isArray(option)
        ? <option key={option[0]} value={option[0]}>{option[1]}</option>
        : (
            <optgroup key={option.group} label={option.group}>
                {option.options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </optgroup>
        ))
}

/** A filter that stays in view: a pill-shaped select, highlighted when set. */
export function QuickSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (value: string) => void; options: Options
}) {
    return (
        <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
            className={`${pillBase} pr-8 ${value ? pillOn : pillIdle}`}>
            {renderOptions(options)}
        </select>
    )
}

/** Two or three choices side by side, e.g. Active / Archived. */
export function QuickToggle<T extends string | boolean>({ label, value, onChange, options }: {
    label: string; value: T; onChange: (value: T) => void; options: [T, string][]
}) {
    return (
        <div role="group" aria-label={label} className="inline-flex h-9 items-center rounded-full bg-sage-100 p-1">
            {options.map(([optionValue, text]) => (
                <button key={String(optionValue)} type="button" aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}
                    className={`h-7 rounded-full px-3 text-xs font-medium transition ${value === optionValue ? "bg-white text-sage-900 shadow-sm" : "text-sage-500 hover:text-sage-800"}`}>
                    {text}
                </button>
            ))}
        </div>
    )
}

/** A labelled select inside the Filters panel. */
export function PanelSelect({ label, value, onChange, options }: {
    label: string; value: string; onChange: (value: string) => void; options: Options
}) {
    const id = React.useId()
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-xs font-medium text-sage-600">{label}</label>
            <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
                className={`h-10 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-brand-100 ${value ? "border-brand-300 bg-brand-50/50 text-brand-900" : "border-sage-200 bg-white text-sage-800"}`}>
                {renderOptions(options)}
            </select>
        </div>
    )
}

/** Yes/no filters inside the panel, under one small heading. */
export function PanelChecks({ label, items }: {
    label: string; items: { label: string; checked: boolean; onChange: (value: boolean) => void }[]
}) {
    return (
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
            <legend className="mb-1.5 p-0 text-xs font-medium text-sage-600">{label}</legend>
            {items.map(item => (
                <label key={item.label} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-sage-800 hover:bg-sage-50">
                    <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} className="h-4 w-4 accent-brand-800" />
                    {item.label}
                </label>
            ))}
        </fieldset>
    )
}

/* ---------- Date range: one dropdown, with dates only for "Custom" ---------- */

export type DateRange = { key: string; from: string; to: string }
export type RangeChoice = { key: string; label: string; from: () => string; to: () => string }

/** A preset period (Today, This week, ...) or Custom, which shows two date fields. */
export function DateRangeSelect({ ranges, value, onChange, idleKey = "all" }: {
    ranges: RangeChoice[]; value: DateRange; onChange: (value: DateRange) => void
    /** The choice that means "no date filter", shown unhighlighted. */
    idleKey?: string
}) {
    function choose(key: string) {
        const preset = ranges.find(r => r.key === key)
        onChange(preset ? { key, from: preset.from(), to: preset.to() } : { ...value, key: "custom" })
    }
    const fieldClass = "h-9 rounded-full border border-sage-200 bg-white px-3 text-sm text-sage-800 outline-none focus:ring-2 focus:ring-brand-100"
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <i className="bi bi-calendar3 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-sage-500" aria-hidden="true" />
                <select aria-label="Dates" value={value.key} onChange={(e) => choose(e.target.value)}
                    className={`${pillBase} pl-8 pr-8 ${value.key !== idleKey ? pillOn : pillIdle}`}>
                    {ranges.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    <option value="custom">Custom dates…</option>
                </select>
            </div>
            {value.key === "custom" && (
                <>
                    <input type="date" aria-label="From" value={value.from} max={value.to || undefined}
                        onChange={(e) => onChange({ ...value, from: e.target.value })} className={fieldClass} />
                    <span className="text-xs text-sage-400">to</span>
                    <input type="date" aria-label="To" value={value.to} min={value.from || undefined}
                        onChange={(e) => onChange({ ...value, to: e.target.value })} className={fieldClass} />
                </>
            )}
        </div>
    )
}

/* ---------- Grade / department: one select for what used to be two ---------- */

/**
 * Basic Education stages and college departments in one grouped list.
 * Values are "stage:<key>" or "dept:<name>"; "" means everyone.
 */
export function gradeOptions(extraDepartments: string[] = []): Options {
    const colleges = [...COLLEGES, ...extraDepartments.filter(d => d !== BASIC_EDUCATION && !(COLLEGES as readonly string[]).includes(d))]
    return [
        ["", "All grades and departments"],
        {
            group: BASIC_EDUCATION, options: [
                [`dept:${BASIC_EDUCATION}`, "All of Basic Education"],
                ...Object.entries(STAGES).map(([key, s]) => [`stage:${key}`, s.label] as [string, string]),
            ]
        },
        { group: "College", options: colleges.map(d => [`dept:${d}`, d] as [string, string]) },
    ]
}

/** The grade select's value for a department/stage pair, and back. */
export function gradeValue(department: string, stage: string) {
    return stage ? `stage:${stage}` : department ? `dept:${department}` : ""
}
export function parseGrade(value: string) {
    return {
        department: value.startsWith("dept:") ? value.slice(5) : "",
        stage: value.startsWith("stage:") ? value.slice(6) : "",
    }
}
export function gradeLabel(department: string, stage: string) {
    return stage ? STAGES[stage as keyof typeof STAGES]?.label ?? stage : department
}

/* ---------- Keeping filters in the page address ---------- */

type UrlValues = Record<string, string | boolean>

/**
 * Filter values kept in the URL, so Back from a record returns to the same filtered list
 * and a filtered list can be bookmarked. Values left at their default stay out of the URL.
 */
export function useUrlFilters<T extends { [K in keyof T]: string | boolean }>(defaults: T): [T, (next: T) => void] {
    const [params, setParams] = useSearchParams()

    const values = React.useMemo(() => {
        const read = { ...defaults } as UrlValues
        for (const key of Object.keys(defaults)) {
            const raw = params.get(key)
            if (raw === null) continue
            read[key] = typeof (defaults as UrlValues)[key] === "boolean" ? raw === "1" : raw
        }
        return read as T
        // defaults is a constant object at each call site
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params])

    const setValues = React.useCallback((next: T) => {
        setParams(current => {
            const updated = new URLSearchParams(current)
            for (const key of Object.keys(defaults)) {
                const value = (next as UrlValues)[key]
                if (value === (defaults as UrlValues)[key] || value === "" || value === false) updated.delete(key)
                else updated.set(key, value === true ? "1" : String(value))
            }
            return updated
        }, { replace: true, preventScrollReset: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setParams])

    return [values, setValues]
}
