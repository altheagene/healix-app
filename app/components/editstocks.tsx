import { apiFetch } from "../api";
import React from "react"

export default function EditStock(props: any) {
    const batch = props.batch || {}
    const [saving, setSaving] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
    const [flashOk, setFlashOk] = React.useState(false)
    const [batchDetails, setBatchDetails] = React.useState({
        batch_id: batch.batch_id,
        batch_number: batch.batch_number || "",
        item_in: 0,
        item_out: 0,
    })

    const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
    const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500"

    async function submitForm() {
        if (batchDetails.item_in === 0 && batchDetails.item_out === 0) {
            setFlashOk(false)
            setFlashMessage("Enter stock to add or remove.")
            return
        }

        setSaving(true)
        setFlashMessage(null)
        try {
            const response = await apiFetch("/editstockbatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(batchDetails),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                setFlashOk(false)
                setFlashMessage("Could not update stock.")
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <p className="text-base font-semibold text-slate-900">Edit Stock</p>
                    <button
                        type="button"
                        onClick={props.hideForm}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
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

                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Current stock: <span className="font-semibold text-slate-900">{batch.stock_level ?? 0}</span>
                    </p>

                    <div>
                        <label className={labelClasses}>Batch number</label>
                        <input type="text" value={batchDetails.batch_number} readOnly className={`${inputClasses} bg-slate-50 text-slate-500`} />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="addstock">Add stock</label>
                        <input
                            type="number"
                            min={0}
                            id="addstock"
                            value={batchDetails.item_in}
                            onChange={(e) => {
                                const next = parseInt(e.target.value, 10)
                                setBatchDetails({ ...batchDetails, item_in: Number.isNaN(next) || next < 0 ? 0 : next })
                            }}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="removestock">Remove stock</label>
                        <input
                            type="number"
                            min={0}
                            max={batch.stock_level ?? 0}
                            id="removestock"
                            value={batchDetails.item_out}
                            onChange={(e) => {
                                const next = parseInt(e.target.value, 10)
                                const stock = batch.stock_level ?? 0
                                const safe = Number.isNaN(next) || next < 0 ? 0 : next
                                setBatchDetails({ ...batchDetails, item_out: safe > stock ? stock : safe })
                            }}
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={props.hideForm}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submitForm}
                        disabled={saving}
                        className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    )
}
