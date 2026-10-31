/*
 * Enter in a form field moves to the next field; Enter in the last field submits the form,
 * the way paper forms and most clinic software behave. One listener covers every form.
 *
 * Left alone: textareas (Enter is a new line), buttons, fields outside a <form> (live search
 * boxes), and any field whose own handler already used the key (e.g. a tag picker adding a tag).
 * Add data-enter="submit" to a field to make Enter submit from it straight away.
 */

const SKIPPED_TYPES = new Set(["button", "submit", "reset", "image", "file", "hidden", "range", "color"])

function isField(el: Element): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
    return el instanceof HTMLInputElement && !SKIPPED_TYPES.has(el.type)
}

function usable(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
    if (el.disabled || el.getAttribute("aria-hidden") === "true") return false
    if ("readOnly" in el && el.readOnly) return false
    if (el.tabIndex < 0) return false
    return el.getClientRects().length > 0
}

/** The form's fields in order, with each radio group counted once (its checked option, or its first). */
function fieldsOf(form: HTMLFormElement) {
    const seenGroups = new Set<string>()
    const fields: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = []
    for (const el of Array.from(form.elements)) {
        if (!isField(el) || !usable(el)) continue
        if (el instanceof HTMLInputElement && el.type === "radio" && el.name) {
            if (seenGroups.has(el.name)) continue
            seenGroups.add(el.name)
            const group = Array.from(form.querySelectorAll<HTMLInputElement>(`input[type=radio][name="${CSS.escape(el.name)}"]`))
            fields.push(group.find(r => r.checked) ?? el)
            continue
        }
        fields.push(el)
    }
    return fields
}

function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.defaultPrevented || event.isComposing) return
    if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return
    const el = event.target
    if (!(el instanceof Element) || !isField(el) || el instanceof HTMLTextAreaElement) return
    const form = el.form
    if (!form) return

    event.preventDefault()
    if (el.dataset.enter === "submit") { form.requestSubmit(); return }

    const fields = fieldsOf(form)
    const here = el instanceof HTMLInputElement && el.type === "radio"
        ? fields.findIndex(f => f instanceof HTMLInputElement && f.type === "radio" && f.name === el.name)
        : fields.indexOf(el)
    const next = here >= 0 ? fields[here + 1] : undefined
    if (!next) { form.requestSubmit(); return }
    next.focus()
    // Ready to type over, the way Tab behaves.
    if (next instanceof HTMLInputElement && ["text", "search", "email", "tel", "number", "password", "url"].includes(next.type)) next.select()
}

/** Turns Enter-to-next on for the whole page. Returns a function that turns it off. */
export function enableEnterToNext() {
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
}
