import { apiFetch } from "../api";
import React from "react"
import { STOCK_IN_REASONS, STOCK_OUT_REASONS, withUnit } from "../inventory"

export default function EditStock(props: any) {
    const batch = props.batch || {}
    const [saving, setSaving] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
    const [flashOk, setFlashOk] = React.useState(false)
    const [direction, setDirection] = React.useState<"in" | "out">("in")
    const [quantity, setQuantity] = React.useState(0)
    const [reason, setReason] = React.useState("restock")
    const [note, setNote] = React.useState("")
    const reasons = direction === "in" ? STOCK_IN_REASONS : STOCK_OUT_REASONS
    const stock = batch.stock_level ?? 0

    const inputClasses = "w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
    const labelClasses = "mb-1.5 block text-xs font-medium text-sage-500"

    async function submitForm() {
        if (quantity <= 0) {
            setFlashOk(false)
            setFlashMessage(`Enter how many to ${direction === "in" ? "add" : "remove"}.`)
            return
        }
        if (direction === "out" && quantity > stock) {
            setFlashOk(false)
            setFlashMessage(`This batch only has ${withUnit(stock, props.unit)}.`)
            return
        }

        setSaving(true)
        setFlashMessage(null)
        try {
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
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                setFlashOk(false)
                setFlashMessage(result.error || "Could not update stock.")
                return
            }

            setFlashOk(true)
            setFlashMessage("Stock updated.")
            props.refetch()
            props.refetchDetails?.()
            setTimeout(() => props.hideForm(), 800)
        } catch {
            setFlashOk(false)
            setFlashMessage("Could not update stock. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
                    <p className="text-base font-semibold text-sage-900">Edit Stock</p>
                    <button
                        type="button"
                        onClick={props.hideForm}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-sage-400 transition hover:bg-sage-50 hover:text-sage-700"
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {flashMessage && (
                        <div className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white ${flashOk ? "bg-emerald-500" : "bg-red-500"}`}>
                            {flashMessage}
                        </div>
                    )}

                    <p className="rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-600">
                        Batch <span className="font-semibold text-sage-900">{batch.batch_number}</span> has{" "}
                        <span className="font-semibold text-sage-900">{withUnit(stock, props.unit)}</span>.
                        Medicines given at a visit are taken off automatically; use this for everything else.
                    </p>

                    <div role="group" aria-label="Add or remove" className="flex rounded-full bg-sage-100 p-1">
                        {([["in", "Add stock"], ["out", "Remove stock"]] as const).map(([value, label]) => (
                            <button key={value} type="button" aria-pressed={direction === value}
                                onClick={() => { setDirection(value); setReason(value === "in" ? "restock" : "used") }}
                                className={`flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${direction === value ? "bg-white text-sage-900 shadow-sm" : "text-sage-500"}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="stock-quantity">How many{props.unit ? ` (${props.unit})` : ""}</label>
                        <input
                            type="number"
                            min={0}
                            max={direction === "out" ? stock : undefined}
                            id="stock-quantity"
                            value={quantity}
                            onChange={(e) => {
                                const next = parseInt(e.target.value, 10)
                                setQuantity(Number.isNaN(next) || next < 0 ? 0 : next)
                            }}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="stock-reason">Reason</label>
                        <select id="stock-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClasses}>
                            {Object.entries(reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="stock-note">Note (optional)</label>
                        <input type="text" id="stock-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)}
                            placeholder={direction === "in" ? "e.g. Delivered by the school office" : "e.g. Used for the sports fest first aid kit"}
                            className={inputClasses} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-sage-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={props.hideForm}
                        className="rounded-xl border border-sage-200 bg-white px-4 py-2.5 text-sm font-medium text-sage-700 transition hover:bg-sage-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submitForm}
                        disabled={saving}
                        className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-900 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )
}
