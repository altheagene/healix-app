import { apiFetch } from "../api";
import React from "react";
import Modal from "./modal";
import { daysUntil, withUnit } from "../inventory";

/** Takes what is left in a batch off the shelf, recording why and how many. */
export default function DisposeBatch({ batch, onClose, onDone }: {
    batch: { batch_id: number; batch_number: string; stock_level: number; supply_name: string; unit?: string | null; expiration_date?: string }
    onClose: () => void
    onDone: () => void
}) {
    const expired = (daysUntil(batch.expiration_date) ?? 0) < 0
    const [reason, setReason] = React.useState(expired ? "expired" : "damaged")
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
        })
        const result = await response.json().catch(() => ({}))
        setSaving(false)
        if (response.ok && result.success) onDone()
        else setError(result.error || "Could not dispose of this batch.")
    }

    return (
        <Modal title={`Dispose of ${batch.supply_name}`} onClose={onClose} width={440}>
            <div className="space-y-4 px-6 py-5">
                {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
                <p className="m-0 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Batch <span className="font-semibold text-slate-900">{batch.batch_number}</span>:{" "}
                    <span className="font-semibold text-slate-900">{withUnit(batch.stock_level, batch.unit)}</span> will be
                    removed from stock and the batch switched off.
                </p>
                <fieldset className="m-0 space-y-2 border-0 p-0">
                    <legend className="mb-1.5 text-xs font-medium text-slate-500">Reason</legend>
                    {([["expired", "Expired"], ["damaged", "Damaged or lost"]] as const).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="radio" name="dispose-reason" value={value} checked={reason === value}
                                onChange={() => setReason(value)} className="h-4 w-4 text-teal-800" />
                            {label}
                        </label>
                    ))}
                </fieldset>
                <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-500">Note (optional)</span>
                    <input type="text" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Returned to the pharmacy"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" />
                </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button type="button" onClick={onClose}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Cancel
                </button>
                <button type="button" onClick={submit} disabled={saving}
                    className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                    {saving ? "Saving..." : "Dispose"}
                </button>
            </div>
        </Modal>
    )
}
