import { apiFetch } from "../api";
import React from 'react'
import { ModalForm } from "./form"
import ItemFields, { itemPayload, type ItemForm } from "./itemfields"
import { notify } from "../notify"

export default function AddItem(props: any) {
  const [categories, setCategories] = React.useState<{ category_id: number; category_name: string }[]>([])
  const [item, setItem] = React.useState<ItemForm>({
    supply_name: '', brand: '', description: '', category_id: 1, unit: '', reorder_level: '', auto_deduct: false,
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    apiFetch(`/getallsuppliescategories`)
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
  }, [])

  async function save() {
    if (!item.supply_name.trim()) return setError("Enter the item's name.")
    setSaving(true)
    setError("")
    const response = await apiFetch(`/additem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemPayload(item), is_active: true }),
    }).catch(() => null)
    const result = await response?.json().catch(() => ({}))
    setSaving(false)
    if (!response?.ok || !result?.success) {
      setError(result?.error || "Could not add this item.")
      return
    }
    notify(`${item.supply_name.trim()} added. Add a batch to put it in stock.`)
    props.refetchSupplies()
    props.hideForm()
  }

  return (
    <ModalForm title="Add item" onClose={props.hideForm} onSubmit={save} submitLabel="Add item" saving={saving} error={error}>
      <ItemFields item={item} onChange={setItem} categories={categories} idPrefix="add-item" />
    </ModalForm>
  )
}
