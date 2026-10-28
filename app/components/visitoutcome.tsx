import { apiFetch } from "../api";
import React from "react"
import Modal from "./modal"
import { DISPOSITIONS, LEAVES_SCHOOL, NOTIFY_METHODS, telHref } from "../visitOutcomes"

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
        <p className="m-0 text-sm text-slate-700">
            {visit.emergency_contact_name || "Emergency contact"}:{" "}
            <a href={telHref(visit.emergency_contact_phone)} className="font-semibold text-teal-800">
                <i className="bi bi-telephone-fill mr-1" aria-hidden="true" />{visit.emergency_contact_phone}
            </a>
        </p>
    )
}

/** Record that a parent was told about the visit, and how. */
export function NotifyParentDialog({ visit, onClose, onDone }: { visit: OpenVisit; onClose: () => void; onDone: () => void }) {
    const [method, setMethod] = React.useState("call")
    const [error, setError] = React.useState("")

    async function save() {
        const response = await apiFetch("/notifyparent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visit_id: visit.visit_id, method }),
        })
        const result = await response.json()
        if (response.ok && result.success) onDone()
        else setError(result.error || "Could not save.")
    }

    return (
        <Modal title={`Notify parent of ${nameOf(visit)}`} onClose={onClose} width={440}>
            <div className="main-form-content">
                <ParentContact visit={visit} />
                <label>
                    How were they told?
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        {Object.entries(NOTIFY_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
            </div>
            <DialogButtons onCancel={onClose} onSave={save} saveLabel="Parent notified" />
        </Modal>
    )
}

/** Close a visit: how it ended, and who took the student if they left school. */
export function VisitOutcomeDialog({ visit, onClose, onDone }: { visit: OpenVisit; onClose: () => void; onDone: () => void }) {
    const [disposition, setDisposition] = React.useState("returned_to_class")
    const [referredTo, setReferredTo] = React.useState("")
    const [pickedUpBy, setPickedUpBy] = React.useState("")
    const [notifyNow, setNotifyNow] = React.useState("")
    const [error, setError] = React.useState("")
    const leaves = LEAVES_SCHOOL.has(disposition)
    const notified = Boolean(visit.parent_notified)

    async function save() {
        setError("")
        if (notifyNow) {
            await apiFetch("/notifyparent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visit_id: visit.visit_id, method: notifyNow }),
            })
        }
        const response = await apiFetch("/visitoutcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                visit_id: visit.visit_id,
                disposition,
                referred_to: referredTo,
                picked_up_by: pickedUpBy,
            }),
        })
        const result = await response.json()
        if (response.ok && result.success) onDone()
        else setError(result.error || "Could not save the outcome.")
    }

    return (
        <Modal title={`Close visit: ${nameOf(visit)}`} onClose={onClose} width={480}>
            <div className="main-form-content">
                <fieldset>
                    <legend>How did the visit end?</legend>
                    <div className="space-y-1.5">
                        {Object.entries(DISPOSITIONS).map(([value, label]) => (
                            <label key={value} style={{ display: "flex", alignItems: "center", fontWeight: 400 }}>
                                <input type="radio" name="disposition" value={value}
                                    checked={disposition === value} onChange={() => setDisposition(value)} />
                                {label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {(disposition === "referred" || disposition === "emergency") && (
                    <label>
                        {disposition === "emergency" ? "Taken to" : "Referred to"} <span className="text-red-600">*</span>
                        <input value={referredTo} onChange={(e) => setReferredTo(e.target.value)}
                            placeholder={disposition === "emergency" ? "e.g. City General Hospital" : "e.g. Dentist, guidance office, hospital"} />
                    </label>
                )}

                {leaves && (
                    <label>
                        Picked up by {disposition === "sent_home" && <span className="text-red-600">*</span>}
                        <input value={pickedUpBy} onChange={(e) => setPickedUpBy(e.target.value)}
                            placeholder="Name and relationship, e.g. Maria Cruz (mother)" />
                    </label>
                )}

                {leaves && !notified && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
                        <p className="m-0 font-semibold">The parent has not been recorded as notified.</p>
                        <div className="mt-1.5"><ParentContact visit={visit} /></div>
                        <label style={{ marginTop: "0.5rem" }}>
                            Notified now by
                            <select value={notifyNow} onChange={(e) => setNotifyNow(e.target.value)}>
                                <option value="">Not yet</option>
                                {Object.entries(NOTIFY_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                    </div>
                )}

                {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
            </div>
            <DialogButtons onCancel={onClose} onSave={save} saveLabel="Close visit" />
        </Modal>
    )
}

function DialogButtons({ onCancel, onSave, saveLabel }: { onCancel: () => void; onSave: () => void; saveLabel: string }) {
    return (
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button type="button" onClick={onCancel}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
            </button>
            <button type="button" onClick={onSave}
                className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-900">
                {saveLabel}
            </button>
        </div>
    )
}
