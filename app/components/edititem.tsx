import { apiFetch } from "../api";
import React from "react"
import { DEFAULT_REORDER_LEVEL, UNITS } from "../inventory"

export default function EditItem(props: any) {
    const details = props.itemDetails || {}
    const [saving, setSaving] = React.useState(false)
    const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
    const [flashOk, setFlashOk] = React.useState(false)
    const [itemDetails, setItemDetails] = React.useState({
        supply_id: details.supply_id,
        supply_name: details.supply_name || "",
        description: details.description || "",
        brand: details.brand || "",
        auto_deduct: Boolean(details.auto_deduct),
        unit: details.unit || "",
        reorder_level: details.reorder_level == null ? "" : String(details.reorder_level),
    })

    const inputClasses = "w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
    const labelClasses = "mb-1.5 block text-xs font-medium text-sage-500"

    async function handleSubmit() {
        if (!itemDetails.supply_name.trim() || !itemDetails.brand.trim() || !itemDetails.description.trim()) {
            setFlashOk(false)
            setFlashMessage("Please fill in all fields before saving.")
            return
        }

        setSaving(true)
        setFlashMessage(null)
        try {
            const response = await apiFetch("/updatesupply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...itemDetails,
                    supply_name: itemDetails.supply_name.trim(),
                    brand: itemDetails.brand.trim(),
                    description: itemDetails.description.trim(),
                    reorder_level: itemDetails.reorder_level === "" ? null : Number(itemDetails.reorder_level),
                }),
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                setFlashOk(false)
                setFlashMessage(result.error || "Could not update this item.")
                return
            }

            setFlashOk(true)
            setFlashMessage("Item updated.")
            props.refetch()
            setTimeout(() => props.hideForm(), 800)
        } catch {
            setFlashOk(false)
            setFlashMessage("Could not update this item. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
                    <p className="text-base font-semibold text-sage-900">Edit Details</p>
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
                        <label className={labelClasses} htmlFor="edit-item-name">
                            Item name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="edit-item-name"
                            value={itemDetails.supply_name}
                            onChange={(e) => setItemDetails({ ...itemDetails, supply_name: e.target.value })}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="edit-item-brand">
                            Brand <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="edit-item-brand"
                            value={itemDetails.brand}
                            onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label className={labelClasses} htmlFor="edit-item-desc">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="edit-item-desc"
                            value={itemDetails.description}
                            onChange={(e) => setItemDetails({ ...itemDetails, description: e.target.value })}
                            className={inputClasses}
                        />
                    </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses} htmlFor="edit-item-unit">Unit</label>
                      <input
                        type="text"
                        id="edit-item-unit"
                        list="edit-item-units"
                        placeholder="e.g. tablets"
                        value={itemDetails.unit}
                        onChange={(e) => setItemDetails({ ...itemDetails, unit: e.target.value })}
                        className={inputClasses}
                      />
                      <datalist id="edit-item-units">
                        {UNITS.map(unit => <option key={unit} value={unit} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className={labelClasses} htmlFor="edit-item-reorder">Reorder at or below</label>
                      <input
                        type="number"
                        min={0}
                        id="edit-item-reorder"
                        placeholder={String(DEFAULT_REORDER_LEVEL)}
                        value={itemDetails.reorder_level}
                        onChange={(e) => setItemDetails({ ...itemDetails, reorder_level: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                    <label className="flex items-start gap-3 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={Boolean(itemDetails.auto_deduct)}
                            onChange={(e) => setItemDetails({ ...itemDetails, auto_deduct: e.target.checked })}
                            className="mt-0.5 h-4 w-4 rounded border-sage-300 text-brand-800 focus:ring-brand-200"
                        />
                        <span className="text-sm text-sage-700">
                            Automatically deduct this item when dispensed.
                            <span className="mt-1 block text-xs text-red-500">
                                This should only be activated for medicines in units (e.g. capsules, tablets)
                            </span>
                        </span>
                    </label>
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
