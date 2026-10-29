import { apiFetch } from "../api";
import React from "react"

export default function EditBatch(props: any) {
    const batch = props.batch || {}
    const [saving, setSaving] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
    const [flashOk, setFlashOk] = React.useState(false)
    const [noExpirationDate, setNoExpirationDate] = React.useState(!batch.expiration_date)
    const [batchDetails, setBatchDetails] = React.useState({
        batch_id: batch.batch_id,
        batch_number: batch.batch_number || "",
        expiration_date: batch.expiration_date || "",
    })

    const inputClasses = "w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
    const labelClasses = "mb-1.5 block text-xs font-medium text-sage-500"

    async function handleSubmit() {
        if (!batchDetails.batch_number.trim()) {
            setFlashOk(false)
            setFlashMessage("Please enter a batch number.")
            return
        }
        if (!noExpirationDate && !batchDetails.expiration_date) {
            setFlashOk(false)
            setFlashMessage("Please choose an expiration date, or mark this batch as having none.")
            return
        }

        setSaving(true)
        setFlashMessage(null)
        try {
            const response = await apiFetch("/editbatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batch_id: batchDetails.batch_id,
                    batch_number: batchDetails.batch_number.trim(),
                    expiration_date: noExpirationDate ? null : batchDetails.expiration_date,
                }),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                setFlashOk(false)
                setFlashMessage("Could not update this batch.")
                return
            }

            setFlashOk(true)
            setFlashMessage("Batch updated.")
            props.refetch()
            props.refetchDetails?.()
            setTimeout(() => props.hideForm(), 800)
        } catch {
            setFlashOk(false)
            setFlashMessage("Could not update this batch. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
                    <p className="text-base font-semibold text-sage-900">Edit Batch</p>
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

                    <div>
                        <label className={labelClasses} htmlFor="edit-batch-number">
                            Batch number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="edit-batch-number"
                            value={batchDetails.batch_number}
                            onChange={(e) => setBatchDetails({ ...batchDetails, batch_number: e.target.value })}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="edit-expiration-date">
                            Expiration date {!noExpirationDate && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="date"
                            id="edit-expiration-date"
                            disabled={noExpirationDate}
                            value={batchDetails.expiration_date || ""}
                            onChange={(e) => setBatchDetails({ ...batchDetails, expiration_date: e.target.value })}
                            className={`${inputClasses} disabled:bg-sage-50 disabled:text-sage-400`}
                        />
                        <label className="mt-2 flex items-center gap-2 text-sm text-sage-600">
                            <input
                                type="checkbox"
                                checked={noExpirationDate}
                                onChange={(e) => {
                                    setNoExpirationDate(e.target.checked)
                                    if (e.target.checked) {
                                        setBatchDetails({ ...batchDetails, expiration_date: "" })
                                    }
                                }}
                                className="h-4 w-4 rounded border-sage-300 text-brand-800 focus:ring-brand-200"
                            />
                            This has no expiration date
                        </label>
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
                        onClick={handleSubmit}
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
