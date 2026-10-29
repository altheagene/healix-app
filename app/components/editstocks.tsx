import { apiFetch } from "../api";
import React from "react"
import { STOCK_IN_REASONS, STOCK_OUT_REASONS, withUnit } from "../inventory"
import { ChoiceGroup, Field, ModalForm, Section, inputClass, selectClass } from "./form"
import { notify } from "../notify"

export default function EditStock(props: any) {
    const batch = props.batch || {}
    const stock = batch.stock_level ?? 0
    const [direction, setDirection] = React.useState<"in" | "out">("in")
    const [quantity, setQuantity] = React.useState(0)
    const [reason, setReason] = React.useState("restock")
    const [note, setNote] = React.useState("")
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")
    const reasons = direction === "in" ? STOCK_IN_REASONS : STOCK_OUT_REASONS

    async function save() {
        if (quantity <= 0) return setError(`Enter how many to ${direction === "in" ? "add" : "remove"}.`)
        if (direction === "out" && quantity > stock) return setError(`This batch only has ${withUnit(stock, props.unit)}.`)

        setSaving(true)
        setError("")
        const response = await apiFetch("/editstockbatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                batch_id: batch.batch_id,
                item_in: direction === "in" ? quantity : 0,
                item_out: direction === "out" ? quantity : 0,
                reason,
                note,
            }),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || !result?.success) {
            setError(result?.error || "Could not update the stock.")
            return
        }
        notify(`${direction === "in" ? "Added" : "Removed"} ${withUnit(quantity, props.unit)}.`)
        props.refetch()
        props.refetchDetails?.()
        props.hideForm()
    }

    return (
        <ModalForm title="Edit stock" onClose={props.hideForm} onSubmit={save} saving={saving} error={error} width={500}
            submitLabel={direction === "in" ? "Add stock" : "Remove stock"}>
            <p className="m-0 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">
                Batch <span className="font-semibold text-sage-900">{batch.batch_number}</span> has{" "}
                <span className="font-semibold text-sage-900">{withUnit(stock, props.unit)}</span>.
                Medicines given at a visit come off automatically; use this for everything else.
            </p>

            <ChoiceGroup legend="Change" name="stock-direction" value={direction}
                options={[["in", "Add stock"], ["out", "Remove stock"]] as const}
                onChange={(value) => { setDirection(value); setReason(value === "in" ? "restock" : "used") }} />

            <Section>
                <Field label={`How many${props.unit ? ` (${props.unit})` : ""}`} htmlFor="stock-quantity" required>
                    <input id="stock-quantity" type="number" min={0} max={direction === "out" ? stock : undefined}
                        className={inputClass} value={quantity}
                        onChange={(e) => { const n = parseInt(e.target.value, 10); setQuantity(Number.isNaN(n) || n < 0 ? 0 : n) }} />
                </Field>
                <Field label="Reason" htmlFor="stock-reason" required>
                    <select id="stock-reason" className={selectClass} value={reason} onChange={(e) => setReason(e.target.value)}>
                        {Object.entries(reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </Field>
            </Section>

            <Field label="Note" htmlFor="stock-note" optional>
                <input id="stock-note" className={inputClass} maxLength={300} value={note}
                    placeholder={direction === "in" ? "e.g. Delivered by the school office" : "e.g. Used for the sports fest first aid kit"}
                    onChange={(e) => setNote(e.target.value)} />
            </Field>
        </ModalForm>
    )
}
