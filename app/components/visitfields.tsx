import React from "react"
import { withUnit } from "../inventory"
import { Field, Section, inputClass, selectClass, textareaClass } from "./form"

export interface MedicineChoice { supply_id: number; supply_name: string; unit?: string | null; available_stock: number; auto_deduct: number | boolean }
export interface MedicineRow { supply_id: number | null; quantity: number; auto_deduct?: boolean | number }

/** Service, staff, vitals, what happened and medicines: shared by Add and Edit visit. */
export default function VisitFields({ details, onChange, services, staff, medicines, rows, onRowsChange, allergies, extraService }: {
    details: Record<string, any>
    onChange: (patch: Record<string, any>) => void
    services: { service_id: number; service_name: string }[]
    staff: { staff_id: number; first_name: string; last_name: string; is_active?: number }[]
    medicines: MedicineChoice[]
    rows: MedicineRow[]
    onRowsChange: (rows: MedicineRow[]) => void
    allergies: { allergy_name: string }[]
    /** Shown under the service picker, e.g. a way to add a new service. */
    extraService?: React.ReactNode
}) {
    const value = (key: string) => details?.[key] ?? ""
    return (
        <>
            <Section title="Visit">
                <div>
                    <Field label="Service" htmlFor="visit-service" required>
                        <select id="visit-service" className={selectClass} value={value("service_id")}
                            onChange={(e) => onChange({ service_id: parseInt(e.target.value, 10) })}>
                            {services.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name}</option>)}
                        </select>
                    </Field>
                    {extraService}
                </div>
                <Field label="Attending" htmlFor="visit-staff" required>
                    <select id="visit-staff" className={selectClass} value={value("staff_id")}
                        onChange={(e) => onChange({ staff_id: parseInt(e.target.value, 10) })}>
                        {staff.map(p => (
                            <option key={p.staff_id} value={p.staff_id}>
                                {p.first_name} {p.last_name}{p.is_active === 0 ? " (left)" : ""}
                            </option>
                        ))}
                    </select>
                </Field>
            </Section>

            <Section title="Vitals" description="Leave blank if not taken.">
                <Field label="Weight (kg)" htmlFor="visit-weight" optional>
                    <input id="visit-weight" inputMode="decimal" className={inputClass} value={value("weight")} placeholder="e.g. 42"
                        onChange={(e) => onChange({ weight: e.target.value })} />
                </Field>
                <Field label="Temperature (°C)" htmlFor="visit-temperature" optional>
                    <input id="visit-temperature" inputMode="decimal" className={inputClass} value={value("temperature")} placeholder="e.g. 37.2"
                        onChange={(e) => onChange({ temperature: e.target.value })} />
                </Field>
            </Section>

            <Section title="What happened">
                <Field label="Chief complaint" htmlFor="visit-complaint" required className="sm:col-span-2">
                    <input id="visit-complaint" className={inputClass} value={value("complaint")} placeholder="e.g. Headache, fever, sprained ankle"
                        onChange={(e) => onChange({ complaint: e.target.value })} />
                </Field>
                <Field label="Assessment" htmlFor="visit-assessment" optional>
                    <textarea id="visit-assessment" rows={2} className={textareaClass} value={value("assessment")}
                        onChange={(e) => onChange({ assessment: e.target.value })} />
                </Field>
                <Field label="Treatment" htmlFor="visit-treatment" optional>
                    <textarea id="visit-treatment" rows={2} className={textareaClass} value={value("treatment")}
                        onChange={(e) => onChange({ treatment: e.target.value })} />
                </Field>
            </Section>

            <Section title="Medicines given" columns={1}>
                {allergies.length > 0 && (
                    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <i className="bi bi-exclamation-octagon-fill mt-0.5" aria-hidden="true" />
                        <p className="m-0">
                            <span className="font-semibold">Allergic to {allergies.map(a => a.allergy_name).join(", ")}.</span>{" "}
                            Check every medicine against this.
                        </p>
                    </div>
                )}
                <MedicineRows medicines={medicines} rows={rows} onChange={onRowsChange} />
            </Section>

            <Field label="Other notes" htmlFor="visit-notes" optional>
                <textarea id="visit-notes" rows={3} className={textareaClass} value={value("notes")}
                    onChange={(e) => onChange({ notes: e.target.value })} />
            </Field>
        </>
    )
}

function counted(medicine?: MedicineChoice) {
    return Boolean(medicine && Number(medicine.auto_deduct))
}

function MedicineRows({ medicines, rows, onChange }: { medicines: MedicineChoice[]; rows: MedicineRow[]; onChange: (rows: MedicineRow[]) => void }) {
    if (!medicines.length && !rows.length) {
        return <p className="m-0 text-sm text-sage-500">No medicines are in stock.</p>
    }
    function update(index: number, patch: Partial<MedicineRow>) {
        onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    }
    function choose(index: number, supplyId: number) {
        const medicine = medicines.find(m => m.supply_id === supplyId)
        // Items not counted one by one (a bottle, a tube) are recorded without a quantity.
        update(index, { supply_id: supplyId, auto_deduct: counted(medicine), quantity: counted(medicine) ? rows[index].quantity || 1 : 0 })
    }
    return (
        <div className="space-y-2">
            {rows.map((row, index) => {
                const medicine = medicines.find(m => m.supply_id === Number(row.supply_id))
                return (
                    <div key={index} className="flex flex-wrap items-end gap-2 rounded-xl border border-sage-200 bg-sage-50/60 p-3">
                        <div className="min-w-[12rem] flex-1">
                            <label htmlFor={`med-${index}`} className="mb-1 block text-xs font-semibold text-sage-700">Medicine</label>
                            <select id={`med-${index}`} className={selectClass} value={row.supply_id ?? ""} onChange={(e) => choose(index, Number(e.target.value))}>
                                {medicines.map(m => (
                                    <option key={m.supply_id} value={m.supply_id}>{m.supply_name} ({withUnit(m.available_stock, m.unit)} left)</option>
                                ))}
                            </select>
                        </div>
                        {counted(medicine) ? (
                            <div className="w-28">
                                <label htmlFor={`med-qty-${index}`} className="mb-1 block text-xs font-semibold text-sage-700">How many</label>
                                <input id={`med-qty-${index}`} type="number" min={1} max={medicine?.available_stock} className={inputClass} value={row.quantity}
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value, 10)
                                        update(index, { quantity: Number.isNaN(n) ? 1 : Math.max(1, Math.min(n, medicine?.available_stock ?? n)) })
                                    }} />
                            </div>
                        ) : (
                            <p className="m-0 w-28 pb-2.5 text-xs text-sage-500">Not counted</p>
                        )}
                        <button type="button" onClick={() => onChange(rows.filter((_, i) => i !== index))} aria-label={`Remove ${medicine?.supply_name || "medicine"}`}
                            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50">
                            <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                    </div>
                )
            })}
            {medicines.length > 0 && (
                <button type="button"
                    onClick={() => onChange([...rows, { supply_id: medicines[0].supply_id, auto_deduct: counted(medicines[0]), quantity: counted(medicines[0]) ? 1 : 0 }])}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
                    <i className="bi bi-plus-lg" aria-hidden="true" /> Add a medicine
                </button>
            )}
        </div>
    )
}
