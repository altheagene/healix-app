import { apiFetch } from "../api";
import React from "react";
import { ChoiceGroup, Field, ModalForm, inputClass } from "./form";
import { daysUntil, withUnit } from "../inventory";
import { notify } from "../notify";

/** Takes what is left in a batch off the shelf, recording why and how many. */
export default function DisposeBatch({ batch, onClose, onDone }: {
    batch: { batch_id: number; batch_number: string; stock_level: number; supply_name: string; unit?: string | null; expiration_date?: string }
    onClose: () => void
    onDone: () => void
}) {
    const expired = (daysUntil(batch.expiration_date) ?? 0) < 0
    const [reason, setReason] = React.useState<"expired" | "damaged">(expired ? "expired" : "damaged")
    const [note, setNote] = React.useState("")
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")

    async function submit() {
        setSaving(true)
        setError("")
        const response = await apiFetch("/disposebatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batch_id: batch.batch_id, reason, note }),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (response?.ok && result?.success) {
            notify(`Disposed of ${withUnit(batch.stock_level, batch.unit)} of ${batch.supply_name}.`)
            onDone()
        } else {
            setError(result?.error || "Could not dispose of this batch.")
        }
    }

    return (
        <ModalForm title={`Dispose of ${batch.supply_name}`} onClose={onClose} onSubmit={submit} width={460}
            submitLabel="Dispose" danger saving={saving} error={error}>
            <p className="m-0 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">
                Batch <span className="font-semibold text-sage-900">{batch.batch_number}</span>:{" "}
                <span className="font-semibold text-sage-900">{withUnit(batch.stock_level, batch.unit)}</span> will be
                removed from stock and the batch switched off.
            </p>
            <ChoiceGroup legend="Reason" name="dispose-reason" value={reason} onChange={setReason}
                options={[["expired", "Expired"], ["damaged", "Damaged or lost"]] as const} />
            <Field label="Note" htmlFor="dispose-note" optional>
                <input id="dispose-note" className={inputClass} maxLength={300} value={note}
                    placeholder="e.g. Returned to the pharmacy" onChange={(e) => setNote(e.target.value)} />
            </Field>
        </ModalForm>
    )
}
