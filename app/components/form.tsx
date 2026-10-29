import React from "react"
import Modal from "./modal"

/*
 * The pieces every dialog form is built from, so they all look and behave alike:
 * one input style, labelled fields with help text, sections for long forms, and a
 * footer that stays in view while the form scrolls.
 */

export const inputClass =
    "block w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none transition " +
    "placeholder:text-sage-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 " +
    "disabled:bg-sage-50 disabled:text-sage-500 aria-[invalid=true]:border-red-300"
export const selectClass = inputClass
export const textareaClass = `${inputClass} min-h-[88px] resize-y`

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
export const primaryButton = `${buttonBase} bg-brand-800 text-white hover:bg-brand-900`
export const secondaryButton = `${buttonBase} border border-sage-200 bg-white text-sage-700 hover:bg-sage-50`
export const dangerButton = `${buttonBase} bg-red-700 text-white hover:bg-red-800`

/** A dialog whose body is a form: Enter submits, Escape cancels, the footer stays visible. */
export function ModalForm({
    title, onClose, onSubmit, submitLabel = "Save", saving = false, savingLabel = "Saving...", error, width = 560,
    submitDisabled = false, danger = false, footerStart, children,
}: {
    title: string
    onClose: () => void
    onSubmit: () => void
    submitLabel?: string
    saving?: boolean
    savingLabel?: string
    error?: React.ReactNode
    width?: number
    submitDisabled?: boolean
    danger?: boolean
    /** Something to show at the left of the footer, such as a "Delete" link. */
    footerStart?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <Modal title={title} onClose={onClose} width={width}>
            <form noValidate onSubmit={(event) => { event.preventDefault(); if (!saving) onSubmit() }}
                className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    {error && <FormError>{error}</FormError>}
                    {children}
                </div>
                <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-t border-sage-100 bg-white px-6 py-4">
                    <div className="mr-auto">{footerStart}</div>
                    <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
                    <button type="submit" disabled={saving || submitDisabled} className={danger ? dangerButton : primaryButton}>
                        {saving ? savingLabel : submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export function FormError({ children }: { children: React.ReactNode }) {
    return (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <i className="bi bi-exclamation-circle mt-0.5" aria-hidden="true" />
            <div>{children}</div>
        </div>
    )
}

/** A labelled field. Pass the input as children, with an id matching htmlFor. */
export function Field({ label, htmlFor, required, optional, hint, className = "", children }: {
    label: React.ReactNode
    htmlFor?: string
    required?: boolean
    optional?: boolean
    hint?: React.ReactNode
    className?: string
    children: React.ReactNode
}) {
    const hintId = htmlFor && hint ? `${htmlFor}-hint` : undefined
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-sage-700">
                {label}
                {required && <span className="text-red-600" aria-hidden="true"> *</span>}
                {optional && <span className="font-normal text-sage-400"> (optional)</span>}
            </label>
            {hintId && React.isValidElement(children)
                ? React.cloneElement(children as React.ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": hintId })
                : children}
            {hint && <p id={hintId} className="m-0 mt-1.5 text-xs text-sage-500">{hint}</p>}
        </div>
    )
}

/** A titled group of fields, laid out in columns on wider screens. */
export function Section({ title, description, columns = 2, children }: {
    title?: string
    description?: React.ReactNode
    columns?: 1 | 2 | 3
    children: React.ReactNode
}) {
    const grid = columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            {title && <legend className="mb-3 p-0 text-sm font-semibold text-sage-900">{title}</legend>}
            {description && <p className="m-0 -mt-2 mb-3 text-xs text-sage-500">{description}</p>}
            <div className={`grid grid-cols-1 gap-4 ${grid}`}>{children}</div>
        </fieldset>
    )
}

/** A checkbox with a title and an explanation, shown as a tappable card. */
export function CheckboxCard({ checked, onChange, label, description, className = "" }: {
    checked: boolean
    onChange: (checked: boolean) => void
    label: React.ReactNode
    description?: React.ReactNode
    className?: string
}) {
    return (
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${checked ? "border-brand-300 bg-brand-50" : "border-sage-200 bg-white hover:bg-sage-50"} ${className}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-800" />
            <span className="text-sm text-sage-900">
                <span className="font-medium">{label}</span>
                {description && <span className="mt-0.5 block text-xs text-sage-500">{description}</span>}
            </span>
        </label>
    )
}

/** Choices shown as buttons in a row; behaves as a radio group. */
export function ChoiceGroup<T extends string>({ legend, name, value, options, onChange, required }: {
    legend: string
    name: string
    value: T | "" | null | undefined
    options: readonly (readonly [T, string])[]
    onChange: (value: T) => void
    required?: boolean
}) {
    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-1.5 p-0 text-xs font-semibold text-sage-700">
                {legend}{required && <span className="text-red-600" aria-hidden="true"> *</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
                {options.map(([key, text]) => {
                    const selected = value === key
                    return (
                        <label key={key} className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm transition focus-within:ring-2 focus-within:ring-brand-100 ${selected ? "border-brand-400 bg-brand-50 font-semibold text-brand-900" : "border-sage-200 bg-white text-sage-700 hover:bg-sage-50"}`}>
                            <input type="radio" name={name} value={key} checked={selected} onChange={() => onChange(key)} className="sr-only" />
                            {text}
                        </label>
                    )
                })}
            </div>
        </fieldset>
    )
}
