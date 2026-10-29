import { apiFetch } from "../api";
import React from "react"
import { DISPOSITIONS, LEAVES_SCHOOL, NOTIFY_METHODS, telHref } from "../visitOutcomes"
import { ChoiceGroup, Field, ModalForm, inputClass, selectClass } from "./form"
import { notify } from "../notify"

export interface OpenVisit {
    visit_id: number
    first_name?: string
    last_name?: string
    patient_name?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    parent_notified?: boolean | number
}

function nameOf(visit: OpenVisit) {
    return visit.patient_name || `${visit.first_name ?? ""} ${visit.last_name ?? ""}`.trim() || "this student"
}

function ParentContact({ visit }: { visit: OpenVisit }) {
    if (!visit.emergency_contact_phone) {
        return <p className="m-0 text-sm text-rose-700">No emergency contact phone on file.</p>
    }
    return (
        <p className="m-0 text-sm text-sage-700">
            {visit.emergency_contact_name || "Emergency contact"}:{" "}
            <a href={telHref(visit.emergency_contact_phone)} className="font-semibold text-brand-800">
                <i className="bi bi-telephone-fill mr-1" aria-hidden="true" />{visit.emergency_contact_phone}
            </a>
        </p>
    )
}

const METHOD_OPTIONS = Object.entries(NOTIFY_METHODS) as [string, string][]

async function post(path: string, body: object) {
    const response = await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .catch(() => null)
    const result = await response?.json().catch(() => ({}))
    return { ok: Boolean(response?.ok && result?.success), error: result?.error as string | undefined }
}

/** Record that a parent was told about the visit, and how. */
export function NotifyParentDialog({ visit, onClose, onDone }: { visit: OpenVisit; onClose: () => void; onDone: () => void }) {
    const [method, setMethod] = React.useState("call")
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")

    async function save() {
        setSaving(true)
        const { ok, error: problem } = await post("/notifyparent", { visit_id: visit.visit_id, method })
        setSaving(false)
        if (!ok) return setError(problem || "Could not save.")
        notify(`Recorded that ${nameOf(visit)}'s parent was told.`)
        onDone()
    }

    return (
        <ModalForm title={`Notify parent of ${nameOf(visit)}`} onClose={onClose} onSubmit={save} width={460}
            submitLabel="Parent notified" saving={saving} error={error}>
            <div className="rounded-xl bg-sage-50 px-4 py-3"><ParentContact visit={visit} /></div>
            <ChoiceGroup legend="How were they told?" name="notify-method" value={method} options={METHOD_OPTIONS} onChange={setMethod} />
        </ModalForm>
    )
}

/** Close a visit: how it ended, and who took the student if they left school. */
export function VisitOutcomeDialog({ visit, onClose, onDone }: { visit: OpenVisit; onClose: () => void; onDone: () => void }) {
    const [disposition, setDisposition] = React.useState("returned_to_class")
    const [referredTo, setReferredTo] = React.useState("")
    const [pickedUpBy, setPickedUpBy] = React.useState("")
    const [notifyNow, setNotifyNow] = React.useState("")
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const leaves = LEAVES_SCHOOL.has(disposition)
    const notified = Boolean(visit.parent_notified)
    const goesTo = disposition === "referred" || disposition === "emergency"

    async function save() {
        if (goesTo && !referredTo.trim()) return setError(disposition === "emergency" ? "Say where the student was taken." : "Say where the student was referred.")
        if (disposition === "sent_home" && !pickedUpBy.trim()) return setError("Say who picked the student up.")
        setSaving(true)
        setError("")
        if (notifyNow) await post("/notifyparent", { visit_id: visit.visit_id, method: notifyNow })
        const { ok, error: problem } = await post("/visitoutcome", {
            visit_id: visit.visit_id, disposition, referred_to: referredTo, picked_up_by: pickedUpBy,
        })
        setSaving(false)
        if (!ok) return setError(problem || "Could not save the outcome.")
        notify(`${nameOf(visit)}'s visit is closed.`)
        onDone()
    }

    return (
        <ModalForm title={`Close visit: ${nameOf(visit)}`} onClose={onClose} onSubmit={save} width={500}
            submitLabel="Close visit" saving={saving} error={error}>
            <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 p-0 text-xs font-semibold text-sage-700">How did the visit end?</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(DISPOSITIONS).map(([value, label]) => {
                        const selected = disposition === value
                        return (
                            <label key={value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-brand-100 ${selected ? "border-brand-400 bg-brand-50 font-semibold text-brand-900" : "border-sage-200 text-sage-700 hover:bg-sage-50"}`}>
                                <input type="radio" name="disposition" value={value} checked={selected} onChange={() => setDisposition(value)}
                                    className="h-4 w-4 accent-brand-800" />
                                {label}
                            </label>
                        )
                    })}
                </div>
            </fieldset>

            {goesTo && (
                <Field label={disposition === "emergency" ? "Taken to" : "Referred to"} htmlFor="outcome-referred" required>
                    <input id="outcome-referred" className={inputClass} value={referredTo} onChange={(e) => setReferredTo(e.target.value)}
                        placeholder={disposition === "emergency" ? "e.g. City General Hospital" : "e.g. Dentist, guidance office, hospital"} />
                </Field>
            )}
            {leaves && (
                <Field label="Picked up by" htmlFor="outcome-picked-up" required={disposition === "sent_home"}>
                    <input id="outcome-picked-up" className={inputClass} value={pickedUpBy} onChange={(e) => setPickedUpBy(e.target.value)}
                        placeholder="Name and relationship, e.g. Maria Cruz (mother)" />
                </Field>
            )}
            {leaves && !notified && (
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="m-0 font-semibold"><i className="bi bi-exclamation-triangle mr-1.5" aria-hidden="true" />The parent has not been recorded as told.</p>
                    <ParentContact visit={visit} />
                    <Field label="Told them now by" htmlFor="outcome-notify">
                        <select id="outcome-notify" className={selectClass} value={notifyNow} onChange={(e) => setNotifyNow(e.target.value)}>
                            <option value="">Not yet</option>
                            {METHOD_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </Field>
                </div>
            )}
        </ModalForm>
    )
}
