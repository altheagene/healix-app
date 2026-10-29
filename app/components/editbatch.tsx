import { apiFetch } from "../api";
import React from "react"
import { CheckboxCard, Field, ModalForm, inputClass } from "./form"
import { notify } from "../notify"

export default function EditBatch(props: any) {
    const batch = props.batch || {}
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const [noExpirationDate, setNoExpirationDate] = React.useState(!batch.expiration_date)
    const [details, setDetails] = React.useState({ batch_number: batch.batch_number || "", expiration_date: batch.expiration_date || "" })

    async function save() {
        if (!details.batch_number.trim()) return setError("Enter the batch number.")
        if (!noExpirationDate && !details.expiration_date) return setError("Choose the expiry date, or tick that this batch has none.")

        setSaving(true)
        setError("")
        const response = await apiFetch("/editbatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                batch_id: batch.batch_id,
                batch_number: details.batch_number.trim(),
                expiration_date: noExpirationDate ? null : details.expiration_date,
            }),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || !result?.success) {
            setError(result?.error || "Could not save this batch.")
            return
        }
        notify("Batch updated.")
        props.refetch()
        props.refetchDetails?.()
        props.hideForm()
    }

    return (
        <ModalForm title="Edit batch" onClose={props.hideForm} onSubmit={save} saving={saving} error={error} width={480}>
            <Field label="Batch number" htmlFor="edit-batch-number" required>
                <input id="edit-batch-number" className={inputClass} value={details.batch_number} autoComplete="off"
                    onChange={(e) => setDetails({ ...details, batch_number: e.target.value })} />
            </Field>
            <div className="space-y-2">
                <Field label="Expiry date" htmlFor="edit-batch-expiry" required={!noExpirationDate}
                    hint="A date in the past switches the batch off at once, so it is never given out.">
                    <input id="edit-batch-expiry" type="date" className={inputClass} disabled={noExpirationDate} value={details.expiration_date}
                        onChange={(e) => setDetails({ ...details, expiration_date: e.target.value })} />
                </Field>
                <CheckboxCard checked={noExpirationDate} label="This batch has no expiry date"
                    onChange={(checked) => { setNoExpirationDate(checked); if (checked) setDetails({ ...details, expiration_date: "" }) }} />
            </div>
            <p className="m-0 text-xs text-sage-500">To change how many are in this batch, use Edit Stock, so the change is recorded with a reason.</p>
        </ModalForm>
    )
}
