import { apiFetch } from "../api";
import React from "react"
import { ModalForm } from "./form"
import ItemFields, { itemPayload, type ItemForm } from "./itemfields"
import { notify } from "../notify"

export default function EditItem(props: any) {
    const details = props.itemDetails || {}
    const [item, setItem] = React.useState<ItemForm>({
        supply_name: details.supply_name || "",
        brand: details.brand || "",
        description: details.description || "",
        unit: details.unit || "",
        reorder_level: details.reorder_level == null ? "" : String(details.reorder_level),
        auto_deduct: Boolean(details.auto_deduct),
    })
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState("")

    async function save() {
        if (!item.supply_name.trim()) return setError("Enter the item's name.")
        setSaving(true)
        setError("")
        const response = await apiFetch("/updatesupply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...itemPayload(item), supply_id: details.supply_id }),
        }).catch(() => null)
        const result = await response?.json().catch(() => ({}))
        setSaving(false)
        if (!response?.ok || !result?.success) {
            setError(result?.error || "Could not save this item.")
            return
        }
        notify("Item updated.")
        props.refetch()
        props.hideForm()
    }

    return (
        <ModalForm title="Edit item" onClose={props.hideForm} onSubmit={save} saving={saving} error={error}>
            <ItemFields item={item} onChange={setItem} idPrefix="edit-item" />
        </ModalForm>
    )
}
