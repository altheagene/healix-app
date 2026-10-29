import { DEFAULT_REORDER_LEVEL, UNITS } from "../inventory"
import { CheckboxCard, Field, Section, inputClass, selectClass } from "./form"

export interface ItemForm {
    supply_name: string
    brand: string
    description: string
    category_id?: number
    unit: string
    reorder_level: string
    auto_deduct: boolean
}

/** The fields shared by Add item and Edit item. */
export default function ItemFields({ item, onChange, categories, idPrefix }: {
    item: ItemForm
    onChange: (item: ItemForm) => void
    categories?: { category_id: number; category_name: string }[]
    idPrefix: string
}) {
    const set = (patch: Partial<ItemForm>) => onChange({ ...item, ...patch })
    return (
        <>
            <Section>
                <Field label="Item name" htmlFor={`${idPrefix}-name`} required className="sm:col-span-2">
                    <input id={`${idPrefix}-name`} className={inputClass} value={item.supply_name} placeholder="e.g. Paracetamol 500mg"
                        onChange={(e) => set({ supply_name: e.target.value })} />
                </Field>
                {categories && (
                    <Field label="Category" htmlFor={`${idPrefix}-category`} required>
                        <select id={`${idPrefix}-category`} className={selectClass} value={item.category_id}
                            onChange={(e) => set({ category_id: parseInt(e.target.value, 10) })}>
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                        </select>
                    </Field>
                )}
                <Field label="Brand" htmlFor={`${idPrefix}-brand`} optional>
                    <input id={`${idPrefix}-brand`} className={inputClass} value={item.brand} onChange={(e) => set({ brand: e.target.value })} />
                </Field>
                <Field label="Description" htmlFor={`${idPrefix}-description`} optional className={categories ? "sm:col-span-2" : ""}>
                    <input id={`${idPrefix}-description`} className={inputClass} value={item.description} placeholder="e.g. For fever and mild pain"
                        onChange={(e) => set({ description: e.target.value })} />
                </Field>
            </Section>

            <Section title="Stock">
                <Field label="Unit" htmlFor={`${idPrefix}-unit`} optional hint="What one counts as: tablets, sachets, pieces.">
                    <input id={`${idPrefix}-unit`} list={`${idPrefix}-units`} className={inputClass} value={item.unit} placeholder="e.g. tablets"
                        onChange={(e) => set({ unit: e.target.value })} />
                </Field>
                <datalist id={`${idPrefix}-units`}>{UNITS.map(unit => <option key={unit} value={unit} />)}</datalist>
                <Field label="Reorder at or below" htmlFor={`${idPrefix}-reorder`} optional hint={`Left empty, ${DEFAULT_REORDER_LEVEL} is used.`}>
                    <input id={`${idPrefix}-reorder`} type="number" min={0} className={inputClass} value={item.reorder_level}
                        placeholder={String(DEFAULT_REORDER_LEVEL)} onChange={(e) => set({ reorder_level: e.target.value })} />
                </Field>
            </Section>

            <CheckboxCard checked={item.auto_deduct} onChange={(auto_deduct) => set({ auto_deduct })}
                label="Take it off stock when given at a visit"
                description="For medicines counted one by one, such as tablets or sachets. Leave off for bottles and supplies." />
        </>
    )
}

export function itemPayload(item: ItemForm) {
    return {
        ...item,
        supply_name: item.supply_name.trim(),
        brand: item.brand.trim(),
        description: item.description.trim(),
        reorder_level: item.reorder_level === "" ? null : Number(item.reorder_level),
    }
}
