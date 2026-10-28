import { apiFetch } from "../api";
import React from "react"
import { useParams } from "react-router"

export default function AddBatch(props: any) {
    const { id } = useParams()
    const [noExpirationDate, setNoExpirationDate] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
    const [flashOk, setFlashOk] = React.useState(false)
    const [batchDetails, setBatchDetails] = React.useState({
        supply_id: id,
        batch_number: "",
        expiration_date: "",
        stock_level: 1,
        is_active: true,
    })

    const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
    const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500"

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
        if (!batchDetails.stock_level || batchDetails.stock_level < 1) {
            setFlashOk(false)
            setFlashMessage("Stock must be at least 1.")
            return
        }

        setSaving(true)
        setFlashMessage(null)
        try {
            const response = await apiFetch("/addbatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supply_id: batchDetails.supply_id,
                    batch_number: batchDetails.batch_number.trim(),
                    expiration_date: noExpirationDate ? null : batchDetails.expiration_date,
                    stock_level: batchDetails.stock_level,
                    is_active: true,
                }),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                setFlashOk(false)
                setFlashMessage("This batch number already exists.")
                return
            }

            setFlashOk(true)
            setFlashMessage("Batch added successfully.")
            props.refetch()
            setTimeout(() => {
                props.hideForm()
            }, 900)
        } catch {
            setFlashOk(false)
            setFlashMessage("Could not add this batch. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <p className="text-base font-semibold text-slate-900">Add Batch</p>
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

                    <div>
                        <label className={labelClasses}>Supply name</label>
                        <input type="text" value={props.name || ""} readOnly className={`${inputClasses} bg-slate-50 text-slate-500`} />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="batch-number">
                            Batch number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="batch-number"
                            value={batchDetails.batch_number}
                            onChange={(e) => setBatchDetails({ ...batchDetails, batch_number: e.target.value })}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="expiration-date">
                            Expiration date {!noExpirationDate && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="date"
                            id="expiration-date"
                            disabled={noExpirationDate}
                            value={batchDetails.expiration_date}
                            onChange={(e) => setBatchDetails({ ...batchDetails, expiration_date: e.target.value })}
                            className={`${inputClasses} disabled:bg-slate-50 disabled:text-slate-400`}
                        />
                        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={noExpirationDate}
                                onChange={(e) => {
                                    setNoExpirationDate(e.target.checked)
                                    if (e.target.checked) {
                                        setBatchDetails({ ...batchDetails, expiration_date: "" })
                                    }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-teal-800 focus:ring-teal-200"
                            />
                            This has no expiration date
                        </label>
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="addstock">
                            Stock <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            id="addstock"
                            value={batchDetails.stock_level}
                            onChange={(e) => {
                                const next = parseInt(e.target.value, 10)
                                setBatchDetails({ ...batchDetails, stock_level: Number.isNaN(next) || next < 1 ? 1 : next })
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
                        onClick={handleSubmit}
                        disabled={saving}
                        className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Batch"}
                    </button>
                </div>
            </div>
        </div>
    )
}
