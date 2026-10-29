import { apiFetch } from "../api";
import React from "react"
import { useParams } from "react-router"
import { CheckboxCard, Field, ModalForm, Section, inputClass, selectClass } from "./form"
import { notify } from "../notify"

export default function AddBatch(props: any) {
    const { id } = useParams()
    const [noExpirationDate, setNoExpirationDate] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const [batch, setBatch] = React.useState({ batch_number: "", expiration_date: "", stock_level: 1, reason: "restock", note: "" })

    async function save() {
        if (!batch.batch_number.trim()) return setError("Enter the batch number printed on the box.")
        if (!noExpirationDate && !batch.expiration_date) return setError("Choose the expiry date, or tick that this batch has none.")
        if (!batch.stock_level || batch.stock_level < 1) return setError("Stock must be at least 1.")

        setSaving(true)
        setError("")
        const response = await apiFetch("/addbatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                supply_id: id,
                batch_number: batch.batch_number.trim(),
                expiration_date: noExpirationDate ? null : batch.expiration_date,
                stock_level: batch.stock_level,
                is_active: true,
                reason: batch.reason,
                note: batch.note,
            }),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || !result?.success) {
            setError(result?.error || "Could not add this batch. The batch number may already be in use.")
            return
        }
        notify("Batch added.")
        props.refetch()
        props.hideForm()
    }

    return (
        <ModalForm title={`Add a batch${props.name ? ` of ${props.name}` : ""}`} onClose={props.hideForm} onSubmit={save}
            submitLabel="Add batch" saving={saving} error={error}>
            <Section>
                <Field label="Batch number" htmlFor="batch-number" required>
                    <input id="batch-number" className={inputClass} value={batch.batch_number} autoComplete="off"
                        onChange={(e) => setBatch({ ...batch, batch_number: e.target.value })} />
                </Field>
                <Field label="How many" htmlFor="batch-stock" required>
                    <input id="batch-stock" type="number" min={1} className={inputClass} value={batch.stock_level}
                        onChange={(e) => { const n = parseInt(e.target.value, 10); setBatch({ ...batch, stock_level: Number.isNaN(n) || n < 1 ? 1 : n }) }} />
                </Field>
            </Section>

            <div className="space-y-2">
                <Field label="Expiry date" htmlFor="batch-expiry" required={!noExpirationDate}>
                    <input id="batch-expiry" type="date" className={inputClass} disabled={noExpirationDate} value={batch.expiration_date}
                        onChange={(e) => setBatch({ ...batch, expiration_date: e.target.value })} />
                </Field>
                <CheckboxCard checked={noExpirationDate} label="This batch has no expiry date"
                    description="Bandages, gloves and equipment usually don't. Batches without one are used last."
                    onChange={(checked) => { setNoExpirationDate(checked); if (checked) setBatch({ ...batch, expiration_date: "" }) }} />
            </div>

            <Section>
                <Field label="Where it came from" htmlFor="batch-source">
                    <select id="batch-source" className={selectClass} value={batch.reason}
                        onChange={(e) => setBatch({ ...batch, reason: e.target.value })}>
                        <option value="restock">Bought or delivered</option>
                        <option value="donation">Donated</option>
                    </select>
                </Field>
                <Field label="Note" htmlFor="batch-note" optional>
                    <input id="batch-note" className={inputClass} maxLength={300} value={batch.note}
                        placeholder={batch.reason === "donation" ? "e.g. From the PTA medical drive" : "e.g. Purchase order 2026-14"}
                        onChange={(e) => setBatch({ ...batch, note: e.target.value })} />
                </Field>
            </Section>
        </ModalForm>
    )
}
