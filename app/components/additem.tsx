import { apiFetch } from "../api";
import React from 'react'

export default function AddItem(props: any) {
  const [suppliesCategories, setSuppliesCategories] = React.useState<any[]>()
  const [itemDetails, setItemDetails] = React.useState({
    supply_name: '',
    brand: '',
    description: '',
    category_id: 1,
    auto_deduct: false,
    is_active: true,
  })
  const [flashMessage, setFlashMessage] = React.useState<string | null>(null)
  const [flashOk, setFlashOk] = React.useState(false)

  const inputClasses = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
  const labelClasses = "mb-1.5 block text-xs font-medium text-slate-500"

  async function submitForm() {
    for (const key of Object.keys(itemDetails)) {
      const objKey = key as keyof typeof itemDetails
      const value = itemDetails[objKey]

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
        body: JSON.stringify(itemDetails)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-base font-semibold text-slate-900">Add Item</p>
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

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={itemDetails.auto_deduct}
              onChange={(e) => setItemDetails({ ...itemDetails, auto_deduct: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-800 focus:ring-teal-200"
            />
            <span className="text-sm text-slate-700">
              Automatically deduct this item when dispensed.
              <span className="mt-1 block text-xs text-red-500">
                This should only be activated for medicines in units (e.g. capsules, tablets)
              </span>
            </span>
          </label>
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
            className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-teal-900"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  )
}
