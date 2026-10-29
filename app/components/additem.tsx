import { apiFetch } from "../api";
import React from 'react'
import { DEFAULT_REORDER_LEVEL, UNITS } from '../inventory'

export default function AddItem(props: any) {
  const [suppliesCategories, setSuppliesCategories] = React.useState<any[]>()
  const [itemDetails, setItemDetails] = React.useState({
    supply_name: '',
    brand: '',
    description: '',
    category_id: 1,
    auto_deduct: false,
    is_active: true,
    unit: '',
    reorder_level: '',
  })
  const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
  const [flashOk, setFlashOk] = React.useState(false)

  const inputClasses = "w-full rounded-xl border border-sage-200 bg-white px-3.5 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
  const labelClasses = "mb-1.5 block text-xs font-medium text-sage-500"

  async function submitForm() {
    for (const key of ['supply_name', 'brand', 'description', 'category_id'] as const) {
      const value = itemDetails[key]

      if (value === '' || value === null) {
        setFlashOk(false)
        setFlashMessage(`Please fill in the ${key.replace('_', ' ')}`)
        return
      }
    }

    try {
      const response = await apiFetch(`/additem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...itemDetails, reorder_level: itemDetails.reorder_level === '' ? null : Number(itemDetails.reorder_level) })
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      setFlashOk(true)
      setFlashMessage('Item added successfully!')
      props.refetchSupplies()
      setTimeout(() => {
        setFlashMessage(null)
        props.hideForm()
      }, 1500)

    } catch (err) {
      console.error(err)
      setFlashOk(false)
      setFlashMessage('Error adding item. Please try again.')
    }
  }

  React.useEffect(() => {
    apiFetch(`/getallsuppliescategories`)
      .then(res => res.json())
      .then(data => setSuppliesCategories(data))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-sage-100 px-6 py-4">
          <p className="text-base font-semibold text-sage-900">Add Item</p>
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
            <div className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white ${flashOk ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {flashMessage}
            </div>
          )}

          <div>
            <label className={labelClasses} htmlFor="add-item-name">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="add-item-name"
              value={itemDetails.supply_name}
              onChange={(e) => setItemDetails({ ...itemDetails, supply_name: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="add-item-brand">
              Brand <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="add-item-brand"
              value={itemDetails.brand}
              onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="add-item-desc">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="add-item-desc"
              value={itemDetails.description}
              onChange={(e) => setItemDetails({ ...itemDetails, description: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div>
            <label className={labelClasses} htmlFor="add-item-category">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="add-item-category"
              value={itemDetails.category_id}
              onChange={(e) => setItemDetails({ ...itemDetails, category_id: parseInt(e.target.value) })}
              className={inputClasses}
            >
              {suppliesCategories?.map(supply => (
                <option key={supply.category_id} value={supply.category_id}>
                  {supply.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses} htmlFor="add-item-unit">Unit</label>
              <input
                type="text"
                id="add-item-unit"
                list="add-item-units"
                placeholder="e.g. tablets"
                value={itemDetails.unit}
                onChange={(e) => setItemDetails({ ...itemDetails, unit: e.target.value })}
                className={inputClasses}
              />
              <datalist id="add-item-units">
                {UNITS.map(unit => <option key={unit} value={unit} />)}
              </datalist>
            </div>
            <div>
              <label className={labelClasses} htmlFor="add-item-reorder">Reorder at or below</label>
              <input
                type="number"
                min={0}
                id="add-item-reorder"
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
              checked={itemDetails.auto_deduct}
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
            onClick={submitForm}
            className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-900"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  )
}
